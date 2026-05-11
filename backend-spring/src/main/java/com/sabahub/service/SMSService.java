package com.sabahub.service;

import com.twilio.Twilio;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMS Service using Twilio Verify API
 * Enterprise-grade SMS delivery with built-in OTP verification
 * Better than basic SMS: handles verification logic, rate limiting, security
 */
@Slf4j
@Service
public class SMSService {

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.verify-service-sid:}")
    private String twilioVerifyServiceSid;

    @Value("${twilio.phone-number:+1234567890}")
    private String twilioPhoneNumber;

    private boolean isInitialized = false;

    /**
     * Check if SMS service is properly configured
     */
    public boolean isConfigured() {
         return twilioAccountSid != null && !twilioAccountSid.isEmpty() && 
             twilioAuthToken != null && !twilioAuthToken.isEmpty() &&
             twilioVerifyServiceSid != null && !twilioVerifyServiceSid.isEmpty();
    }

    /**
     * Initialize Twilio client (lazy initialization)
     */
    private void initializeTwilio() {
        if (!isInitialized && twilioAccountSid != null && !twilioAccountSid.isEmpty()) {
            Twilio.init(twilioAccountSid, twilioAuthToken);
            isInitialized = true;
            log.info("Twilio client initialized");
        }
    }

    /**
     * Send OTP via SMS using Twilio Verify API
     * The Verify API handles verification logic server-side with better security
     */
    public void sendOTPSMS(String phoneNumber, String otpCode) {
        log.info("Sending OTP SMS via Verify API to: {}", phoneNumber);

        if (!isConfigured()) {
            String errorMsg = "SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.";
            log.warn(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        if (!isInitialized) {
            initializeTwilio();
        }

        try {
            // Use Verify API to send OTP via SMS
            // This is better than basic SMS: handles verification, rate limiting, security
            Verification verification = Verification.creator(
                    twilioVerifyServiceSid,      // Service SID
                    phoneNumber,                  // Recipient phone number
                    "sms"                         // Channel: sms or call
            ).create();

            log.info("SMS OTP sent successfully via Verify API. Status: {}, Phone: {}", 
                    verification.getStatus(), phoneNumber);

        } catch (Exception e) {
            log.error("Failed to send SMS OTP to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS OTP: " + e.getMessage(), e);
        }
    }

    /**
     * Send a verification code via Twilio Verify (preferred for phone verification)
     */
    public void sendVerificationCode(String phoneNumber) {
        log.info("Sending verification code via Verify API to: {}", phoneNumber);
        if (!isConfigured()) {
            String errorMsg = "SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.";
            log.warn(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        if (!isInitialized) {
            initializeTwilio();
        }

        try {
            Verification verification = Verification.creator(
                    twilioVerifyServiceSid,
                    phoneNumber,
                    "sms"
            ).create();

            log.info("Verification SMS sent via Verify API. Status: {}, Phone: {}", verification.getStatus(), phoneNumber);
        } catch (Exception e) {
            log.error("Failed to send verification SMS to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send verification SMS: " + e.getMessage(), e);
        }
    }

    /**
     * Verify a code using Twilio Verify API
     */
    public boolean verifyCode(String phoneNumber, String code) {
        log.info("Verifying SMS code via Verify API for: {}", phoneNumber);
        if (!isConfigured()) {
            String errorMsg = "SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.";
            log.warn(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        if (!isInitialized) {
            initializeTwilio();
        }

        try {
            VerificationCheck verificationCheck = VerificationCheck.creator(twilioVerifyServiceSid)
                    .setCode(code)
                    .setTo(phoneNumber)
                    .create();

            String status = verificationCheck.getStatus();
            log.info("Verification check status: {} for {}", status, phoneNumber);
            return "approved".equalsIgnoreCase(status);
        } catch (Exception e) {
            log.error("Failed to verify SMS code for: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to verify SMS code: " + e.getMessage(), e);
        }
    }

    /**
     * Send password reset OTP via SMS using Twilio Verify API
     */
    public void sendPasswordResetSMS(String phoneNumber, String otpCode) {
        log.info("Sending password reset SMS via Verify API to: {}", phoneNumber);
        if (!isConfigured()) {
            String errorMsg = "SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.";
            log.warn(errorMsg);
            throw new RuntimeException(errorMsg);
        }

        if (!isInitialized) {
            initializeTwilio();
        }

        try {
            // Use Verify API to send password reset OTP via SMS
            Verification verification = Verification.creator(
                    twilioVerifyServiceSid,      // Service SID
                    phoneNumber,                  // Recipient phone number
                    "sms"                         // Channel: sms
            ).create();

            log.info("Password reset SMS OTP sent via Verify API. Status: {}, Phone: {}", 
                    verification.getStatus(), phoneNumber);

        } catch (Exception e) {
            log.error("Failed to send password reset SMS to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send password reset SMS: " + e.getMessage(), e);
        }
    }

    /**
     * Validate phone number format
     */
    public boolean isValidPhoneNumber(String phoneNumber) {
        // Basic validation - should be in E.164 format: +[country code][number]
        return phoneNumber != null && phoneNumber.matches("^\\+?[1-9]\\d{1,14}$");
    }

    /**
     * Format phone number to E.164 standard for Twilio
     */
    public String formatPhoneNumber(String phoneNumber, String countryCode) {
        if (phoneNumber == null) {
            return null;
        }

        // Remove all non-digit characters
        String digits = phoneNumber.replaceAll("\\D", "");

        // Add country code if not present
        if (!digits.startsWith(countryCode.replaceAll("\\D", ""))) {
            digits = countryCode.replaceAll("\\D", "") + digits;
        }

        return "+" + digits;
    }
}
