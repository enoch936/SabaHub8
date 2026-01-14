package com.sabahub.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.Stripe;
import com.stripe.model.Transfer;
import com.stripe.model.Account;
import com.stripe.exception.StripeException;
import com.stripe.param.TransferCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    private final ObjectMapper mapper;
    private final String webhookSecret;
    
    @Value("${stripe.api.key:}")
    private String stripeApiKey;
    
    @Value("${stripe.platform.account.id:}")
    private String platformAccountId;

    public PaymentService(@Value("${chapa.webhook.secret:}") String webhookSecret) {
        this.mapper = new ObjectMapper();
        this.mapper.configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true);
        this.webhookSecret = webhookSecret;
        initializeStripe();
    }
    
    /**
     * Initialize Stripe with API key from environment
     */
    private void initializeStripe() {
        if (stripeApiKey != null && !stripeApiKey.isBlank()) {
            Stripe.apiKey = stripeApiKey;
        }
    }

    public boolean verifyChapaSignature(Map<String, Object> payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            return false; // fail-closed if secret not configured
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            String body = mapper.writeValueAsString(payload);
            String computed = hmacSha256Hex(body, webhookSecret);
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
