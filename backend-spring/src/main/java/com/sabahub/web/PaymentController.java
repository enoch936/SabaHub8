package com.sabahub.web;

import com.sabahub.domain.Transaction;
import com.sabahub.domain.User;
import com.sabahub.domain.WalletLedgerEntry;
import com.sabahub.domain.Withdrawal;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.repository.WithdrawalRepository;
import com.sabahub.service.AuditService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.PaymentService;
import com.sabahub.service.WalletService;
import com.sabahub.service.WalletCurrencyService;
import com.sabahub.service.RateLimiter;
import com.sabahub.config.RateLimitProperties;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
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
    private final WithdrawalRepository withdrawalRepository;
    private final AuditService auditService;
    private final WalletCurrencyService walletCurrencyService;

    public PaymentController(WalletService walletService,
                             PaymentService paymentService,
                             CurrentUserService currentUserService,
                             TransactionRepository transactionRepository,
                             WithdrawalRepository withdrawalRepository,
                             AuditService auditService,
                             WalletCurrencyService walletCurrencyService,
                             RateLimiter rateLimiter,
                             RateLimitProperties rateLimitProperties) {
        this.walletService = walletService;
        this.paymentService = paymentService;
        this.currentUserService = currentUserService;
        this.transactionRepository = transactionRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.auditService = auditService;
        this.walletCurrencyService = walletCurrencyService;
        this.rateLimiter = rateLimiter;
        this.rateLimitProperties = rateLimitProperties;
    }

    @PostMapping("/payments/stripe/init")
    public ResponseEntity<Map<String, Object>> initStripe(
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        int limit = rateLimitProperties.getChapaInitPerMinute();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        if (!rateLimiter.allow("stripe:init:" + me.getId(), limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }

        double amount = readAmount(body.get("amount"));
        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "amount_must_be_greater_than_zero"));
        }
        final String currency;
        try {
            currency = normalizeCurrency(valueAsText(body.get("currency")), WalletCurrencyService.USD);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }

        if (idemKey != null && !idemKey.isBlank()) {
            var existing = transactionRepository.findByUserIdAndIdempotencyKey(me.getId(), idemKey);
            if (existing.isPresent()) {
                var tx0 = existing.get();
                Object checkoutUrl = tx0.getMetadata() == null ? null : tx0.getMetadata().get("checkoutUrl");
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("transactionId", tx0.getId());
                response.put("providerRef", tx0.getProviderRef());
                response.put("checkoutUrl", checkoutUrl);
                response.put("idempotent", true);
                return ResponseEntity.ok(response);
            }
        }

        Transaction tx = new Transaction();
        tx.setUserId(me.getId());
        tx.setProvider(Transaction.Provider.STRIPE);
        tx.setDirection(Transaction.Direction.IN);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setStatus(Transaction.Status.PENDING);
        tx.setMetadata(Map.of("init", true, "provider", "STRIPE"));
        tx.setIdempotencyKey(idemKey);
        transactionRepository.save(tx);

        String sessionReference = "sbh_str_" + tx.getId();
        try {
            Map<String, Object> stripe = paymentService.initializeStripeCheckoutSession(
                    sessionReference,
                    java.math.BigDecimal.valueOf(amount),
                    currency,
                    me.getEmail(),
                    me.getFullName(),
                    tx.getId()
            );

            tx.setProviderRef(valueAsText(stripe.get("providerRef")));
            tx.setMetadata(Map.of(
                    "init", true,
                    "provider", "STRIPE",
                    "checkoutUrl", valueAsText(stripe.get("checkoutUrl")),
                    "paymentStatus", valueAsText(stripe.get("paymentStatus"))
            ));
            transactionRepository.save(tx);

            return ResponseEntity.ok(Map.of(
                    "transactionId", tx.getId(),
                    "providerRef", tx.getProviderRef(),
                    "checkoutUrl", valueAsText(stripe.get("checkoutUrl"))
            ));
        } catch (IllegalStateException e) {
            tx.setStatus(Transaction.Status.FAILED);
            tx.setMetadata(Map.of("init", true, "provider", "STRIPE", "error", e.getMessage()));
            transactionRepository.save(tx);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "error", "stripe_initialize_failed",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Initialize a real Chapa payment and return checkout details.
     */
    @PostMapping("/payments/chapa/init")
    public ResponseEntity<Map<String, Object>> initChapa(
            @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
            @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        int limit = rateLimitProperties.getChapaInitPerMinute();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        if (!rateLimiter.allow("chapa:init:" + me.getId(), limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }
        double amount = ((Number) body.getOrDefault("amount", 0)).doubleValue();
        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "amount_must_be_greater_than_zero"));
        }
        final String currency;
        try {
            currency = normalizeCurrency(valueAsText(body.get("currency")), WalletCurrencyService.ETB);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }

        if (idemKey != null && !idemKey.isBlank()) {
            var existing = transactionRepository.findByUserIdAndIdempotencyKey(me.getId(), idemKey);
            if (existing.isPresent()) {
                var tx0 = existing.get();
                Object checkoutUrl = tx0.getMetadata() == null ? null : tx0.getMetadata().get("checkoutUrl");
                Object providerRef = tx0.getProviderRef();
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("transactionId", tx0.getId());
                response.put("idempotent", true);
                if (providerRef != null) {
                    response.put("providerRef", providerRef);
                }
                if (checkoutUrl != null) {
                    response.put("checkoutUrl", checkoutUrl);
                }
                return ResponseEntity.ok(response);
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

        String txRef = "sbh_" + tx.getId();
        try {
            Map<String, Object> chapa = paymentService.initializeChapaPayment(
                txRef,
                java.math.BigDecimal.valueOf(amount),
                currency,
                me.getEmail(),
                me.getFullName(),
                tx.getId()
            );
            String providerRef = String.valueOf(chapa.getOrDefault("providerRef", txRef));
            String checkoutUrl = String.valueOf(chapa.getOrDefault("checkoutUrl", ""));

            tx.setProviderRef(providerRef);
            tx.setMetadata(Map.of(
                "init", true,
                "checkoutUrl", checkoutUrl
            ));
            transactionRepository.save(tx);

            return ResponseEntity.ok(Map.of(
                "transactionId", tx.getId(),
                "providerRef", providerRef,
                "checkoutUrl", checkoutUrl
            ));
        } catch (IllegalStateException e) {
            tx.setStatus(Transaction.Status.FAILED);
            tx.setMetadata(Map.of(
                "init", true,
                "error", e.getMessage()
            ));
            transactionRepository.save(tx);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                "error", "chapa_initialize_failed",
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/payments/stripe/finalize")
    public ResponseEntity<Map<String, Object>> finalizeStripe(@RequestBody Map<String, Object> body) {
        try {
            User me = currentUserService.requireUser();
            Transaction tx = resolveOwnedFundingTransaction(me, Transaction.Provider.STRIPE, body);
            if (tx.getStatus() == Transaction.Status.SUCCESS) {
                return ResponseEntity.ok(Map.of(
                        "ok", true,
                        "transactionId", tx.getId(),
                        "providerRef", tx.getProviderRef(),
                        "status", tx.getStatus().name(),
                        "idempotent", true
                ));
            }

            Map<String, Object> inspection = paymentService.inspectStripeCheckoutSession(tx.getProviderRef());
            if (!Boolean.TRUE.equals(inspection.get("paid"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "stripe_payment_not_completed",
                        "providerRef", tx.getProviderRef(),
                        "paymentStatus", inspection.get("paymentStatus")
                ));
            }

            double amount = tx.getAmount() == null ? 0.0 : tx.getAmount();
            String currency = tx.getCurrency();
            Map<String, Object> result = settleInboundFundingTransaction(tx, amount, currency, inspection);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            if ("forbidden".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/payments/chapa/finalize")
    public ResponseEntity<Map<String, Object>> finalizeChapa(@RequestBody Map<String, Object> body) {
        try {
            User me = currentUserService.requireUser();
            Transaction tx = resolveOwnedFundingTransaction(me, Transaction.Provider.CHAPA, body);
            if (tx.getStatus() == Transaction.Status.SUCCESS) {
                return ResponseEntity.ok(Map.of(
                        "ok", true,
                        "transactionId", tx.getId(),
                        "providerRef", tx.getProviderRef(),
                        "status", tx.getStatus().name(),
                        "idempotent", true
                ));
            }

            Map<String, Object> verification = paymentService.verifyChapaTransaction(tx.getProviderRef());
            if (!Boolean.TRUE.equals(verification.get("verified"))) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "chapa_payment_not_completed",
                        "providerRef", tx.getProviderRef()
                ));
            }

            double amount = firstPositiveNumber(
                    tx.getAmount(),
                    readAmount(verification.get("amount"))
            );
            String currency = normalizeCurrency(
                    valueAsText(verification.get("currency")),
                    tx.getCurrency() == null ? "ETB" : tx.getCurrency()
            );
            Map<String, Object> result = settleInboundFundingTransaction(tx, amount, currency, verification);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            if ("forbidden".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }
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
        Map<String, Object> data = payload.get("data") instanceof Map<?, ?>
            ? (Map<String, Object>) payload.get("data")
            : Map.of();

        String providerRef = firstNonBlank(
            valueAsText(payload.get("providerRef")),
            valueAsText(payload.get("tx_ref")),
            valueAsText(data.get("tx_ref"))
        );
        if (providerRef == null || providerRef.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "missing_tx_ref"));
        }

        Map<String, Object> verification = paymentService.verifyChapaTransaction(providerRef);
        if (!Boolean.TRUE.equals(verification.get("verified"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "transaction_not_successful"));
        }

        var existing = transactionRepository.findByProviderAndProviderRef(Transaction.Provider.CHAPA, providerRef)
                .or(() -> (idemKey != null && !idemKey.isBlank()) ? transactionRepository.findByIdempotencyKey(idemKey) : java.util.Optional.empty());
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "transaction_not_initialized"));
        }
        Transaction tx = existing.get();
        if (tx.getUserId() == null || tx.getUserId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "transaction_user_not_found"));
        }

        double amount = firstPositiveNumber(
                tx.getAmount(),
                readAmount(payload.get("amount")),
                readAmount(data.get("amount")),
                readAmount(verification.get("amount"))
        );
        final String currency;
        try {
            currency = normalizeCurrency(
                    firstNonBlank(
                            valueAsText(payload.get("currency")),
                            valueAsText(data.get("currency")),
                            valueAsText(verification.get("currency"))
                    ),
                    tx.getCurrency() == null ? WalletCurrencyService.ETB : tx.getCurrency()
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }

        Map<String, Object> result = settleInboundFundingTransaction(tx, amount, currency, payload);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payments/stripe/webhook")
    public ResponseEntity<Map<String, Object>> stripeWebhook(
            @RequestHeader(name = "Stripe-Signature", required = false) String signature,
            @RequestBody String payload,
            HttpServletRequest request) {
        int limit = rateLimitProperties.getWebhookPerMinutePerIp();
        int windowSeconds = rateLimitProperties.getWindowSeconds();
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
        if (!rateLimiter.allow("stripe:webhook:" + ip, limit, windowSeconds)) {
            return ResponseEntity.status(429).body(Map.of("error", "rate_limited"));
        }

        final Event event;
        try {
            event = paymentService.constructStripeEvent(payload, signature);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid_signature"));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", ex.getMessage()));
        }

        if (!"checkout.session.completed".equals(event.getType())
                && !"checkout.session.async_payment_succeeded".equals(event.getType())) {
            return ResponseEntity.ok(Map.of("received", true, "ignored", true));
        }

        StripeObject stripeObject = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(stripeObject instanceof Session session)) {
            return ResponseEntity.ok(Map.of("received", true, "ignored", true));
        }

        String providerRef = session.getId();
        Transaction tx = transactionRepository.findByProviderAndProviderRef(Transaction.Provider.STRIPE, providerRef)
                .orElse(null);
        if (tx == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "transaction_not_initialized"));
        }
        if (tx.getUserId() == null || tx.getUserId().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "transaction_user_not_found"));
        }

        Map<String, Object> inspection = paymentService.inspectStripeCheckoutSession(providerRef);
        if (!Boolean.TRUE.equals(inspection.get("paid"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "stripe_payment_not_completed"));
        }

        double amount = firstPositiveNumber(tx.getAmount());
        final String currency;
        try {
            currency = normalizeCurrency(
                    valueAsText(inspection.get("currency")),
                    tx.getCurrency() == null ? WalletCurrencyService.USD : tx.getCurrency()
            );
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        Map<String, Object> result = settleInboundFundingTransaction(tx, amount, currency, inspection);
        return ResponseEntity.ok(result);
    }

    private static double toDouble(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException ignored) {
            return 0.0;
        }
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

        final String currency;
        try {
            currency = normalizeCurrency(valueAsText(body.get("currency")), WalletCurrencyService.ETB);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
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

        final String currency;
        try {
            currency = normalizeCurrency(valueAsText(body.get("currency")), WalletCurrencyService.ETB);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        Object noteRaw = body.getOrDefault("note", "");
        String note = noteRaw == null ? "" : noteRaw.toString().trim();
        boolean adminReviewRequired = Boolean.TRUE.equals(body.get("adminReviewRequired"));
        Object amountValue = body.getOrDefault("amount", 0);
        double amount = amountValue instanceof Number ? ((Number) amountValue).doubleValue() : 0.0;

        try {
            Map<String, Object> result = walletService.transferToUser(recipient, amount, currency, note, idemKey, adminReviewRequired);
            String status = result.get("status") == null ? null : result.get("status").toString();
            HttpStatus responseStatus = "PENDING".equalsIgnoreCase(status) ? HttpStatus.ACCEPTED : HttpStatus.CREATED;
            return ResponseEntity.status(responseStatus).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/payments/internal/pending")
    public ResponseEntity<?> listPendingInternalTransfers(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        requireFinanceAdmin();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
        var pending = transactionRepository.findByProviderAndStatusOrderByCreatedAtDesc(
                Transaction.Provider.INTERNAL,
                Transaction.Status.PENDING,
                pageable
        );
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/admin/payments/internal/{id}/review")
    public ResponseEntity<?> reviewPendingInternalTransfer(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {
        User admin = requireFinanceAdmin();
        boolean approved = body == null || body.get("approved") == null || Boolean.TRUE.equals(body.get("approved"));
        String note = body != null && body.get("note") instanceof String text ? text.trim() : "";
        try {
            Map<String, Object> result = walletService.reviewInternalTransfer(id, approved, admin.getId(), note);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * List pending local/manual top-up requests for admin review.
     */
    @GetMapping("/admin/payments/local/pending")
    public ResponseEntity<?> listPendingLocalTopups(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        requireFinanceAdmin();

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "createdAt"));
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
        User admin = requireFinanceAdmin();
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

    @GetMapping("/admin/withdrawals")
    public ResponseEntity<?> listAdminWithdrawals(
            @RequestParam(name = "status", defaultValue = "PENDING,PROCESSING") String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        requireFinanceAdmin();

        List<String> requestedStatuses = Arrays.stream(status.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(String::toUpperCase)
                .distinct()
                .toList();

        List<Withdrawal.Status> enumStatuses;
        try {
            enumStatuses = requestedStatuses.stream()
                    .map(Withdrawal.Status::valueOf)
                    .toList();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_withdrawal_status"));
        }

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Order.desc("requestedAt"), Sort.Order.desc("createdAt"))
        );

        var withdrawals = withdrawalRepository.findForAdminReview(enumStatuses, requestedStatuses, pageable);
        return ResponseEntity.ok(withdrawals);
    }

    @PatchMapping("/admin/withdrawals/{id}")
    public ResponseEntity<?> adminUpdateWithdrawal(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        User admin = requireFinanceAdmin();
        Withdrawal withdrawal = withdrawalRepository.findById(id).orElseThrow();

        Object statusRaw = body.get("status");
        if (!(statusRaw instanceof String statusText) || statusText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status_required"));
        }

        final Withdrawal.Status nextStatus;
        try {
            nextStatus = Withdrawal.Status.valueOf(statusText.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid_withdrawal_status"));
        }

        String note = body.get("note") instanceof String text ? text.trim() : "";
        LocalDateTime now = LocalDateTime.now();

        withdrawal.setStatusEnum(nextStatus);
        withdrawal.setStatus(nextStatus.name());
        withdrawal.setUpdatedAt(now);

        if (!note.isBlank()) {
            withdrawal.setNotes(note);
        }

        switch (nextStatus) {
            case PROCESSING -> {
                if (withdrawal.getProcessedAt() == null) {
                    withdrawal.setProcessedAt(now);
                }
                withdrawal.setFailureReason(null);
            }
            case COMPLETED -> {
                if (withdrawal.getProcessedAt() == null) {
                    withdrawal.setProcessedAt(now);
                }
                withdrawal.setCompletedAt(now);
                withdrawal.setFailureReason(null);
            }
            case FAILED, CANCELLED -> {
                if (withdrawal.getProcessedAt() == null) {
                    withdrawal.setProcessedAt(now);
                }
                if (!note.isBlank()) {
                    withdrawal.setFailureReason(note);
                }
            }
            case PENDING -> {
                withdrawal.setProcessedAt(null);
                withdrawal.setCompletedAt(null);
                if (note.isBlank()) {
                    withdrawal.setFailureReason(null);
                }
            }
        }

        if ((withdrawal.getSettledLedgerEntryId() != null && !withdrawal.getSettledLedgerEntryId().isBlank())
                && nextStatus != Withdrawal.Status.COMPLETED) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "withdrawal_already_settled"));
        }

        Transaction linkedTransaction = transactionRepository.findById(withdrawal.getId()).orElse(null);
        if (linkedTransaction != null) {
            Map<String, Object> txMetadata = linkedTransaction.getMetadata() == null
                    ? new LinkedHashMap<>()
                    : new LinkedHashMap<>(linkedTransaction.getMetadata());
            txMetadata.put("adminReviewStatus", nextStatus.name());
            txMetadata.put("reviewedByAdminId", admin.getId());
            txMetadata.put("reviewedAt", now.toString());
            if (!note.isBlank()) {
                txMetadata.put("reviewNote", note);
            }
            linkedTransaction.setMetadata(txMetadata);
            switch (nextStatus) {
                case COMPLETED -> linkedTransaction.setStatus(Transaction.Status.SUCCESS);
                case FAILED -> linkedTransaction.setStatus(Transaction.Status.FAILED);
                case CANCELLED -> linkedTransaction.setStatus(Transaction.Status.CANCELLED);
                default -> linkedTransaction.setStatus(Transaction.Status.PENDING);
            }
        }

        if (nextStatus == Withdrawal.Status.COMPLETED) {
            try {
                WalletLedgerEntry ledgerEntry = walletService.settleCompletedWithdrawal(withdrawal, admin.getId(), note);
                if (linkedTransaction != null) {
                    Map<String, Object> txMetadata = linkedTransaction.getMetadata() == null
                            ? new LinkedHashMap<>()
                            : new LinkedHashMap<>(linkedTransaction.getMetadata());
                    txMetadata.put("settlementReference", withdrawal.getSettlementReference());
                    txMetadata.put("settledLedgerEntryId", ledgerEntry.getId());
                    linkedTransaction.setMetadata(txMetadata);
                }
            } catch (IllegalStateException ex) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
            }
        }

        Withdrawal saved = withdrawalRepository.save(withdrawal);
        if (linkedTransaction != null) {
            transactionRepository.save(linkedTransaction);
        }
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actorUserId", admin.getId());
        metadata.put("status", saved.getStatus());
        metadata.put("userId", saved.getUserId());
        metadata.put("freelancerId", saved.getFreelancerId());
        metadata.put("note", note);
        auditService.log("ADMIN_WITHDRAWAL_UPDATED", "WITHDRAWAL", saved.getId(), metadata);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/admin/payments/transactions")
    public ResponseEntity<?> listAdminTransactions(
            @RequestParam(name = "provider", required = false) String provider,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "direction", required = false) String direction,
            @RequestParam(name = "userId", required = false) String userId,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        requireFinanceAdmin();

        String providerFilter = provider == null ? "" : provider.trim().toUpperCase();
        String statusFilter = status == null ? "" : status.trim().toUpperCase();
        String directionFilter = direction == null ? "" : direction.trim().toUpperCase();
        String userIdFilter = userId == null ? "" : userId.trim();
        String queryFilter = query == null ? "" : query.trim().toLowerCase();

        List<Transaction> filtered = transactionRepository.findAll().stream()
                .filter(tx -> providerFilter.isBlank() || (tx.getProvider() != null && tx.getProvider().name().equalsIgnoreCase(providerFilter)))
                .filter(tx -> statusFilter.isBlank() || (tx.getStatus() != null && tx.getStatus().name().equalsIgnoreCase(statusFilter)))
                .filter(tx -> directionFilter.isBlank() || (tx.getDirection() != null && tx.getDirection().name().equalsIgnoreCase(directionFilter)))
                .filter(tx -> userIdFilter.isBlank() || (tx.getUserId() != null && tx.getUserId().equalsIgnoreCase(userIdFilter)))
                .filter(tx -> {
                    if (queryFilter.isBlank()) {
                        return true;
                    }
                    String providerRef = tx.getProviderRef() == null ? "" : tx.getProviderRef();
                    String txUserId = tx.getUserId() == null ? "" : tx.getUserId();
                    return providerRef.toLowerCase().contains(queryFilter)
                            || txUserId.toLowerCase().contains(queryFilter)
                            || (tx.getId() != null && tx.getId().toLowerCase().contains(queryFilter));
                })
                .sorted(Comparator.comparing(Transaction::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, filtered.size());
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<Map<String, Object>> content = fromIndex >= toIndex
            ? new ArrayList<>()
            : filtered.subList(fromIndex, toIndex).stream().map(this::toAdminTransactionView).toList();
        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", filtered.size());
        response.put("totalPages", totalPages);
        response.put("number", safePage);
        response.put("size", safeSize);
        response.put("generatedAt", Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    private Map<String, Object> toAdminTransactionView(Transaction tx) {
        Map<String, Object> metadata = tx.getMetadata() == null ? Map.of() : tx.getMetadata();
        String counterpartyUserId = valueAsText(metadata.get("counterpartyUserId"));
        String counterpartyEmail = valueAsText(metadata.get("counterpartyEmail"));
        String counterpartyName = valueAsText(metadata.get("counterpartyName"));

        String primaryUserId = valueAsText(tx.getUserId());
        String providerName = tx.getProvider() == null ? "PAYMENT" : tx.getProvider().name();
        String directionName = tx.getDirection() == null ? "" : tx.getDirection().name();

        String senderUserId;
        String receiverUserId;
        String senderLabel;
        String receiverLabel;

        if ("IN".equalsIgnoreCase(directionName)) {
            senderUserId = counterpartyUserId;
            receiverUserId = primaryUserId;
            senderLabel = firstNonBlank(counterpartyName, counterpartyEmail, counterpartyUserId, providerName + " source");
            receiverLabel = firstNonBlank(primaryUserId, "N/A");
        } else if ("OUT".equalsIgnoreCase(directionName)) {
            senderUserId = primaryUserId;
            receiverUserId = counterpartyUserId;
            senderLabel = firstNonBlank(primaryUserId, "N/A");
            receiverLabel = firstNonBlank(counterpartyName, counterpartyEmail, counterpartyUserId, providerName + " destination");
        } else {
            senderUserId = primaryUserId;
            receiverUserId = counterpartyUserId;
            senderLabel = firstNonBlank(primaryUserId, providerName + " source");
            receiverLabel = firstNonBlank(counterpartyName, counterpartyEmail, counterpartyUserId, providerName + " destination");
        }

        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", tx.getId());
        view.put("userId", tx.getUserId());
        view.put("provider", tx.getProvider());
        view.put("direction", tx.getDirection());
        view.put("status", tx.getStatus());
        view.put("amount", tx.getAmount());
        view.put("currency", tx.getCurrency());
        view.put("providerRef", tx.getProviderRef());
        view.put("metadata", tx.getMetadata());
        view.put("createdAt", tx.getCreatedAt());
        view.put("updatedAt", tx.getUpdatedAt());
        view.put("senderUserId", senderUserId);
        view.put("senderLabel", senderLabel);
        view.put("receiverUserId", receiverUserId);
        view.put("receiverLabel", receiverLabel);
        return view;
    }

    private String valueAsText(Object raw) {
        if (raw == null) {
            return "";
        }
        String value = raw.toString().trim();
        return value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private Transaction resolveOwnedFundingTransaction(User user,
                                                       Transaction.Provider provider,
                                                       Map<String, Object> body) {
        String transactionId = valueAsText(body.get("transactionId"));
        String providerRef = valueAsText(body.get("providerRef"));

        Transaction tx = null;
        if (!transactionId.isBlank()) {
            tx = transactionRepository.findById(transactionId).orElse(null);
        }
        if (tx == null && !providerRef.isBlank()) {
            tx = transactionRepository.findByProviderAndProviderRef(provider, providerRef).orElse(null);
        }
        if (tx == null) {
            throw new IllegalArgumentException("transaction_not_found");
        }
        if (tx.getProvider() != provider) {
            throw new IllegalArgumentException("invalid_transaction_provider");
        }
        if (!user.getId().equals(tx.getUserId())) {
            throw new IllegalStateException("forbidden");
        }
        return tx;
    }

    private Map<String, Object> settleInboundFundingTransaction(Transaction tx,
                                                                double amount,
                                                                String currency,
                                                                Map<String, Object> providerPayload) {
        if (tx.getUserId() == null || tx.getUserId().isBlank()) {
            throw new IllegalStateException("transaction_user_not_found");
        }
        if (amount <= 0) {
            amount = tx.getAmount() == null ? 0.0 : tx.getAmount();
        }
        if (amount <= 0) {
            throw new IllegalStateException("invalid_transaction_amount");
        }

        WalletLedgerEntry entry = switch (tx.getProvider()) {
            case STRIPE -> walletService.creditTopUpStripe(tx.getUserId(), amount, currency, tx.getProviderRef());
            case CHAPA -> walletService.creditTopUpChapa(tx.getUserId(), amount, currency, tx.getProviderRef());
            default -> throw new IllegalStateException("unsupported_funding_provider");
        };

        Map<String, Object> metadata = tx.getMetadata() == null ? new LinkedHashMap<>() : new LinkedHashMap<>(tx.getMetadata());
        metadata.put("providerPayload", providerPayload);
        metadata.put("finalizedAt", Instant.now().toString());
        metadata.put("ledgerEntryId", entry.getId());
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setStatus(Transaction.Status.SUCCESS);
        tx.setMetadata(metadata);
        transactionRepository.save(tx);

        return Map.of(
                "ok", true,
                "transactionId", tx.getId(),
                "providerRef", tx.getProviderRef(),
                "status", tx.getStatus().name(),
                "walletCredited", true,
                "ledgerEntryId", entry.getId()
        );
    }

    private double readAmount(Object raw) {
        if (raw instanceof Number number) {
            return number.doubleValue();
        }
        if (raw instanceof String value) {
            return toDouble(value.trim());
        }
        return 0.0;
    }

    private double firstPositiveNumber(Double... values) {
        for (Double value : values) {
            if (value != null && value > 0) {
                return value;
            }
        }
        return 0.0;
    }

    private String normalizeCurrency(String value, String fallback) {
        return walletCurrencyService.normalizeSupportedCurrency(value, fallback);
    }

    @PostMapping("/admin/wallet/adjust")
    public ResponseEntity<?> adminAdjustWallet(@RequestBody Map<String, Object> body) {
        User admin = requireFinanceAdmin();

        Object userIdRaw = body.get("userId");
        if (!(userIdRaw instanceof String userId) || userId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }

        Object amountRaw = body.get("amount");
        double amount = amountRaw instanceof Number number ? number.doubleValue() : 0.0;
        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "amount must be greater than 0"));
        }

        String action = body.get("action") instanceof String value ? value.trim().toUpperCase() : "COMMIT";
        if (!"COMMIT".equals(action) && !"ROLLBACK".equals(action)) {
            return ResponseEntity.badRequest().body(Map.of("error", "action must be COMMIT or ROLLBACK"));
        }

        final String currency;
        try {
            currency = normalizeCurrency(valueAsText(body.get("currency")), WalletCurrencyService.USD);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        String note = body.get("note") instanceof String value ? value.trim() : "";

        try {
            Map<String, Object> result = walletService.adminAdjustWallet(
                    userId.trim(),
                    amount,
                    currency,
                    action,
                    note,
                    admin.getId()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
        }
    }

    private User requireFinanceAdmin() {
        User me = currentUserService.requireUser();
        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN")
                || currentUserService.hasRole(me, "FINANCE_ADMIN");
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }
        return me;
    }
}
