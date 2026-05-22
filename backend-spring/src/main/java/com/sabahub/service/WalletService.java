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

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

@Service
public class WalletService {

    private final WalletLedgerRepository walletLedgerRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final WalletCurrencyService walletCurrencyService;
    private final LiveActivityService liveActivityService;
    private final Map<String, ReentrantLock> walletLocks = new ConcurrentHashMap<>();

    public WalletService(WalletLedgerRepository walletLedgerRepository,
                         TransactionRepository transactionRepository,
                         UserRepository userRepository,
                         WithdrawalRepository withdrawalRepository,
                         CurrentUserService currentUserService,
                         AuditService auditService,
                         WalletCurrencyService walletCurrencyService,
                         LiveActivityService liveActivityService) {
        this.walletLedgerRepository = walletLedgerRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.walletCurrencyService = walletCurrencyService;
        this.liveActivityService = liveActivityService;
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
        List<Withdrawal> withdrawals = withdrawalRepository.findByUserId(userId);

        String currency = resolveWalletCurrency(entriesDesc);
        Map<String, Object> balancesByCurrency = buildWalletBalancesByCurrency(entriesAsc, withdrawals);
        Map<String, Object> primaryBalance = asWalletBreakdown(balancesByCurrency.get(currency));

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
        result.put("balance", toDouble(primaryBalance.get("balance")));
        result.put("availableBalance", toDouble(primaryBalance.get("availableBalance")));
        result.put("currency", currency);
        result.put("escrowHeld", toDouble(primaryBalance.get("escrowHeld")));
        result.put("pendingPayouts", toDouble(primaryBalance.get("pendingPayouts")));
        result.put("holds", toDouble(primaryBalance.get("holds")));
        result.put("supportedCurrencies", walletCurrencyService.supportedCurrencies());
        result.put("balancesByCurrency", balancesByCurrency);
        result.put("fx", walletCurrencyService.fxSnapshot());
        result.put("pendingLocalTopups", pendingLocalTopups);
        result.put("entries", entriesDesc.stream().limit(100).toList());
        result.put("transactions", transactions);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getWalletForecast(String userId,
                                                 String range,
                                                 Integer horizon,
                                                 String preferredCurrency) {
        String normalizedRange = range == null ? "30D" : range.trim().toUpperCase();
        boolean monthly = "1Y".equals(normalizedRange);

        int historyWindow = switch (normalizedRange) {
            case "7D" -> 7;
            case "14D" -> 14;
            case "30D" -> 30;
            case "90D" -> 90;
            case "1Y" -> 12;
            default -> 30;
        };

        int defaultHorizon = monthly ? 6 : 10;
        int minHorizon = monthly ? 3 : 5;
        int maxHorizon = monthly ? 24 : 30;
        int steps = horizon == null ? defaultHorizon : Math.max(minHorizon, Math.min(maxHorizon, horizon));

        String currency = walletCurrencyService.normalizeSupportedCurrency(
                preferredCurrency,
                resolveWalletCurrency(walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId))
        );
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(tx -> transactionMatchesCurrency(tx, currency))
                .toList();
        double baselineCumulative = computeBalance(userId, currency);

        List<Double> historicalNetSeries = monthly
                ? buildMonthlyHistoricalNetSeries(transactions, historyWindow, currency)
                : buildDailyHistoricalNetSeries(transactions, historyWindow, currency);

        if (historicalNetSeries.isEmpty()) {
            historicalNetSeries = List.of(0.0);
        }

        double avgNet = historicalNetSeries.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double volatility = Math.sqrt(
                historicalNetSeries.stream()
                        .mapToDouble(v -> Math.pow(v - avgNet, 2))
                        .average()
                        .orElse(0.0)
        );
        double absoluteFloor = Math.max(1.0, Math.abs(avgNet) * 0.2);

        List<Map<String, Object>> points = new ArrayList<>();
        double cumulative = baselineCumulative;
        Instant now = Instant.now();

        for (int i = 0; i < steps; i += 1) {
            double trendDrift = avgNet * Math.min(0.18, (i + 1) * 0.02);
            double seasonalityWave = Math.sin((i + 1) * 0.8) * (volatility * 0.35);
            double projectedNet = round2(avgNet + trendDrift + seasonalityWave);

            cumulative = round2(cumulative + projectedNet);

            double bandHalfWidth = Math.max(absoluteFloor, volatility * (1.0 + (i * 0.08)));
            double confidenceLower = round2(projectedNet - bandHalfWidth);
            double confidenceUpper = round2(projectedNet + bandHalfWidth);

            Map<String, Object> point = new HashMap<>();
            point.put("key", monthly ? monthlyForecastKey(now, i + 1) : dailyForecastKey(now, i + 1));
            point.put("label", monthly ? "M+" + (i + 1) : "D+" + (i + 1));
            point.put("projectedNet", projectedNet);
            point.put("projectedCumulative", cumulative);
            point.put("confidenceLower", confidenceLower);
            point.put("confidenceUpper", confidenceUpper);
            point.put("currency", currency);
            points.add(point);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("source", "backend");
        response.put("model", "wallet-trend-v1");
        response.put("generatedAt", Instant.now().toString());
        response.put("range", normalizedRange);
        response.put("horizon", steps);
        response.put("currency", currency);
        response.put("startCumulative", baselineCumulative);
        response.put("points", points);
        return response;
    }

    @Transactional(readOnly = true)
    public double getBalanceByUserIdAndCurrency(String userId, String currency) {
        return computeBalance(
                walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId),
                walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
        );
    }

