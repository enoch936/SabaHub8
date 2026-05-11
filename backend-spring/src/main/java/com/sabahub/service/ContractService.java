package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;
    private final CurrentUserService currentUserService;
    private final EscrowService escrowService;
    private final AuditService auditService;

    public ContractService(ContractRepository contractRepository,
                           EmployerRepository employerRepository,
                           FreelancerRepository freelancerRepository,
                           CurrentUserService currentUserService,
                           EscrowService escrowService,
                           AuditService auditService) {
        this.contractRepository = contractRepository;
        this.employerRepository = employerRepository;
        this.freelancerRepository = freelancerRepository;
        this.currentUserService = currentUserService;
        this.escrowService = escrowService;
        this.auditService = auditService;
    }

    public List<Contract> listMyContracts() {
        User me = currentUserService.requireUser();
        Set<String> identityKeys = resolveIdentityKeys(me);
        boolean isEmployer = currentUserService.hasRole(me, "EMPLOYER");
        boolean isFreelancer = currentUserService.hasRole(me, "FREELANCER");
        boolean isAdmin = currentUserService.hasRole(me, "ADMIN");

        List<Contract> filtered = contractRepository.findAll().stream()
                .filter(contract -> {
                    if (isAdmin) {
                        return true;
                    }

                    boolean matchesEmployer = isEmployer
                            && contract.getEmployerId() != null
                            && identityKeys.contains(contract.getEmployerId());

                    boolean matchesFreelancer = isFreelancer
                            && contract.getFreelancerId() != null
                            && identityKeys.contains(contract.getFreelancerId());

                    return matchesEmployer || matchesFreelancer;
                })
                .sorted(Comparator.comparing(
                        (Contract contract) -> contract.getUpdatedAt() != null ? contract.getUpdatedAt() : contract.getCreatedAt(),
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();

        LinkedHashMap<String, Contract> unique = new LinkedHashMap<>();
        for (Contract contract : filtered) {
            if (contract.getId() != null && !contract.getId().isBlank()) {
                unique.putIfAbsent(contract.getId(), contract);
            }
        }

        return new ArrayList<>(unique.values());
    }

    public Contract createDraftContract(Contract draft) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Contract contract = draft == null ? new Contract() : draft;
        contract.setId(null);
        contract.setEmployerId(me.getId());

        prepareDraftContract(contract, true);
        signAsEmployer(contract, LocalDateTime.now());
        resetFreelancerSignature(contract);

        Contract saved = contractRepository.save(contract);
        auditService.log("CONTRACT_DRAFT_CREATED", "CONTRACT", saved.getId(), java.util.Map.of(
                "employerId", me.getId(),
                "freelancerId", safeString(saved.getFreelancerId()),
                "totalAmount", safe(saved.getTotalAmount()),
                "currency", safeString(saved.getCurrency())
        ));
        return saved;
    }

    public Contract getContract(String id) {
        User me = currentUserService.requireUser();
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!canAccessContract(me, contract)) {
            throw new IllegalStateException("Forbidden");
        }

        return contract;
    }

    public Contract acceptContract(String id) {
        User me = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(me);

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!matchesIdentity(me, contract.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }
        if (contract.getStatus() != Contract.Status.DRAFT && contract.getStatus() != Contract.Status.PENDING) {
            throw new IllegalStateException("Only draft contracts can be accepted");
        }

        prepareDraftContract(contract, false);
        validateContractReadyForActivation(contract);
        escrowService.lockAgreementEscrow(contract, me.getId());

        LocalDateTime now = LocalDateTime.now();
        if (contract.getSignatures() == null) {
            contract.setSignatures(Contract.ContractSignatures.builder().build());
        }
        if (!Boolean.TRUE.equals(contract.getSignatures().getEmployerSigned())) {
            signAsEmployer(contract, now);
        }
        contract.getSignatures().setFreelancerSigned(Boolean.TRUE);
        contract.getSignatures().setFreelancerSignedAt(now);
        contract.getSignatures().setContractHash(buildContractHash(contract));

        contract.setAcceptedAt(now);
        contract.setAgreementEstablishedAt(now);
        contract.setStatus(Contract.Status.ACTIVE);
        contract.setPaidAmount(resolvePaidAmount(contract));

        Contract saved = contractRepository.save(contract);
        auditService.log("CONTRACT_AGREEMENT_ESTABLISHED", "CONTRACT", saved.getId(), java.util.Map.of(
                "freelancerId", me.getId(),
                "employerId", safeString(saved.getEmployerId()),
                "escrowRequiredAmount", safe(saved.getEscrowRequiredAmount()),
                "escrowHeld", safe(saved.getEscrowTotalHeld()),
                "agreementVersion", safeInt(saved.getAgreementVersion(), 1)
        ));
        return saved;
    }

    public Contract addMilestone(String contractId, Contract.PaymentMilestone milestone) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!matchesIdentity(me, contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }
        ensureDraftEditable(contract);
        if (milestone == null) {
            throw new IllegalArgumentException("Milestone is required");
        }

        Contract.PaymentMilestone next = normalizeMilestoneInput(milestone);
        List<Contract.PaymentMilestone> milestones = contract.getPaymentMilestones() == null
                ? new ArrayList<>()
                : new ArrayList<>(contract.getPaymentMilestones());
        milestones.add(next);
        contract.setPaymentMilestones(milestones);

        prepareDraftContract(contract, false);
        signAsEmployer(contract, LocalDateTime.now());
        resetFreelancerSignature(contract);

        Contract saved = contractRepository.save(contract);
        auditService.log("CONTRACT_MILESTONE_ADDED", "CONTRACT", saved.getId(), java.util.Map.of(
                "milestoneId", safeString(next.getId()),
                "sequence", safeInt(next.getSequence(), milestones.size()),
                "amount", safe(next.getAmount())
        ));
        return saved;
    }

    public Contract submitMilestone(String contractId, String milestoneId, String submissionNote) {
        User me = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(me);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!matchesIdentity(me, contract.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }
        if (contract.getStatus() != Contract.Status.ACTIVE && contract.getStatus() != Contract.Status.IN_PROGRESS) {
            throw new IllegalStateException("Milestones can only be submitted on active contracts");
        }

        Contract.PaymentMilestone milestone = findMilestone(contract, milestoneId);
        ensureMilestoneSequenceReady(contract, milestoneId);

        String normalizedStatus = normalizeMilestoneStatus(milestone.getStatus());
        if (!"PENDING".equals(normalizedStatus) && !"IN_PROGRESS".equals(normalizedStatus)) {
            throw new IllegalStateException("Only pending milestones can be submitted");
        }
        if (Boolean.TRUE.equals(contract.getRequiresEscrow()) && !Boolean.TRUE.equals(milestone.getEscrowLocked())) {
            throw new IllegalStateException("Milestone escrow must be locked before work can be submitted");
        }

        milestone.setStatus("SUBMITTED");
        milestone.setSubmittedAt(LocalDateTime.now());
        milestone.setSubmissionNote(blankToNull(submissionNote));
        milestone.setPercentageComplete(100.0);
        contract.setStatus(Contract.Status.IN_PROGRESS);

        Contract saved = contractRepository.save(contract);
        auditService.log("CONTRACT_MILESTONE_SUBMITTED", "CONTRACT", saved.getId(), java.util.Map.of(
                "milestoneId", safeString(milestone.getId()),
                "submittedBy", me.getId()
        ));
        return saved;
    }

    public Contract approveMilestone(String contractId, String milestoneId, String feedbackFromEmployer) {
        User me = currentUserService.requireUser();
        currentUserService.requireEmployerMode(me);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!matchesIdentity(me, contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }
        if (contract.getStatus() != Contract.Status.ACTIVE && contract.getStatus() != Contract.Status.IN_PROGRESS) {
            throw new IllegalStateException("Milestones can only be approved on active contracts");
        }

        Contract.PaymentMilestone milestone = findMilestone(contract, milestoneId);
        ensureMilestoneSequenceReady(contract, milestoneId);
        if (!"SUBMITTED".equals(normalizeMilestoneStatus(milestone.getStatus()))) {
            throw new IllegalStateException("Only submitted milestones can be approved");
        }

        if (Boolean.TRUE.equals(contract.getRequiresEscrow())) {
            escrowService.releaseMilestoneEscrow(contract, milestone, me.getId());
        }

        milestone.setStatus("APPROVED");
        milestone.setApprovedByEmployer(Boolean.TRUE);
        milestone.setApprovedAt(LocalDateTime.now());
        milestone.setFeedbackFromEmployer(blankToNull(feedbackFromEmployer));
        milestone.setPercentageComplete(100.0);
        contract.setPaidAmount(resolvePaidAmount(contract));

        if (allMilestonesApproved(contract) && safe(contract.getEscrowTotalHeld()) <= 0.01d) {
            contract.setStatus(Contract.Status.COMPLETED);
            contract.setCompletedAt(LocalDateTime.now());
        } else {
            contract.setStatus(Contract.Status.IN_PROGRESS);
        }

        Contract saved = contractRepository.save(contract);
        auditService.log("CONTRACT_MILESTONE_APPROVED", "CONTRACT", saved.getId(), java.util.Map.of(
                "milestoneId", safeString(milestone.getId()),
                "approvedBy", me.getId(),
                "releasedAmount", safe(milestone.getAmount())
        ));
        return saved;
    }

    public Contract deliver(String contractId, String note, String deliveryAssetId) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "FREELANCER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!matchesIdentity(me, contract.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }
        if (contract.getStatus() != Contract.Status.ACTIVE && contract.getStatus() != Contract.Status.IN_PROGRESS) {
            throw new IllegalStateException("Contract not active");
        }
        if (contract.getPaymentMilestones() != null && !contract.getPaymentMilestones().isEmpty()) {
            boolean everyMilestoneSubmitted = contract.getPaymentMilestones().stream()
                    .allMatch(milestone -> {
                        String status = normalizeMilestoneStatus(milestone.getStatus());
                        return "SUBMITTED".equals(status) || "APPROVED".equals(status);
                    });
            if (!everyMilestoneSubmitted) {
                throw new IllegalStateException("All milestones must be submitted before final delivery can be marked");
            }
        }

        contract.setDeliveryNote(blankToNull(note));
        contract.setDeliveryAssetId(blankToNull(deliveryAssetId));
        contract.setStatus(Contract.Status.DELIVERED);
        return contractRepository.save(contract);
    }

    public Contract complete(String contractId) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!matchesIdentity(me, contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }
        if (contract.getStatus() == Contract.Status.DISPUTED || contract.getStatus() == Contract.Status.CANCELLED) {
            throw new IllegalStateException("Contract cannot be completed from its current status");
        }
        if (contract.getPaymentMilestones() != null && !contract.getPaymentMilestones().isEmpty() && !allMilestonesApproved(contract)) {
            throw new IllegalStateException("All milestones must be approved before the contract can be completed");
        }
        if (safe(contract.getEscrowTotalHeld()) > 0.01d) {
            throw new IllegalStateException("All escrow funds must be released or refunded before contract completion");
        }
        if ((contract.getPaymentMilestones() == null || contract.getPaymentMilestones().isEmpty())
                && contract.getStatus() != Contract.Status.DELIVERED) {
            throw new IllegalStateException("Contract must be delivered before it can be completed");
        }

        contract.setStatus(Contract.Status.COMPLETED);
        contract.setCompletedAt(LocalDateTime.now());
        contract.setPaidAmount(resolvePaidAmount(contract));
        return contractRepository.save(contract);
    }

    private void prepareDraftContract(Contract contract, boolean newDraft) {
        if (contract == null) {
            throw new IllegalArgumentException("Contract payload is required");
        }

        contract.setStatus(Contract.Status.DRAFT);
        contract.setEscrowTotalHeld(newDraft ? 0.0 : safe(contract.getEscrowTotalHeld()));
        contract.setPaidAmount(newDraft ? 0.0 : resolvePaidAmount(contract));
        contract.setCurrency(firstNonBlank(contract.getCurrency(), "USD").toUpperCase(Locale.ROOT));
        contract.setPaymentModel(firstNonBlank(contract.getPaymentModel(), "MILESTONE"));
        contract.setEscrowProtectionLevel("FULL");
        contract.setRequiresEscrow(Boolean.TRUE);
        contract.setDisputeWindowDays(contract.getDisputeWindowDays() == null ? 7 : contract.getDisputeWindowDays());
        contract.setAutoReleaseDays(contract.getAutoReleaseDays() == null ? 5 : contract.getAutoReleaseDays());
        contract.setAdminReviewRequired(contract.getAdminReviewRequired() == null ? Boolean.TRUE : contract.getAdminReviewRequired());
        contract.setAgreementVersion(safeInt(contract.getAgreementVersion(), 1));
        contract.setAgreementEstablishedAt(null);
        contract.setEscrowLockedAt(newDraft ? null : contract.getEscrowLockedAt());
        contract.setAcceptedAt(newDraft ? null : contract.getAcceptedAt());
        contract.setCompletedAt(contract.getStatus() == Contract.Status.COMPLETED ? contract.getCompletedAt() : null);
        contract.setLastAgreementUpdatedAt(LocalDateTime.now());

        if (contract.getTerms() == null) {
            contract.setTerms(Contract.ContractTerms.builder().build());
        }
        if (contract.getPaymentMilestones() == null) {
            contract.setPaymentMilestones(new ArrayList<>());
        }

        validateContractParties(contract);
        validateContractDates(contract);
        validateContractFinancials(contract);
        validateTerms(contract);
        normalizeAndValidateMilestones(contract, false);
        contract.setEscrowRequiredAmount(resolveRequiredEscrow(contract));
        ensureSignaturesContainer(contract);
        contract.getSignatures().setContractHash(buildContractHash(contract));
    }

    private void validateContractReadyForActivation(Contract contract) {
        validateContractParties(contract);
        validateContractDates(contract);
        validateContractFinancials(contract);
        validateTerms(contract);
        normalizeAndValidateMilestones(contract, true);
        double requiredEscrow = resolveRequiredEscrow(contract);
        if (requiredEscrow <= 0) {
            throw new IllegalStateException("At least one funded milestone is required before the contract agreement can be established");
        }
        contract.setEscrowRequiredAmount(requiredEscrow);
    }

    private void validateContractParties(Contract contract) {
        if (blankToNull(contract.getTitle()) == null) {
            throw new IllegalArgumentException("Contract title is required");
        }
        if (blankToNull(contract.getEmployerId()) == null) {
            throw new IllegalArgumentException("Employer is required");
        }
        if (blankToNull(contract.getFreelancerId()) == null) {
            throw new IllegalArgumentException("Freelancer is required");
        }
    }

    private void validateContractDates(Contract contract) {
        if (contract.getStartDate() == null) {
            throw new IllegalArgumentException("Contract start date is required");
        }
        if (contract.getEndDate() == null) {
            throw new IllegalArgumentException("Contract end date is required");
        }
        if (contract.getEndDate().isBefore(contract.getStartDate())) {
            throw new IllegalArgumentException("Contract end date must be on or after the start date");
        }
    }

    private void validateContractFinancials(Contract contract) {
        if (safe(contract.getTotalAmount()) <= 0) {
            throw new IllegalArgumentException("Contract total amount must be greater than 0");
        }
        if (!Boolean.TRUE.equals(contract.getRequiresEscrow())) {
            throw new IllegalArgumentException("Escrow protection is mandatory for contract agreements");
        }
    }

    private void validateTerms(Contract contract) {
        boolean hasRootDescription = blankToNull(contract.getDescription()) != null;
        boolean hasTermsScope = contract.getTerms() != null && blankToNull(contract.getTerms().getScope()) != null;
        boolean hasDeliverables = contract.getTerms() != null && blankToNull(contract.getTerms().getDeliverables()) != null;
        boolean hasAcceptance = contract.getTerms() != null && blankToNull(contract.getTerms().getAcceptanceCriteria()) != null;

        if (!hasRootDescription && !hasTermsScope && !hasDeliverables && !hasAcceptance) {
            throw new IllegalArgumentException("Contract agreement terms are required");
        }
    }

    private void normalizeAndValidateMilestones(Contract contract, boolean requireExactFundingPlan) {
        List<Contract.PaymentMilestone> milestones = contract.getPaymentMilestones() == null
                ? new ArrayList<>()
                : new ArrayList<>(contract.getPaymentMilestones());

        if (requireExactFundingPlan && milestones.isEmpty()) {
            throw new IllegalStateException("At least one milestone is required before the contract agreement can be established");
        }

        LocalDateTime previousDueDate = null;
        double totalMilestoneAmount = 0.0;

        for (int index = 0; index < milestones.size(); index += 1) {
            Contract.PaymentMilestone milestone = milestones.get(index);
            if (milestone == null) {
                throw new IllegalArgumentException("Milestone entries cannot be empty");
            }

            milestone.setId(firstNonBlank(milestone.getId(), UUID.randomUUID().toString()));
            milestone.setSequence(index + 1);
            milestone.setTitle(firstNonBlank(milestone.getTitle(), null));
            milestone.setDescription(firstNonBlank(milestone.getDescription(), milestone.getDeliverables()));
            milestone.setDeliverables(firstNonBlank(milestone.getDeliverables(), milestone.getDescription()));
            milestone.setStatus(normalizeMilestoneStatus(milestone.getStatus()));
            milestone.setApprovedByEmployer(Boolean.TRUE.equals(milestone.getApprovedByEmployer()));
            milestone.setEscrowLocked(Boolean.TRUE.equals(milestone.getEscrowLocked()));
            milestone.setPercentageComplete(milestone.getPercentageComplete() == null ? 0.0 : milestone.getPercentageComplete());

            if (blankToNull(milestone.getTitle()) == null) {
                throw new IllegalArgumentException("Each milestone must have a title");
            }
            if (safe(milestone.getAmount()) <= 0) {
                throw new IllegalArgumentException("Each milestone amount must be greater than 0");
            }
            if (milestone.getDueDate() == null) {
                throw new IllegalArgumentException("Each milestone must include a due date");
            }
            if (milestone.getDueDate().isBefore(contract.getStartDate())) {
                throw new IllegalArgumentException("Milestone due dates cannot be before the contract start date");
            }
            if (milestone.getDueDate().isAfter(contract.getEndDate())) {
                throw new IllegalArgumentException("Milestone due dates must finish on or before the contract end date");
            }
            if (previousDueDate != null && milestone.getDueDate().isBefore(previousDueDate)) {
                throw new IllegalArgumentException("Milestones must be ordered by ascending due date");
            }

            totalMilestoneAmount += safe(milestone.getAmount());
            previousDueDate = milestone.getDueDate();
        }

        if (totalMilestoneAmount - safe(contract.getTotalAmount()) > 0.01d) {
            throw new IllegalArgumentException("Milestone total cannot exceed the contract amount");
        }
        if (requireExactFundingPlan && Math.abs(totalMilestoneAmount - safe(contract.getTotalAmount())) > 0.01d) {
            throw new IllegalStateException("Milestone total must exactly match the contract amount before agreement can be established");
        }

        contract.setPaymentMilestones(milestones);
    }

    private Contract.PaymentMilestone normalizeMilestoneInput(Contract.PaymentMilestone milestone) {
        Contract.PaymentMilestone next = milestone;
        next.setId(firstNonBlank(next.getId(), UUID.randomUUID().toString()));
        next.setTitle(blankToNull(next.getTitle()));
        next.setDescription(firstNonBlank(next.getDescription(), next.getDeliverables()));
        next.setDeliverables(firstNonBlank(next.getDeliverables(), next.getDescription()));
        next.setStatus("PENDING");
        next.setApprovedByEmployer(Boolean.FALSE);
        next.setApprovedAt(null);
        next.setSubmittedAt(null);
        next.setReleaseDate(null);
        next.setEscrowLocked(Boolean.FALSE);
        next.setEscrowLockedAt(null);
        next.setEscrowReferenceId(null);
        next.setPaymentReferenceId(null);
        next.setSubmissionNote(null);
        next.setFeedbackFromEmployer(null);
        next.setPercentageComplete(0.0);
        return next;
    }

    private Contract.PaymentMilestone findMilestone(Contract contract, String milestoneId) {
        if (contract.getPaymentMilestones() == null || contract.getPaymentMilestones().isEmpty()) {
            throw new IllegalArgumentException("Contract has no milestones");
        }

        return contract.getPaymentMilestones().stream()
                .filter(milestone -> milestone != null && milestoneId.equals(milestone.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Milestone not found"));
    }

    private void ensureMilestoneSequenceReady(Contract contract, String milestoneId) {
        if (contract.getPaymentMilestones() == null) {
            return;
        }

        for (Contract.PaymentMilestone milestone : contract.getPaymentMilestones()) {
            if (milestone == null) {
                continue;
            }
            if (milestoneId.equals(milestone.getId())) {
                return;
            }
            if (!isMilestoneApproved(milestone)) {
                throw new IllegalStateException("Milestones must be completed in sequence");
            }
        }
    }

    private boolean allMilestonesApproved(Contract contract) {
        return contract.getPaymentMilestones() != null
                && !contract.getPaymentMilestones().isEmpty()
                && contract.getPaymentMilestones().stream().allMatch(this::isMilestoneApproved);
    }

    private boolean isMilestoneApproved(Contract.PaymentMilestone milestone) {
        return milestone != null && ("APPROVED".equals(normalizeMilestoneStatus(milestone.getStatus()))
                || "RELEASED".equals(normalizeMilestoneStatus(milestone.getStatus())));
    }

    private void ensureDraftEditable(Contract contract) {
        if (contract.getStatus() != Contract.Status.DRAFT && contract.getStatus() != Contract.Status.PENDING) {
            throw new IllegalStateException("Milestones can only be changed before the agreement is established");
        }
        if (safe(contract.getEscrowTotalHeld()) > 0.01d || contract.getAgreementEstablishedAt() != null) {
            throw new IllegalStateException("Contract agreement is already funded and cannot be edited");
        }
    }

    private void signAsEmployer(Contract contract, LocalDateTime signedAt) {
        ensureSignaturesContainer(contract);
        contract.getSignatures().setEmployerSigned(Boolean.TRUE);
        contract.getSignatures().setEmployerSignedAt(signedAt);
        contract.getSignatures().setContractHash(buildContractHash(contract));
    }

    private void resetFreelancerSignature(Contract contract) {
        ensureSignaturesContainer(contract);
        contract.getSignatures().setFreelancerSigned(Boolean.FALSE);
        contract.getSignatures().setFreelancerSignedAt(null);
    }

    private void ensureSignaturesContainer(Contract contract) {
        if (contract.getSignatures() == null) {
            contract.setSignatures(Contract.ContractSignatures.builder().build());
        }
    }

    private String buildContractHash(Contract contract) {
        StringBuilder payload = new StringBuilder();
        payload.append(safeString(contract.getTitle())).append('|')
                .append(safeString(contract.getDescription())).append('|')
                .append(safeString(contract.getEmployerId())).append('|')
                .append(safeString(contract.getFreelancerId())).append('|')
                .append(safe(contract.getTotalAmount())).append('|')
                .append(safeString(contract.getCurrency())).append('|')
                .append(contract.getStartDate()).append('|')
                .append(contract.getEndDate()).append('|')
                .append(safeInt(contract.getAgreementVersion(), 1));

        if (contract.getTerms() != null) {
            payload.append('|').append(safeString(contract.getTerms().getScope()))
                    .append('|').append(safeString(contract.getTerms().getDeliverables()))
                    .append('|').append(safeString(contract.getTerms().getAcceptanceCriteria()))
                    .append('|').append(safeString(contract.getTerms().getPaymentSchedule()))
                    .append('|').append(safeString(contract.getTerms().getConfidentiality()))
                    .append('|').append(safeString(contract.getTerms().getIpRights()))
                    .append('|').append(safeString(contract.getTerms().getTerminationClause()));
        }

        if (contract.getPaymentMilestones() != null) {
            for (Contract.PaymentMilestone milestone : contract.getPaymentMilestones()) {
                if (milestone == null) {
                    continue;
                }
                payload.append('|')
                        .append(safeString(milestone.getId())).append(':')
                        .append(safeInt(milestone.getSequence(), 0)).append(':')
                        .append(safeString(milestone.getTitle())).append(':')
                        .append(safe(milestone.getAmount())).append(':')
                        .append(milestone.getDueDate());
            }
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(payload.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to calculate contract hash");
        }
    }

    private boolean canAccessContract(User me, Contract contract) {
        return currentUserService.hasRole(me, "ADMIN")
                || matchesIdentity(me, contract.getEmployerId())
                || matchesIdentity(me, contract.getFreelancerId());
    }

    private boolean matchesIdentity(User me, String targetId) {
        return targetId != null && resolveIdentityKeys(me).contains(targetId);
    }

    private Set<String> resolveIdentityKeys(User me) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();

        if (me.getId() != null && !me.getId().isBlank()) {
            keys.add(me.getId());
        }
        if (me.getEmail() != null && !me.getEmail().isBlank()) {
            keys.add(me.getEmail());
        }

        if (me.getId() != null && !me.getId().isBlank()) {
            employerRepository.findByUserId(me.getId())
                    .ifPresent(employer -> {
                        if (employer.getId() != null && !employer.getId().isBlank()) {
                            keys.add(employer.getId());
                        }
                    });

            freelancerRepository.findByUserId(me.getId())
                    .ifPresent(freelancer -> {
                        if (freelancer.getId() != null && !freelancer.getId().isBlank()) {
                            keys.add(freelancer.getId());
                        }
                    });
        }

        if (me.getEmail() != null && !me.getEmail().isBlank()) {
            employerRepository.findByUserId(me.getEmail())
                    .ifPresent(employer -> {
                        if (employer.getId() != null && !employer.getId().isBlank()) {
                            keys.add(employer.getId());
                        }
                    });

            freelancerRepository.findByUserId(me.getEmail())
                    .ifPresent(freelancer -> {
                        if (freelancer.getId() != null && !freelancer.getId().isBlank()) {
                            keys.add(freelancer.getId());
                        }
                    });
        }

        return keys;
    }

    private double resolveRequiredEscrow(Contract contract) {
        if (contract.getPaymentMilestones() != null && !contract.getPaymentMilestones().isEmpty()) {
            return round2(contract.getPaymentMilestones().stream()
                    .filter(java.util.Objects::nonNull)
                    .mapToDouble(milestone -> safe(milestone.getAmount()))
                    .sum());
        }
        return round2(safe(contract.getTotalAmount()));
    }

    private double resolvePaidAmount(Contract contract) {
        if (contract.getPaymentMilestones() != null && !contract.getPaymentMilestones().isEmpty()) {
            return round2(contract.getPaymentMilestones().stream()
                    .filter(this::isMilestoneApproved)
                    .mapToDouble(milestone -> safe(milestone.getAmount()))
                    .sum());
        }
        return round2(safe(contract.getPaidAmount()));
    }

    private String normalizeMilestoneStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "IN_ESCROW" -> "PENDING";
            case "RELEASED" -> "APPROVED";
            default -> normalized;
        };
    }

    private String firstNonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private int safeInt(Integer value, int fallback) {
        return value == null || value < 1 ? fallback : value;
    }

    private double round2(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }
}
