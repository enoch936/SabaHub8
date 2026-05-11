package com.sabahub.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@Service
public class PaymentEncryptionService {

    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final String ENCRYPTION_VERSION = "v1";

    private final ObjectMapper objectMapper;
    private final SecretKeySpec secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public PaymentEncryptionService(ObjectMapper objectMapper,
                                    @Value("${wallet.encryption.key:${app.jwt.secret}}") String secret) {
        this.objectMapper = objectMapper;
        this.secretKey = new SecretKeySpec(deriveKey(secret), "AES");
    }

    public String encryptMap(Map<String, String> payload) {
        try {
            return encrypt(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize payout details", e);
        }
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            return "enc:" + ENCRYPTION_VERSION + ":" +
                    Base64.getEncoder().encodeToString(iv) + ":" +
                    Base64.getEncoder().encodeToString(ciphertext);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt payout details", e);
        }
    }

    public String maskAccountNumber(String value) {
        if (value == null) {
            return "";
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return "";
        }
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }

    private byte[] deriveKey(String secret) {
        String normalized = secret == null ? "" : secret.trim();
        if (normalized.isEmpty()) {
            throw new IllegalStateException("wallet.encryption.key must be configured");
        }

        byte[] decoded = tryBase64Decode(normalized);
        if (decoded != null && (decoded.length == 16 || decoded.length == 24 || decoded.length == 32)) {
            return decoded;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(normalized.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to derive wallet encryption key", e);
        }
    }

    private byte[] tryBase64Decode(String value) {
        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
