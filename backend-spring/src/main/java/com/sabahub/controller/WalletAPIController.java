package com.sabahub.controller;

import com.sabahub.domain.Transaction;
import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.domain.Withdrawal;
import com.sabahub.dto.WalletDTO;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.repository.WalletLedgerRepository;
import com.sabahub.repository.WithdrawalRepository;
import com.sabahub.service.AuditService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.PaymentEncryptionService;
import com.sabahub.service.WalletCurrencyService;
import com.sabahub.service.WalletService;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/wallet")
@CrossOrigin(origins = {"http://localhost:3000"})
public class WalletAPIController {

    @Autowired
    private WalletLedgerRepository walletLedgerRepository;

    @Autowired
    private WithdrawalRepository withdrawalRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private PaymentEncryptionService paymentEncryptionService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private WalletCurrencyService walletCurrencyService;

    /**
     * Get current user's wallet balance and summary
     */
    @GetMapping("/balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWalletBalance(Authentication authentication) {
        try {
            String userId = currentUserService.getCurrentUserId();
            Map<String, Object> wallet = walletService.getWalletByUserId(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("balance", wallet.get("balance"));
            response.put("availableBalance", wallet.get("availableBalance"));
            response.put("currency", wallet.get("currency"));
            response.put("balancesByCurrency", wallet.get("balancesByCurrency"));
            response.put("supportedCurrencies", wallet.get("supportedCurrencies"));
            response.put("fx", wallet.get("fx"));
            response.put("totalTransactions", walletLedgerRepository.countByUserId(userId));
            response.put("lastUpdated", Instant.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch wallet balance: " + e.getMessage()));
        }
    }

    /**
     * Get wallet transactions/ledger entries
     */
    @GetMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTransactions(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            String userId = currentUserService.getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);

            Page<WalletLedgerEntry> transactions = walletLedgerRepository.findByUserId(userId, pageable);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch transactions: " + e.getMessage()));
        }
    }

