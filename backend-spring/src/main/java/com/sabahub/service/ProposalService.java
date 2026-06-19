package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProjectRepository;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class ProposalService {
    private static final Set<Proposal.Status> AI_SELECTABLE_STATUSES = Set.of(
            Proposal.Status.SUBMITTED,
            Proposal.Status.SHORTLISTED
    );
    private static final Set<String> AI_STOP_WORDS = Set.of(
            "about", "after", "also", "and", "are", "because", "been", "before", "build", "can", "deliver",
            "delivery", "for", "from", "have", "into", "job", "make", "need", "needs", "over", "project",
            "proposal", "scope", "that", "the", "this", "with", "work", "will", "your"
    );

    private final ProposalRepository proposalRepository;
    private final JobRepository jobRepository;
    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final EmployerRepository employerRepository;
    private final UserRepository userRepository;
    private final FreelancerRepository freelancerRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public ProposalService(ProposalRepository proposalRepository,
                           JobRepository jobRepository,
                           ProjectRepository projectRepository,
                           ContractRepository contractRepository,
                           EmployerRepository employerRepository,
                           UserRepository userRepository,
                           FreelancerRepository freelancerRepository,
                           CurrentUserService currentUserService,
                           AuditService auditService,
                           NotificationService notificationService) {
        this.proposalRepository = proposalRepository;
        this.jobRepository = jobRepository;
        this.projectRepository = projectRepository;
        this.contractRepository = contractRepository;
        this.employerRepository = employerRepository;
        this.userRepository = userRepository;
        this.freelancerRepository = freelancerRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    private Set<String> resolveEmployerIdentityKeys(User me) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();

        if (me.getId() != null && !me.getId().isBlank()) {
            keys.add(me.getId());
            employerRepository.findByUserId(me.getId())
                    .ifPresent(employer -> {
                        if (employer.getId() != null && !employer.getId().isBlank()) {
                            keys.add(employer.getId());
                        }
                    });
        }

        if (me.getEmail() != null && !me.getEmail().isBlank()) {
            keys.add(me.getEmail());
            employerRepository.findByUserId(me.getEmail())
                    .ifPresent(employer -> {
                        if (employer.getId() != null && !employer.getId().isBlank()) {
                            keys.add(employer.getId());
                        }
                    });
        }

        return keys;
    }

    private boolean canManageJobAsEmployer(User me, Job job) {
        if (job == null || job.getEmployerId() == null || job.getEmployerId().isBlank()) {
            return false;
        }
        Set<String> keys = resolveEmployerIdentityKeys(me);
        return keys.contains(job.getEmployerId());
    }

    private Job requireManagedEmployerJob(String jobId, User me) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!canManageJobAsEmployer(me, job)) {
            throw new IllegalStateException("Forbidden");
        }

        return job;
    }

    // Freelancer applies to job
    public Proposal submitProposal(String jobId, Proposal proposal) {
        User me = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(me);

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (job.getStatus() != Job.Status.OPEN) {
            throw new IllegalStateException("Job is not open");
        }

        if (hasReachedHiringCapacity(job)) {
            syncJobHiringStatus(job);
            throw new IllegalStateException("Job is no longer accepting proposals");
        }

        if (proposalRepository.findByJobIdAndFreelancerId(jobId, me.getId()).isPresent()) {
            throw new IllegalStateException("You already submitted a proposal for this job");
        }

        proposal.setId(null);
        proposal.setJobId(jobId);
        proposal.setFreelancerId(me.getId());
        proposal.setStatus(Proposal.Status.SUBMITTED);
        Proposal saved = proposalRepository.save(proposal);

        notificationService.notifyProposalSubmitted(
                job.getEmployerId(),
                job.getId(),
                job.getTitle(),
                me.getId(),
                saved.getBidAmount()
        );

        return saved;
    }

    // Employer views proposals for own job
    public List<Proposal> listProposalsForEmployerJob(String jobId) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        requireManagedEmployerJob(jobId, me);

        List<Proposal> proposals = proposalRepository.findByJobId(jobId);
        reconcileAcceptedProposals(proposals);
        return proposals;
    }

    public List<ProposalView> listProposalViewsForEmployerJob(String jobId) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Job job = requireManagedEmployerJob(jobId, me);
        List<Proposal> proposals = proposalRepository.findByJobId(jobId);
        reconcileAcceptedProposals(proposals);
        return toEmployerProposalViews(job, proposals);
    }

    public List<ProposalView> toProposalViews(List<Proposal> proposals) {
        if (proposals == null || proposals.isEmpty()) {
            return List.of();
        }

        Map<String, ProposalReference> referenceCache = new LinkedHashMap<>();
        Map<String, String> employerNameCache = new LinkedHashMap<>();
        Map<String, String> freelancerNameCache = new LinkedHashMap<>();

        return proposals.stream()
                .sorted(Comparator.comparing(this::sortInstantForProposal).reversed())
                .map(proposal -> toProposalView(
                        proposal,
                        referenceCache,
                        employerNameCache,
                        freelancerNameCache,
                        ProposalAiRanking.empty()))
                .toList();
    }

    private List<ProposalView> toEmployerProposalViews(Job job, List<Proposal> proposals) {
        if (proposals == null || proposals.isEmpty()) {
            return List.of();
        }

        Map<String, ProposalAiRanking> aiRankings = rankProposalsForJob(job, proposals);
        Map<String, ProposalReference> referenceCache = new LinkedHashMap<>();
        Map<String, String> employerNameCache = new LinkedHashMap<>();
        Map<String, String> freelancerNameCache = new LinkedHashMap<>();

        return proposals.stream()
                .map(proposal -> toProposalView(
                        proposal,
                        referenceCache,
                        employerNameCache,
                        freelancerNameCache,
                        aiRankings.getOrDefault(proposal.getId(), ProposalAiRanking.empty())))
                .sorted(this::compareEmployerProposalViews)
                .toList();
    }

    public void reconcileAcceptedProposals(List<Proposal> proposals) {
        if (proposals == null || proposals.isEmpty()) {
            return;
        }

        Map<String, Job> affectedJobs = new LinkedHashMap<>();

        for (Proposal proposal : proposals) {
            if (proposal == null || proposal.getStatus() != Proposal.Status.ACCEPTED) {
                continue;
            }

            Job job = jobRepository.findById(proposal.getJobId()).orElse(null);
            if (job == null) {
                continue;
            }

            ensureContractForAcceptedProposal(job, proposal);
            affectedJobs.putIfAbsent(job.getId(), job);
        }

        for (Job job : affectedJobs.values()) {
            syncJobHiringStatus(job);
        }
    }

    // Employer accepts proposal → creates contract
    public Contract acceptProposal(String proposalId) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        Job job = jobRepository.findById(proposal.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!canManageJobAsEmployer(me, job)) {
            throw new IllegalStateException("Forbidden");
        }

        Contract existingContract = contractRepository.findByJobIdAndFreelancerId(job.getId(), proposal.getFreelancerId())
                .orElse(null);
        if (proposal.getStatus() == Proposal.Status.ACCEPTED && existingContract != null) {
            syncJobHiringStatus(job);
            return existingContract;
        }

        if (proposal.getStatus() == Proposal.Status.REJECTED || proposal.getStatus() == Proposal.Status.WITHDRAWN) {
            throw new IllegalStateException("Cannot accept a " + proposal.getStatus().name().toLowerCase() + " proposal");
        }

        if (hasReachedHiringCapacity(job)) {
            syncJobHiringStatus(job);
            throw new IllegalStateException("Job already has all required freelancers");
        }

        proposal.setStatus(Proposal.Status.ACCEPTED);
        proposalRepository.save(proposal);

        Contract saved = ensureContractForAcceptedProposal(job, proposal);
        syncJobHiringStatus(job);
        
        // Audit log: proposal accepted (contract created)
        Map<String, Object> acceptAudit = new LinkedHashMap<>();
        acceptAudit.put("proposal_id", proposal.getId());
        acceptAudit.put("contract_id", saved.getId());
        if (proposal.getFreelancerId() != null) {
            acceptAudit.put("freelancer_id", proposal.getFreelancerId());
        }
        if (proposal.getBidAmount() != null) {
            acceptAudit.put("bid_amount", proposal.getBidAmount());
        }
        auditService.log("PROPOSAL_ACCEPT", "PROPOSAL", proposal.getId(), acceptAudit);

        notificationService.notifyProposalAccepted(
                proposal.getFreelancerId(),
                proposal.getId(),
                job.getId(),
                job.getTitle(),
                me.getId(),
                saved.getId()
        );
        
        return saved;
    }

    public Contract acceptTopRankedProposal(String jobId) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Job job = requireManagedEmployerJob(jobId, me);
        List<Proposal> proposals = proposalRepository.findByJobId(jobId);
        reconcileAcceptedProposals(proposals);

        Map<String, ProposalAiRanking> rankings = rankProposalsForJob(job, proposals);
        Proposal selected = proposals.stream()
                .filter(this::isAiSelectableProposal)
                .max(Comparator
                        .comparingDouble((Proposal proposal) -> aiScoreFor(proposal, rankings))
                        .thenComparing(this::sortInstantForProposal))
                .orElseThrow(() -> new IllegalStateException("No submitted proposals are available for AI selection"));

        Contract contract = acceptProposal(selected.getId());

        ProposalAiRanking ranking = rankings.get(selected.getId());
        Map<String, Object> rankAudit = new LinkedHashMap<>();
        rankAudit.put("proposal_id", selected.getId());
        rankAudit.put("job_id", jobId);
        rankAudit.put("ai_rank", ranking == null ? null : ranking.rank());
        rankAudit.put("ai_score", ranking == null ? null : ranking.score());
        rankAudit.put("ai_recommendation", ranking == null ? null : ranking.recommendation());
        auditService.log("PROPOSAL_AI_TOP_SELECTED", "PROPOSAL", selected.getId(), rankAudit);

        return contract;
    }

    // Employer rejects proposal before contract creation
    public Proposal rejectProposal(String proposalId) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        Job job = jobRepository.findById(proposal.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!canManageJobAsEmployer(me, job)) {
            throw new IllegalStateException("Forbidden");
        }

        if (proposal.getStatus() == Proposal.Status.ACCEPTED) {
            throw new IllegalStateException("Accepted proposals must be cancelled, not rejected");
        }

        proposal.setStatus(Proposal.Status.REJECTED);
        Proposal saved = proposalRepository.save(proposal);

        Map<String, Object> rejectAudit = new LinkedHashMap<>();
        rejectAudit.put("proposal_id", saved.getId());
        rejectAudit.put("job_id", saved.getJobId());
        if (saved.getFreelancerId() != null) {
            rejectAudit.put("freelancer_id", saved.getFreelancerId());
        }
        auditService.log("PROPOSAL_REJECT", "PROPOSAL", saved.getId(), rejectAudit);

        notificationService.notifyProposalRejected(
            saved.getFreelancerId(),
            saved.getId(),
            job.getId(),
            job.getTitle(),
            me.getId()
        );

        return saved;
    }

    // Employer cancels accepted proposal and linked contract flow
    public Proposal cancelProposal(String proposalId) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        Job job = jobRepository.findById(proposal.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!canManageJobAsEmployer(me, job)) {
            throw new IllegalStateException("Forbidden");
        }

        Contract linkedContract = contractRepository.findByJobIdAndFreelancerId(job.getId(), proposal.getFreelancerId()).orElse(null);
        if (linkedContract != null && linkedContract.getStatus() == Contract.Status.COMPLETED) {
            throw new IllegalStateException("Cannot cancel proposal because contract is already completed");
        }

        proposal.setStatus(Proposal.Status.WITHDRAWN);
        Proposal saved = proposalRepository.save(proposal);

        if (linkedContract != null) {
            linkedContract.setStatus(Contract.Status.CANCELLED);
            contractRepository.save(linkedContract);
        }

        syncJobHiringStatus(job);

        Map<String, Object> cancelAudit = new LinkedHashMap<>();
        cancelAudit.put("proposal_id", saved.getId());
        cancelAudit.put("job_id", saved.getJobId());
        if (saved.getFreelancerId() != null) {
            cancelAudit.put("freelancer_id", saved.getFreelancerId());
        }
        cancelAudit.put("contract_cancelled", linkedContract != null);
        auditService.log("PROPOSAL_CANCEL", "PROPOSAL", saved.getId(), cancelAudit);

        notificationService.notifyProposalCancelled(
            saved.getFreelancerId(),
            saved.getId(),
            job.getId(),
            job.getTitle(),
            me.getId(),
            linkedContract == null ? null : linkedContract.getId()
        );

        return saved;
    }

    private Contract ensureContractForAcceptedProposal(Job job, Proposal proposal) {
        Contract existing = contractRepository.findByJobIdAndFreelancerId(job.getId(), proposal.getFreelancerId())
                .orElse(null);

        if (existing == null) {
            Contract contract = new Contract();
            LocalDateTime startDate = LocalDateTime.now();
            LocalDateTime endDate = startDate.plusDays(proposal.getTimelineDays() == null || proposal.getTimelineDays() < 1 ? 14 : proposal.getTimelineDays());

            contract.setJobId(job.getId());
            contract.setEmployerId(job.getEmployerId());
            contract.setFreelancerId(proposal.getFreelancerId());
            contract.setStatus(Contract.Status.DRAFT);
            contract.setTitle(job.getTitle());
            contract.setDescription(job.getDescription());
            contract.setCurrency(job.getCurrency() == null ? "ETB" : job.getCurrency());
            contract.setEscrowTotalHeld(0.0);
            contract.setEscrowRequiredAmount(proposal.getBidAmount() == null ? 0.0 : proposal.getBidAmount());
            contract.setPaidAmount(0.0);
            contract.setPaymentModel("MILESTONE");
            contract.setEscrowProtectionLevel("FULL");
            contract.setDisputeWindowDays(7);
            contract.setAutoReleaseDays(5);
            contract.setRequiresEscrow(Boolean.TRUE);
            contract.setAdminReviewRequired(Boolean.TRUE);
            contract.setTotalAmount(proposal.getBidAmount());
            contract.setStartDate(startDate);
            contract.setEndDate(endDate);
            contract.setAgreementVersion(1);
            contract.setLastAgreementUpdatedAt(startDate);
            contract.setTerms(Contract.ContractTerms.builder()
                    .scope(firstNonBlank(job.getDescription(), proposal.getCoverLetter()))
                    .deliverables(firstNonBlank(job.getDescription(), "Deliver work according to the accepted proposal and milestone plan"))
                    .acceptanceCriteria("Employer approval and escrow release are required for each milestone.")
                    .paymentSchedule("MILESTONE")
                    .confidentiality("Platform standard confidentiality obligations apply until superseded by explicit NDA.")
                    .ipRights("Transferred according to the accepted contract terms after payment release.")
                    .terminationClause("Contract may be cancelled only through platform workflow, refund, or dispute resolution.")
                    .build());
            contract.setPaymentMilestones(new ArrayList<>(List.of(
                    Contract.PaymentMilestone.builder()
                            .id(UUID.randomUUID().toString())
                            .sequence(1)
                            .title("Accepted proposal delivery")
                            .description(firstNonBlank(job.getDescription(), proposal.getCoverLetter()))
                            .amount(proposal.getBidAmount())
                            .dueDate(endDate)
                            .status("PENDING")
                            .deliverables(firstNonBlank(job.getDescription(), proposal.getCoverLetter()))
                            .approvedByEmployer(Boolean.FALSE)
                            .escrowLocked(Boolean.FALSE)
                            .percentageComplete(0.0)
                            .build()
            )));
            contract.setSignatures(Contract.ContractSignatures.builder()
                    .employerSigned(Boolean.TRUE)
                    .employerSignedAt(startDate)
                    .freelancerSigned(Boolean.FALSE)
                    .build());
            return contractRepository.save(contract);
        }

        if (existing.getStatus() == Contract.Status.PENDING) {
            existing.setStatus(Contract.Status.DRAFT);
            return contractRepository.save(existing);
        }

        return existing;
    }

    private void syncJobHiringStatus(Job job) {
        if (job == null || job.getId() == null || job.getId().isBlank()) {
            return;
        }

        if (job.getStatus() == Job.Status.CANCELLED
                || job.getStatus() == Job.Status.CLOSED
                || job.getStatus() == Job.Status.COMPLETED) {
            return;
        }

        long filledSlots = countFilledFreelancerSlots(job.getId());
        Job.Status targetStatus = filledSlots >= requiredFreelancerCount(job)
                ? Job.Status.IN_PROGRESS
                : Job.Status.OPEN;

        if (job.getStatus() != targetStatus) {
            job.setStatus(targetStatus);
            jobRepository.save(job);
        }
    }

    private boolean hasReachedHiringCapacity(Job job) {
        if (job == null || job.getId() == null || job.getId().isBlank()) {
            return false;
        }
        return countFilledFreelancerSlots(job.getId()) >= requiredFreelancerCount(job);
    }

    private long countFilledFreelancerSlots(String jobId) {
        return contractRepository.findAllByJobId(jobId).stream()
                .filter(contract -> contract != null && contract.getStatus() != Contract.Status.CANCELLED)
                .map(contract -> {
                    if (contract.getFreelancerId() != null && !contract.getFreelancerId().isBlank()) {
                        return contract.getFreelancerId();
                    }
                    return contract.getId();
                })
                .distinct()
                .count();
    }

    private int requiredFreelancerCount(Job job) {
        if (job == null || job.getMaxConcurrentProjects() == null || job.getMaxConcurrentProjects() < 1) {
            return 1;
        }
        return job.getMaxConcurrentProjects();
    }

    private Map<String, ProposalAiRanking> rankProposalsForJob(Job job, List<Proposal> proposals) {
        if (proposals == null || proposals.isEmpty()) {
            return Map.of();
        }

        List<ScoredProposal> scoredProposals = proposals.stream()
                .filter(Objects::nonNull)
                .map(proposal -> new ScoredProposal(proposal, scoreProposalForJob(job, proposal)))
                .sorted(this::compareScoredProposals)
                .toList();

        LinkedHashMap<String, ProposalAiRanking> rankings = new LinkedHashMap<>();
        int rank = 1;
        for (ScoredProposal scored : scoredProposals) {
            if (isAiSelectableProposal(scored.proposal())) {
                rankings.put(scored.proposal().getId(), scored.ranking().withRank(rank));
                rank += 1;
            }
        }

        for (ScoredProposal scored : scoredProposals) {
            rankings.putIfAbsent(
                    scored.proposal().getId(),
                    scored.ranking().withSelectionStatus(proposalStatus(scored.proposal()))
            );
        }

        return rankings;
    }

    private ProposalAiRanking scoreProposalForJob(Job job, Proposal proposal) {
        List<String> reasons = new ArrayList<>();
        Freelancer freelancer = resolveFreelancerProfile(proposal.getFreelancerId());
        User freelancerUser = resolveFreelancerUser(proposal.getFreelancerId(), freelancer);

        Set<String> requiredTerms = normalizeTerms(jobRequirementTerms(job));
        Set<String> freelancerSkills = normalizeTerms(freelancerSkillLabels(freelancer, freelancerUser));
        Set<String> overlap = new LinkedHashSet<>(requiredTerms);
        overlap.retainAll(freelancerSkills);

        double skillScore = requiredTerms.isEmpty()
                ? 22.0
                : (35.0 * overlap.size()) / requiredTerms.size();
        if (!overlap.isEmpty()) {
            reasons.add("Profile matches " + String.join(", ", overlap.stream().limit(4).toList()));
        } else if (!requiredTerms.isEmpty()) {
            reasons.add("No direct profile skill evidence for the main requirements");
        } else {
            reasons.add("Job has no explicit skill list, so rank leans on proposal quality and profile proof");
        }

        double relevanceScore = scoreProposalRelevance(job, proposal, requiredTerms, reasons);
        double budgetScore = scoreBudgetFit(job, proposal, reasons);
        double timelineScore = scoreTimelineFit(job, proposal, reasons);
        double proofScore = scoreFreelancerProof(freelancer, freelancerUser, reasons);

        double score = roundScore(Math.min(100.0, skillScore + relevanceScore + budgetScore + timelineScore + proofScore));
        return new ProposalAiRanking(null, score, recommendationForScore(score), List.copyOf(reasons));
    }

    private double scoreProposalRelevance(Job job,
                                          Proposal proposal,
                                          Set<String> requiredTerms,
                                          List<String> reasons) {
        String coverText = normalizeTerm(proposal.getCoverLetter());
        if (coverText.isBlank()) {
            reasons.add("Cover letter is empty");
            return 0.0;
        }

        Set<String> keywords = extractJobKeywords(job);
        int keywordHits = countMentions(keywords, coverText);
        int requiredHits = countMentions(requiredTerms, coverText);

        double keywordBase = keywords.isEmpty()
                ? 8.0
                : Math.min(12.0, 12.0 * keywordHits / Math.max(1.0, Math.min(8.0, keywords.size())));
        double requirementBase = requiredTerms.isEmpty()
                ? 6.0
                : Math.min(8.0, 8.0 * requiredHits / Math.max(1.0, Math.min(6.0, requiredTerms.size())));
        double structureBonus = coverText.length() >= 180 ? 3.0 : coverText.length() >= 90 ? 1.5 : 0.0;
        if (coverText.contains("milestone") || coverText.contains("timeline") || coverText.contains("deliverable")) {
            structureBonus += 2.0;
        }

        if (keywordHits > 0 || requiredHits > 0) {
            reasons.add("Proposal text references " + Math.max(keywordHits, requiredHits) + " job-specific signals");
        } else {
            reasons.add("Proposal text is generic against the posted requirements");
        }

        return Math.min(25.0, keywordBase + requirementBase + structureBonus);
    }

    private double scoreBudgetFit(Job job, Proposal proposal, List<String> reasons) {
        Double bidAmount = proposal.getBidAmount();
        if (bidAmount == null || bidAmount <= 0) {
            reasons.add("Bid amount is missing");
            return 3.0;
        }

        Double budgetMin = job == null ? null : job.getBudgetMin();
        Double budgetMax = job == null ? null : job.getBudgetMax();
        if (budgetMin == null && budgetMax == null) {
            reasons.add("No budget range is set, so bid fit is neutral");
            return 8.0;
        }

        if (budgetMin != null && budgetMax != null && bidAmount >= budgetMin && bidAmount <= budgetMax) {
            reasons.add("Bid fits the posted budget range");
            return 15.0;
        }
        if (budgetMax != null && bidAmount <= budgetMax) {
            reasons.add("Bid is within the maximum budget");
            return 13.0;
        }
        if (budgetMin != null && bidAmount < budgetMin) {
            reasons.add("Bid is below the expected range; review scope quality");
            return 10.0;
        }
        if (budgetMax != null && bidAmount <= budgetMax * 1.15) {
            reasons.add("Bid is slightly above budget, but close enough for review");
            return 8.0;
        }

        reasons.add("Bid is above the posted budget range");
        return 4.0;
    }

    private double scoreTimelineFit(Job job, Proposal proposal, List<String> reasons) {
        Integer timelineDays = proposal.getTimelineDays();
        if (timelineDays == null || timelineDays < 1) {
            reasons.add("Timeline is missing");
            return 3.0;
        }

        Integer targetDays = job == null ? null : job.getSlaDeliveryDays();
        if (targetDays == null || targetDays < 1) {
            reasons.add("Timeline is provided for employer review");
            return timelineDays <= 30 ? 8.0 : 6.0;
        }

        if (timelineDays <= targetDays) {
            reasons.add("Timeline meets the requested delivery target");
            return 10.0;
        }
        if (timelineDays <= Math.ceil(targetDays * 1.25)) {
            reasons.add("Timeline is close to the requested delivery target");
            return 7.0;
        }

        reasons.add("Timeline is slower than the requested delivery target");
        return 4.0;
    }

    private double scoreFreelancerProof(Freelancer freelancer, User user, List<String> reasons) {
        UserProfileSnapshot snapshot = UserProfileSnapshot.from(user);
        double proofScore = 0.0;

        Double rating = firstNonNull(freelancer == null ? null : freelancer.getRating(), snapshot.averageRating());
        if (rating != null && rating > 0) {
            proofScore += Math.min(6.0, rating * 1.2);
            reasons.add("Freelancer rating signal: " + roundScore(rating));
        }

        Double successRate = firstNonNull(freelancer == null ? null : freelancer.getSuccessRate(), snapshot.successRate());
        Integer jobSuccess = freelancer == null ? null : freelancer.getJobSuccessScore();
        if (successRate != null && successRate > 0) {
            proofScore += Math.min(4.0, successRate / 25.0);
            reasons.add("Success rate signal: " + Math.round(successRate) + "%");
        } else if (jobSuccess != null && jobSuccess > 0) {
            proofScore += Math.min(4.0, jobSuccess / 25.0);
            reasons.add("Job success score signal: " + jobSuccess + "%");
        }

        Integer completedProjects = firstNonNull(
                freelancer == null ? null : freelancer.getCompletedProjects(),
                snapshot.completedProjects()
        );
        if (completedProjects != null && completedProjects > 0) {
            proofScore += Math.min(4.0, completedProjects / 10.0);
            reasons.add("Completed work evidence: " + completedProjects + " projects");
        }

        Integer years = firstNonNull(freelancer == null ? null : freelancer.getYearsOfExperience(), snapshot.yearsOfExperience());
        if (years != null && years > 0) {
            proofScore += Math.min(3.0, years / 2.0);
        }

        if (Boolean.TRUE.equals(freelancer == null ? null : freelancer.getIdentityVerified())
                || Boolean.TRUE.equals(snapshot.identityVerified())) {
            proofScore += 1.0;
        }
        if (freelancer != null && "VERIFIED".equalsIgnoreCase(firstNonBlank(freelancer.getVerificationStatus(), ""))) {
            proofScore += 1.0;
        }

        if (proofScore <= 0.0) {
            reasons.add("Limited freelancer proof signals are available");
        }

        return Math.min(18.0, proofScore);
    }

    private int compareScoredProposals(ScoredProposal left, ScoredProposal right) {
        int scoreCompare = Double.compare(right.ranking().score(), left.ranking().score());
        if (scoreCompare != 0) {
            return scoreCompare;
        }
        return sortInstantForProposal(right.proposal()).compareTo(sortInstantForProposal(left.proposal()));
    }

    private int compareEmployerProposalViews(ProposalView left, ProposalView right) {
        int leftRank = left.aiRank() == null ? Integer.MAX_VALUE : left.aiRank();
        int rightRank = right.aiRank() == null ? Integer.MAX_VALUE : right.aiRank();
        if (leftRank != rightRank) {
            return Integer.compare(leftRank, rightRank);
        }

        double leftScore = left.aiScore() == null ? -1.0 : left.aiScore();
        double rightScore = right.aiScore() == null ? -1.0 : right.aiScore();
        int scoreCompare = Double.compare(rightScore, leftScore);
        if (scoreCompare != 0) {
            return scoreCompare;
        }

        return sortInstantForProposalView(right).compareTo(sortInstantForProposalView(left));
    }

    private boolean isAiSelectableProposal(Proposal proposal) {
        return proposal != null && AI_SELECTABLE_STATUSES.contains(proposalStatus(proposal));
    }

    private Proposal.Status proposalStatus(Proposal proposal) {
        return proposal == null || proposal.getStatus() == null ? Proposal.Status.SUBMITTED : proposal.getStatus();
    }

    private double aiScoreFor(Proposal proposal, Map<String, ProposalAiRanking> rankings) {
        ProposalAiRanking ranking = rankings.get(proposal.getId());
        return ranking == null || ranking.score() == null ? -1.0 : ranking.score();
    }

    private List<String> jobRequirementTerms(Job job) {
        ArrayList<String> terms = new ArrayList<>();
        if (job == null) {
            return terms;
        }
        addAllStrings(terms, job.getRequiredSkills());
        addAllStrings(terms, job.getSkills());
        addAllStrings(terms, job.getRequiredTools());
        addAllStrings(terms, job.getRequiredQualifications());
        addAllStrings(terms, job.getDeliverableScopes());
        if (job.getCategoryId() != null) {
            terms.add(job.getCategoryId());
        }
        return terms;
    }

    private List<String> freelancerSkillLabels(Freelancer freelancer, User user) {
        ArrayList<String> skills = new ArrayList<>();
        if (freelancer != null) {
            if (freelancer.getSkills() != null) {
                freelancer.getSkills().stream()
                        .filter(Objects::nonNull)
                        .map(Freelancer.Skill::getName)
                        .filter(Objects::nonNull)
                        .forEach(skills::add);
            }
            if (freelancer.getProfessionalTitle() != null) {
                skills.add(freelancer.getProfessionalTitle());
            }
            addAllStrings(skills, freelancer.getCategories());
        }
        if (user != null && user.getProfile() != null) {
            addAllStrings(skills, user.getProfile().getSkills());
            if (user.getProfile().getExpertise() != null) {
                skills.add(user.getProfile().getExpertise());
            }
        }
        return skills;
    }

    private Set<String> normalizeTerms(Collection<String> values) {
        if (values == null || values.isEmpty()) {
            return Set.of();
        }

        LinkedHashSet<String> terms = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = normalizeTerm(value);
            if (!normalized.isBlank()) {
                terms.add(normalized);
                for (String token : normalized.split("\\s+")) {
                    if (token.length() >= 3 && !AI_STOP_WORDS.contains(token)) {
                        terms.add(token);
                    }
                }
            }
        }
        return terms;
    }

    private Set<String> extractJobKeywords(Job job) {
        if (job == null) {
            return Set.of();
        }

        String text = String.join(" ",
                safeText(job.getTitle()),
                safeText(job.getDescription()),
                safeText(job.getOverviewText()),
                safeText(job.getEvaluationProcess())
        );
        String normalized = normalizeTerm(text);
        if (normalized.isBlank()) {
            return Set.of();
        }

        LinkedHashSet<String> keywords = new LinkedHashSet<>();
        for (String token : normalized.split("\\s+")) {
            if (token.length() >= 4 && !AI_STOP_WORDS.contains(token)) {
                keywords.add(token);
            }
        }
        return keywords;
    }

    private int countMentions(Set<String> terms, String normalizedText) {
        if (terms == null || terms.isEmpty() || normalizedText == null || normalizedText.isBlank()) {
            return 0;
        }

        int hits = 0;
        for (String term : terms) {
            if (!term.isBlank() && normalizedText.contains(term)) {
                hits += 1;
            }
        }
        return hits;
    }

    private Freelancer resolveFreelancerProfile(String freelancerRef) {
        if (freelancerRef == null || freelancerRef.isBlank()) {
            return null;
        }

        return freelancerRepository.findByUserId(freelancerRef)
                .or(() -> freelancerRepository.findById(freelancerRef))
                .orElse(null);
    }

    private User resolveFreelancerUser(String freelancerRef, Freelancer freelancer) {
        if (freelancer != null && freelancer.getUserId() != null && !freelancer.getUserId().isBlank()) {
            User byFreelancerUserId = resolveUserByReference(freelancer.getUserId());
            if (byFreelancerUserId != null) {
                return byFreelancerUserId;
            }
        }
        return resolveUserByReference(freelancerRef);
    }

    private User resolveUserByReference(String userRef) {
        if (userRef == null || userRef.isBlank()) {
            return null;
        }
        return userRepository.findById(userRef)
                .or(() -> userRepository.findByEmail(userRef))
                .orElse(null);
    }

    private void addAllStrings(List<String> target, Collection<String> values) {
        if (values == null) {
            return;
        }
        values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .forEach(target::add);
    }

    private String normalizeTerm(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String recommendationForScore(double score) {
        if (score >= 85.0) {
            return "Strong AI fit";
        }
        if (score >= 70.0) {
            return "Recommended";
        }
        if (score >= 50.0) {
            return "Review with caution";
        }
        return "Low AI fit";
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private Double firstNonNull(Double first, Double second) {
        return first != null ? first : second;
    }

    private Integer firstNonNull(Integer first, Integer second) {
        return first != null ? first : second;
    }

    private double roundScore(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private ProposalView toProposalView(Proposal proposal,
                                        Map<String, ProposalReference> referenceCache,
                                        Map<String, String> employerNameCache,
                                        Map<String, String> freelancerNameCache,
                                        ProposalAiRanking aiRanking) {
        ProposalReference reference = resolveReference(proposal.getJobId(), referenceCache, employerNameCache);
        Freelancer freelancer = resolveFreelancerProfile(proposal.getFreelancerId());

        return new ProposalView(
                proposal.getId(),
                proposal.getJobId(),
                firstNonBlank(reference.title(), "Job " + safeLabel(proposal.getJobId(), "Unknown")),
                reference.employerId(),
                firstNonBlank(reference.employerName(), "Employer"),
                proposal.getFreelancerId(),
                resolveFreelancerName(proposal.getFreelancerId(), freelancerNameCache),
                proposal.getCoverLetter(),
                proposal.getBidAmount(),
                proposal.getTimelineDays(),
                proposal.getStatus() == null ? Proposal.Status.SUBMITTED.name() : proposal.getStatus().name(),
                proposal.getCreatedAt(),
                proposal.getUpdatedAt(),
                aiRanking.rank(),
                aiRanking.score(),
                aiRanking.recommendation(),
                aiRanking.reasons(),
                freelancer != null && Boolean.TRUE.equals(freelancer.getIdentityVerified()),
                freelancer != null && freelancer.getPaymentMethod() != null,
                freelancer == null ? null : freelancer.getRating(),
                freelancer == null ? null : freelancer.getReviewCount()
        );
    }

    private ProposalReference resolveReference(String jobOrProjectId,
                                               Map<String, ProposalReference> referenceCache,
                                               Map<String, String> employerNameCache) {
        if (jobOrProjectId == null || jobOrProjectId.isBlank()) {
            return ProposalReference.EMPTY;
        }
        if (referenceCache.containsKey(jobOrProjectId)) {
            return referenceCache.get(jobOrProjectId);
        }

        ProposalReference resolved = jobRepository.findById(jobOrProjectId)
                .map(job -> new ProposalReference(
                        blankToNull(job.getTitle()),
                        blankToNull(job.getEmployerId()),
                        resolveEmployerName(job.getEmployerId(), job.getCompanyName(), employerNameCache)
                ))
                .or(() -> projectRepository.findById(jobOrProjectId)
                        .map(project -> new ProposalReference(
                                blankToNull(project.getTitle()),
                                blankToNull(project.getEmployerId()),
                                resolveEmployerName(project.getEmployerId(), null, employerNameCache)
                        )))
                .orElse(ProposalReference.EMPTY);

        referenceCache.put(jobOrProjectId, resolved);
        return resolved;
    }

    private String resolveEmployerName(String employerRef,
                                       String fallbackCompanyName,
                                       Map<String, String> employerNameCache) {
        if (employerRef == null || employerRef.isBlank()) {
            return firstNonBlank(fallbackCompanyName, "Employer");
        }
        if (employerNameCache.containsKey(employerRef)) {
            return employerNameCache.get(employerRef);
        }

        String resolved = employerRepository.findById(employerRef)
                .map(this::extractEmployerName)
                .filter(value -> !value.isBlank())
                .or(() -> employerRepository.findByUserId(employerRef)
                        .map(this::extractEmployerName)
                        .filter(value -> !value.isBlank()))
                .or(() -> userRepository.findById(employerRef)
                        .map(this::displayName)
                        .filter(value -> !value.isBlank()))
                .or(() -> userRepository.findByEmail(employerRef)
                        .map(this::displayName)
                        .filter(value -> !value.isBlank()))
                .orElseGet(() -> firstNonBlank(fallbackCompanyName, fallbackLabel(employerRef)));

        employerNameCache.put(employerRef, resolved);
        return resolved;
    }

    private String resolveFreelancerName(String freelancerRef, Map<String, String> freelancerNameCache) {
        if (freelancerRef == null || freelancerRef.isBlank()) {
            return "Freelancer";
        }
        if (freelancerNameCache.containsKey(freelancerRef)) {
            return freelancerNameCache.get(freelancerRef);
        }

        String resolved = userRepository.findById(freelancerRef)
                .map(this::displayName)
                .filter(value -> !value.isBlank())
                .or(() -> userRepository.findByEmail(freelancerRef)
                        .map(this::displayName)
                        .filter(value -> !value.isBlank()))
                .or(() -> freelancerRepository.findById(freelancerRef)
                        .map(Freelancer::getUserId)
                        .flatMap(userRepository::findById)
                        .map(this::displayName)
                        .filter(value -> !value.isBlank()))
                .or(() -> freelancerRepository.findByUserId(freelancerRef)
                        .map(Freelancer::getUserId)
                        .flatMap(userRepository::findById)
                        .map(this::displayName)
                        .filter(value -> !value.isBlank()))
                .orElseGet(() -> fallbackLabel(freelancerRef));

        freelancerNameCache.put(freelancerRef, resolved);
        return resolved;
    }

    private String extractEmployerName(Employer employer) {
        if (employer == null) {
            return "";
        }
        if (employer.getCompanyProfile() != null && employer.getCompanyProfile().getCompanyName() != null) {
            return employer.getCompanyProfile().getCompanyName().trim();
        }
        return resolveUserName(employer.getUserId());
    }

    private String resolveUserName(String userRef) {
        if (userRef == null || userRef.isBlank()) {
            return "";
        }
        return userRepository.findById(userRef)
                .map(this::displayName)
                .filter(value -> !value.isBlank())
                .or(() -> userRepository.findByEmail(userRef)
                        .map(this::displayName)
                        .filter(value -> !value.isBlank()))
                .orElse("");
    }

    private String displayName(User user) {
        if (user == null) {
            return "";
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName().trim();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return "@" + user.getUsername().trim();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().trim();
        }
        return fallbackLabel(user.getId());
    }

    private String fallbackLabel(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown";
        }
        return value.length() <= 12 ? value : value.substring(0, 12);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String safeLabel(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private Instant sortInstantForProposal(Proposal proposal) {
        if (proposal.getUpdatedAt() != null) {
            return proposal.getUpdatedAt();
        }
        if (proposal.getCreatedAt() != null) {
            return proposal.getCreatedAt();
        }
        return Instant.EPOCH;
    }

    private Instant sortInstantForProposalView(ProposalView proposal) {
        if (proposal.updatedAt() != null) {
            return proposal.updatedAt();
        }
        if (proposal.createdAt() != null) {
            return proposal.createdAt();
        }
        return Instant.EPOCH;
    }

    private record ScoredProposal(Proposal proposal, ProposalAiRanking ranking) {}

    private record ProposalAiRanking(Integer rank,
                                     Double score,
                                     String recommendation,
                                     List<String> reasons) {
        private static ProposalAiRanking empty() {
            return new ProposalAiRanking(null, null, null, List.of());
        }

        private ProposalAiRanking withRank(int rank) {
            return new ProposalAiRanking(rank, score, recommendation, reasons);
        }

        private ProposalAiRanking withSelectionStatus(Proposal.Status status) {
            if (AI_SELECTABLE_STATUSES.contains(status)) {
                return this;
            }

            ArrayList<String> updatedReasons = new ArrayList<>();
            updatedReasons.add(selectionStatusReason(status));
            if (reasons != null) {
                updatedReasons.addAll(reasons);
            }
            return new ProposalAiRanking(null, score, recommendation, List.copyOf(updatedReasons));
        }

        private static String selectionStatusReason(Proposal.Status status) {
            if (status == Proposal.Status.ACCEPTED) {
                return "Already accepted; excluded from AI selection";
            }
            if (status == Proposal.Status.REJECTED) {
                return "Rejected proposals are excluded from AI selection";
            }
            if (status == Proposal.Status.WITHDRAWN) {
                return "Withdrawn proposals are excluded from AI selection";
            }
            return "Current status is excluded from AI selection";
        }
    }

    private record UserProfileSnapshot(Double averageRating,
                                       Double successRate,
                                       Integer completedProjects,
                                       Integer yearsOfExperience,
                                       Boolean identityVerified) {
        private static UserProfileSnapshot from(User user) {
            if (user == null || user.getProfile() == null) {
                return new UserProfileSnapshot(null, null, null, null, null);
            }

            UserProfile profile = user.getProfile();
            Double normalizedSuccessRate = profile.getSuccessRate() == null
                    ? null
                    : profile.getSuccessRate().doubleValue();
            return new UserProfileSnapshot(
                    profile.getAverageRating(),
                    normalizedSuccessRate,
                    profile.getCompletedProjects(),
                    profile.getYearsOfExperience(),
                    profile.getIdentityVerified()
            );
        }
    }

    private record ProposalReference(String title, String employerId, String employerName) {
        private static final ProposalReference EMPTY = new ProposalReference(null, null, null);
    }

    public record ProposalView(String id,
                               String jobId,
                               String jobTitle,
                               String employerId,
                               String employerName,
                               String freelancerId,
                               String freelancerName,
                               String coverLetter,
                               Double bidAmount,
                               Integer timelineDays,
                               String status,
                               Instant createdAt,
                               Instant updatedAt,
                               Integer aiRank,
                               Double aiScore,
                               String aiRecommendation,
                               List<String> aiReasons,
                               Boolean freelancerVerified,
                               Boolean freelancerPaymentVerified,
                               Double freelancerRating,
                               Integer freelancerReviewCount) {}
}
