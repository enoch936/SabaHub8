package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.repository.WalletLedgerRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WalletService {

    private final WalletLedgerRepository walletLedgerRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public WalletService(WalletLedgerRepository walletLedgerRepository, CurrentUserService currentUserService, AuditService auditService) {
        this.walletLedgerRepository = walletLedgerRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    public Map<String, Object> getWallet() {
        User me = currentUserService.requireUser();
        List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(me.getId());

        double balance = 0.0;
        for (WalletLedgerEntry e : entries) {
            if (e.getType() == WalletLedgerEntry.Type.CREDIT) {
                balance += safe(e.getAmount());
            } else {
                balance -= safe(e.getAmount());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("userId", me.getId());
        result.put("balance", balance);
        result.put("currency", entries.isEmpty() ? "ETB" : entries.get(entries.size() - 1).getCurrency());
        result.put("entries", entries);
        return result;
    }

    // Helper: compute current balance from ledger entries
    private double computeBalance(String userId) {
        List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId);
        double balance = 0.0;
        for (WalletLedgerEntry e : entries) {
            if (e.getType() == WalletLedgerEntry.Type.CREDIT) balance += safe(e.getAmount());
            else balance -= safe(e.getAmount());
        }
        return balance;
    }

    // Credit wallet for successful Chapa top-up (called from webhook verification flow)
    public WalletLedgerEntry creditTopUpChapa(String userId, double amount, String currency, String providerRef) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be > 0");
        double balance = computeBalance(userId);

        WalletLedgerEntry credit = new WalletLedgerEntry();
        credit.setUserId(userId);
        credit.setType(WalletLedgerEntry.Type.CREDIT);
        credit.setReason(WalletLedgerEntry.Reason.CHAPA_TOPUP);
        credit.setAmount(amount);
        credit.setCurrency(currency == null || currency.isBlank() ? "ETB" : currency);
        credit.setReferenceId(providerRef);
        credit.setBalanceAfter(balance + amount);
        walletLedgerRepository.save(credit);

        auditService.log("CHAPA_TOPUP", "TRANSACTION", providerRef, Map.of(
                "userId", userId,
                "amount", amount,
                "currency", credit.getCurrency()
        ));

        return credit;
    }

    // Credit wallet for verified local/manual top-up (admin verification flow)
    public WalletLedgerEntry creditTopUpLocal(String userId, double amount, String currency, String referenceId, String verifiedByAdminId) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be > 0");
        double balance = computeBalance(userId);

        WalletLedgerEntry credit = new WalletLedgerEntry();
        credit.setUserId(userId);
        credit.setType(WalletLedgerEntry.Type.CREDIT);
        credit.setReason(WalletLedgerEntry.Reason.LOCAL_TOPUP);
        credit.setAmount(amount);
        credit.setCurrency(currency == null || currency.isBlank() ? "ETB" : currency);
        credit.setReferenceId(referenceId);
        credit.setBalanceAfter(balance + amount);
        walletLedgerRepository.save(credit);

        auditService.log("LOCAL_TOPUP", "TRANSACTION", referenceId, Map.of(
                "userId", userId,
                "amount", amount,
                "currency", credit.getCurrency(),
                "verifiedByAdminId", verifiedByAdminId
        ));

        return credit;
    }

    private double safe(Double v) {
        return v == null ? 0.0 : v;
    }
}
