package com.sabahub.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Transfer;
import com.stripe.model.Account;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.exception.StripeException;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.TransferCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class PaymentService {

    private static final Set<String> ZERO_DECIMAL_CURRENCIES = Set.of(
            "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
            "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
    );

    private final ObjectMapper mapper;
    private final String chapaWebhookSecret;
    private final String chapaSecretKey;
    private final String chapaPublicKey;
    private final String chapaBaseUrl;
    private final String chapaCallbackUrl;
    private final String chapaReturnUrl;
    private final String chapaDefaultCurrency;
    private final String stripeWebhookSecret;
    private final String stripeReturnUrl;
    private final String stripeCancelUrl;
    private final String appPublicUrl;
    private final HttpClient httpClient;
    
    @Value("${stripe.api.key:}")
    private String stripeApiKey;
    
    @Value("${stripe.platform.account.id:}")
    private String platformAccountId;

    public PaymentService(@Value("${chapa.webhook.secret:}") String chapaWebhookSecret,
                          @Value("${chapa.secret.key:}") String chapaSecretKey,
                          @Value("${chapa.public.key:}") String chapaPublicKey,
                          @Value("${chapa.base.url:https://api.chapa.co/v1}") String chapaBaseUrl,
                          @Value("${chapa.callback.url:}") String chapaCallbackUrl,
                          @Value("${chapa.return.url:}") String chapaReturnUrl,
                          @Value("${chapa.default.currency:ETB}") String chapaDefaultCurrency,
                          @Value("${stripe.webhook.secret:}") String stripeWebhookSecret,
                          @Value("${stripe.return.url:}") String stripeReturnUrl,
                          @Value("${stripe.cancel.url:}") String stripeCancelUrl,
                          @Value("${app.public-url:http://localhost:3000}") String appPublicUrl) {
        this.mapper = JsonMapper.builder()
            .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
            .build();
        this.chapaWebhookSecret = chapaWebhookSecret;
        this.chapaSecretKey = chapaSecretKey;
        this.chapaPublicKey = chapaPublicKey;
        this.chapaBaseUrl = chapaBaseUrl;
        this.chapaCallbackUrl = chapaCallbackUrl;
        this.chapaReturnUrl = chapaReturnUrl;
        this.chapaDefaultCurrency = chapaDefaultCurrency;
        this.stripeWebhookSecret = stripeWebhookSecret;
        this.stripeReturnUrl = stripeReturnUrl;
        this.stripeCancelUrl = stripeCancelUrl;
        this.appPublicUrl = appPublicUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    /**
     * Initialize Stripe with API key from environment
     */
    @PostConstruct
    private void initializeStripe() {
        if (stripeApiKey != null && !stripeApiKey.isBlank()) {
            Stripe.apiKey = stripeApiKey;
        }
    }

    public Map<String, Object> initializeStripeCheckoutSession(String sessionReference,
                                                               BigDecimal amount,
                                                               String currency,
                                                               String email,
                                                               String fullName,
                                                               String transactionId) {
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new IllegalStateException("STRIPE_API_KEY is not configured");
        }

        String normalizedCurrency = normalizeCurrency(currency, "USD");
        String successUrl = resolveStripeSuccessUrl(transactionId);
        String cancelUrl = resolveStripeCancelUrl(transactionId);
        long unitAmount = toMinorUnits(amount, normalizedCurrency);

        try {
            SessionCreateParams.LineItem.PriceData.ProductData productData =
                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName("SabaHub Wallet Funding")
                            .setDescription("Secure hosted checkout for wallet funding")
                            .build();

            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl + "&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(cancelUrl)
                    .putMetadata("transactionId", transactionId)
                    .putMetadata("sessionReference", sessionReference)
                    .putMetadata("customerName", fullName == null ? "" : fullName.trim())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency(normalizedCurrency.toLowerCase())
                                                    .setUnitAmount(unitAmount)
                                                    .setProductData(productData)
                                                    .build()
                                    )
                                    .build()
                    );

            if (email != null && !email.isBlank()) {
                paramsBuilder.setCustomerEmail(email.trim());
            }

            SessionCreateParams params = paramsBuilder.build();

            Session session = Session.create(params);
            if (session.getUrl() == null || session.getUrl().isBlank()) {
                throw new IllegalStateException("Stripe checkout session did not include a hosted URL");
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("providerRef", session.getId());
            result.put("checkoutUrl", session.getUrl());
            result.put("status", session.getStatus());
            result.put("paymentStatus", session.getPaymentStatus());
            return result;
        } catch (StripeException e) {
            throw new IllegalStateException("Unable to initialize Stripe checkout: " + e.getMessage(), e);
        }
    }

    public Event constructStripeEvent(String payload, String signatureHeader) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
            throw new IllegalStateException("STRIPE_WEBHOOK_SECRET is not configured");
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new IllegalArgumentException("Missing Stripe-Signature header");
        }
        try {
            return Webhook.constructEvent(payload, signatureHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            throw new IllegalArgumentException("Invalid Stripe signature", e);
        }
    }

    public Map<String, Object> inspectStripeCheckoutSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("Stripe session id is required");
        }
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new IllegalStateException("STRIPE_API_KEY is not configured");
        }
        try {
            Session session = Session.retrieve(sessionId.trim());
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("providerRef", session.getId());
            result.put("status", session.getStatus());
            result.put("paymentStatus", session.getPaymentStatus());
            result.put("amountTotal", session.getAmountTotal());
            result.put("currency", session.getCurrency());
            result.put("metadata", session.getMetadata());
            result.put("paid", "paid".equalsIgnoreCase(session.getPaymentStatus()));
            return result;
        } catch (StripeException e) {
            throw new IllegalStateException("Unable to inspect Stripe checkout session: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> initializeChapaPayment(String txRef,
                                                      BigDecimal amount,
                                                      String currency,
                                                      String email,
                                                      String fullName,
                                                      String transactionId) {
        if (chapaSecretKey == null || chapaSecretKey.isBlank()) {
            throw new IllegalStateException("CHAPA_SECRET_KEY is not configured");
        }

        String normalizedCurrency = (currency == null || currency.isBlank()) ? chapaDefaultCurrency : currency.trim().toUpperCase();
        String amountAsString = amount.stripTrailingZeros().toPlainString();
        String safeEmail = (email == null || email.isBlank()) ? "payments@sabahub.local" : email.trim();
        String firstName = extractFirstName(fullName);
        String lastName = extractLastName(fullName);

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("amount", amountAsString);
        requestPayload.put("currency", normalizedCurrency);
        requestPayload.put("email", safeEmail);
        requestPayload.put("first_name", firstName);
        requestPayload.put("last_name", lastName);
        requestPayload.put("tx_ref", txRef);
        String callbackUrl = resolveChapaCallbackUrl();
        String returnUrl = resolveChapaReturnUrl(transactionId, txRef);
        if (callbackUrl != null && !callbackUrl.isBlank()) {
            requestPayload.put("callback_url", callbackUrl);
        }
        if (returnUrl != null && !returnUrl.isBlank()) {
            requestPayload.put("return_url", returnUrl);
        }
        requestPayload.put("customization", Map.of(
                "title", "SabaHub Top-up",
                "description", "Add funds to your SabaHub wallet"
        ));
        requestPayload.put("meta", Map.of("transactionId", transactionId));

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl(chapaBaseUrl) + "/transaction/initialize"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + chapaSecretKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(requestPayload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Chapa initialize failed. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new IllegalStateException("Chapa initialize failed with HTTP " + response.statusCode());
            }

            Map<String, Object> parsed = mapper.readValue(response.body(), Map.class);
            Map<String, Object> data = asMap(parsed.get("data"));
            String checkoutUrl = asString(data.get("checkout_url"));
            String providerRef = asString(data.get("tx_ref"));

            if (providerRef == null || providerRef.isBlank()) {
                providerRef = txRef;
            }
            if (checkoutUrl == null || checkoutUrl.isBlank()) {
                throw new IllegalStateException("Chapa response did not include checkout_url");
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("providerRef", providerRef);
            result.put("checkoutUrl", checkoutUrl);
            result.put("chapaResponse", parsed);
            return result;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to initialize Chapa payment: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> verifyChapaTransaction(String txRef) {
        if (txRef == null || txRef.isBlank()) {
            return Map.of("verified", false, "providerRef", "");
        }
        if (chapaSecretKey == null || chapaSecretKey.isBlank()) {
            throw new IllegalStateException("CHAPA_SECRET_KEY is not configured");
        }

        try {
            String encodedTxRef = java.net.URLEncoder.encode(txRef.trim(), StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl(chapaBaseUrl) + "/transaction/verify/" + encodedTxRef))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + chapaSecretKey.trim())
                    .header("Content-Type", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return Map.of(
                        "verified", false,
                        "providerRef", txRef.trim(),
                        "httpStatus", response.statusCode()
                );
            }

            Map<String, Object> parsed = mapper.readValue(response.body(), Map.class);
            String status = asString(parsed.get("status"));
            Map<String, Object> data = asMap(parsed.get("data"));
            String txStatus = asString(data.get("status"));
            boolean verified = "success".equalsIgnoreCase(status) && "success".equalsIgnoreCase(txStatus);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("verified", verified);
            result.put("providerRef", txRef.trim());
            result.put("status", status);
            result.put("transactionStatus", txStatus);
            result.put("currency", asString(data.get("currency")));
            result.put("amount", data.get("amount"));
            result.put("payload", parsed);
            return result;
        } catch (Exception e) {
            return Map.of(
                    "verified", false,
                    "providerRef", txRef.trim(),
                    "error", e.getMessage()
            );
        }
    }

    public boolean isChapaTransactionSuccessful(String txRef) {
        Object verified = verifyChapaTransaction(txRef).get("verified");
        return Boolean.TRUE.equals(verified);
    }

    public boolean verifyChapaSignature(Map<String, Object> payload, String signatureHeader) {
        if (chapaWebhookSecret == null || chapaWebhookSecret.isBlank()) {
            return false; // fail-closed if secret not configured
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            String body = mapper.writeValueAsString(payload);
            String computed = hmacSha256Hex(body, chapaWebhookSecret);
            return constantTimeEquals(computed, signatureHeader);
        } catch (Exception e) {
            return false;
        }
    }

    private String hmacSha256Hex(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] h = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(h.length * 2);
        for (byte b : h) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    private static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://api.chapa.co/v1";
        }
        String trimmed = baseUrl.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String resolveStripeSuccessUrl(String transactionId) {
        String base = normalizePublicUrl(stripeReturnUrl, "/payments/complete");
        String separator = base.contains("?") ? "&" : "?";
        return base + separator + "provider=stripe&transactionId=" + encode(transactionId);
    }

    private String resolveStripeCancelUrl(String transactionId) {
        String configured = stripeCancelUrl;
        if (configured != null && !configured.isBlank()) {
            return configured.trim();
        }
        String base = normalizePublicUrl(null, "/jobs/wallet");
        String separator = base.contains("?") ? "&" : "?";
        return base + separator + "funding=stripe-cancelled&transactionId=" + encode(transactionId);
    }

    private String resolveChapaCallbackUrl() {
        return chapaCallbackUrl == null || chapaCallbackUrl.isBlank() ? null : chapaCallbackUrl.trim();
    }

    private String resolveChapaReturnUrl(String transactionId, String providerRef) {
        String base = normalizePublicUrl(chapaReturnUrl, "/payments/complete");
        String separator = base.contains("?") ? "&" : "?";
        return base + separator +
                "provider=chapa&transactionId=" + encode(transactionId) +
                "&providerRef=" + encode(providerRef);
    }

    private String normalizePublicUrl(String configuredUrl, String defaultPath) {
        if (configuredUrl != null && !configuredUrl.isBlank()) {
            return configuredUrl.trim();
        }
        String base = appPublicUrl == null || appPublicUrl.isBlank() ? "http://localhost:3000" : appPublicUrl.trim();
        String normalizedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        if (defaultPath.startsWith("/")) {
            return normalizedBase + defaultPath;
        }
        return normalizedBase + "/" + defaultPath;
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String normalizeCurrency(String currency, String fallback) {
        if (currency == null || currency.isBlank()) {
            return fallback;
        }
        return currency.trim().toUpperCase();
    }

    private long toMinorUnits(BigDecimal amount, String currency) {
        int scale = ZERO_DECIMAL_CURRENCIES.contains(currency.toUpperCase()) ? 0 : 2;
        return amount.movePointRight(scale).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static String asString(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private static String extractFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "SabaHub";
        }
        String[] parts = fullName.trim().split("\\s+");
        return parts.length == 0 ? "SabaHub" : parts[0];
    }

    private static String extractLastName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "User";
        }
        String[] parts = fullName.trim().split("\\s+");
        return parts.length < 2 ? "User" : parts[parts.length - 1];
    }
    
    // ==================== STRIPE ESCROW & PAYMENT METHODS ====================
    
    /**
     * Release escrow payment from employer to freelancer (transfer)
     */
    public String releaseEscrowPayment(
        String freelancerConnectedAccountId,
        BigDecimal amount,
        String currency,
        String contractId
    ) {
        if (stripeApiKey == null || stripeApiKey.isBlank()) {
            throw new RuntimeException("Stripe API key not configured");
        }
        
        try {
            // Create transfer to freelancer's connected account
            TransferCreateParams params = TransferCreateParams.builder()
                .setAmount(amount.multiply(new BigDecimal(100)).longValue()) // Amount in cents
                .setCurrency(currency.toLowerCase())
                .setDestination(freelancerConnectedAccountId)
                .putMetadata("contract_id", contractId)
                .putMetadata("type", "milestone_payment")
                .setDescription("Milestone payment for contract: " + contractId)
                .build();
            
            Transfer transfer = Transfer.create(params);
            return transfer.getId();
        } catch (StripeException e) {
            throw new RuntimeException("Failed to release payment: " + e.getMessage());
        }
    }
    
    /**
     * Create a connected account for a freelancer (for receiving payments)
     */
    public String createConnectedAccount(String email, String firstName, String lastName) {
        try {
            Map<String, Object> accountParams = new HashMap<>();
            accountParams.put("type", "express");
            accountParams.put("country", "US");
            accountParams.put("email", email);
            
            Map<String, Object> individual = new HashMap<>();
            individual.put("first_name", firstName);
            individual.put("last_name", lastName);
            accountParams.put("individual", individual);
            
            Account account = Account.create(accountParams);
            return account.getId();
        } catch (StripeException e) {
            throw new RuntimeException("Failed to create connected account: " + e.getMessage());
        }
    }
    
    /**
     * Verify if a freelancer has completed Stripe onboarding
     */
    public boolean isFreelancerVerified(String connectedAccountId) {
        try {
            Account account = Account.retrieve(connectedAccountId);
            return account.getChargesEnabled() && account.getPayoutsEnabled();
        } catch (StripeException e) {
            return false;
        }
    }
    
    /**
     * Calculate application fee (platform commission)
     * Default: 10% commission on all payments
     */
    public BigDecimal calculateApplicationFee(BigDecimal contractAmount, double feePercentage) {
        return contractAmount.multiply(new BigDecimal(feePercentage / 100.0));
    }
}