    /**
     * Get escrow balance (funds held in escrow)
     */
    @GetMapping("/escrow-balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getEscrowBalance(Authentication authentication) {
        try {
            String userId = currentUserService.getCurrentUserId();
            Map<String, Object> wallet = walletService.getWalletByUserId(userId);
            return ResponseEntity.ok(Map.of(
                    "escrowBalance", wallet.get("escrowHeld"),
                    "currency", wallet.get("currency"),
                    "balancesByCurrency", wallet.get("balancesByCurrency"),
                    "lastUpdated", Instant.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch escrow balance: " + e.getMessage()));
        }
    }

    /**
     * Initiate a wallet withdrawal/payout
     */
    @PostMapping("/withdraw")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> initiateWithdrawal(
            @RequestBody WalletDTO withdrawalRequest,
            Authentication authentication) {
        try {
            String userId = currentUserService.getCurrentUserId();

            // Validate amount
            if (withdrawalRequest.getAmount() == null || withdrawalRequest.getAmount() <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid withdrawal amount"));
            }

            String currency = walletCurrencyService.normalizeSupportedCurrency(
                    withdrawalRequest.getCurrency(),
                    WalletCurrencyService.ETB
            );
            double availableBalance = walletService.getAvailableBalanceByUserIdAndCurrency(userId, currency);

            if (availableBalance < withdrawalRequest.getAmount()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Insufficient balance",
                                "available", availableBalance,
                                "currency", currency
                        ));
            }

            String paymentMethod = withdrawalRequest.getPaymentMethod() != null && !withdrawalRequest.getPaymentMethod().isBlank()
                    ? withdrawalRequest.getPaymentMethod().trim().toUpperCase()
                    : "BANK_TRANSFER";
            Map<String, String> payoutDetails = withdrawalRequest.getBankDetails() == null
                    ? new LinkedHashMap<>()
                    : new LinkedHashMap<>(withdrawalRequest.getBankDetails());
            String accountNumber = payoutDetails.getOrDefault("accountNumber", "");
            String destinationLast4 = paymentEncryptionService.maskAccountNumber(accountNumber);
            if (destinationLast4.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing destination account number or card number"));
            }

            String encryptedPayoutDetails = paymentEncryptionService.encryptMap(payoutDetails);
            LocalDateTime now = LocalDateTime.now();
            String referenceNumber = "wdl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 18);

            // Create withdrawal request
            Withdrawal withdrawal = new Withdrawal();
            withdrawal.setUserId(userId);
            withdrawal.setAmount(new BigDecimal(withdrawalRequest.getAmount()));
            withdrawal.setAmountDecimal(withdrawalRequest.getAmount());
            withdrawal.setCurrency(currency);
            withdrawal.setPaymentMethod(paymentMethod);
            withdrawal.setStatus("PENDING");
            withdrawal.setStatusEnum(Withdrawal.Status.PENDING);
            withdrawal.setBankDetails(maskPayoutDetails(payoutDetails, destinationLast4));
            withdrawal.setBankName(payoutDetails.get("bankName"));
            withdrawal.setAccountHolderName(payoutDetails.get("accountName"));
            withdrawal.setAccountNumber(destinationLast4.isBlank() ? null : "****" + destinationLast4);
            withdrawal.setEncryptedPayoutDetails(encryptedPayoutDetails);
            withdrawal.setPayoutDestinationLast4(destinationLast4);
            withdrawal.setReferenceNumber(referenceNumber);
            withdrawal.setRequestedAt(now);
            withdrawal.setCreatedAt(now);
            withdrawal.setUpdatedAt(now);

            Withdrawal savedWithdrawal = withdrawalRepository.save(withdrawal);
            savedWithdrawal.setTransactionId(savedWithdrawal.getId());
            withdrawalRepository.save(savedWithdrawal);

            Map<String, Object> txMetadata = new LinkedHashMap<>();
            txMetadata.put("withdrawalId", savedWithdrawal.getId());
            txMetadata.put("paymentMethod", paymentMethod);
            txMetadata.put("bankName", payoutDetails.get("bankName"));
            txMetadata.put("accountHolderName", payoutDetails.get("accountName"));
            txMetadata.put("accountNumberLast4", destinationLast4);
            txMetadata.put("encryptedDestination", true);

            Transaction tx = new Transaction();
            tx.setId(savedWithdrawal.getId());
            tx.setUserId(userId);
            tx.setProvider(Transaction.Provider.WITHDRAWAL);
            tx.setDirection(Transaction.Direction.OUT);
            tx.setAmount(withdrawalRequest.getAmount());
            tx.setCurrency(currency);
            tx.setStatus(Transaction.Status.PENDING);
            tx.setProviderRef(referenceNumber);
            tx.setMetadata(txMetadata);
            transactionRepository.save(tx);

            auditService.log("WITHDRAWAL_REQUESTED", "WITHDRAWAL", savedWithdrawal.getId(), Map.of(
                    "userId", userId,
                    "amount", withdrawalRequest.getAmount(),
                    "currency", currency,
                    "paymentMethod", paymentMethod,
                    "referenceNumber", referenceNumber
            ));

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Withdrawal request initiated",
                            "withdrawalId", savedWithdrawal.getId(),
                            "amount", savedWithdrawal.getAmount(),
                            "status", savedWithdrawal.getStatus(),
                            "referenceNumber", savedWithdrawal.getReferenceNumber()
                    ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to initiate withdrawal: " + e.getMessage()));
        }
    }

    /**
     * Get user's withdrawal history
     */
    @GetMapping("/withdrawals")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWithdrawals(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String userId = currentUserService.getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);

