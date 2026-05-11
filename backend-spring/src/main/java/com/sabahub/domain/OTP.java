package com.sabahub.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

/**
 * OTP (One-Time Password) entity for email and SMS verification
 * Stores OTP codes for user registration and authentication flows
 */
@Document(collection = "otps")
public class OTP {

    @Id
    private String id;

    private String identifier; // Email or phone number
    private String otpCode; // 6-digit OTP
    private OTPType type; // EMAIL or SMS
    private OTPPurpose purpose; // REGISTRATION, PASSWORD_RESET, etc.
    private OTPStatus status; // PENDING, VERIFIED, EXPIRED
    
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime verifiedAt;
    
    private int attemptCount; // Track failed verification attempts
    private int maxAttempts = 5;

    public enum OTPType {
        EMAIL,
        SMS,
        BOTH
    }

    public enum OTPPurpose {
        REGISTRATION,
        PASSWORD_RESET,
        EMAIL_VERIFICATION,
        PHONE_VERIFICATION,
        LOGIN
    }

    public enum OTPStatus {
        PENDING,
        VERIFIED,
        EXPIRED,
        BLOCKED // After max attempts
    }

    // Constructors
    public OTP() {}

    public OTP(String identifier, String otpCode, OTPType type, OTPPurpose purpose) {
        this.identifier = identifier;
        this.otpCode = otpCode;
        this.type = type;
        this.purpose = purpose;
        this.status = OTPStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusMinutes(10); // 10 minute expiry
        this.attemptCount = 0;
    }

    // Methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return status == OTPStatus.PENDING && !isExpired();
    }

    public void incrementAttempts() {
        this.attemptCount++;
        if (this.attemptCount >= this.maxAttempts) {
            this.status = OTPStatus.BLOCKED;
        }
    }

    public void verify() {
        this.status = OTPStatus.VERIFIED;
        this.verifiedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }

    public OTPType getType() { return type; }
    public void setType(OTPType type) { this.type = type; }

    public OTPPurpose getPurpose() { return purpose; }
    public void setPurpose(OTPPurpose purpose) { this.purpose = purpose; }

    public OTPStatus getStatus() { return status; }
    public void setStatus(OTPStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public int getAttemptCount() { return attemptCount; }
    public void setAttemptCount(int attemptCount) { this.attemptCount = attemptCount; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
}
