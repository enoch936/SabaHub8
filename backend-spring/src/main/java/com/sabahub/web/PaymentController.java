package com.sabahub.web;

import com.sabahub.domain.Transaction;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.PaymentService;
import com.sabahub.service.WalletService;
import com.sabahub.service.RateLimiter;
import com.sabahub.config.RateLimitProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

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
            var existing = transactionRepository.findByIdempotencyKey(idemKey);
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
        double amount = ((Number) body.getOrDefault("amount", 0)).doubleValue();
        String currency = (String) body.getOrDefault("currency", "ETB");
        String referenceId = (String) body.getOrDefault("referenceId", "");
        if (idemKey != null && !idemKey.isBlank()) {
            var existing = transactionRepository.findByIdempotencyKey(idemKey);
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
        return ResponseEntity.ok(Map.of("transactionId", tx.getId()));
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
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (tx.getStatus() != Transaction.Status.PENDING || tx.getProvider() != Transaction.Provider.LOCAL) {
            throw new IllegalStateException("Invalid transaction state");
        }

        tx.setStatus(Transaction.Status.SUCCESS);
        if (idemKey != null && !idemKey.isBlank()) {
            tx.setIdempotencyKey(idemKey);
        }
        transactionRepository.save(tx);

        walletService.creditTopUpLocal(tx.getUserId(), tx.getAmount(), tx.getCurrency(), tx.getProviderRef(), admin.getId());
        return ResponseEntity.ok(Map.of("ok", true));
    }
}