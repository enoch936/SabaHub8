package com.sabahub.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMS Service using Twilio
 * Enterprise-grade SMS delivery for OTP verification
 */
@Slf4j
@Service
public class SMSService {

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone-number:+1234567890}")
    private String twilioPhoneNumber;

    private boolean isInitialized = false;

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
     * Send OTP via SMS
     */
    public void sendOTPSMS(String phoneNumber, String otpCode) {
        log.info("Sending OTP SMS to: {}", phoneNumber);
        
        if (!isInitialized) {
            initializeTwilio();
        }

        if (twilioAccountSid == null || twilioAccountSid.isEmpty()) {
            log.warn("Twilio not configured - SMS OTP will not be sent");
            return;
        }

        try {
            String messageBody = "Your SabaHub verification code is: " + otpCode + 
                               "\nThis code expires in 10 minutes.\n" +
                               "Do not share with anyone.";

            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),  // To number
                    new PhoneNumber(twilioPhoneNumber),  // From number
                    messageBody
            ).create();

            log.info("SMS sent successfully. SID: {}", message.getSid());

        } catch (Exception e) {
            log.error("Failed to send SMS to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS: " + e.getMessage(), e);
        }
    }

    /**
     * Send password reset OTP via SMS
     */
    public void sendPasswordResetSMS(String phoneNumber, String otpCode) {
        log.info("Sending password reset SMS to: {}", phoneNumber);
        
        if (!isInitialized) {
            initializeTwilio();
        }

        if (twilioAccountSid == null || twilioAccountSid.isEmpty()) {
            log.warn("Twilio not configured - SMS will not be sent");
            return;
        }

        try {
            String messageBody = "Your SabaHub password reset code is: " + otpCode + 
                               "\nThis code expires in 10 minutes.\n" +
                               "If you didn't request this, ignore this message.";

            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(twilioPhoneNumber),
                    messageBody
            ).create();

            log.info("Password reset SMS sent successfully. SID: {}", message.getSid());

        } catch (Exception e) {
            log.error("Failed to send password reset SMS to: {} - Error: {}", phoneNumber, e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS: " + e.getMessage(), e);
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
