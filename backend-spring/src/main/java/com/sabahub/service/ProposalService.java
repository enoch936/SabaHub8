package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.User;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProposalService {

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

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!canManageJobAsEmployer(me, job)) {
            throw new IllegalStateException("Forbidden");
        }

        List<Proposal> proposals = proposalRepository.findByJobId(jobId);
        reconcileAcceptedProposals(proposals);
        return proposals;
    }

    public List<ProposalView> listProposalViewsForEmployerJob(String jobId) {
        return toProposalViews(listProposalsForEmployerJob(jobId));
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
                .map(proposal -> toProposalView(proposal, referenceCache, employerNameCache, freelancerNameCache))
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

    private ProposalView toProposalView(Proposal proposal,
                                        Map<String, ProposalReference> referenceCache,
                                        Map<String, String> employerNameCache,
                                        Map<String, String> freelancerNameCache) {
        ProposalReference reference = resolveReference(proposal.getJobId(), referenceCache, employerNameCache);

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
                proposal.getUpdatedAt()
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
                               Instant updatedAt) {}
}
