package com.sabahub.config;

import com.sabahub.service.EmailService;
import com.sabahub.service.SMSService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Health check for OTP services on application startup
 * Fails fast when SMTP or Twilio OTP services are not properly configured.
 */
@Slf4j
@Component
public class OTPServicesHealthCheck {

    private final EmailService emailService;
    private final SMSService smsService;

    public OTPServicesHealthCheck(EmailService emailService, SMSService smsService) {
        this.emailService = emailService;
        this.smsService = smsService;
    }

    @PostConstruct
    public void checkOTPServicesOnStartup() {
        log.info("=".repeat(80));
        log.info("OTP SERVICES CONFIGURATION CHECK");
        log.info("=".repeat(80));
        
        boolean emailConfigured = emailService.isConfigured();
        boolean smsConfigured = smsService.isConfigured();
        
        // Email Service Check
        if (emailConfigured) {
            log.info("✅ Email Service: CONFIGURED - OTP emails will be sent");
        } else {
            log.warn("⚠️  Email Service: NOT CONFIGURED");
            log.warn("   → To enable email OTP, set these environment variables:");
            log.warn("   → SMTP_USERNAME=your-email@gmail.com");
            log.warn("   → SMTP_PASSWORD=your-app-password");
            log.warn("   → For Gmail: Enable 2FA and generate app password at:");
            log.warn("   → https://myaccount.google.com/apppasswords");
        }
        
        // SMS Service Check
        if (smsConfigured) {
            log.info("✅ SMS Service: CONFIGURED - OTP SMS will be sent");
        } else {
            log.warn("⚠️  SMS Service: NOT CONFIGURED");
            log.warn("   → To enable SMS OTP, set these environment variables:");
            log.warn("   → TWILIO_ACCOUNT_SID=your-account-sid");
            log.warn("   → TWILIO_AUTH_TOKEN=your-auth-token");
            log.warn("   → Get credentials at: https://www.twilio.com/console");
        }
        
        // Overall Status: require at least one delivery channel (email or SMS).
        log.info("-".repeat(80));
        if (emailConfigured && smsConfigured) {
            log.info("? OTP System Status: FULLY OPERATIONAL (Email + SMS)");
        } else if (emailConfigured || smsConfigured) {
            log.warn("??  OTP System Status: OPERATIONAL with a single delivery channel");
        } else {
            String errorMessage = "OTP startup check failed: neither SMTP nor Twilio Verify is configured";
            log.error("? OTP System Status: STARTUP BLOCKED");
            log.error("   ? {}", errorMessage);
            log.info("=".repeat(80));
            throw new IllegalStateException(errorMessage);
        }

        log.info("=".repeat(80));
    }
}
