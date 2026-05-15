package com.sabahub.service;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;

/**
 * SMS Service using Twilio Verify API
 * Enterprise-grade SMS delivery with built-in OTP verification
 * Better than basic SMS: handles verification logic, rate limiting, security
 */
@Slf4j
@Service
public class SMSService {

    private static final String SMS_CONFIG_MESSAGE =
            "SMS verification is not configured correctly. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.";

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
         return isTwilioSid(twilioAccountSid, "AC") &&
             hasRealValue(twilioAuthToken) &&
             isTwilioSid(twilioVerifyServiceSid, "VA");
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

        requireConfigured();

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

        } catch (ApiException e) {
            log.error("Twilio rejected SMS OTP request for {}. Status: {}, Code: {}, Message: {}",
                    phoneNumber, e.getStatusCode(), e.getCode(), e.getMessage());
            throw toDeliveryException("send SMS OTP", e);
        } catch (Exception e) {
            log.error("Failed to send SMS OTP to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new VerificationDeliveryException("Unable to send SMS verification code right now. Please try again.", e);
        }
    }

    /**
     * Send a verification code via Twilio Verify (preferred for phone verification)
     */
    public void sendVerificationCode(String phoneNumber) {
        log.info("Sending verification code via Verify API to: {}", phoneNumber);
        requireConfigured();

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
        } catch (ApiException e) {
            log.error("Twilio rejected verification SMS request for {}. Status: {}, Code: {}, Message: {}",
                    phoneNumber, e.getStatusCode(), e.getCode(), e.getMessage());
            throw toDeliveryException("send verification SMS", e);
        } catch (Exception e) {
            log.error("Failed to send verification SMS to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new VerificationDeliveryException("Unable to send SMS verification code right now. Please try again.", e);
        }
    }

    /**
     * Verify a code using Twilio Verify API
     */
    public boolean verifyCode(String phoneNumber, String code) {
        log.info("Verifying SMS code via Verify API for: {}", phoneNumber);
        requireConfigured();

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
        } catch (ApiException e) {
            log.error("Twilio rejected SMS verification check for {}. Status: {}, Code: {}, Message: {}",
                    phoneNumber, e.getStatusCode(), e.getCode(), e.getMessage());
            throw toDeliveryException("verify SMS code", e);
        } catch (Exception e) {
            log.error("Failed to verify SMS code for: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new VerificationDeliveryException("Unable to verify SMS code right now. Please try again.", e);
        }
    }

    /**
     * Send password reset OTP via SMS using Twilio Verify API
     */
    public void sendPasswordResetSMS(String phoneNumber, String otpCode) {
        log.info("Sending password reset SMS via Verify API to: {}", phoneNumber);
        requireConfigured();

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

        } catch (ApiException e) {
            log.error("Twilio rejected password reset SMS request for {}. Status: {}, Code: {}, Message: {}",
                    phoneNumber, e.getStatusCode(), e.getCode(), e.getMessage());
            throw toDeliveryException("send password reset SMS", e);
        } catch (Exception e) {
            log.error("Failed to send password reset SMS to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new VerificationDeliveryException("Unable to send SMS verification code right now. Please try again.", e);
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

    private void requireConfigured() {
        if (!isConfigured()) {
            log.warn(SMS_CONFIG_MESSAGE);
            throw new VerificationDeliveryException(SMS_CONFIG_MESSAGE);
        }
    }

    private VerificationDeliveryException toDeliveryException(String action, ApiException e) {
        Integer statusCode = e.getStatusCode();
        String message = e.getMessage() == null ? "" : e.getMessage();
        boolean authFailure = (statusCode != null && (statusCode == 401 || statusCode == 403))
                || message.toLowerCase(Locale.ROOT).contains("authenticate");
        if (authFailure) {
            return new VerificationDeliveryException(
                    "SMS provider rejected the configured Twilio credentials. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.",
                    e
            );
        }
        return new VerificationDeliveryException("Unable to " + action + " right now. Please try again.", e);
    }

    private boolean isTwilioSid(String value, String prefix) {
        return hasRealValue(value) && value.matches("^" + prefix + "[0-9a-fA-F]{32}$");
    }

    private boolean hasRealValue(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return !normalized.contains("placeholder")
                && !normalized.contains("changeme")
                && !normalized.contains("your_")
                && !normalized.contains("example");
    }
}
