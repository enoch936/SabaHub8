package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.User;
import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.WalletLedgerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EscrowService {

    private final ContractRepository contractRepository;
    private final WalletLedgerRepository walletLedgerRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public EscrowService(ContractRepository contractRepository,
                         WalletLedgerRepository walletLedgerRepository,
                         CurrentUserService currentUserService,
                         AuditService auditService) {
        this.contractRepository = contractRepository;
        this.walletLedgerRepository = walletLedgerRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    public Contract fundEscrow(String contractId, double amount, String currency) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be > 0");

        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!me.getId().equals(contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (contract.getStatus() != Contract.Status.ACTIVE) {
            throw new IllegalStateException("Contract not active");
        }

        double balance = computeBalance(me.getId());
        if (balance < amount) {
            throw new IllegalStateException("Insufficient wallet balance");
        }

        // Debit employer wallet
        WalletLedgerEntry debit = new WalletLedgerEntry();
        debit.setUserId(me.getId());
        debit.setType(WalletLedgerEntry.Type.DEBIT);
        debit.setReason(WalletLedgerEntry.Reason.ESCROW_FUND);
        debit.setAmount(amount);
        debit.setCurrency(currency == null || currency.isBlank() ? "ETB" : currency);
        debit.setReferenceId(contract.getId());
        debit.setBalanceAfter(balance - amount);
        walletLedgerRepository.save(debit);

        contract.setEscrowTotalHeld(safe(contract.getEscrowTotalHeld()) + amount);
        if (contract.getCurrency() == null || contract.getCurrency().isBlank()) {
            contract.setCurrency(debit.getCurrency());
        }
        Contract saved = contractRepository.save(contract);
        
        // Audit log: escrow funded
        auditService.log("ESCROW_FUND", "CONTRACT", saved.getId(), java.util.Map.of(
            "amount", amount,
            "currency", debit.getCurrency(),
            "employer_id", me.getId()
        ));
        
        return saved;
    }

    public Contract releaseEscrow(String contractId, double amount, Double platformFeeAmount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be > 0");

        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        if (!me.getId().equals(contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (contract.getEscrowTotalHeld() == null || contract.getEscrowTotalHeld() < amount) {
            throw new IllegalStateException("Insufficient escrow held");
        }

        double fee = platformFeeAmount == null ? 0.0 : platformFeeAmount;
        if (fee < 0) throw new IllegalArgumentException("Fee must be >= 0");
        if (fee > amount) throw new IllegalArgumentException("Fee cannot exceed amount");

        // Credit freelancer wallet
        double freelancerBalance = computeBalance(contract.getFreelancerId());
        WalletLedgerEntry creditFreelancer = new WalletLedgerEntry();
        creditFreelancer.setUserId(contract.getFreelancerId());
        creditFreelancer.setType(WalletLedgerEntry.Type.CREDIT);
        creditFreelancer.setReason(WalletLedgerEntry.Reason.ESCROW_RELEASE);
        creditFreelancer.setAmount(amount - fee);
        creditFreelancer.setCurrency(contract.getCurrency());
        creditFreelancer.setReferenceId(contract.getId());
        creditFreelancer.setBalanceAfter(freelancerBalance + (amount - fee));
        walletLedgerRepository.save(creditFreelancer);

        // Platform fee (optional): stored as FEE debit on freelancer OR separate platform account later.
        if (fee > 0) {
            double b = computeBalance(contract.getFreelancerId());
            WalletLedgerEntry feeEntry = new WalletLedgerEntry();
            feeEntry.setUserId(contract.getFreelancerId());
            feeEntry.setType(WalletLedgerEntry.Type.DEBIT);
            feeEntry.setReason(WalletLedgerEntry.Reason.FEE);
            feeEntry.setAmount(fee);
            feeEntry.setCurrency(contract.getCurrency());
            feeEntry.setReferenceId(contract.getId());
            feeEntry.setBalanceAfter(b - fee);
            walletLedgerRepository.save(feeEntry);
        }

        contract.setEscrowTotalHeld(contract.getEscrowTotalHeld() - amount);
        if (contract.getEscrowTotalHeld() <= 0 && contract.getStatus() == Contract.Status.DELIVERED) {
            contract.setStatus(Contract.Status.COMPLETED);
        }
        Contract saved = contractRepository.save(contract);
        
        // Audit log: escrow released
        auditService.log("ESCROW_RELEASE", "CONTRACT", saved.getId(), java.util.Map.of(
            "amount", amount,
            "fee", fee,
            "currency", contract.getCurrency(),
            "freelancer_id", contract.getFreelancerId()
        ));
        
        return saved;
    }

    public Contract refundEscrow(String contractId, double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be > 0");

        User me = currentUserService.requireUser();
        boolean isAdmin = currentUserService.hasRole(me, "ADMIN");

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        // Allow employer (owner) or admin
        if (!isAdmin && !me.getId().equals(contract.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (contract.getEscrowTotalHeld() == null || contract.getEscrowTotalHeld() < amount) {
            throw new IllegalStateException("Insufficient escrow held");
        }

        double employerBalance = computeBalance(contract.getEmployerId());
        WalletLedgerEntry refund = new WalletLedgerEntry();
        refund.setUserId(contract.getEmployerId());
        refund.setType(WalletLedgerEntry.Type.CREDIT);
        refund.setReason(WalletLedgerEntry.Reason.REFUND);
        refund.setAmount(amount);
        refund.setCurrency(contract.getCurrency());
        refund.setReferenceId(contract.getId());
        refund.setBalanceAfter(employerBalance + amount);
        walletLedgerRepository.save(refund);

        contract.setEscrowTotalHeld(contract.getEscrowTotalHeld() - amount);
        if (contract.getEscrowTotalHeld() <= 0 && contract.getStatus() == Contract.Status.CANCELLED) {
            // ok
        }
        Contract saved = contractRepository.save(contract);
        
        // Audit log: escrow refunded
        auditService.log("ESCROW_REFUND", "CONTRACT", saved.getId(), java.util.Map.of(
            "amount", amount,
            "currency", contract.getCurrency(),
            "employer_id", contract.getEmployerId(),
            "is_admin", isAdmin
        ));
        
        return saved;
    }

    private double computeBalance(String userId) {
        List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId);
        double balance = 0.0;
        for (WalletLedgerEntry e : entries) {
            if (e.getType() == WalletLedgerEntry.Type.CREDIT) balance += safe(e.getAmount());
            else balance -= safe(e.getAmount());
        }
        return balance;
    }

    private double safe(Double v) {
        return v == null ? 0.0 : v;
    }
}