            Page<Withdrawal> withdrawals = withdrawalRepository.findByUserId(userId, pageable);
            return ResponseEntity.ok(withdrawals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch withdrawals: " + e.getMessage()));
        }
    }

    /**
     * Get withdrawal request status
     */
    @GetMapping("/withdrawals/{withdrawalId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWithdrawalStatus(
            @PathVariable String withdrawalId,
            Authentication authentication) {
        try {
            String userId = currentUserService.getCurrentUserId();
            Optional<Withdrawal> withdrawal = withdrawalRepository.findById(withdrawalId);

            if (!withdrawal.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Withdrawal w = withdrawal.get();
            // Verify ownership
            if (!w.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to view this withdrawal"));
            }

            return ResponseEntity.ok(w);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch withdrawal: " + e.getMessage()));
        }
    }

    /**
     * Get wallet summary with all metrics
     */
    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWalletSummary(Authentication authentication) {
        try {
            String userId = currentUserService.getCurrentUserId();

            // Get balance
            List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);
            Double balance = 0.0;
            if (!entries.isEmpty()) {
                balance = entries.get(0).getBalanceAfter() != null ? entries.get(0).getBalanceAfter() : 0.0;
            }

            // Get escrow balance
            List<WalletLedgerEntry> escrowEntries = walletLedgerRepository
                    .findByUserIdAndReasonOrderByCreatedAtDesc(userId, WalletLedgerEntry.Reason.ESCROW_FUND);
            Double escrowBalance = 0.0;
            for (WalletLedgerEntry entry : escrowEntries) {
                if (entry.getType() == WalletLedgerEntry.Type.DEBIT) {
                    escrowBalance += entry.getAmount();
                }
            }

            // Get withdrawal stats
            long pendingWithdrawals = withdrawalRepository.countByUserIdAndStatus(userId, Withdrawal.Status.PENDING);
            long completedWithdrawals = withdrawalRepository.countByUserIdAndStatus(userId, Withdrawal.Status.COMPLETED);

            Map<String, Object> summary = new HashMap<>();
            summary.put("balance", balance);
            summary.put("escrowBalance", escrowBalance);
            summary.put("availableBalance", balance - escrowBalance);
            summary.put("currency", "USD");
            summary.put("totalTransactions", walletLedgerRepository.countByUserId(userId));
            summary.put("pendingWithdrawals", pendingWithdrawals);
            summary.put("completedWithdrawals", completedWithdrawals);
            summary.put("lastUpdated", Instant.now());

            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch wallet summary: " + e.getMessage()));
        }
    }

    /**
     * Top-up wallet (for admin or payment gateway integration)
     */
    @PostMapping("/topup")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','FINANCE_ADMIN')")
    public ResponseEntity<?> topupWallet(
            @RequestBody WalletDTO topupRequest,
            Authentication authentication) {
        try {
            if (topupRequest.getUserId() == null || topupRequest.getAmount() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Missing required fields: userId, amount"));
            }

            if (topupRequest.getAmount() <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Amount must be greater than 0"));
            }

            // Create ledger entry
            WalletLedgerEntry entry = new WalletLedgerEntry();
            entry.setUserId(topupRequest.getUserId());
            entry.setType(WalletLedgerEntry.Type.CREDIT);
            entry.setReason(WalletLedgerEntry.Reason.ADMIN_COMMIT);
            entry.setAmount(topupRequest.getAmount());
            entry.setCurrency(topupRequest.getCurrency() != null ? topupRequest.getCurrency() : "USD");

            // Get current balance
            Double currentBalance = resolveCurrentBalance(topupRequest.getUserId());

            entry.setBalanceAfter(currentBalance + topupRequest.getAmount());

            WalletLedgerEntry savedEntry = walletLedgerRepository.save(entry);

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("actor", authentication.getName());
            metadata.put("targetUserId", topupRequest.getUserId());
            metadata.put("amount", savedEntry.getAmount());
            metadata.put("currency", savedEntry.getCurrency());
            metadata.put("action", "COMMIT");
            auditService.log("ADMIN_WALLET_ADJUSTMENT", "WALLET", savedEntry.getId(), metadata);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Wallet topped up successfully",
                            "transactionId", savedEntry.getId(),
                            "amount", savedEntry.getAmount(),
                            "newBalance", savedEntry.getBalanceAfter()
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to topup wallet: " + e.getMessage()));
        }
    }

    /**
     * Admin wallet commit/rollback adjustment.
     */
    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','FINANCE_ADMIN')")
    public ResponseEntity<?> adjustWallet(
            @RequestBody WalletDTO adjustRequest,
            Authentication authentication) {
        try {
            if (adjustRequest.getUserId() == null || adjustRequest.getUserId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
            }
            if (adjustRequest.getAmount() == null || adjustRequest.getAmount() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "amount must be greater than 0"));
            }
            String action = adjustRequest.getAction() == null ? "COMMIT" : adjustRequest.getAction().trim().toUpperCase();
            if (!"COMMIT".equals(action) && !"ROLLBACK".equals(action)) {
                return ResponseEntity.badRequest().body(Map.of("error", "action must be COMMIT or ROLLBACK"));
            }

            double currentBalance = resolveCurrentBalance(adjustRequest.getUserId());
            double amount = adjustRequest.getAmount();
            boolean rollback = "ROLLBACK".equals(action);
            if (rollback && currentBalance < amount) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "insufficient_balance_for_rollback",
                        "currentBalance", currentBalance,
                        "requestedRollback", amount
                ));
            }

            WalletLedgerEntry entry = new WalletLedgerEntry();
            entry.setUserId(adjustRequest.getUserId());
            entry.setType(rollback ? WalletLedgerEntry.Type.DEBIT : WalletLedgerEntry.Type.CREDIT);
            entry.setReason(rollback ? WalletLedgerEntry.Reason.ADMIN_ROLLBACK : WalletLedgerEntry.Reason.ADMIN_COMMIT);
            entry.setAmount(amount);
            entry.setCurrency(adjustRequest.getCurrency() != null ? adjustRequest.getCurrency() : "USD");
            entry.setReferenceId(adjustRequest.getNote());
            entry.setBalanceAfter(rollback ? currentBalance - amount : currentBalance + amount);

            WalletLedgerEntry savedEntry = walletLedgerRepository.save(entry);

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("actor", authentication.getName());
            metadata.put("targetUserId", adjustRequest.getUserId());
            metadata.put("amount", amount);
            metadata.put("currency", savedEntry.getCurrency());
            metadata.put("action", action);
            metadata.put("note", adjustRequest.getNote());
            metadata.put("balanceAfter", savedEntry.getBalanceAfter());
            auditService.log("ADMIN_WALLET_ADJUSTMENT", "WALLET", savedEntry.getId(), metadata);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", rollback ? "Wallet rollback completed" : "Wallet commit completed",
                    "transactionId", savedEntry.getId(),
                    "action", action,
                    "amount", savedEntry.getAmount(),
                    "newBalance", savedEntry.getBalanceAfter()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to adjust wallet: " + e.getMessage()));
        }
    }

    private Double resolveCurrentBalance(String userId) {
        List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (entries.isEmpty()) {
            return 0.0;
        }
        return entries.get(0).getBalanceAfter() != null ? entries.get(0).getBalanceAfter() : 0.0;
    }

    private Map<String, String> maskPayoutDetails(Map<String, String> payoutDetails, String destinationLast4) {
        Map<String, String> masked = new LinkedHashMap<>();
        payoutDetails.forEach((key, value) -> {
            if ("accountNumber".equalsIgnoreCase(key) || "cardNumber".equalsIgnoreCase(key) || "cardCvv".equalsIgnoreCase(key)) {
                return;
            }
            masked.put(key, value);
        });
        if (destinationLast4 != null && !destinationLast4.isBlank()) {
            masked.put("accountNumberLast4", destinationLast4);
        }
        return masked;
    }
}
