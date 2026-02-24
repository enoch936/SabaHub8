package com.sabahub.service;

import com.sabahub.domain.Transaction;
import com.sabahub.domain.User;
import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.domain.Withdrawal;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.repository.WalletLedgerRepository;
import com.sabahub.repository.WithdrawalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WalletService {

    private final WalletLedgerRepository walletLedgerRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public WalletService(WalletLedgerRepository walletLedgerRepository,
                         TransactionRepository transactionRepository,
                         UserRepository userRepository,
                         WithdrawalRepository withdrawalRepository,
                         CurrentUserService currentUserService,
                         AuditService auditService) {
        this.walletLedgerRepository = walletLedgerRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWallet() {
        User me = currentUserService.requireUser();
        return getWalletByUserId(me.getId());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWalletByUserId(String userId) {
        List<WalletLedgerEntry> entriesAsc = walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId);
        List<WalletLedgerEntry> entriesDesc = walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);

        double balance = computeBalance(entriesAsc);
        double escrowHeld = computeEscrowHeld(userId);
        double pendingPayouts = computePendingPayouts(userId);
        double availableBalance = Math.max(0.0, balance - escrowHeld - pendingPayouts);
        String currency = resolveWalletCurrency(entriesDesc);

        List<Map<String, Object>> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .limit(25)
                .map(this::toTransactionView)
                .toList();

        // Fallback for environments with legacy ledger-only data and no Transaction docs.
        if (transactions.isEmpty()) {
            transactions = entriesDesc.stream().limit(25).map(this::toLegacyTransactionView).toList();
        }

        long pendingLocalTopups = transactionRepository.countByUserIdAndProviderAndStatus(
                userId, Transaction.Provider.LOCAL, Transaction.Status.PENDING
        );

        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("balance", balance);
        result.put("availableBalance", availableBalance);
        result.put("currency", currency);
        result.put("escrowHeld", escrowHeld);
        result.put("pendingPayouts", pendingPayouts);
        result.put("holds", escrowHeld + pendingPayouts);
        result.put("pendingLocalTopups", pendingLocalTopups);
        result.put("entries", entriesDesc.stream().limit(100).toList());
        result.put("transactions", transactions);
        return result;
    }

    @Transactional
    public Map<String, Object> transferToUser(String recipientIdentifier,
                                              double amount,
                                              String currency,
                                              String note,
                                              String idempotencyKey) {
        User sender = currentUserService.requireUser();
        String senderId = sender.getId();

        if (recipientIdentifier == null || recipientIdentifier.isBlank()) {
            throw new IllegalArgumentException("Recipient is required");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = transactionRepository.findByUserIdAndIdempotencyKey(senderId, idempotencyKey);
            if (existing.isPresent()) {
                Map<String, Object> idemResponse = new HashMap<>();
                idemResponse.put("ok", true);
                idemResponse.put("idempotent", true);
                idemResponse.put("transferReference", existing.get().getProviderRef());
                idemResponse.put("transactionId", existing.get().getId());
                idemResponse.put("senderBalanceAfter", computeBalance(senderId));
                return idemResponse;
            }
        }

        User recipient = resolveRecipient(recipientIdentifier);
        if (recipient == null) {
            throw new IllegalArgumentException("Recipient account not found");
        }
        if (senderId.equals(recipient.getId())) {
            throw new IllegalArgumentException("Cannot transfer to your own wallet");
        }

        double normalizedAmount = Math.round(amount * 100.0) / 100.0;
        double senderBalanceBefore = computeBalance(senderId);
        double senderEscrowHeld = computeEscrowHeld(senderId);
        double senderPendingPayouts = computePendingPayouts(senderId);
        double senderAvailableBalance = Math.max(0.0, senderBalanceBefore - senderEscrowHeld - senderPendingPayouts);

        if (senderAvailableBalance < normalizedAmount) {
            throw new IllegalStateException("Insufficient available balance");
        }

        String transferCurrency = (currency == null || currency.isBlank())
                ? resolveWalletCurrency(walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(senderId))
                : currency.trim().toUpperCase();

        String transferReference = "shb_trf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18);
        double senderBalanceAfter = senderBalanceBefore - normalizedAmount;
        double recipientBalanceBefore = computeBalance(recipient.getId());
        double recipientBalanceAfter = recipientBalanceBefore + normalizedAmount;

        Map<String, Object> senderMetadata = new HashMap<>();
        senderMetadata.put("counterpartyUserId", recipient.getId());
        senderMetadata.put("counterpartyEmail", recipient.getEmail());
        senderMetadata.put("transferReference", transferReference);
        if (note != null && !note.isBlank()) {
            senderMetadata.put("note", note.trim());
        }

        Transaction senderTx = new Transaction();
        senderTx.setUserId(senderId);
        senderTx.setProvider(Transaction.Provider.INTERNAL);
        senderTx.setDirection(Transaction.Direction.OUT);
        senderTx.setAmount(normalizedAmount);
        senderTx.setCurrency(transferCurrency);
        senderTx.setStatus(Transaction.Status.SUCCESS);
        senderTx.setProviderRef(transferReference);
        senderTx.setMetadata(senderMetadata);
        senderTx.setIdempotencyKey(idempotencyKey);
        transactionRepository.save(senderTx);

        Map<String, Object> recipientMetadata = new HashMap<>();
        recipientMetadata.put("counterpartyUserId", senderId);
        recipientMetadata.put("counterpartyEmail", sender.getEmail());
        recipientMetadata.put("transferReference", transferReference);
        if (note != null && !note.isBlank()) {
            recipientMetadata.put("note", note.trim());
        }

        Transaction recipientTx = new Transaction();
        recipientTx.setUserId(recipient.getId());
        recipientTx.setProvider(Transaction.Provider.INTERNAL);
        recipientTx.setDirection(Transaction.Direction.IN);
        recipientTx.setAmount(normalizedAmount);
        recipientTx.setCurrency(transferCurrency);
        recipientTx.setStatus(Transaction.Status.SUCCESS);
        recipientTx.setProviderRef(transferReference);
        recipientTx.setMetadata(recipientMetadata);
        transactionRepository.save(recipientTx);

        WalletLedgerEntry senderLedger = new WalletLedgerEntry();
        senderLedger.setUserId(senderId);
        senderLedger.setType(WalletLedgerEntry.Type.DEBIT);
        senderLedger.setReason(WalletLedgerEntry.Reason.INTERNAL_TRANSFER_OUT);
        senderLedger.setAmount(normalizedAmount);
        senderLedger.setCurrency(transferCurrency);
        senderLedger.setReferenceId(transferReference);
        senderLedger.setBalanceAfter(senderBalanceAfter);
        walletLedgerRepository.save(senderLedger);

        WalletLedgerEntry recipientLedger = new WalletLedgerEntry();
        recipientLedger.setUserId(recipient.getId());
        recipientLedger.setType(WalletLedgerEntry.Type.CREDIT);
        recipientLedger.setReason(WalletLedgerEntry.Reason.INTERNAL_TRANSFER_IN);
        recipientLedger.setAmount(normalizedAmount);
        recipientLedger.setCurrency(transferCurrency);
        recipientLedger.setReferenceId(transferReference);
        recipientLedger.setBalanceAfter(recipientBalanceAfter);
        walletLedgerRepository.save(recipientLedger);

        Map<String, Object> auditPayload = new HashMap<>();
        auditPayload.put("senderUserId", senderId);
        auditPayload.put("recipientUserId", recipient.getId());
        auditPayload.put("amount", normalizedAmount);
        auditPayload.put("currency", transferCurrency);
        auditPayload.put("transferReference", transferReference);
        if (note != null && !note.isBlank()) {
            auditPayload.put("note", note.trim());
        }
        auditService.log("INTERNAL_WALLET_TRANSFER", "TRANSACTION", senderTx.getId(), auditPayload);

        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("transferReference", transferReference);
        response.put("transactionId", senderTx.getId());
        response.put("amount", normalizedAmount);
        response.put("currency", transferCurrency);
        response.put("senderBalanceAfter", senderBalanceAfter);
        Map<String, Object> recipientView = new HashMap<>();
        recipientView.put("id", recipient.getId());
        recipientView.put("email", recipient.getEmail());
        recipientView.put("fullName", recipient.getFullName() == null ? "" : recipient.getFullName());
        response.put("recipient", recipientView);
        return response;
    }

    // Helper: compute current balance from ledger entries
    private double computeBalance(String userId) {
        return computeBalance(walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId));
    }

    private double computeBalance(List<WalletLedgerEntry> entries) {
        double balance = 0.0;
        for (WalletLedgerEntry e : entries) {
            if (e.getType() == WalletLedgerEntry.Type.CREDIT) {
                balance += safe(e.getAmount());
            } else {
                balance -= safe(e.getAmount());
            }
        }
        return balance;
    }

    private User resolveRecipient(String identifier) {
        String trimmed = identifier.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.contains("@")) {
            return userRepository.findByEmail(trimmed.toLowerCase()).orElse(null);
        }
        return userRepository.findById(trimmed).orElseGet(() ->
                userRepository.findByEmail(trimmed.toLowerCase()).orElse(null)
        );
    }

    private String resolveWalletCurrency(List<WalletLedgerEntry> entriesDesc) {
        for (WalletLedgerEntry entry : entriesDesc) {
            String c = entry.getCurrency();
            if (c != null && !c.isBlank()) {
                return c.toUpperCase();
            }
        }
        return "ETB";
    }

    private double computeEscrowHeld(String userId) {
        List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId);
        double held = 0.0;
        for (WalletLedgerEntry entry : entries) {
            if (entry.getReason() == WalletLedgerEntry.Reason.ESCROW_FUND) {
                held += (entry.getType() == WalletLedgerEntry.Type.DEBIT) ? safe(entry.getAmount()) : -safe(entry.getAmount());
            } else if (entry.getReason() == WalletLedgerEntry.Reason.ESCROW_RELEASE
                    || entry.getReason() == WalletLedgerEntry.Reason.REFUND) {
                if (entry.getType() == WalletLedgerEntry.Type.CREDIT) {
                    held -= safe(entry.getAmount());
                }
            }
        }
        return Math.max(0.0, held);
    }

    private double computePendingPayouts(String userId) {
        return withdrawalRepository.findByUserId(userId).stream()
                .filter(w -> {
                    if (w.getStatusEnum() != null) {
                        return w.getStatusEnum() == Withdrawal.Status.PENDING || w.getStatusEnum() == Withdrawal.Status.PROCESSING;
                    }
                    String status = w.getStatus();
                    return "PENDING".equalsIgnoreCase(status) || "PROCESSING".equalsIgnoreCase(status);
                })
                .mapToDouble(w -> {
                    if (w.getAmountDecimal() != null) {
                        return w.getAmountDecimal();
                    }
                    return w.getAmount() == null ? 0.0 : w.getAmount().doubleValue();
                })
                .sum();
    }

    private Map<String, Object> toTransactionView(Transaction tx) {
        Map<String, Object> view = new HashMap<>();
        view.put("id", tx.getId());
        view.put("provider", tx.getProvider() == null ? null : tx.getProvider().name());
        view.put("direction", tx.getDirection() == null ? null : tx.getDirection().name());
        view.put("status", tx.getStatus() == null ? null : tx.getStatus().name());
        view.put("reason", toTransactionReason(tx));
        view.put("amount", tx.getAmount());
        view.put("currency", tx.getCurrency());
        view.put("referenceId", tx.getProviderRef());
        view.put("createdAt", tx.getCreatedAt());
        view.put("updatedAt", tx.getUpdatedAt());
        view.put("metadata", tx.getMetadata());
        return view;
    }

    private String toTransactionReason(Transaction tx) {
        if (tx.getProvider() == Transaction.Provider.LOCAL && tx.getStatus() == Transaction.Status.PENDING) {
            return "LOCAL_TOPUP_PENDING_ADMIN_APPROVAL";
        }
        if (tx.getProvider() == Transaction.Provider.LOCAL) {
            return "LOCAL_TOPUP_APPROVED";
        }
        if (tx.getProvider() == Transaction.Provider.CHAPA) {
            return "CHAPA_TOPUP";
        }
        if (tx.getProvider() == Transaction.Provider.INTERNAL && tx.getDirection() == Transaction.Direction.OUT) {
            return "SABAHUB_TRANSFER_OUT";
        }
        if (tx.getProvider() == Transaction.Provider.INTERNAL && tx.getDirection() == Transaction.Direction.IN) {
            return "SABAHUB_TRANSFER_IN";
        }
        return "WALLET_TRANSACTION";
    }

    private Map<String, Object> toLegacyTransactionView(WalletLedgerEntry entry) {
        Map<String, Object> view = new HashMap<>();
        view.put("id", entry.getId());
        view.put("provider", "LEDGER");
        view.put("direction", entry.getType() == WalletLedgerEntry.Type.CREDIT ? "IN" : "OUT");
        view.put("status", "SUCCESS");
        view.put("reason", entry.getReason() == null ? "WALLET_LEDGER" : entry.getReason().name());
        view.put("amount", entry.getAmount());
        view.put("currency", entry.getCurrency());
        view.put("referenceId", entry.getReferenceId());
        view.put("createdAt", entry.getCreatedAt());
        view.put("metadata", Map.of());
        return view;
    }

    // Credit wallet for successful Chapa top-up (called from webhook verification flow)
    @Transactional
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
    @Transactional
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
