package com.sabahub.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class PaymentService {

    private final ObjectMapper mapper;
    private final String webhookSecret;

    public PaymentService(@Value("${chapa.webhook.secret:}") String webhookSecret) {
        this.mapper = new ObjectMapper();
        this.mapper.configure(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY, true);
        this.webhookSecret = webhookSecret;
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
}