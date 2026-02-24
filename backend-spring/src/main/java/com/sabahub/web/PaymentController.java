package com.sabahub.web;

import com.sabahub.domain.Transaction;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.PaymentService;
import com.sabahub.service.WalletService;
import com.sabahub.service.RateLimiter;
import com.sabahub.config.RateLimitProperties;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PaymentController {

    private final WalletService walletService;
    private final PaymentService paymentService;
    private final CurrentUserService currentUserService;
    private final RateLimiter rateLimiter;
    private final RateLimitProperties rateLimitProperties;
    private final TransactionRepository transactionRepository;

    public PaymentController(WalletService walletService,
                             PaymentService paymentService,
                             CurrentUserService currentUserService,
                             TransactionRepository transactionRepository,
                             RateLimiter rateLimiter,
                             RateLimitProperties rateLimitProperties) {
        this.walletService = walletService;
        this.paymentService = paymentService;
        this.currentUserService = currentUserService;
        this.transactionRepository = transactionRepository;
        this.rateLimiter = rateLimiter;
        this.rateLimitProperties = rateLimitProperties;
    }

    /**
     * Placeholder: initialize a Chapa payment intent (implementation omitted).
     */
    @PostMapping("/payments/chapa/init")
    public ResponseEntity<Map<String, Object>> initChapa(
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> body) {
        // Normally create a Transaction with PENDING and return provider checkout info.
        var me = currentUserService.requireUser();
        int limit = rateLimitProperties.getChapaInitPerMinute();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        if (!rateLimiter.allow("chapa:init:" + me.getId(), limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }
        double amount = ((Number) body.getOrDefault("amount", 0)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ETB");

        if (idemKey != null && !idemKey.isBlank()) {
            var existing = transactionRepository.findByUserIdAndIdempotencyKey(me.getId(), idemKey);
            if (existing.isPresent()) {
                var tx0 = existing.get();
                return ResponseEntity.ok(Map.of("transactionId", tx0.getId(), "idempotent", true));
            }
        }

        Transaction tx = new Transaction();
        tx.setUserId(me.getId());
        tx.setProvider(Transaction.Provider.CHAPA);
        tx.setDirection(Transaction.Direction.IN);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setStatus(Transaction.Status.PENDING);
        tx.setMetadata(Map.of("init", true));
        tx.setIdempotencyKey(idemKey);
        transactionRepository.save(tx);

        return ResponseEntity.ok(Map.of("transactionId", tx.getId()));
    }

    /**
     * Chapa webhook: after verifying signature, credit wallet.
     */
    @PostMapping("/payments/chapa/webhook")
    public ResponseEntity<Map<String, Object>> chapaWebhook(
            @RequestHeader(name = "X-Chapa-Signature", required = false) String signature,
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        int limit = rateLimitProperties.getWebhookPerMinutePerIp();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        if (!rateLimiter.allow("chapa:webhook:" + ip, limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }
        if (!paymentService.verifyChapaSignature(payload, signature)) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid_signature"));
        }
        // Verify signature (omitted). Assume valid for demo.
        String providerRef = (String) payload.get("providerRef");
        String userId = (String) payload.get("userId");
        double amount = ((Number) payload.getOrDefault("amount", 0)).doubleValue();
        String currency = (String) payload.getOrDefault("currency", "ETB");

        // Idempotency: ensure not processed
        var existing = transactionRepository.findByProviderAndProviderRef(Transaction.Provider.CHAPA, providerRef)
                .or(() -> (idemKey != null && !idemKey.isBlank()) ? transactionRepository.findByIdempotencyKey(idemKey) : java.util.Optional.empty());
        Transaction tx;
        if (existing.isPresent()) {
            tx = existing.get();
        } else {
            tx = new Transaction();
            tx.setUserId(userId);
            tx.setProvider(Transaction.Provider.CHAPA);
            tx.setDirection(Transaction.Direction.IN);
            tx.setAmount(amount);
            tx.setCurrency(currency);
            tx.setStatus(Transaction.Status.SUCCESS);
            tx.setProviderRef(providerRef);
            tx.setMetadata(payload);
            tx.setIdempotencyKey(idemKey);
            transactionRepository.save(tx);
        }

        walletService.creditTopUpChapa(userId, amount, currency, providerRef);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * Local/manual top-up request (stores pending transaction; later admin verifies).
     */
    @PostMapping("/payments/local/request")
    public ResponseEntity<Map<String, Object>> localRequest(
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        int limit = rateLimitProperties.getLocalRequestPerMinute();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        if (!rateLimiter.allow("local:request:" + me.getId(), limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }
        Object amountValue = body.getOrDefault("amount", 0);
        double amount = amountValue instanceof Number ? ((Number) amountValue).doubleValue() : 0.0;
        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "amount_must_be_greater_than_zero"));
        }

        Object currencyRaw = body.getOrDefault("currency", "ETB");
        String currency = currencyRaw == null ? "ETB" : currencyRaw.toString().trim().toUpperCase();
        Object referenceRaw = body.getOrDefault("referenceId", "");
        String referenceId = referenceRaw == null ? "" : referenceRaw.toString().trim();
        if (referenceId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "reference_id_required"));
        }

        if (idemKey != null && !idemKey.isBlank()) {
            var existing = transactionRepository.findByUserIdAndIdempotencyKey(me.getId(), idemKey);
            if (existing.isPresent()) {
                var tx0 = existing.get();
                return ResponseEntity.ok(Map.of("transactionId", tx0.getId(), "idempotent", true));
            }
        }

        Transaction tx = new Transaction();
        tx.setUserId(me.getId());
        tx.setProvider(Transaction.Provider.LOCAL);
        tx.setDirection(Transaction.Direction.IN);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setStatus(Transaction.Status.PENDING);
        tx.setProviderRef(referenceId);
        tx.setMetadata(body);
        tx.setIdempotencyKey(idemKey);
        transactionRepository.save(tx);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "transactionId", tx.getId(),
                "status", tx.getStatus().name(),
                "message", "Local payment submitted. Funds will be available after admin approval."
        ));
    }

    /**
     * Transfer settled wallet funds from one SabaHub account to another.
     */
    @PostMapping("/payments/internal/transfer")
    public ResponseEntity<Map<String, Object>> transferInternal(
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        int limit = rateLimitProperties.getLocalRequestPerMinute();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        if (!rateLimiter.allow("wallet:transfer:" + me.getId(), limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }

        Object recipientRaw = body.containsKey("recipient")
                ? body.get("recipient")
                : body.containsKey("recipientEmail")
                ? body.get("recipientEmail")
                : body.getOrDefault("recipientUserId", "");
        String recipient = recipientRaw == null ? "" : recipientRaw.toString().trim();

        Object transferCurrencyRaw = body.getOrDefault("currency", "ETB");
        String currency = transferCurrencyRaw == null ? "ETB" : transferCurrencyRaw.toString().trim().toUpperCase();
        Object noteRaw = body.getOrDefault("note", "");
        String note = noteRaw == null ? "" : noteRaw.toString().trim();
        Object amountValue = body.getOrDefault("amount", 0);
        double amount = amountValue instanceof Number ? ((Number) amountValue).doubleValue() : 0.0;

        try {
            Map<String, Object> result = walletService.transferToUser(recipient, amount, currency, note, idemKey);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * List pending local/manual top-up requests for admin review.
     */
    @GetMapping("/admin/payments/local/pending")
    public ResponseEntity<?> listPendingLocalTopups(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        var admin = currentUserService.requireUser();
        currentUserService.requireRole(admin, "ADMIN");

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        var pending = transactionRepository.findByProviderAndStatusOrderByCreatedAtDesc(
                Transaction.Provider.LOCAL,
                Transaction.Status.PENDING,
                pageable
        );
        return ResponseEntity.ok(pending);
    }

    /**
     * Admin verifies a local/manual top-up and credits the wallet.
     */
    @PostMapping("/admin/payments/local/verify")
    public ResponseEntity<Map<String, Object>> adminVerifyLocal(
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> body) {
        var admin = currentUserService.requireUser();
        currentUserService.requireRole(admin, "ADMIN");
        int limit = rateLimitProperties.getAdminVerifyPerMinute();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        if (!rateLimiter.allow("admin:verify:" + admin.getId(), limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }

        String transactionId = (String) body.get("transactionId");
        boolean approved = body.get("approved") == null || Boolean.TRUE.equals(body.get("approved"));
        String adminNote = body.get("note") instanceof String ? ((String) body.get("note")).trim() : "";

        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (tx.getProvider() != Transaction.Provider.LOCAL) {
            throw new IllegalStateException("Invalid transaction state");
        }
        if (tx.getStatus() == Transaction.Status.SUCCESS) {
            return ResponseEntity.ok(Map.of("ok", true, "idempotent", true, "status", tx.getStatus().name()));
        }
        if (tx.getStatus() != Transaction.Status.PENDING) {
            throw new IllegalStateException("Transaction already reviewed");
        }

        tx.setStatus(approved ? Transaction.Status.SUCCESS : Transaction.Status.FAILED);

        Map<String, Object> metadata = tx.getMetadata() == null ? new HashMap<>() : new HashMap<>(tx.getMetadata());
        metadata.put("reviewedByAdminId", admin.getId());
        metadata.put("reviewApproved", approved);
        if (!adminNote.isBlank()) {
            metadata.put("reviewNote", adminNote);
        }
        tx.setMetadata(metadata);
        if (idemKey != null && !idemKey.isBlank()) {
            tx.setIdempotencyKey(idemKey);
        }
        transactionRepository.save(tx);

        if (approved) {
            walletService.creditTopUpLocal(tx.getUserId(), tx.getAmount(), tx.getCurrency(), tx.getProviderRef(), admin.getId());
        }

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "status", tx.getStatus().name(),
                "walletCredited", approved
        ));
    }
}
