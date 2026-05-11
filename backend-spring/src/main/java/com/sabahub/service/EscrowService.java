package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.User;
import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.WalletLedgerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class EscrowService {

    private final ContractRepository contractRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final WalletService walletService;
    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;

    public EscrowService(ContractRepository contractRepository,
                         WalletLedgerRepository walletLedgerRepository,
                         CurrentUserService currentUserService,
                         AuditService auditService,
                         WalletService walletService,
                         EmployerRepository employerRepository,
                         FreelancerRepository freelancerRepository) {
        this.contractRepository = contractRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.walletService = walletService;
        this.employerRepository = employerRepository;
        this.freelancerRepository = freelancerRepository;
    }

    public Contract fundEscrow(String contractId, double amount, String currency) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        String employerWalletUserId = resolveEmployerWalletUserId(contract.getEmployerId());

        if (!me.getId().equals(employerWalletUserId)) {
            throw new IllegalStateException("Forbidden");
        }
        ensureEscrowCanChange(contract);

        String escrowCurrency = resolveCurrency(contract, currency);
        double normalizedAmount = round2(amount);
        double availableBalance = walletService.getAvailableBalanceByUserIdAndCurrency(employerWalletUserId, escrowCurrency);
        if (availableBalance + 0.01d < normalizedAmount) {
            throw new IllegalStateException("Insufficient available wallet balance");
        }

        String reference = buildReference(contract.getId(), "manual-fund-" + UUID.randomUUID());
        persistLedgerEntry(
                employerWalletUserId,
                WalletLedgerEntry.Type.DEBIT,
                WalletLedgerEntry.Reason.ESCROW_FUND,
                normalizedAmount,
                escrowCurrency,
                reference
        );

        contract.setCurrency(escrowCurrency);
        contract.setEscrowTotalHeld(round2(safe(contract.getEscrowTotalHeld()) + normalizedAmount));
        contract.setEscrowRequiredAmount(round2(Math.max(safe(contract.getEscrowRequiredAmount()), resolveRequiredEscrow(contract))));
        if (contract.getEscrowRequiredAmount() > 0
                && contract.getEscrowTotalHeld() + 0.01d >= contract.getEscrowRequiredAmount()) {
            markMilestonesEscrowLocked(contract, LocalDateTime.now());
            if (contract.getEscrowLockedAt() == null) {
                contract.setEscrowLockedAt(LocalDateTime.now());
            }
        }

        Contract saved = contractRepository.save(contract);
        auditService.log("ESCROW_FUND", "CONTRACT", saved.getId(), java.util.Map.of(
                "amount", normalizedAmount,
                "currency", escrowCurrency,
                "employer_id", me.getId()
        ));
        return saved;
    }

    public Contract lockAgreementEscrow(Contract contract, String initiatedByUserId) {
        if (contract == null || contract.getId() == null || contract.getId().isBlank()) {
            throw new IllegalArgumentException("Contract is required");
        }
        if (!Boolean.TRUE.equals(contract.getRequiresEscrow())) {
            throw new IllegalStateException("Escrow is required before the contract agreement can be established");
        }

        String escrowCurrency = resolveCurrency(contract, contract.getCurrency());
        double requiredAmount = round2(resolveRequiredEscrow(contract));
        if (requiredAmount <= 0) {
            throw new IllegalStateException("Contract must have a funded amount before agreement can be established");
        }

        double currentlyHeld = round2(safe(contract.getEscrowTotalHeld()));
        double remaining = round2(Math.max(0.0, requiredAmount - currentlyHeld));
        String reference = buildReference(contract.getId(), "agreement-lock-v" + safeInt(contract.getAgreementVersion(), 1));

        if (remaining > 0) {
            String employerWalletUserId = resolveEmployerWalletUserId(contract.getEmployerId());
            if (!walletLedgerRepository.existsByUserIdAndReferenceId(employerWalletUserId, reference)) {
                double availableBalance = walletService.getAvailableBalanceByUserIdAndCurrency(employerWalletUserId, escrowCurrency);
                if (availableBalance + 0.01d < remaining) {
                    throw new IllegalStateException(String.format(
                            Locale.ROOT,
                            "Escrow must be fully locked before contract agreement can be established. Required %.2f %s but only %.2f is available.",
                            remaining,
                            escrowCurrency,
                            availableBalance
                    ));
                }

                persistLedgerEntry(
                        employerWalletUserId,
                        WalletLedgerEntry.Type.DEBIT,
                        WalletLedgerEntry.Reason.ESCROW_FUND,
                        remaining,
                        escrowCurrency,
                        reference
                );
            }

            contract.setEscrowTotalHeld(round2(currentlyHeld + remaining));
        }

        LocalDateTime lockedAt = contract.getEscrowLockedAt() == null ? LocalDateTime.now() : contract.getEscrowLockedAt();
        contract.setCurrency(escrowCurrency);
        contract.setEscrowRequiredAmount(requiredAmount);
        contract.setEscrowLockedAt(lockedAt);
        markMilestonesEscrowLocked(contract, lockedAt);

        auditService.log("CONTRACT_ESCROW_LOCKED", "CONTRACT", contract.getId(), java.util.Map.of(
                "requiredAmount", requiredAmount,
                "currency", escrowCurrency,
                "actorUserId", initiatedByUserId == null ? "" : initiatedByUserId
        ));

        return contract;
    }

    public Contract releaseEscrow(String contractId, double amount, Double platformFeeAmount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        String employerWalletUserId = resolveEmployerWalletUserId(contract.getEmployerId());
        String freelancerWalletUserId = resolveFreelancerWalletUserId(contract.getFreelancerId());

        if (!me.getId().equals(employerWalletUserId)) {
            throw new IllegalStateException("Forbidden");
        }

        double normalizedAmount = round2(amount);
        double fee = round2(platformFeeAmount == null ? 0.0 : platformFeeAmount);
        if (fee < 0) {
            throw new IllegalArgumentException("Fee must be greater than or equal to 0");
        }
        if (fee > normalizedAmount) {
            throw new IllegalArgumentException("Fee cannot exceed the escrow release amount");
        }
        if (safe(contract.getEscrowTotalHeld()) + 0.01d < normalizedAmount) {
            throw new IllegalStateException("Insufficient escrow held");
        }

        String escrowCurrency = resolveCurrency(contract, contract.getCurrency());
        String releaseReference = buildReference(contract.getId(), "manual-release-" + UUID.randomUUID());
        persistLedgerEntry(
                freelancerWalletUserId,
                WalletLedgerEntry.Type.CREDIT,
                WalletLedgerEntry.Reason.ESCROW_RELEASE,
                round2(normalizedAmount - fee),
                escrowCurrency,
                releaseReference
        );

        if (fee > 0) {
            persistLedgerEntry(
                    freelancerWalletUserId,
                    WalletLedgerEntry.Type.DEBIT,
                    WalletLedgerEntry.Reason.FEE,
                    fee,
                    escrowCurrency,
                    buildReference(contract.getId(), "manual-release-fee-" + UUID.randomUUID())
            );
        }

        contract.setEscrowTotalHeld(round2(Math.max(0.0, safe(contract.getEscrowTotalHeld()) - normalizedAmount)));
        contract.setPaidAmount(round2(safe(contract.getPaidAmount()) + normalizedAmount));
        if (contract.getEscrowTotalHeld() <= 0.01d && contract.getStatus() == Contract.Status.DELIVERED) {
            contract.setStatus(Contract.Status.COMPLETED);
        }

        Contract saved = contractRepository.save(contract);
        auditService.log("ESCROW_RELEASE", "CONTRACT", saved.getId(), java.util.Map.of(
                "amount", normalizedAmount,
                "fee", fee,
                "currency", escrowCurrency,
                "freelancer_id", contract.getFreelancerId()
        ));
        return saved;
    }

    public Contract releaseMilestoneEscrow(Contract contract,
                                           Contract.PaymentMilestone milestone,
                                           String approvedByUserId) {
        if (contract == null || milestone == null) {
            throw new IllegalArgumentException("Contract and milestone are required");
        }
        double amount = round2(safe(milestone.getAmount()));
        if (amount <= 0) {
            throw new IllegalArgumentException("Milestone amount must be greater than 0");
        }
        if (safe(contract.getEscrowTotalHeld()) + 0.01d < amount) {
            throw new IllegalStateException("Milestone cannot be approved because escrow is not fully locked");
        }

        String escrowCurrency = resolveCurrency(contract, contract.getCurrency());
        String freelancerWalletUserId = resolveFreelancerWalletUserId(contract.getFreelancerId());
        String reference = milestone.getPaymentReferenceId();
        if (reference == null || reference.isBlank()) {
            reference = buildReference(contract.getId(), "milestone-" + milestone.getId() + "-release");
        }

        if (!walletLedgerRepository.existsByUserIdAndReferenceId(freelancerWalletUserId, reference)) {
            persistLedgerEntry(
                    freelancerWalletUserId,
                    WalletLedgerEntry.Type.CREDIT,
                    WalletLedgerEntry.Reason.ESCROW_RELEASE,
                    amount,
                    escrowCurrency,
                    reference
            );
        }

        milestone.setPaymentReferenceId(reference);
        milestone.setReleaseDate(LocalDateTime.now());
        contract.setEscrowTotalHeld(round2(Math.max(0.0, safe(contract.getEscrowTotalHeld()) - amount)));

        auditService.log("MILESTONE_ESCROW_RELEASE", "CONTRACT", contract.getId(), java.util.Map.of(
                "milestoneId", milestone.getId(),
                "amount", amount,
                "currency", escrowCurrency,
                "approvedByUserId", approvedByUserId == null ? "" : approvedByUserId
        ));

        return contract;
    }

    public Contract requestEscrowRefund(String contractId, double amount, String note) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        User me = currentUserService.requireUser();
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        ensureRefundWorkflowAvailable(contract);

        boolean employerParty = matchesIdentity(me, contract.getEmployerId());
        boolean freelancerParty = matchesIdentity(me, contract.getFreelancerId());
        if (!employerParty && !freelancerParty) {
            throw new IllegalStateException("Forbidden");
        }

        if (employerParty) {
            currentUserService.requireEmployerMode(me);
        } else {
            currentUserService.requireFreelancerMode(me);
        }

        Contract.EscrowRefundRequest existing = contract.getRefundRequest();
        if (isPendingRefundRequest(existing)) {
            throw new IllegalStateException("An escrow refund request is already awaiting approval");
        }

        double normalizedAmount = round2(amount);
        if (safe(contract.getEscrowTotalHeld()) + 0.01d < normalizedAmount) {
            throw new IllegalStateException("Requested refund exceeds held escrow");
        }

        LocalDateTime now = LocalDateTime.now();
        String actorRole = employerParty ? "EMPLOYER" : "FREELANCER";
        Contract.EscrowRefundRequest request = Contract.EscrowRefundRequest.builder()
                .id(UUID.randomUUID().toString())
                .status("PENDING")
                .amount(normalizedAmount)
                .currency(resolveCurrency(contract, contract.getCurrency()))
                .note(blankToNull(note))
                .requestedByUserId(me.getId())
                .requestedByRole(actorRole)
                .requestedAt(now)
                .employerApproval(buildPendingRefundApproval("EMPLOYER"))
                .freelancerApproval(buildPendingRefundApproval("FREELANCER"))
                .build();

        if (employerParty) {
            applyRefundApproval(request.getEmployerApproval(), "APPROVED", me.getId(), note, now);
        } else {
            applyRefundApproval(request.getFreelancerApproval(), "APPROVED", me.getId(), note, now);
        }

        contract.setRefundRequest(request);
        Contract saved = contractRepository.save(contract);
        auditService.log("ESCROW_REFUND_REQUESTED", "CONTRACT", saved.getId(), java.util.Map.of(
                "amount", normalizedAmount,
                "currency", request.getCurrency(),
                "requestedByUserId", me.getId(),
                "requestedByRole", actorRole
        ));
        return saved;
    }

    public Contract decideEscrowRefund(String contractId, boolean approve, String note) {
        User me = currentUserService.requireUser();
        boolean isAdmin = hasFinanceDisputeAccess(me);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        ensureRefundWorkflowAvailable(contract);

        Contract.EscrowRefundRequest request = contract.getRefundRequest();
        if (!isPendingRefundRequest(request)) {
            throw new IllegalStateException("No pending escrow refund request exists for this contract");
        }

        boolean employerParty = matchesIdentity(me, contract.getEmployerId());
        boolean freelancerParty = matchesIdentity(me, contract.getFreelancerId());
        if (!isAdmin && !employerParty && !freelancerParty) {
            throw new IllegalStateException("Forbidden");
        }

        LocalDateTime now = LocalDateTime.now();
        if (isAdmin) {
            if (!approve) {
                request.setStatus("REJECTED");
                request.setResolutionType("ADMIN_REJECTED");
                request.setResolutionNote(firstNonBlank(note, "Admin rejected the escrow refund request."));
                request.setResolvedByUserId(me.getId());
                request.setResolvedAt(now);

                contract.setRefundRequest(request);
                Contract saved = contractRepository.save(contract);
                auditService.log("ESCROW_REFUND_REJECTED", "CONTRACT", saved.getId(), java.util.Map.of(
                        "amount", round2(safe(request.getAmount())),
                        "currency", firstNonBlank(request.getCurrency(), resolveCurrency(contract, contract.getCurrency())),
                        "actorUserId", me.getId(),
                        "actorType", "ADMIN"
                ));
                return saved;
            }

            request.setResolutionType("ADMIN_OVERRIDE");
            request.setResolutionNote(firstNonBlank(note, request.getResolutionNote(), "Admin approved escrow refund."));
            request.setResolvedByUserId(me.getId());
            request.setResolvedAt(now);
            contract.setRefundRequest(request);
            contractRepository.save(contract);
            return refundEscrow(contractId, safe(request.getAmount()));
        }

        if (employerParty) {
            currentUserService.requireEmployerMode(me);
            if (!isPendingRefundApproval(request.getEmployerApproval())) {
                throw new IllegalStateException("Employer has already acted on this refund request");
            }
            applyRefundApproval(request.getEmployerApproval(), approve ? "APPROVED" : "REJECTED", me.getId(), note, now);
        } else {
            currentUserService.requireFreelancerMode(me);
            if (!isPendingRefundApproval(request.getFreelancerApproval())) {
                throw new IllegalStateException("Freelancer has already acted on this refund request");
            }
            applyRefundApproval(request.getFreelancerApproval(), approve ? "APPROVED" : "REJECTED", me.getId(), note, now);
        }

        if (!approve) {
            request.setStatus("REJECTED");
            request.setResolutionType("PARTY_REJECTED");
            request.setResolutionNote(firstNonBlank(note, "Refund request was rejected by " + (employerParty ? "employer" : "freelancer") + "."));
            request.setResolvedByUserId(me.getId());
            request.setResolvedAt(now);

            contract.setRefundRequest(request);
            Contract saved = contractRepository.save(contract);
            auditService.log("ESCROW_REFUND_REJECTED", "CONTRACT", saved.getId(), java.util.Map.of(
                    "amount", round2(safe(request.getAmount())),
                    "currency", firstNonBlank(request.getCurrency(), resolveCurrency(contract, contract.getCurrency())),
                    "actorUserId", me.getId(),
                    "actorType", employerParty ? "EMPLOYER" : "FREELANCER"
            ));
            return saved;
        }

        if (hasDualRefundApproval(request)) {
            request.setStatus("APPROVED");
            request.setResolutionType("DUAL_APPROVAL");
            request.setResolutionNote(firstNonBlank(note, request.getResolutionNote(), "Employer and freelancer both approved the escrow refund."));
            request.setResolvedByUserId(me.getId());
            request.setResolvedAt(now);
            contract.setRefundRequest(request);
            contractRepository.save(contract);
            return refundEscrow(contractId, safe(request.getAmount()));
        }

        contract.setRefundRequest(request);
        Contract saved = contractRepository.save(contract);
        auditService.log("ESCROW_REFUND_APPROVED_PARTIALLY", "CONTRACT", saved.getId(), java.util.Map.of(
                "amount", round2(safe(request.getAmount())),
                "currency", firstNonBlank(request.getCurrency(), resolveCurrency(contract, contract.getCurrency())),
                "actorUserId", me.getId(),
                "actorType", employerParty ? "EMPLOYER" : "FREELANCER"
        ));
        return saved;
    }

    public Contract refundEscrow(String contractId, double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        User me = currentUserService.requireUser();
        boolean isAdmin = hasFinanceDisputeAccess(me);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        ensureRefundWorkflowAvailable(contract);
        String employerWalletUserId = resolveEmployerWalletUserId(contract.getEmployerId());

        boolean employerParty = matchesIdentity(me, contract.getEmployerId());
        boolean freelancerParty = matchesIdentity(me, contract.getFreelancerId());
        if (!isAdmin && !employerParty && !freelancerParty) {
            throw new IllegalStateException("Forbidden");
        }

        double normalizedAmount = round2(amount);
        if (safe(contract.getEscrowTotalHeld()) + 0.01d < normalizedAmount) {
            throw new IllegalStateException("Insufficient escrow held");
        }

        Contract.EscrowRefundRequest request = contract.getRefundRequest();
        if (!isAdmin) {
            if (request == null || !"APPROVED".equalsIgnoreCase(firstNonBlank(request.getStatus(), "")) || !hasDualRefundApproval(request)) {
                throw new IllegalStateException("Escrow refund requires employer and freelancer approval or admin decision");
            }
            if (Math.abs(safe(request.getAmount()) - normalizedAmount) > 0.01d) {
                throw new IllegalStateException("Refund amount must match the approved escrow refund request");
            }
        }

        if (request == null) {
            request = buildSyntheticRefundRequest(normalizedAmount, resolveCurrency(contract, contract.getCurrency()), me, isAdmin);
        } else {
            request.setAmount(normalizedAmount);
            request.setCurrency(firstNonBlank(request.getCurrency(), resolveCurrency(contract, contract.getCurrency())));
        }

        String escrowCurrency = resolveCurrency(contract, contract.getCurrency());
        persistLedgerEntry(
                employerWalletUserId,
                WalletLedgerEntry.Type.CREDIT,
                WalletLedgerEntry.Reason.REFUND,
                normalizedAmount,
                escrowCurrency,
                buildReference(contract.getId(), "refund-" + UUID.randomUUID())
        );

        contract.setEscrowTotalHeld(round2(Math.max(0.0, safe(contract.getEscrowTotalHeld()) - normalizedAmount)));
        LocalDateTime now = LocalDateTime.now();
        request.setStatus("EXECUTED");
        request.setExecutedAt(now);
        request.setResolvedAt(now);
        request.setResolvedByUserId(me.getId());
        request.setResolutionType(firstNonBlank(request.getResolutionType(), isAdmin ? "ADMIN_OVERRIDE" : "DUAL_APPROVAL"));
        request.setResolutionNote(firstNonBlank(request.getResolutionNote(), isAdmin
                ? "Escrow refunded by admin decision."
                : "Escrow refunded after employer and freelancer approval."));
        contract.setRefundRequest(request);
        syncContractStatusAfterRefund(contract, now);
        Contract saved = contractRepository.save(contract);

        auditService.log("ESCROW_REFUND", "CONTRACT", saved.getId(), java.util.Map.of(
                "amount", normalizedAmount,
                "currency", escrowCurrency,
                "employer_id", contract.getEmployerId(),
                "is_admin", isAdmin,
                "refund_resolution_type", firstNonBlank(request.getResolutionType(), "")
        ));
        return saved;
    }

    public Contract settleDisputedEscrow(String contractId,
                                         double employerAmount,
                                         double freelancerAmount,
                                         double adminAmount,
                                         String reserveRecipientUserId,
                                         String note) {
        User me = currentUserService.requireUser();
        if (!hasFinanceDisputeAccess(me)) {
            throw new IllegalStateException("Forbidden");
        }

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (contract.getStatus() != Contract.Status.DISPUTED) {
            throw new IllegalStateException("Contract is not in disputed status");
        }

        double employer = round2(Math.max(0.0, employerAmount));
        double freelancer = round2(Math.max(0.0, freelancerAmount));
        double admin = round2(Math.max(0.0, adminAmount));
        double total = round2(employer + freelancer + admin);
        double held = round2(safe(contract.getEscrowTotalHeld()));

        if (total <= 0) {
            throw new IllegalArgumentException("Settlement amount must be greater than 0");
        }
        if (Math.abs(total - held) > 0.01d) {
            throw new IllegalArgumentException("Settlement amount must exactly match held escrow");
        }

        String escrowCurrency = resolveCurrency(contract, contract.getCurrency());
        if (employer > 0) {
            creditUser(resolveEmployerWalletUserId(contract.getEmployerId()), WalletLedgerEntry.Reason.DISPUTE_SETTLEMENT_EMPLOYER, employer, escrowCurrency,
                    buildReference(contract.getId(), "dispute-employer-" + UUID.randomUUID()));
        }
        if (freelancer > 0) {
            creditUser(resolveFreelancerWalletUserId(contract.getFreelancerId()), WalletLedgerEntry.Reason.DISPUTE_SETTLEMENT_FREELANCER, freelancer, escrowCurrency,
                    buildReference(contract.getId(), "dispute-freelancer-" + UUID.randomUUID()));
        }
        if (admin > 0) {
            String reserveRecipient = reserveRecipientUserId == null || reserveRecipientUserId.isBlank()
                    ? me.getId()
                    : reserveRecipientUserId;
            creditUser(reserveRecipient, WalletLedgerEntry.Reason.DISPUTE_SETTLEMENT_ADMIN, admin, escrowCurrency,
                    buildReference(contract.getId(), "dispute-admin-" + UUID.randomUUID()));
        }

        contract.setEscrowTotalHeld(0.0);
        contract.setStatus(Contract.Status.COMPLETED);
        Contract saved = contractRepository.save(contract);

        auditService.log("ESCROW_DISPUTE_SETTLEMENT", "CONTRACT", saved.getId(), java.util.Map.of(
                "employerAmount", employer,
                "freelancerAmount", freelancer,
                "adminAmount", admin,
                "currency", escrowCurrency,
                "reserveRecipientUserId", reserveRecipientUserId == null ? "" : reserveRecipientUserId,
                "note", note == null ? "" : note,
                "adminUserId", me.getId()
        ));

        return saved;
    }

    private void ensureRefundWorkflowAvailable(Contract contract) {
        ensureEscrowCanChange(contract);
        if (contract.getStatus() == Contract.Status.DISPUTED) {
            throw new IllegalStateException("Refund workflow is unavailable while the contract is disputed. Use admin dispute settlement.");
        }
    }

    private Contract.EscrowRefundApproval buildPendingRefundApproval(String partyRole) {
        return Contract.EscrowRefundApproval.builder()
                .partyRole(partyRole)
                .status("PENDING")
                .build();
    }

    private void applyRefundApproval(Contract.EscrowRefundApproval approval,
                                     String status,
                                     String actorUserId,
                                     String note,
                                     LocalDateTime actedAt) {
        if (approval == null) {
            return;
        }
        approval.setStatus(firstNonBlank(status, "PENDING"));
        approval.setActedByUserId(actorUserId);
        approval.setNote(blankToNull(note));
        approval.setActedAt(actedAt);
    }

    private boolean hasDualRefundApproval(Contract.EscrowRefundRequest request) {
        if (request == null) {
            return false;
        }
        return "APPROVED".equalsIgnoreCase(firstNonBlank(request.getEmployerApproval() == null ? null : request.getEmployerApproval().getStatus(), ""))
                && "APPROVED".equalsIgnoreCase(firstNonBlank(request.getFreelancerApproval() == null ? null : request.getFreelancerApproval().getStatus(), ""));
    }

    private boolean isPendingRefundRequest(Contract.EscrowRefundRequest request) {
        return request != null && "PENDING".equalsIgnoreCase(firstNonBlank(request.getStatus(), ""));
    }

    private boolean isPendingRefundApproval(Contract.EscrowRefundApproval approval) {
        return approval != null && "PENDING".equalsIgnoreCase(firstNonBlank(approval.getStatus(), ""));
    }

    private Contract.EscrowRefundRequest buildSyntheticRefundRequest(double amount,
                                                                     String currency,
                                                                     User actor,
                                                                     boolean isAdmin) {
        LocalDateTime now = LocalDateTime.now();
        Contract.EscrowRefundRequest request = Contract.EscrowRefundRequest.builder()
                .id(UUID.randomUUID().toString())
                .status("APPROVED")
                .amount(amount)
                .currency(currency)
                .requestedByUserId(actor.getId())
                .requestedByRole(isAdmin ? "ADMIN" : "SYSTEM")
                .requestedAt(now)
                .employerApproval(buildPendingRefundApproval("EMPLOYER"))
                .freelancerApproval(buildPendingRefundApproval("FREELANCER"))
                .resolvedByUserId(actor.getId())
                .resolutionType(isAdmin ? "ADMIN_OVERRIDE" : "SYSTEM")
                .resolvedAt(now)
                .build();

        if (isAdmin) {
            request.setResolutionNote("Escrow refunded by admin decision.");
        }
        return request;
    }

    private void syncContractStatusAfterRefund(Contract contract, LocalDateTime processedAt) {
        if (safe(contract.getEscrowTotalHeld()) > 0.01d) {
            return;
        }

        if (safe(contract.getPaidAmount()) > 0.01d) {
            contract.setStatus(Contract.Status.COMPLETED);
            if (contract.getCompletedAt() == null) {
                contract.setCompletedAt(processedAt);
            }
            return;
        }

        contract.setStatus(Contract.Status.CANCELLED);
        contract.setCompletedAt(null);
    }

    private void markMilestonesEscrowLocked(Contract contract, LocalDateTime lockedAt) {
        if (contract.getPaymentMilestones() == null) {
            return;
        }
        for (Contract.PaymentMilestone milestone : contract.getPaymentMilestones()) {
            if (milestone == null) {
                continue;
            }
            milestone.setEscrowLocked(Boolean.TRUE);
            if (milestone.getEscrowLockedAt() == null) {
                milestone.setEscrowLockedAt(lockedAt);
            }
            if (milestone.getEscrowReferenceId() == null || milestone.getEscrowReferenceId().isBlank()) {
                milestone.setEscrowReferenceId(buildReference(contract.getId(), "milestone-" + milestone.getId() + "-lock"));
            }
            if (milestone.getStatus() == null || milestone.getStatus().isBlank()) {
                milestone.setStatus("PENDING");
            }
        }
    }

    private void ensureEscrowCanChange(Contract contract) {
        if (contract.getStatus() == Contract.Status.CANCELLED || contract.getStatus() == Contract.Status.COMPLETED) {
            throw new IllegalStateException("Escrow cannot be changed for a closed contract");
        }
    }

    private void creditUser(String userId,
                            WalletLedgerEntry.Reason reason,
                            double amount,
                            String currency,
                            String referenceId) {
        persistLedgerEntry(
                userId,
                WalletLedgerEntry.Type.CREDIT,
                reason,
                amount,
                currency,
                referenceId
        );
    }

    private WalletLedgerEntry persistLedgerEntry(String userId,
                                                 WalletLedgerEntry.Type type,
                                                 WalletLedgerEntry.Reason reason,
                                                 double amount,
                                                 String currency,
                                                 String referenceId) {
        WalletLedgerEntry existing = walletLedgerRepository.findByUserIdAndReferenceId(userId, referenceId).orElse(null);
        if (existing != null) {
            return existing;
        }

        double balanceBefore = walletService.getBalanceByUserIdAndCurrency(userId, currency);
        WalletLedgerEntry entry = new WalletLedgerEntry();
        entry.setUserId(userId);
        entry.setType(type);
        entry.setReason(reason);
        entry.setAmount(round2(amount));
        entry.setCurrency(currency);
        entry.setReferenceId(referenceId);
        if (type == WalletLedgerEntry.Type.CREDIT) {
            entry.setBalanceAfter(round2(balanceBefore + amount));
        } else {
            entry.setBalanceAfter(round2(balanceBefore - amount));
        }
        return walletLedgerRepository.save(entry);
    }

    private boolean hasFinanceDisputeAccess(User user) {
        return currentUserService.hasRole(user, "ADMIN")
                || currentUserService.hasRole(user, "SUPER_ADMIN")
                || currentUserService.hasRole(user, "FINANCE_ADMIN")
                || currentUserService.hasRole(user, "SUPPORT_ADMIN");
    }

    private double resolveRequiredEscrow(Contract contract) {
        if (contract == null) {
            return 0.0;
        }
        if (contract.getPaymentMilestones() != null && !contract.getPaymentMilestones().isEmpty()) {
            return contract.getPaymentMilestones().stream()
                    .filter(java.util.Objects::nonNull)
                    .mapToDouble(milestone -> safe(milestone.getAmount()))
                    .sum();
        }
        return safe(contract.getTotalAmount());
    }

    private String resolveCurrency(Contract contract, String fallbackCurrency) {
        String candidate = fallbackCurrency;
        if (candidate == null || candidate.isBlank()) {
            candidate = contract == null ? null : contract.getCurrency();
        }
        if (candidate == null || candidate.isBlank()) {
            return "ETB";
        }
        return candidate.trim().toUpperCase(Locale.ROOT);
    }

    private String resolveEmployerWalletUserId(String employerId) {
        if (employerId == null || employerId.isBlank()) {
            return employerId;
        }
        return employerRepository.findById(employerId)
                .map(employer -> employer.getUserId())
                .filter(userId -> userId != null && !userId.isBlank())
                .or(() -> employerRepository.findByUserId(employerId)
                        .map(employer -> employer.getUserId())
                        .filter(userId -> userId != null && !userId.isBlank()))
                .orElse(employerId);
    }

    private String resolveFreelancerWalletUserId(String freelancerId) {
        if (freelancerId == null || freelancerId.isBlank()) {
            return freelancerId;
        }
        return freelancerRepository.findById(freelancerId)
                .map(freelancer -> freelancer.getUserId())
                .filter(userId -> userId != null && !userId.isBlank())
                .or(() -> freelancerRepository.findByUserId(freelancerId)
                        .map(freelancer -> freelancer.getUserId())
                        .filter(userId -> userId != null && !userId.isBlank()))
                .orElse(freelancerId);
    }

    private String buildReference(String contractId, String action) {
        return "contract:" + contractId + ":" + action;
    }

    private boolean matchesIdentity(User user, String targetId) {
        return targetId != null && resolveIdentityKeys(user).contains(targetId);
    }

    private Set<String> resolveIdentityKeys(User user) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        if (user == null) {
            return keys;
        }

        if (user.getId() != null && !user.getId().isBlank()) {
            keys.add(user.getId());
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            keys.add(user.getEmail());
        }

        if (user.getId() != null && !user.getId().isBlank()) {
            employerRepository.findByUserId(user.getId())
                    .ifPresent(employer -> {
                        if (employer.getId() != null && !employer.getId().isBlank()) {
                            keys.add(employer.getId());
                        }
                    });

            freelancerRepository.findByUserId(user.getId())
                    .ifPresent(freelancer -> {
                        if (freelancer.getId() != null && !freelancer.getId().isBlank()) {
                            keys.add(freelancer.getId());
                        }
                    });
        }

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            employerRepository.findByUserId(user.getEmail())
                    .ifPresent(employer -> {
                        if (employer.getId() != null && !employer.getId().isBlank()) {
                            keys.add(employer.getId());
                        }
                    });

            freelancerRepository.findByUserId(user.getEmail())
                    .ifPresent(freelancer -> {
                        if (freelancer.getId() != null && !freelancer.getId().isBlank()) {
                            keys.add(freelancer.getId());
                        }
                    });
        }

        return keys;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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