    @Transactional(readOnly = true)
    public double getEscrowHeldByUserIdAndCurrency(String userId, String currency) {
        return computeEscrowHeld(
                walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId),
                walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
        );
    }

    @Transactional(readOnly = true)
    public double getPendingPayoutsByUserIdAndCurrency(String userId, String currency) {
        return computePendingPayouts(
                withdrawalRepository.findByUserId(userId),
                walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
        );
    }

    @Transactional(readOnly = true)
    public double getAvailableBalanceByUserIdAndCurrency(String userId, String currency) {
        String normalizedCurrency = walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB);
        double balance = getBalanceByUserIdAndCurrency(userId, normalizedCurrency);
        double escrowHeld = getEscrowHeldByUserIdAndCurrency(userId, normalizedCurrency);
        double pendingPayouts = getPendingPayoutsByUserIdAndCurrency(userId, normalizedCurrency);
        return walletCurrencyService.round2(Math.max(0.0, balance - escrowHeld - pendingPayouts));
    }

    @Transactional
    public Map<String, Object> transferToUser(String recipientIdentifier,
                                              double amount,
                                              String currency,
                                              String note,
                                              String idempotencyKey,
                                              boolean adminReviewRequired) {
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
                idemResponse.put("status", existing.get().getStatus() == null ? null : existing.get().getStatus().name());
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

        String transferCurrency = walletCurrencyService.normalizeSupportedCurrency(
                currency,
                resolveWalletCurrency(walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(senderId))
        );
        double normalizedAmount = walletCurrencyService.round2(amount);

        return withWalletLocks(
                List.of(lockKey(senderId, transferCurrency), lockKey(recipient.getId(), transferCurrency)),
                () -> {
                    if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                        var existing = transactionRepository.findByUserIdAndIdempotencyKey(senderId, idempotencyKey);
                        if (existing.isPresent()) {
                            Map<String, Object> idemResponse = new HashMap<>();
                            idemResponse.put("ok", true);
                            idemResponse.put("idempotent", true);
                            idemResponse.put("transferReference", existing.get().getProviderRef());
                            idemResponse.put("transactionId", existing.get().getId());
                            idemResponse.put("status", existing.get().getStatus() == null ? null : existing.get().getStatus().name());
                            return idemResponse;
                        }
                    }

                    double senderBalanceBefore = computeBalance(senderId, transferCurrency);
                    double senderEscrowHeld = computeEscrowHeld(senderId, transferCurrency);
                    double senderPendingPayouts = computePendingPayouts(senderId, transferCurrency);
                    double senderAvailableBalance = walletCurrencyService.round2(
                            Math.max(0.0, senderBalanceBefore - senderEscrowHeld - senderPendingPayouts)
                    );

                    if (senderAvailableBalance < normalizedAmount) {
                        throw new IllegalStateException("Insufficient available balance");
                    }

                    String transferReference = "shb_trf_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18);
                    Map<String, Object> senderMetadata = new HashMap<>();
                    senderMetadata.put("counterpartyUserId", recipient.getId());
                    senderMetadata.put("counterpartyEmail", recipient.getEmail());
                    senderMetadata.put("counterpartyName", recipient.getFullName() == null ? "" : recipient.getFullName());
                    senderMetadata.put("transferReference", transferReference);
                    senderMetadata.put("requestedByUserId", senderId);
                    senderMetadata.put("senderAvailableBalanceAtRequest", senderAvailableBalance);
                    senderMetadata.put("adminReviewRequired", adminReviewRequired);
                    if (note != null && !note.isBlank()) {
                        senderMetadata.put("note", note.trim());
                    }

                    Transaction senderTx = new Transaction();
                    senderTx.setUserId(senderId);
                    senderTx.setProvider(Transaction.Provider.INTERNAL);
                    senderTx.setDirection(Transaction.Direction.OUT);
                    senderTx.setAmount(normalizedAmount);
                    senderTx.setCurrency(transferCurrency);
                    senderTx.setStatus(adminReviewRequired ? Transaction.Status.PENDING : Transaction.Status.SUCCESS);
                    senderTx.setProviderRef(transferReference);
                    senderTx.setMetadata(senderMetadata);
                    senderTx.setIdempotencyKey(idempotencyKey);
                    transactionRepository.save(senderTx);

                    Map<String, Object> recipientView = new HashMap<>();
                    recipientView.put("id", recipient.getId());
                    recipientView.put("email", recipient.getEmail());
                    recipientView.put("fullName", recipient.getFullName() == null ? "" : recipient.getFullName());

                    if (adminReviewRequired) {
                        Map<String, Object> auditPayload = new HashMap<>();
                        auditPayload.put("senderUserId", senderId);
                        auditPayload.put("recipientUserId", recipient.getId());
                        auditPayload.put("amount", normalizedAmount);
                        auditPayload.put("currency", transferCurrency);
                        auditPayload.put("transferReference", transferReference);
                        auditPayload.put("status", "PENDING");
                        if (note != null && !note.isBlank()) {
                            auditPayload.put("note", note.trim());
                        }
                        auditService.log("INTERNAL_WALLET_TRANSFER_REQUESTED", "TRANSACTION", senderTx.getId(), auditPayload);

                        Map<String, Object> response = new HashMap<>();
                        response.put("ok", true);
                        response.put("transferReference", transferReference);
                        response.put("transactionId", senderTx.getId());
                        response.put("amount", normalizedAmount);
                        response.put("currency", transferCurrency);
                        response.put("status", "PENDING");
                        response.put("recipient", recipientView);
                        return response;
                    }

                    double senderBalanceAfter = walletCurrencyService.round2(senderBalanceBefore - normalizedAmount);
                    double recipientBalanceBefore = computeBalance(recipient.getId(), transferCurrency);
                    double recipientBalanceAfter = walletCurrencyService.round2(recipientBalanceBefore + normalizedAmount);

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

                    User senderUser = userRepository.findById(senderId).orElse(null);
                    Map<String, Object> recipientMetadata = new HashMap<>();
                    recipientMetadata.put("counterpartyUserId", senderId);
                    recipientMetadata.put("counterpartyEmail", senderUser == null ? null : senderUser.getEmail());
                    recipientMetadata.put("counterpartyName", senderUser == null ? null : senderUser.getFullName());
                    recipientMetadata.put("transferReference", transferReference);
                    recipientMetadata.put("autoApproved", true);
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

                    senderMetadata.put("reviewDecision", "AUTO_APPROVED");
                    senderMetadata.put("senderBalanceAfter", senderBalanceAfter);
                    senderTx.setMetadata(senderMetadata);
                    transactionRepository.save(senderTx);

                    Map<String, Object> auditPayload = new HashMap<>();
                    auditPayload.put("senderUserId", senderId);
                    auditPayload.put("recipientUserId", recipient.getId());
                    auditPayload.put("amount", normalizedAmount);
                    auditPayload.put("currency", transferCurrency);
                    auditPayload.put("transferReference", transferReference);
                    auditPayload.put("status", "SUCCESS");
                    if (note != null && !note.isBlank()) {
                        auditPayload.put("note", note.trim());
                    }
                    auditService.log("INTERNAL_WALLET_TRANSFER", "TRANSACTION", senderTx.getId(), auditPayload);

                    // Live Activity: transfer successful
                    liveActivityService.broadcast(
                            "PAYMENT",
                            senderUser.getFullName() + " transferred " + normalizedAmount + " " + transferCurrency + " to " + recipient.getFullName(),
                            senderId,
                            senderUser.getUsername(),
                            null,
                            "success",
                            Map.of("amount", normalizedAmount, "currency", transferCurrency, "type", "TRANSFER")
                    );

                    Map<String, Object> response = new HashMap<>();
                    response.put("ok", true);
                    response.put("transferReference", transferReference);
                    response.put("transactionId", senderTx.getId());
                    response.put("amount", normalizedAmount);
                    response.put("currency", transferCurrency);
                    response.put("status", "SUCCESS");
                    response.put("senderBalanceAfter", senderBalanceAfter);
                    response.put("recipient", recipientView);
                    return response;
                }
        );
    }

    @Transactional
    public Map<String, Object> reviewInternalTransfer(String transactionId,
                                                      boolean approved,
                                                      String adminId,
                                                      String note) {
        Transaction senderTx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transfer transaction not found"));

        if (senderTx.getProvider() != Transaction.Provider.INTERNAL || senderTx.getDirection() != Transaction.Direction.OUT) {
            throw new IllegalArgumentException("Invalid internal transfer transaction");
        }

        if (senderTx.getStatus() == Transaction.Status.SUCCESS) {
            return Map.of(
                    "ok", true,
                    "idempotent", true,
                    "transactionId", senderTx.getId(),
                    "status", senderTx.getStatus().name(),
                    "message", "Transfer already approved"
            );
        }

        if (senderTx.getStatus() == Transaction.Status.CANCELLED || senderTx.getStatus() == Transaction.Status.FAILED) {
            return Map.of(
                    "ok", true,
                    "idempotent", true,
                    "transactionId", senderTx.getId(),
                    "status", senderTx.getStatus().name(),
                    "message", "Transfer already finalized"
            );
        }

        String senderId = senderTx.getUserId();
        String recipientId = senderTx.getMetadata() == null ? null : (String) senderTx.getMetadata().get("counterpartyUserId");
        if (recipientId == null || recipientId.isBlank()) {
            throw new IllegalStateException("Transfer is missing recipient metadata");
        }

        double amount = senderTx.getAmount() == null ? 0.0 : senderTx.getAmount();
        if (amount <= 0) {
            throw new IllegalStateException("Transfer has invalid amount");
        }
        String transferCurrency = walletCurrencyService.normalizeSupportedCurrency(
                senderTx.getCurrency(),
                WalletCurrencyService.ETB
        );

        Map<String, Object> metadata = senderTx.getMetadata() == null ? new HashMap<>() : new HashMap<>(senderTx.getMetadata());
        metadata.put("reviewedByAdminId", adminId);
        metadata.put("reviewedAt", java.time.Instant.now().toString());
        if (note != null && !note.isBlank()) {
            metadata.put("reviewNote", note.trim());
        }

        return withWalletLocks(
                List.of("review:" + transactionId, lockKey(senderId, transferCurrency), lockKey(recipientId, transferCurrency)),
                () -> {
                    Transaction freshSenderTx = transactionRepository.findById(transactionId)
                            .orElseThrow(() -> new IllegalArgumentException("Transfer transaction not found"));
                    if (freshSenderTx.getStatus() == Transaction.Status.SUCCESS) {
                        return Map.of(
                                "ok", true,
                                "idempotent", true,
                                "transactionId", freshSenderTx.getId(),
                                "status", freshSenderTx.getStatus().name(),
                                "message", "Transfer already approved"
                        );
                    }
                    if (freshSenderTx.getStatus() == Transaction.Status.CANCELLED || freshSenderTx.getStatus() == Transaction.Status.FAILED) {
                        return Map.of(
                                "ok", true,
                                "idempotent", true,
                                "transactionId", freshSenderTx.getId(),
                                "status", freshSenderTx.getStatus().name(),
                                "message", "Transfer already finalized"
                        );
                    }

                    Map<String, Object> freshMetadata = freshSenderTx.getMetadata() == null
                            ? new HashMap<>()
                            : new HashMap<>(freshSenderTx.getMetadata());
                    freshMetadata.put("reviewedByAdminId", adminId);
                    freshMetadata.put("reviewedAt", java.time.Instant.now().toString());
                    if (note != null && !note.isBlank()) {
                        freshMetadata.put("reviewNote", note.trim());
                    }

                    if (!approved) {
                        freshSenderTx.setStatus(Transaction.Status.CANCELLED);
                        freshMetadata.put("reviewDecision", "REJECTED");
                        freshSenderTx.setMetadata(freshMetadata);
                        transactionRepository.save(freshSenderTx);

                        Map<String, Object> reviewAudit = new HashMap<>();
                        reviewAudit.put("approved", false);
                        reviewAudit.put("adminId", adminId);
                        reviewAudit.put("senderUserId", senderId);
                        reviewAudit.put("recipientUserId", recipientId);
                        reviewAudit.put("amount", amount);
                        reviewAudit.put("currency", transferCurrency);
                        reviewAudit.put("note", note);
                        auditService.log("INTERNAL_WALLET_TRANSFER_REVIEWED", "TRANSACTION", freshSenderTx.getId(), reviewAudit);

                        return Map.of(
                                "ok", true,
                                "transactionId", freshSenderTx.getId(),
                                "status", freshSenderTx.getStatus().name(),
                                "message", "Transfer rejected by admin"
                        );
                    }

                    double senderBalanceBefore = computeBalance(senderId, transferCurrency);
                    double senderEscrowHeld = computeEscrowHeld(senderId, transferCurrency);
                    double senderPendingPayouts = computePendingPayouts(senderId, transferCurrency);
                    double senderAvailableBalance = walletCurrencyService.round2(
                            Math.max(0.0, senderBalanceBefore - senderEscrowHeld - senderPendingPayouts)
                    );
                    if (senderAvailableBalance < amount) {
                        freshSenderTx.setStatus(Transaction.Status.FAILED);
                        freshMetadata.put("reviewDecision", "FAILED_INSUFFICIENT_FUNDS");
                        freshSenderTx.setMetadata(freshMetadata);
                        transactionRepository.save(freshSenderTx);

                        return Map.of(
                                "ok", false,
                                "transactionId", freshSenderTx.getId(),
                                "status", freshSenderTx.getStatus().name(),
                                "message", "Sender has insufficient available balance at approval time"
                        );
                    }

                    String transferReference = freshSenderTx.getProviderRef();
                    double senderBalanceAfter = walletCurrencyService.round2(senderBalanceBefore - amount);
                    double recipientBalanceBefore = computeBalance(recipientId, transferCurrency);
                    double recipientBalanceAfter = walletCurrencyService.round2(recipientBalanceBefore + amount);

                    WalletLedgerEntry senderLedger = new WalletLedgerEntry();
                    senderLedger.setUserId(senderId);
                    senderLedger.setType(WalletLedgerEntry.Type.DEBIT);
                    senderLedger.setReason(WalletLedgerEntry.Reason.INTERNAL_TRANSFER_OUT);
                    senderLedger.setAmount(amount);
                    senderLedger.setCurrency(transferCurrency);
                    senderLedger.setReferenceId(transferReference);
                    senderLedger.setBalanceAfter(senderBalanceAfter);
                    walletLedgerRepository.save(senderLedger);

                    WalletLedgerEntry recipientLedger = new WalletLedgerEntry();
                    recipientLedger.setUserId(recipientId);
                    recipientLedger.setType(WalletLedgerEntry.Type.CREDIT);
                    recipientLedger.setReason(WalletLedgerEntry.Reason.INTERNAL_TRANSFER_IN);
                    recipientLedger.setAmount(amount);
                    recipientLedger.setCurrency(transferCurrency);
                    recipientLedger.setReferenceId(transferReference);
                    recipientLedger.setBalanceAfter(recipientBalanceAfter);
                    walletLedgerRepository.save(recipientLedger);

                    User senderUser = userRepository.findById(senderId).orElse(null);
                    Map<String, Object> recipientMetadata = new HashMap<>();
                    recipientMetadata.put("counterpartyUserId", senderId);
                    recipientMetadata.put("counterpartyEmail", senderUser == null ? null : senderUser.getEmail());
                    recipientMetadata.put("counterpartyName", senderUser == null ? null : senderUser.getFullName());
                    recipientMetadata.put("transferReference", transferReference);
                    recipientMetadata.put("approvedByAdminId", adminId);
                    if (note != null && !note.isBlank()) {
                        recipientMetadata.put("note", note.trim());
                    }

                    Transaction recipientTx = new Transaction();
                    recipientTx.setUserId(recipientId);
                    recipientTx.setProvider(Transaction.Provider.INTERNAL);
                    recipientTx.setDirection(Transaction.Direction.IN);
                    recipientTx.setAmount(amount);
                    recipientTx.setCurrency(transferCurrency);
                    recipientTx.setStatus(Transaction.Status.SUCCESS);
                    recipientTx.setProviderRef(transferReference);
                    recipientTx.setMetadata(recipientMetadata);
                    transactionRepository.save(recipientTx);

                    freshSenderTx.setStatus(Transaction.Status.SUCCESS);
                    freshMetadata.put("reviewDecision", "APPROVED");
                    freshMetadata.put("senderBalanceAfter", senderBalanceAfter);
                    freshSenderTx.setMetadata(freshMetadata);
                    transactionRepository.save(freshSenderTx);

                    Map<String, Object> reviewAudit = new HashMap<>();
                    reviewAudit.put("approved", true);
                    reviewAudit.put("adminId", adminId);
                    reviewAudit.put("senderUserId", senderId);
                    reviewAudit.put("recipientUserId", recipientId);
                    reviewAudit.put("amount", amount);
                    reviewAudit.put("currency", transferCurrency);
                    reviewAudit.put("transferReference", transferReference);
                    reviewAudit.put("note", note);
                    auditService.log("INTERNAL_WALLET_TRANSFER_REVIEWED", "TRANSACTION", freshSenderTx.getId(), reviewAudit);

                    return Map.of(
                            "ok", true,
                            "transactionId", freshSenderTx.getId(),
                            "status", freshSenderTx.getStatus().name(),
                            "transferReference", transferReference,
                            "amount", amount,
                            "currency", transferCurrency,
                            "senderBalanceAfter", senderBalanceAfter,
                            "recipientBalanceAfter", recipientBalanceAfter
                    );
                }
        );
    }

    // Helper: compute current balance from ledger entries
    private double computeBalance(String userId, String currency) {
        return computeBalance(
                walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId),
                walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
        );
    }

    private double computeBalance(List<WalletLedgerEntry> entries, String currency) {
        String normalizedCurrency = walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB);
        double balance = 0.0;
        for (WalletLedgerEntry e : entries) {
            if (!normalizedCurrency.equals(normalizeStoredCurrency(e.getCurrency()))) {
                continue;
            }
            if (e.getType() == WalletLedgerEntry.Type.CREDIT) {
                balance += safe(e.getAmount());
            } else {
                balance -= safe(e.getAmount());
            }
        }
        return walletCurrencyService.round2(balance);
    }

    private Map<String, Double> computeBalanceByCurrency(List<WalletLedgerEntry> entries) {
        Map<String, Double> balances = zeroedCurrencyMap();
        for (WalletLedgerEntry entry : entries) {
            String currency = normalizeStoredCurrency(entry.getCurrency());
            double next = balances.getOrDefault(currency, 0.0);
            next += entry.getType() == WalletLedgerEntry.Type.CREDIT ? safe(entry.getAmount()) : -safe(entry.getAmount());
            balances.put(currency, walletCurrencyService.round2(next));
        }
        return balances;
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
            if (c != null && !c.isBlank() && walletCurrencyService.isSupported(c)) {
                return c.trim().toUpperCase(Locale.ROOT);
            }
        }
        return WalletCurrencyService.ETB;
    }

    private double computeEscrowHeld(String userId, String currency) {
        return computeEscrowHeld(
                walletLedgerRepository.findByUserIdOrderByCreatedAtAsc(userId),
                walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
        );
    }

    private double computeEscrowHeld(List<WalletLedgerEntry> entries, String currency) {
        String normalizedCurrency = walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB);
        double held = 0.0;
        for (WalletLedgerEntry entry : entries) {
            if (!normalizedCurrency.equals(normalizeStoredCurrency(entry.getCurrency()))) {
                continue;
            }
            if (entry.getReason() == WalletLedgerEntry.Reason.ESCROW_FUND) {
                held += (entry.getType() == WalletLedgerEntry.Type.DEBIT) ? safe(entry.getAmount()) : -safe(entry.getAmount());
            } else if (entry.getReason() == WalletLedgerEntry.Reason.ESCROW_RELEASE
                    || entry.getReason() == WalletLedgerEntry.Reason.REFUND) {
                if (entry.getType() == WalletLedgerEntry.Type.CREDIT) {
                    held -= safe(entry.getAmount());
                }
            }
        }
        return walletCurrencyService.round2(Math.max(0.0, held));
    }

    private Map<String, Double> computeEscrowHeldByCurrency(List<WalletLedgerEntry> entries) {
        Map<String, Double> heldByCurrency = zeroedCurrencyMap();
        for (String currency : walletCurrencyService.supportedCurrencies()) {
            heldByCurrency.put(currency, computeEscrowHeld(entries, currency));
        }
        return heldByCurrency;
    }

    private double computePendingPayouts(String userId, String currency) {
        return computePendingPayouts(
                withdrawalRepository.findByUserId(userId),
                walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
        );
    }

    private double computePendingPayouts(List<Withdrawal> withdrawals, String currency) {
        String normalizedCurrency = walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB);
        double total = withdrawals.stream()
                .filter(w -> {
                    if (w.getStatusEnum() != null) {
                        return w.getStatusEnum() == Withdrawal.Status.PENDING || w.getStatusEnum() == Withdrawal.Status.PROCESSING;
                    }
                    String status = w.getStatus();
                    return "PENDING".equalsIgnoreCase(status) || "PROCESSING".equalsIgnoreCase(status);
                })
                .filter(w -> normalizedCurrency.equals(normalizeStoredCurrency(w.getCurrency())))
                .mapToDouble(w -> {
                    if (w.getAmountDecimal() != null) {
                        return w.getAmountDecimal();
                    }
                    return w.getAmount() == null ? 0.0 : w.getAmount().doubleValue();
                })
                .sum();
        return walletCurrencyService.round2(total);
    }

    private Map<String, Double> computePendingPayoutsByCurrency(List<Withdrawal> withdrawals) {
        Map<String, Double> pendingByCurrency = zeroedCurrencyMap();
        for (String currency : walletCurrencyService.supportedCurrencies()) {
            pendingByCurrency.put(currency, computePendingPayouts(withdrawals, currency));
        }
        return pendingByCurrency;
    }

    private Map<String, Object> toTransactionView(Transaction tx) {
        Map<String, Object> view = new HashMap<>();
        view.put("id", tx.getId());
        view.put("provider", tx.getProvider() == null ? null : tx.getProvider().name());
        view.put("direction", tx.getDirection() == null ? null : tx.getDirection().name());
        view.put("status", tx.getStatus() == null ? null : tx.getStatus().name());
        view.put("reason", toTransactionReason(tx));
        view.put("amount", tx.getAmount());
        view.put("currency", normalizeStoredCurrency(tx.getCurrency()));
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
        if (tx.getProvider() == Transaction.Provider.STRIPE) {
            return "STRIPE_TOPUP";
        }
        if (tx.getProvider() == Transaction.Provider.CHAPA) {
            return "CHAPA_TOPUP";
        }
        if (tx.getProvider() == Transaction.Provider.WITHDRAWAL) {
            if (tx.getStatus() == Transaction.Status.SUCCESS) {
                return "WITHDRAWAL_COMPLETED";
            }
            if (tx.getStatus() == Transaction.Status.FAILED || tx.getStatus() == Transaction.Status.CANCELLED) {
                return "WITHDRAWAL_CANCELLED";
            }
            return "WITHDRAWAL_REQUEST";
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
        view.put("currency", normalizeStoredCurrency(entry.getCurrency()));
        view.put("referenceId", entry.getReferenceId());
        view.put("createdAt", entry.getCreatedAt());
        view.put("metadata", Map.of());
        return view;
    }

    // Credit wallet for successful Chapa top-up (called from webhook verification flow)
    @Transactional
    public WalletLedgerEntry creditTopUpChapa(String userId, double amount, String currency, String providerRef) {
        return creditTopUp(
                "CHAPA_TOPUP",
                WalletLedgerEntry.Reason.CHAPA_TOPUP,
                userId,
                amount,
                currency,
                providerRef,
                Map.of("provider", "CHAPA")
        );
    }

    @Transactional
    public WalletLedgerEntry creditTopUpStripe(String userId, double amount, String currency, String providerRef) {
        return creditTopUp(
                "STRIPE_TOPUP",
                WalletLedgerEntry.Reason.STRIPE_TOPUP,
                userId,
                amount,
                currency,
                providerRef,
                Map.of("provider", "STRIPE")
        );
    }

    // Credit wallet for verified local/manual top-up (admin verification flow)
    @Transactional
    public WalletLedgerEntry creditTopUpLocal(String userId, double amount, String currency, String referenceId, String verifiedByAdminId) {
        return creditTopUp(
                "LOCAL_TOPUP",
                WalletLedgerEntry.Reason.LOCAL_TOPUP,
                userId,
                amount,
                currency,
                referenceId,
                Map.of("provider", "LOCAL", "verifiedByAdminId", verifiedByAdminId)
        );
    }

    @Transactional
    public WalletLedgerEntry settleCompletedWithdrawal(Withdrawal withdrawal, String adminId, String note) {
        if (withdrawal == null) {
            throw new IllegalArgumentException("withdrawal is required");
        }
        if (withdrawal.getUserId() == null || withdrawal.getUserId().isBlank()) {
            throw new IllegalArgumentException("withdrawal is missing user id");
        }

        String reference = withdrawal.getSettlementReference();
        if (reference == null || reference.isBlank()) {
            reference = withdrawal.getReferenceNumber();
        }
        if (reference == null || reference.isBlank()) {
            reference = "wdl_" + withdrawal.getId();
        }
        final String settlementReference = reference;

        Optional<WalletLedgerEntry> existing = walletLedgerRepository.findByUserIdAndReferenceId(withdrawal.getUserId(), settlementReference);
        if (existing.isPresent()) {
            WalletLedgerEntry entry = existing.get();
            if (withdrawal.getSettlementReference() == null || withdrawal.getSettlementReference().isBlank()) {
                withdrawal.setSettlementReference(settlementReference);
            }
            if (withdrawal.getSettledLedgerEntryId() == null || withdrawal.getSettledLedgerEntryId().isBlank()) {
                withdrawal.setSettledLedgerEntryId(entry.getId());
            }
            if (withdrawal.getLedgerSettledAt() == null) {
                withdrawal.setLedgerSettledAt(LocalDateTime.now());
            }
            return entry;
        }

        double amount = withdrawal.getAmountDecimal() != null
                ? withdrawal.getAmountDecimal()
                : withdrawal.getAmount() == null ? 0.0 : withdrawal.getAmount().doubleValue();
        if (amount <= 0) {
            throw new IllegalStateException("withdrawal amount must be greater than 0");
        }

        String withdrawalCurrency = walletCurrencyService.normalizeSupportedCurrency(
                withdrawal.getCurrency(),
                WalletCurrencyService.ETB
        );

        return withWalletLocks(
                List.of(lockKey(withdrawal.getUserId(), withdrawalCurrency)),
                () -> {
                    double currentBalance = computeBalance(withdrawal.getUserId(), withdrawalCurrency);
                    if (currentBalance < amount) {
                        throw new IllegalStateException("wallet balance is lower than the withdrawal being settled");
                    }

                    WalletLedgerEntry entry = new WalletLedgerEntry();
                    entry.setUserId(withdrawal.getUserId());
                    entry.setType(WalletLedgerEntry.Type.DEBIT);
                    entry.setReason(WalletLedgerEntry.Reason.WITHDRAW);
                    entry.setAmount(amount);
                    entry.setCurrency(withdrawalCurrency);
                    entry.setReferenceId(settlementReference);
                    entry.setBalanceAfter(walletCurrencyService.round2(currentBalance - amount));
                    walletLedgerRepository.save(entry);

                    withdrawal.setSettlementReference(settlementReference);
                    withdrawal.setSettledLedgerEntryId(entry.getId());
                    withdrawal.setLedgerSettledAt(LocalDateTime.now());

                    Map<String, Object> auditPayload = new HashMap<>();
                    auditPayload.put("withdrawalId", withdrawal.getId());
                    auditPayload.put("userId", withdrawal.getUserId());
                    auditPayload.put("amount", amount);
                    auditPayload.put("currency", entry.getCurrency());
                    auditPayload.put("reference", settlementReference);
                    auditPayload.put("adminId", adminId);
                    auditPayload.put("note", note);
                    auditService.log("WITHDRAWAL_SETTLED", "WITHDRAWAL", withdrawal.getId(), auditPayload);

                    return entry;
                }
        );
    }

    @Transactional
    public Map<String, Object> adminAdjustWallet(String userId,
                                                 double amount,
                                                 String currency,
                                                 String action,
                                                 String note,
                                                 String adminId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be greater than 0");
        }

        String normalizedAction = action == null ? "COMMIT" : action.trim().toUpperCase();
        if (!"COMMIT".equals(normalizedAction) && !"ROLLBACK".equals(normalizedAction)) {
            throw new IllegalArgumentException("action must be COMMIT or ROLLBACK");
        }

        boolean rollback = "ROLLBACK".equals(normalizedAction);
        String adjustedCurrency = walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.USD);

        return withWalletLocks(
                List.of(lockKey(userId, adjustedCurrency)),
                () -> {
                    double currentBalance = computeBalance(userId, adjustedCurrency);
                    if (rollback && currentBalance < amount) {
                        throw new IllegalStateException("insufficient balance for rollback");
                    }

                    String reference = "admin_adj_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

                    WalletLedgerEntry entry = new WalletLedgerEntry();
                    entry.setUserId(userId);
                    entry.setType(rollback ? WalletLedgerEntry.Type.DEBIT : WalletLedgerEntry.Type.CREDIT);
                    entry.setReason(rollback ? WalletLedgerEntry.Reason.ADMIN_ROLLBACK : WalletLedgerEntry.Reason.ADMIN_COMMIT);
                    entry.setAmount(amount);
                    entry.setCurrency(adjustedCurrency);
                    entry.setReferenceId(reference);
                    entry.setBalanceAfter(walletCurrencyService.round2(rollback ? currentBalance - amount : currentBalance + amount));
                    walletLedgerRepository.save(entry);

                    Map<String, Object> metadata = new HashMap<>();
                    metadata.put("actorUserId", adminId);
                    metadata.put("targetUserId", userId);
                    metadata.put("amount", amount);
                    metadata.put("currency", adjustedCurrency);
                    metadata.put("action", normalizedAction);
                    metadata.put("reference", reference);
                    metadata.put("note", note);
                    metadata.put("adjustedAt", Instant.now().toString());
                    auditService.log("ADMIN_WALLET_ADJUSTMENT", "WALLET", entry.getId(), metadata);

                    Map<String, Object> result = new HashMap<>();
                    result.put("message", rollback ? "Wallet rollback completed" : "Wallet commit completed");
                    result.put("transactionId", entry.getId());
                    result.put("action", normalizedAction);
                    result.put("amount", entry.getAmount());
                    result.put("currency", entry.getCurrency());
                    result.put("newBalance", entry.getBalanceAfter());
                    result.put("reference", reference);
                    return result;
                }
        );
    }

    private double safe(Double v) {
        return v == null ? 0.0 : v;
    }

    private Map<String, Object> buildWalletBalancesByCurrency(List<WalletLedgerEntry> entriesAsc, List<Withdrawal> withdrawals) {
        Map<String, Double> balances = computeBalanceByCurrency(entriesAsc);
        Map<String, Double> escrowHeld = computeEscrowHeldByCurrency(entriesAsc);
        Map<String, Double> pendingPayouts = computePendingPayoutsByCurrency(withdrawals);

        Map<String, Object> result = new LinkedHashMap<>();
        for (String currency : walletCurrencyService.supportedCurrencies()) {
            double balance = walletCurrencyService.round2(balances.getOrDefault(currency, 0.0));
            double held = walletCurrencyService.round2(escrowHeld.getOrDefault(currency, 0.0));
            double pending = walletCurrencyService.round2(pendingPayouts.getOrDefault(currency, 0.0));
            double available = walletCurrencyService.round2(Math.max(0.0, balance - held - pending));

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("currency", currency);
            entry.put("balance", balance);
            entry.put("availableBalance", available);
            entry.put("escrowHeld", held);
            entry.put("pendingPayouts", pending);
            entry.put("holds", walletCurrencyService.round2(held + pending));
            entry.put("convertedBalance", buildConvertedValues(balance, currency));
            entry.put("convertedAvailableBalance", buildConvertedValues(available, currency));
            result.put(currency, entry);
        }
        return result;
    }

    private Map<String, Object> buildConvertedValues(double amount, String sourceCurrency) {
        Map<String, Object> converted = new LinkedHashMap<>();
        for (String currency : walletCurrencyService.supportedCurrencies()) {
            converted.put(currency, walletCurrencyService.convert(amount, sourceCurrency, currency));
        }
        return converted;
    }

    private Map<String, Object> asWalletBreakdown(Object raw) {
        if (raw instanceof Map<?, ?> map) {
            Map<String, Object> copy = new LinkedHashMap<>();
            map.forEach((key, value) -> copy.put(String.valueOf(key), value));
            return copy;
        }
        return Map.of(
                "balance", 0.0,
                "availableBalance", 0.0,
                "escrowHeld", 0.0,
                "pendingPayouts", 0.0,
                "holds", 0.0
        );
    }

    private double toDouble(Object raw) {
        if (raw instanceof Number number) {
            return walletCurrencyService.round2(number.doubleValue());
        }
        if (raw instanceof String value) {
            try {
                return walletCurrencyService.round2(Double.parseDouble(value));
            } catch (NumberFormatException ignored) {
                return 0.0;
            }
        }
        return 0.0;
    }

    private Map<String, Double> zeroedCurrencyMap() {
        Map<String, Double> values = new LinkedHashMap<>();
        for (String currency : walletCurrencyService.supportedCurrencies()) {
            values.put(currency, 0.0);
        }
        return values;
    }

    private String normalizeStoredCurrency(String value) {
        if (walletCurrencyService.isSupported(value)) {
            return value.trim().toUpperCase(Locale.ROOT);
        }
        return WalletCurrencyService.ETB;
    }

    private boolean transactionMatchesCurrency(Transaction tx, String currency) {
        if (tx == null) {
            return false;
        }
        return walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB)
                .equals(normalizeStoredCurrency(tx.getCurrency()));
    }

    private String lockKey(String userId, String currency) {
        return userId + "|" + walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB);
    }

    private <T> T withWalletLocks(List<String> lockKeys, Supplier<T> action) {
        List<String> orderedKeys = lockKeys.stream()
                .filter(key -> key != null && !key.isBlank())
                .distinct()
                .sorted()
                .toList();

        List<ReentrantLock> locks = new ArrayList<>();
        for (String key : orderedKeys) {
            ReentrantLock lock = walletLocks.computeIfAbsent(key, ignored -> new ReentrantLock());
            lock.lock();
            locks.add(lock);
        }

        try {
            return action.get();
        } finally {
            for (int i = locks.size() - 1; i >= 0; i -= 1) {
                locks.get(i).unlock();
            }
        }
    }

    private boolean includeInForecast(Transaction tx) {
        if (tx == null) return false;
        if (tx.getStatus() == Transaction.Status.FAILED || tx.getStatus() == Transaction.Status.CANCELLED) return false;
        return tx.getCreatedAt() != null;
    }

    private List<Double> buildDailyHistoricalNetSeries(List<Transaction> transactions, int days, String currency) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Double> series = new ArrayList<>();

        for (int i = days - 1; i >= 0; i -= 1) {
            LocalDate targetDay = today.minusDays(i);
            double net = 0.0;
            for (Transaction tx : transactions) {
                if (!includeInForecast(tx)) continue;
                if (!transactionMatchesCurrency(tx, currency)) continue;
                LocalDate txDay = tx.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
                if (!txDay.equals(targetDay)) continue;
                if (tx.getDirection() == Transaction.Direction.IN) net += safe(tx.getAmount());
                if (tx.getDirection() == Transaction.Direction.OUT) net -= safe(tx.getAmount());
            }
            series.add(round2(net));
        }

        return series;
    }

    private List<Double> buildMonthlyHistoricalNetSeries(List<Transaction> transactions, int months, String currency) {
        YearMonth current = YearMonth.now(ZoneOffset.UTC);
        List<Double> series = new ArrayList<>();

        for (int i = months - 1; i >= 0; i -= 1) {
            YearMonth targetMonth = current.minusMonths(i);
            double net = 0.0;
            for (Transaction tx : transactions) {
                if (!includeInForecast(tx)) continue;
                if (!transactionMatchesCurrency(tx, currency)) continue;
                YearMonth txMonth = YearMonth.from(tx.getCreatedAt().atZone(ZoneOffset.UTC));
                if (!txMonth.equals(targetMonth)) continue;
                if (tx.getDirection() == Transaction.Direction.IN) net += safe(tx.getAmount());
                if (tx.getDirection() == Transaction.Direction.OUT) net -= safe(tx.getAmount());
            }
            series.add(round2(net));
        }

        return series;
    }

    private String dailyForecastKey(Instant now, int plusDays) {
        return now.plusSeconds(86_400L * plusDays).atZone(ZoneOffset.UTC).toLocalDate().toString();
    }

    private String monthlyForecastKey(Instant now, int plusMonths) {
        return YearMonth.from(now.atZone(ZoneOffset.UTC)).plusMonths(plusMonths).format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private WalletLedgerEntry creditTopUp(String auditEvent,
                                          WalletLedgerEntry.Reason reason,
                                          String userId,
                                          double amount,
                                          String currency,
                                          String referenceId,
                                          Map<String, Object> extraAuditPayload) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be > 0");
        if (userId == null || userId.isBlank()) throw new IllegalArgumentException("userId is required");
        if (referenceId == null || referenceId.isBlank()) throw new IllegalArgumentException("referenceId is required");

        Optional<WalletLedgerEntry> existing = walletLedgerRepository.findByUserIdAndReferenceId(userId, referenceId);
        if (existing.isPresent()) {
            return existing.get();
        }

        String normalizedCurrency = walletCurrencyService.normalizeSupportedCurrency(currency, WalletCurrencyService.ETB);

        return withWalletLocks(
                List.of(lockKey(userId, normalizedCurrency)),
                () -> {
                    Optional<WalletLedgerEntry> duplicate = walletLedgerRepository.findByUserIdAndReferenceId(userId, referenceId);
                    if (duplicate.isPresent()) {
                        return duplicate.get();
                    }

                    double balance = computeBalance(userId, normalizedCurrency);

                    WalletLedgerEntry credit = new WalletLedgerEntry();
                    credit.setUserId(userId);
                    credit.setType(WalletLedgerEntry.Type.CREDIT);
                    credit.setReason(reason);
                    credit.setAmount(amount);
                    credit.setCurrency(normalizedCurrency);
                    credit.setReferenceId(referenceId);
                    credit.setBalanceAfter(walletCurrencyService.round2(balance + amount));
                    walletLedgerRepository.save(credit);

                    Map<String, Object> auditPayload = new HashMap<>();
                    auditPayload.put("userId", userId);
                    auditPayload.put("amount", amount);
                    auditPayload.put("currency", credit.getCurrency());
                    auditPayload.putAll(extraAuditPayload);
                    auditService.log(auditEvent, "TRANSACTION", referenceId, auditPayload);

                    // Live Activity: top-up successful
                    User topupUser = userRepository.findById(userId).orElse(null);
                    liveActivityService.broadcast(
                            "PAYMENT",
                            (topupUser != null ? topupUser.getFullName() : "User") + " topped up " + amount + " " + normalizedCurrency,
                            userId,
                            topupUser != null ? topupUser.getUsername() : null,
                            null,
                            "success",
                            Map.of("amount", amount, "currency", normalizedCurrency, "type", "TOPUP", "provider", extraAuditPayload.getOrDefault("provider", "UNKNOWN"))
                    );

                    return credit;
                }
        );
    }
}
