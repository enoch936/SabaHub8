package com.sabahub.service;

import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.dto.freelancer.FreelancerDTOs;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class AITaxonomyService {
    private final PythonAiBridgeService pythonAiBridgeService;
    private final CurrentUserService currentUserService;

    public AITaxonomyService(PythonAiBridgeService pythonAiBridgeService,
                             CurrentUserService currentUserService) {
        this.pythonAiBridgeService = pythonAiBridgeService;
        this.currentUserService = currentUserService;
    }

    public Map<String, Object> suggestJob(Job job) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("experience", job.getMinYearsExperience());
        metadata.put("industry", safeList(job.getIndustry()));
        metadata.put("tools", safeList(job.getRequiredTools()));
        metadata.put("pricingModel", stringValue(job.getPricingModel()));
        metadata.put("engagementType", stringValue(job.getEngagementType()));
        metadata.put("deliverableType", stringValue(job.getDeliverableType()));
        metadata.put("workLocation", job.getWorkLocation());

        Map<String, Object> existingTaxonomy = new LinkedHashMap<>();
        existingTaxonomy.put("categoryId", job.getCategoryId());
        existingTaxonomy.put("skills", safeList(job.getSkills()));
        existingTaxonomy.put("requiredSkills", safeList(job.getRequiredSkills()));
        existingTaxonomy.put("industry", safeList(job.getIndustry()));

        return classify(buildPayload(
                "job",
                job.getTitle(),
                mergeValues(job.getRequiredSkills(), job.getSkills(), job.getRequiredTools()),
                joinText(job.getDescription(), job.getOverviewText()),
                metadata,
                existingTaxonomy
        ));
    }

    public Map<String, Object> suggestFreelancerProfile(FreelancerDTOs.FreelancerProfileRequest request) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("availability", request.getAvailability());
        metadata.put("preferredIndustries", safeList(request.getPreferredIndustries()));
        metadata.put("preferredProjectTypes", safeList(request.getPreferredProjectTypes()));
        metadata.put("preferredProjectSizes", safeList(request.getPreferredProjectSizes()));
        metadata.put("location", request.getLocation());
        metadata.put("timezone", request.getTimezone());

        Map<String, Object> existingTaxonomy = new LinkedHashMap<>();
        existingTaxonomy.put("categories", safeList(request.getCategories()));

        return classify(buildPayload(
                "talent",
                request.getProfessionalTitle(),
                extractFreelancerSkills(request.getSkills()),
                request.getBio(),
                metadata,
                existingTaxonomy
        ));
    }

    public Map<String, Object> suggestUserProfile(UserProfile profile) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("experience", profile.getYearsOfExperience());
        metadata.put("availability", profile.getAvailability());
        metadata.put("location", profile.getLocation());
        metadata.put("timezone", profile.getTimezone());
        metadata.put("portfolioUrls", safeList(profile.getPortfolioUrls()));
        metadata.put("preferences", safeList(profile.getPreferredCategories()));

        Map<String, Object> existingTaxonomy = new LinkedHashMap<>();
        existingTaxonomy.put("preferredCategories", safeList(profile.getPreferredCategories()));
        existingTaxonomy.put("expertise", profile.getExpertise());

        return classify(buildPayload(
                "profile",
                profile.getUsername(),
                safeList(profile.getSkills()),
                profile.getBio(),
                metadata,
                existingTaxonomy
        ));
    }

    public Map<String, Object> suggestUserSettings(UserProfile profile) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("preferences", safeList(profile.getPreferredCategories()));
        metadata.put("preferredLanguage", profile.getPreferredLanguage());
        metadata.put("availability", profile.getAvailability());
        metadata.put("location", profile.getLocation());

        Map<String, Object> existingTaxonomy = new LinkedHashMap<>();
        existingTaxonomy.put("preferredCategories", safeList(profile.getPreferredCategories()));

        return classify(buildPayload(
                "settings",
                profile.getUsername(),
                safeList(profile.getSkills()),
                joinText(profile.getBio(), profile.getLocation()),
                metadata,
                existingTaxonomy
        ));
    }

    public Map<String, Object> suggestCurrentUserProfile() {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile() == null ? new UserProfile() : user.getProfile();
        if (profile.getUsername() == null || profile.getUsername().isBlank()) {
            profile.setUsername(user.getUsername());
        }
        return suggestUserProfile(profile);
    }

    public Map<String, Object> suggestCurrentUserSettings() {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile() == null ? new UserProfile() : user.getProfile();
        if (profile.getUsername() == null || profile.getUsername().isBlank()) {
            profile.setUsername(user.getUsername());
        }
        return suggestUserSettings(profile);
    }

    public Map<String, Object> learningSummary() {
        Optional<Map<String, Object>> remote = pythonAiBridgeService.taxonomyLearningSummary();
        if (remote.isPresent()) {
            return remote.get();
        }
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("last_updated", null);
        fallback.put("tracked_terms", List.of());
        return fallback;
    }

    private Map<String, Object> classify(Map<String, Object> payload) {
        Optional<Map<String, Object>> remote = pythonAiBridgeService.classifyTaxonomy(payload);
        return remote.orElseGet(() -> fallback(payload));
    }

    private Map<String, Object> buildPayload(String type,
                                             String title,
                                             List<String> skills,
                                             String description,
                                             Map<String, Object> metadata,
                                             Map<String, Object> existingTaxonomy) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("title", normalizeBlank(title));
        payload.put("description", normalizeBlank(description));
        payload.put("skills", skills);
        payload.put("metadata", metadata == null ? Map.of() : metadata);
        payload.put("existing_taxonomy", existingTaxonomy == null ? Map.of() : existingTaxonomy);
        return payload;
    }

    private Map<String, Object> fallback(Map<String, Object> payload) {
        List<String> inputSkills = safeList(payload.get("skills"));
        String type = normalizeBlank(String.valueOf(payload.getOrDefault("type", ""))).toLowerCase(Locale.ROOT);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("type", type);
        response.put("category", "");
        response.put("subcategory", "");
        response.put("skills", inputSkills.stream().limit(10).toList());
        response.put("expertise_level", null);
        response.put("confidence", 0.0);
        response.put("is_new_category", false);
        response.put("suggested_new_category", Map.of(
                "parent", "",
                "name", "",
                "reason", "",
                "trend_score", 0
        ));
        response.put("normalization", Map.of(
                "merged_terms", List.of(),
                "standardized_skills", inputSkills.stream().limit(10).toList()
        ));
        response.put("recommendations", Map.of(
                "suggested_categories", List.of(),
                "related_skills", inputSkills.stream().limit(10).toList(),
                "profile_improvements", List.of()
        ));
        return response;
    }

    private List<String> extractFreelancerSkills(List<Freelancer.Skill> skills) {
        if (skills == null || skills.isEmpty()) {
            return List.of();
        }
        List<String> names = new ArrayList<>();
        for (Freelancer.Skill skill : skills) {
            if (skill == null || skill.getName() == null || skill.getName().isBlank()) {
                continue;
            }
            names.add(skill.getName().trim());
        }
        return unique(names);
    }

    private String joinText(String... parts) {
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part == null || part.isBlank()) {
                continue;
            }
            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(part.trim());
        }
        return builder.toString();
    }

    @SafeVarargs
    private List<String> mergeValues(List<String>... values) {
        List<String> merged = new ArrayList<>();
        for (List<String> value : values) {
            merged.addAll(safeList(value));
        }
        return unique(merged);
    }

    private List<String> safeList(Object value) {
        if (value instanceof Collection<?> collection) {
            List<String> output = new ArrayList<>();
            for (Object item : collection) {
                if (item == null) {
                    continue;
                }
                String normalized = normalizeBlank(String.valueOf(item));
                if (!normalized.isBlank()) {
                    output.add(normalized);
                }
            }
            return unique(output);
        }
        return List.of();
    }

    private String normalizeBlank(String value) {
        return value == null ? "" : value.trim();
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private List<String> unique(List<String> values) {
        Set<String> deduped = new LinkedHashSet<>();
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            deduped.add(value.trim());
        }
        return new ArrayList<>(deduped);
    }
}
