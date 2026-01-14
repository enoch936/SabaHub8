package com.sabahub.controller;

import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.domain.Withdrawal;
import com.sabahub.dto.WalletDTO;
import com.sabahub.repository.WalletLedgerRepository;
import com.sabahub.repository.WithdrawalRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.domain.User;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v2/wallet")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class WalletAPIController {

    @Autowired
    private WalletLedgerRepository walletLedgerRepository;

    @Autowired
    private WithdrawalRepository withdrawalRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get current user's wallet balance and summary
     */
    @GetMapping("/balance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getWalletBalance(Authentication authentication) {
        try {
            String userId = authentication.getPrincipal().toString();

            // Get the latest wallet balance
            List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);
            Double balance = 0.0;

            if (!entries.isEmpty()) {
                balance = entries.get(0).getBalanceAfter() != null ? entries.get(0).getBalanceAfter() : 0.0;
            }

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("balance", balance);
            response.put("currency", "USD");
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
            String userId = authentication.getPrincipal().toString();
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
            String userId = authentication.getPrincipal().toString();

            List<WalletLedgerEntry> escrowEntries = walletLedgerRepository
                    .findByUserIdAndReasonOrderByCreatedAtDesc(userId, WalletLedgerEntry.Reason.ESCROW_FUND);

            Double escrowBalance = 0.0;
            for (WalletLedgerEntry entry : escrowEntries) {
                if (entry.getType() == WalletLedgerEntry.Type.DEBIT) {
                    escrowBalance += entry.getAmount();
                } else if (entry.getType() == WalletLedgerEntry.Type.CREDIT) {
                    escrowBalance -= entry.getAmount();
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("escrowBalance", escrowBalance);
            response.put("currency", "USD");
            response.put("lastUpdated", Instant.now());

            return ResponseEntity.ok(response);
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
            String userId = authentication.getPrincipal().toString();

            // Validate amount
            if (withdrawalRequest.getAmount() == null || withdrawalRequest.getAmount() <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid withdrawal amount"));
            }

            // Get current balance
            List<WalletLedgerEntry> entries = walletLedgerRepository.findByUserIdOrderByCreatedAtDesc(userId);
            Double balance = 0.0;

            if (!entries.isEmpty()) {
                balance = entries.get(0).getBalanceAfter() != null ? entries.get(0).getBalanceAfter() : 0.0;
            }

            // Check sufficient balance
            if (balance < withdrawalRequest.getAmount()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Insufficient balance", "available", balance));
            }

            // Create withdrawal request
            Withdrawal withdrawal = new Withdrawal();
            withdrawal.setUserId(userId);
            withdrawal.setAmount(new BigDecimal(withdrawalRequest.getAmount()));
            withdrawal.setAmountDecimal(withdrawalRequest.getAmount());
            withdrawal.setCurrency(withdrawalRequest.getCurrency() != null ? withdrawalRequest.getCurrency() : "USD");
            withdrawal.setPaymentMethod(withdrawalRequest.getPaymentMethod() != null ? withdrawalRequest.getPaymentMethod() : "BANK_TRANSFER");
            withdrawal.setStatus("PENDING");
            withdrawal.setStatusEnum(Withdrawal.Status.PENDING);
            withdrawal.setBankDetails(withdrawalRequest.getBankDetails());

            Withdrawal savedWithdrawal = withdrawalRepository.save(withdrawal);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Withdrawal request initiated",
                            "withdrawalId", savedWithdrawal.getId(),
                            "amount", savedWithdrawal.getAmount(),
                            "status", savedWithdrawal.getStatus()
                    ));
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
            String userId = authentication.getPrincipal().toString();
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
            Optional<Withdrawal> withdrawal = withdrawalRepository.findById(withdrawalId);

            if (!withdrawal.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Withdrawal w = withdrawal.get();
            // Verify ownership
            if (!w.getUserId().equals(authentication.getPrincipal().toString())) {
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
            String userId = authentication.getPrincipal().toString();

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
    @PreAuthorize("hasRole('ADMIN')")
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
            entry.setReason(WalletLedgerEntry.Reason.CHAPA_TOPUP);
            entry.setAmount(topupRequest.getAmount());
            entry.setCurrency(topupRequest.getCurrency() != null ? topupRequest.getCurrency() : "USD");

            // Get current balance
            List<WalletLedgerEntry> entries = walletLedgerRepository
                    .findByUserIdOrderByCreatedAtDesc(topupRequest.getUserId());
            Double currentBalance = 0.0;
            if (!entries.isEmpty()) {
                currentBalance = entries.get(0).getBalanceAfter() != null ? entries.get(0).getBalanceAfter() : 0.0;
            }

            entry.setBalanceAfter(currentBalance + topupRequest.getAmount());

            WalletLedgerEntry savedEntry = walletLedgerRepository.save(entry);

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
}
