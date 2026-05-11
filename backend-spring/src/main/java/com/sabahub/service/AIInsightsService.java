package com.sabahub.service;

import com.sabahub.config.AIEngineProperties;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.JobRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AIInsightsService {
    private static final String ENGINE_NAME = "SabaHub Local AI Engine";
    private static final String ENGINE_VERSION = "2.0.0";
    private static final String INFERENCE_MODE = "ON_PREM_LOCAL_RULE_ENGINE";

    private final JobRepository jobRepository;
    private final FreelancerRepository freelancerRepository;
    private final CurrentUserService currentUserService;
    private final AIEngineProperties aiEngineProperties;
    private final PythonAiBridgeService pythonAiBridgeService;

    public AIInsightsService(JobRepository jobRepository,
                             FreelancerRepository freelancerRepository,
                             CurrentUserService currentUserService,
                             AIEngineProperties aiEngineProperties,
                             PythonAiBridgeService pythonAiBridgeService) {
        this.jobRepository = jobRepository;
        this.freelancerRepository = freelancerRepository;
        this.currentUserService = currentUserService;
        this.aiEngineProperties = aiEngineProperties;
        this.pythonAiBridgeService = pythonAiBridgeService;
    }

    public List<Map<String, Object>> recommendJobsForCurrentUser(int limit) {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile();

        Set<String> userSkills = normalizeSet(profile == null ? null : profile.getSkills());
        Set<String> preferredCategories = normalizeSet(profile == null ? null : profile.getPreferredCategories());
        boolean openToOpportunities = profile != null && Boolean.TRUE.equals(profile.getOpenToOpportunities());

        List<Job> openJobs = jobRepository.findByStatus(Job.Status.OPEN);
        List<Map<String, Object>> localRecs = openJobs.stream()
                .map(job -> buildJobRecommendation(job, userSkills, preferredCategories, openToOpportunities))
                .sorted(Comparator.comparingDouble((Map<String, Object> item) -> toDouble(item.get("score"))).reversed())
                .limit(Math.max(1, limit))
                .collect(Collectors.toList());

        List<Map<String, Object>> finalRecs = maybeBlendWithPythonJobs(localRecs, profile, user);
        finalRecs.forEach(this::attachEngineMetadata);
        return finalRecs;
    }

    public List<Map<String, Object>> matchFreelancersForJob(String jobId, int limit) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new NoSuchElementException("Job not found"));

        Set<String> requiredSkills = normalizeSet(job.getRequiredSkills());
        List<Freelancer> candidates = freelancerRepository
                .findActiveVerifiedFreelancers(PageRequest.of(0, 300))
                .getContent();

        List<Map<String, Object>> localMatches = candidates.stream()
                .map(freelancer -> buildFreelancerMatch(freelancer, requiredSkills, job))
                .sorted(Comparator.comparingDouble((Map<String, Object> item) -> toDouble(item.get("score"))).reversed())
                .limit(Math.max(1, limit))
                .collect(Collectors.toList());

        List<Map<String, Object>> finalMatches = maybeBlendWithPythonFreelancers(localMatches, job);
        finalMatches.forEach(this::attachEngineMetadata);
        return finalMatches;
    }

    public Map<String, Object> evaluateFraudRisk(double amount,
                                                 String currency,
                                                 String paymentMethod,
                                                 String recipientCountry) {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile();

        List<String> flags = new ArrayList<>();
        int riskPoints = 0;

        if (amount >= 5000) {
            riskPoints += 35;
            flags.add("High-value transaction");
        } else if (amount >= 1000) {
            riskPoints += 20;
            flags.add("Medium-value transaction");
        }

        if (profile == null || !Boolean.TRUE.equals(profile.getIdentityVerified())) {
            riskPoints += 30;
            flags.add("Identity not verified");
        }
        if (profile == null || !Boolean.TRUE.equals(profile.getEmailVerified())) {
            riskPoints += 10;
            flags.add("Email not verified");
        }
        if (profile == null || !Boolean.TRUE.equals(profile.getPhoneVerified())) {
            riskPoints += 10;
            flags.add("Phone not verified");
        }

        if (user.getCreatedAt() != null) {
            long accountAgeDays = Duration.between(user.getCreatedAt(), Instant.now()).toDays();
            if (accountAgeDays < 7) {
                riskPoints += 25;
                flags.add("New account age");
            } else if (accountAgeDays < 30) {
                riskPoints += 10;
                flags.add("Young account age");
            }
        }

        if (paymentMethod != null && paymentMethod.toUpperCase(Locale.ROOT).contains("CRYPTO")) {
            riskPoints += 15;
            flags.add("Crypto payment method");
        }
        if (recipientCountry != null && !recipientCountry.isBlank() && isCrossBorder(profile, recipientCountry)) {
            riskPoints += 12;
            flags.add("Cross-border transfer");
        }

        int bounded = Math.max(0, Math.min(100, riskPoints));
        String level;
        if (bounded >= 70) {
            level = "HIGH";
        } else if (bounded >= 35) {
            level = "MEDIUM";
        } else {
            level = "LOW";
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("riskScore", bounded);
        response.put("riskLevel", level);
        response.put("flags", flags);
        response.put("currency", currency == null || currency.isBlank() ? "USD" : currency.toUpperCase(Locale.ROOT));
        response.put("recommendedAction", level.equals("HIGH")
                ? "Require manual review and step-up verification before settlement."
                : level.equals("MEDIUM")
                ? "Hold transfer briefly and request second-factor confirmation."
                : "Allow automated processing with standard monitoring.");

        maybeUsePythonFraud(response, amount, currency, paymentMethod, recipientCountry, user, profile);
        attachEngineMetadata(response);
        return response;
    }

    public Map<String, Object> assistChatbot(String prompt, String contextType, String contextId) {
        String normalizedPrompt = prompt == null ? "" : prompt.trim().toLowerCase(Locale.ROOT);
        String answer;
        List<String> suggestedActions = new ArrayList<>();

        if (normalizedPrompt.contains("proposal")) {
            answer = "To improve proposal acceptance, personalize your cover letter, include measurable outcomes, and match the job's required skills explicitly.";
            suggestedActions.add("Open proposals dashboard");
            suggestedActions.add("Reuse a high-performing template");
            suggestedActions.add("Attach portfolio examples");
        } else if (normalizedPrompt.contains("payment") || normalizedPrompt.contains("invoice")) {
            answer = "For payment safety, confirm milestone delivery, keep invoice evidence attached, and use escrow release for every approved milestone.";
            suggestedActions.add("Check wallet transactions");
            suggestedActions.add("Review pending escrow milestones");
            suggestedActions.add("Run fraud risk check");
        } else if (normalizedPrompt.contains("job") || normalizedPrompt.contains("match")) {
            answer = "You can improve matching quality by completing skills, setting preferred categories, and keeping availability up to date in your profile.";
            suggestedActions.add("Update profile skills");
            suggestedActions.add("Review AI job recommendations");
            suggestedActions.add("Adjust availability");
        } else {
            answer = "I can help with job matching, proposal quality, payments risk checks, and platform workflows. Ask a specific question for higher precision guidance.";
            suggestedActions.add("Ask about proposals");
            suggestedActions.add("Ask about payments");
            suggestedActions.add("Ask about job matching");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("answer", answer);
        response.put("contextType", contextType == null ? "GENERAL" : contextType.toUpperCase(Locale.ROOT));
        response.put("contextId", contextId);
        response.put("suggestedActions", suggestedActions);
        response.put("confidence", inferConfidence(normalizedPrompt));

        maybeUsePythonChat(response, prompt, contextType, contextId);
        attachEngineMetadata(response);
        return response;
    }

    public Map<String, Object> engineStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("engine", ENGINE_NAME);
        status.put("version", ENGINE_VERSION);
        status.put("inferenceMode", INFERENCE_MODE);
        status.put("externalAiApiEnabled", false);
        status.put("externalAiApiUsed", false);
        status.put("dataSource", "internal_database_only");
        status.put("message", "All AI decisions are computed locally in backend-spring.");
        status.put("mode", aiEngineProperties.getMode());
        status.put("pythonEnabled", aiEngineProperties.isPythonEnabled());
        status.put("pythonBridgeConfigured", aiEngineProperties.shouldUsePythonBridge());
        status.put("pythonBridgeReachable", pythonAiBridgeService.ping());
        status.put("pythonJobsEnabled", aiEngineProperties.shouldUsePythonJobs());
        status.put("pythonFreelancersEnabled", aiEngineProperties.shouldUsePythonFreelancers());
        status.put("pythonFraudEnabled", aiEngineProperties.shouldUsePythonFraud());
        status.put("pythonChatEnabled", aiEngineProperties.shouldUsePythonChat());
        status.put("blendJobs", clampWeight(aiEngineProperties.getPythonJobsBlendWeight()));
        status.put("blendFreelancers", clampWeight(aiEngineProperties.getPythonFreelancersBlendWeight()));
        status.put("blendFraud", clampWeight(aiEngineProperties.getPythonFraudBlendWeight()));
        status.put("blendChat", clampWeight(aiEngineProperties.getPythonChatBlendWeight()));
        return status;
    }

    private List<Map<String, Object>> maybeBlendWithPythonJobs(List<Map<String, Object>> localRecs, UserProfile profile, User user) {
        if (!aiEngineProperties.shouldUsePythonJobs()) return localRecs;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", user.getId());
        payload.put("skills", profile == null ? List.of() : profile.getSkills());
        payload.put("preferredCategories", profile == null ? List.of() : profile.getPreferredCategories());
        payload.put("items", localRecs);
        Optional<List<Map<String, Object>>> remote = pythonAiBridgeService.rerankJobRecommendations(payload);
        return blendScoreLists(localRecs, remote.orElse(List.of()), "jobId", aiEngineProperties.getPythonJobsBlendWeight());
    }

    private List<Map<String, Object>> maybeBlendWithPythonFreelancers(List<Map<String, Object>> localMatches, Job job) {
        if (!aiEngineProperties.shouldUsePythonFreelancers()) return localMatches;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("jobId", job.getId());
        payload.put("requiredSkills", job.getRequiredSkills());
        payload.put("items", localMatches);
        Optional<List<Map<String, Object>>> remote = pythonAiBridgeService.rerankFreelancerMatches(payload);
        return blendScoreLists(localMatches, remote.orElse(List.of()), "freelancerId", aiEngineProperties.getPythonFreelancersBlendWeight());
    }

    private void maybeUsePythonFraud(Map<String, Object> local,
                                     double amount,
                                     String currency,
                                     String paymentMethod,
                                     String recipientCountry,
                                     User user,
                                     UserProfile profile) {
        if (!aiEngineProperties.shouldUsePythonFraud()) return;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("amount", amount);
        payload.put("currency", currency);
        payload.put("paymentMethod", paymentMethod);
        payload.put("recipientCountry", recipientCountry);
        payload.put("userId", user.getId());
        payload.put("identityVerified", profile != null && Boolean.TRUE.equals(profile.getIdentityVerified()));
        payload.put("emailVerified", profile != null && Boolean.TRUE.equals(profile.getEmailVerified()));
        payload.put("phoneVerified", profile != null && Boolean.TRUE.equals(profile.getPhoneVerified()));

        Optional<Map<String, Object>> remote = pythonAiBridgeService.scoreFraudRisk(payload);
        if (remote.isPresent()) {
            mergeFraud(local, remote.get(), aiEngineProperties.getPythonFraudBlendWeight());
        } else if (aiEngineProperties.isStrictPython()) {
            throw new IllegalStateException("Strict python mode is enabled but python bridge is unavailable");
        }
    }

    private void maybeUsePythonChat(Map<String, Object> local, String prompt, String contextType, String contextId) {
        if (!aiEngineProperties.shouldUsePythonChat()) return;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("prompt", prompt);
        payload.put("contextType", contextType);
        payload.put("contextId", contextId);
        payload.put("localAnswer", local.get("answer"));

        Optional<Map<String, Object>> remote = pythonAiBridgeService.assistChatbot(payload);
        if (remote.isPresent()) {
            mergeChat(local, remote.get(), aiEngineProperties.getPythonChatBlendWeight());
        } else if (aiEngineProperties.isStrictPython()) {
            throw new IllegalStateException("Strict python mode is enabled but python bridge is unavailable");
        }
    }

    private List<Map<String, Object>> blendScoreLists(List<Map<String, Object>> local,
                                                      List<Map<String, Object>> remote,
                                                      String idKey,
                                                      double blendWeight) {
        if (remote == null || remote.isEmpty()) return local;
        double w = clampWeight(blendWeight);
        Map<String, Map<String, Object>> remoteById = remote.stream()
                .filter(item -> item.get(idKey) != null)
                .collect(Collectors.toMap(
                        item -> String.valueOf(item.get(idKey)),
                        Function.identity(),
                        (a, b) -> a
                ));

        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> localItem : local) {
            Object id = localItem.get(idKey);
            if (id == null) {
                merged.add(localItem);
                continue;
            }
            Map<String, Object> remoteItem = remoteById.get(String.valueOf(id));
            if (remoteItem == null) {
                merged.add(localItem);
                continue;
            }
            double localScore = toDouble(localItem.get("score"));
            double remoteScore = toDouble(remoteItem.get("score"));
            double blended = (localScore * (1.0 - w)) + (remoteScore * w);
            Map<String, Object> out = new LinkedHashMap<>(localItem);
            out.put("score", Math.round(blended * 100.0) / 100.0);
            out.put("pythonScore", remoteScore);
            merged.add(out);
        }

        merged.sort(Comparator.comparingDouble((Map<String, Object> item) -> toDouble(item.get("score"))).reversed());
        return merged;
    }

    private void mergeFraud(Map<String, Object> local, Map<String, Object> remote, double blendWeight) {
        double localScore = toDouble(local.get("riskScore"));
        double remoteScore = toDouble(remote.get("riskScore"));
        double w = clampWeight(blendWeight);
        int mergedScore = (int) Math.round((localScore * (1.0 - w)) + (remoteScore * w));
        mergedScore = Math.max(0, Math.min(100, mergedScore));
        local.put("riskScore", mergedScore);
        local.put("pythonRiskScore", remoteScore);
        local.put("riskLevel", mergedScore >= 70 ? "HIGH" : mergedScore >= 35 ? "MEDIUM" : "LOW");

        Object remoteFlags = remote.get("flags");
        if (remoteFlags instanceof List<?> list && !list.isEmpty()) {
            List<String> flags = new ArrayList<>();
            Object localFlags = local.get("flags");
            if (localFlags instanceof List<?> lf) {
                for (Object f : lf) flags.add(String.valueOf(f));
            }
            for (Object f : list) {
                String flag = String.valueOf(f);
                if (!flags.contains(flag)) flags.add(flag);
            }
            local.put("flags", flags);
        }
    }

    private void mergeChat(Map<String, Object> local, Map<String, Object> remote, double blendWeight) {
        double localConfidence = toDouble(local.get("confidence"));
        double remoteConfidence = toDouble(remote.get("confidence"));
        double w = clampWeight(blendWeight);
        double blendedConfidence = (localConfidence * (1.0 - w)) + (remoteConfidence * w);
        if (remote.get("answer") instanceof String answer && !answer.isBlank() && remoteConfidence >= (localConfidence * 0.9)) {
            local.put("answer", answer);
        }
        local.put("confidence", Math.round(blendedConfidence * 10000.0) / 10000.0);
        Object remoteActions = remote.get("suggestedActions");
        if (remoteActions instanceof List<?> actions && !actions.isEmpty()) {
            List<String> merged = new ArrayList<>();
            Object localActions = local.get("suggestedActions");
            if (localActions instanceof List<?> existing) {
                for (Object a : existing) merged.add(String.valueOf(a));
            }
            for (Object a : actions) {
                String val = String.valueOf(a);
                if (!merged.contains(val)) merged.add(val);
            }
            local.put("suggestedActions", merged);
        }
    }

    private double clampWeight(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private Map<String, Object> buildJobRecommendation(Job job,
                                                        Set<String> userSkills,
                                                        Set<String> preferredCategories,
                                                        boolean openToOpportunities) {
        Set<String> required = normalizeSet(job.getRequiredSkills());
        Set<String> optional = normalizeSet(job.getSkills());
        Set<String> allJobSkills = new LinkedHashSet<>();
        allJobSkills.addAll(required);
        allJobSkills.addAll(optional);

        Set<String> overlap = new LinkedHashSet<>(allJobSkills);
        overlap.retainAll(userSkills);

        double overlapRatio = allJobSkills.isEmpty() ? 0.0 : ((double) overlap.size() / allJobSkills.size());
        double score = overlapRatio * 75.0;

        if (preferredCategories.contains(normalize(job.getCategoryId()))) {
            score += 10;
        }
        if (openToOpportunities) {
            score += 5;
        }
        if (job.getBudgetMax() != null && job.getBudgetMax() >= 1000) {
            score += 10;
        }

        score = Math.round(Math.min(100, score) * 100.0) / 100.0;

        List<String> reasons = new ArrayList<>();
        if (!overlap.isEmpty()) {
            reasons.add("Skill overlap: " + String.join(", ", overlap.stream().limit(4).toList()));
        }
        if (preferredCategories.contains(normalize(job.getCategoryId()))) {
            reasons.add("Matches your preferred category");
        }
        if (openToOpportunities) {
            reasons.add("Profile marked open to opportunities");
        }
        if (reasons.isEmpty()) {
            reasons.add("General fit based on role demand and profile completeness");
        }

        Map<String, Object> rec = new LinkedHashMap<>();
        rec.put("jobId", job.getId());
        rec.put("title", job.getTitle());
        rec.put("score", score);
        rec.put("budgetMin", job.getBudgetMin());
        rec.put("budgetMax", job.getBudgetMax());
        rec.put("currency", job.getCurrency());
        rec.put("reasons", reasons);
        return rec;
    }

    private Map<String, Object> buildFreelancerMatch(Freelancer freelancer,
                                                     Set<String> requiredSkills,
                                                     Job job) {
        Set<String> freelancerSkills = normalizeFreelancerSkills(freelancer.getSkills());

        Set<String> overlap = new LinkedHashSet<>(freelancerSkills);
        overlap.retainAll(requiredSkills);

        double skillScore = requiredSkills.isEmpty() ? 0.0 : ((double) overlap.size() / requiredSkills.size()) * 70.0;
        double ratingScore = Math.max(0, Math.min(20, (freelancer.getRating() == null ? 0.0 : freelancer.getRating() * 4.0)));
        double experienceScore = Math.max(0, Math.min(10, (freelancer.getYearsOfExperience() == null ? 0 : freelancer.getYearsOfExperience()) / 2.0));
        double total = Math.round(Math.min(100, skillScore + ratingScore + experienceScore) * 100.0) / 100.0;

        List<String> reasons = new ArrayList<>();
        if (!overlap.isEmpty()) {
            reasons.add("Required skill match: " + String.join(", ", overlap.stream().limit(4).toList()));
        }
        if (freelancer.getRating() != null) {
            reasons.add("Rating: " + freelancer.getRating());
        }
        if (freelancer.getYearsOfExperience() != null) {
            reasons.add("Experience: " + freelancer.getYearsOfExperience() + " years");
        }
        if (freelancer.getAvailability() != null) {
            reasons.add("Availability: " + freelancer.getAvailability());
        }
        if (reasons.isEmpty()) {
            reasons.add("General fit based on verified and active status");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("freelancerId", freelancer.getId());
        response.put("userId", freelancer.getUserId());
        response.put("professionalTitle", freelancer.getProfessionalTitle());
        response.put("score", total);
        response.put("reasons", reasons);
        response.put("jobId", job.getId());
        return response;
    }

    private boolean isCrossBorder(UserProfile profile, String recipientCountry) {
        String location = profile == null ? null : profile.getLocation();
        if (location == null || location.isBlank()) return false;
        return !location.toLowerCase(Locale.ROOT).contains(recipientCountry.toLowerCase(Locale.ROOT));
    }

    private double inferConfidence(String normalizedPrompt) {
        if (normalizedPrompt == null || normalizedPrompt.isBlank()) return 0.41;
        if (normalizedPrompt.contains("proposal") || normalizedPrompt.contains("payment") || normalizedPrompt.contains("job")) {
            return 0.82;
        }
        return 0.67;
    }

    private Set<String> normalizeFreelancerSkills(List<Freelancer.Skill> skills) {
        if (skills == null) return Set.of();
        return skills.stream()
                .map(Freelancer.Skill::getName)
                .filter(Objects::nonNull)
                .map(this::normalize)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> normalizeSet(Collection<String> values) {
        if (values == null) return Set.of();
        return values.stream()
                .filter(Objects::nonNull)
                .map(this::normalize)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private void attachEngineMetadata(Map<String, Object> payload) {
        payload.put("engine", ENGINE_NAME);
        payload.put("engineVersion", ENGINE_VERSION);
        payload.put("inferenceMode", INFERENCE_MODE);
        payload.put("mode", aiEngineProperties.getMode());
        payload.put("pythonEnabled", aiEngineProperties.isPythonEnabled());
        payload.put("externalAiApiUsed", false);
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        if (value == null) return 0.0;
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }
}
