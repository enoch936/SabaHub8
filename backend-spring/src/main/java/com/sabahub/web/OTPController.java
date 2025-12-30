package com.sabahub.web;

import com.sabahub.domain.OTP;
import com.sabahub.dto.OTPRequestDTO;
import com.sabahub.dto.OTPVerificationDTO;
import com.sabahub.dto.RegisterWithOTPDTO;
import com.sabahub.service.EmailService;
import com.sabahub.service.OTPService;
import com.sabahub.service.SMSService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

/**
 * REST Controller for OTP verification (Email + SMS)
 * Handles registration and password reset OTP flows
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/otp")
@CrossOrigin(origins = "*")
public class OTPController {

    private final OTPService otpService;
    private final EmailService emailService;
    private final SMSService smsService;

    public OTPController(OTPService otpService, EmailService emailService, SMSService smsService) {
        this.otpService = otpService;
        this.emailService = emailService;
        this.smsService = smsService;
    }

    /**
     * Step 1: Request OTP for registration
     * Sends OTP via both email and SMS
     */
    @PostMapping("/request-registration")
    public ResponseEntity<?> requestRegistrationOTP(@Valid @RequestBody OTPRequestDTO request) {
        log.info("Requesting registration OTP for email: {}", request.getEmail());

        try {
            // Generate OTP for email
            OTP emailOTP = otpService.generateOTP(
                    request.getEmail(),
                    OTP.OTPType.EMAIL,
                    OTP.OTPPurpose.REGISTRATION
            );

            // Send email OTP
            emailService.sendOTPEmail(
                    request.getEmail(),
                    emailOTP.getOtpCode(),
                    request.getFirstName()
            );

            // Generate OTP for SMS
            OTP smsOTP = otpService.generateOTP(
                    request.getPhoneNumber(),
                    OTP.OTPType.SMS,
                    OTP.OTPPurpose.REGISTRATION
            );

            // Send SMS OTP
            if (smsService.isValidPhoneNumber(request.getPhoneNumber())) {
                smsService.sendOTPSMS(request.getPhoneNumber(), smsOTP.getOtpCode());
            } else {
                log.warn("Invalid phone number format: {}", request.getPhoneNumber());
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Invalid phone number format", false, null)
                );
            }

            log.info("Registration OTP sent successfully to email: {} and phone: {}",
                    request.getEmail(), request.getPhoneNumber());

            return ResponseEntity.ok(
                    new ApiResponse("OTP sent to email and SMS successfully", true, null)
            );

        } catch (Exception e) {
            log.error("Error requesting registration OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to send OTP: " + e.getMessage(), false, null)
            );
        }
    }

    /**
     * Step 2: Verify email OTP
     */
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmailOTP(@Valid @RequestBody OTPVerificationDTO request) {
        log.info("Verifying email OTP for: {}", request.getEmail());

        try {
            boolean isValid = otpService.verifyOTPWithAttempts(request.getEmail(), request.getOtpCode());

            if (isValid) {
                log.info("Email OTP verified successfully for: {}", request.getEmail());
                return ResponseEntity.ok(
                        new ApiResponse("Email verified successfully", true, null)
                );
            } else {
                otpService.recordFailedAttempt(request.getEmail(), request.getOtpCode());
                log.warn("Invalid email OTP for: {}", request.getEmail());
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Invalid or expired OTP", false, null)
                );
            }

        } catch (RuntimeException e) {
            log.error("Error verifying email OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    new ApiResponse(e.getMessage(), false, null)
            );
        } catch (Exception e) {
            log.error("Unexpected error verifying email OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to verify OTP", false, null)
            );
        }
    }

    /**
     * Step 3: Verify SMS OTP
     */
    @PostMapping("/verify-sms")
    public ResponseEntity<?> verifySMSOTP(@Valid @RequestBody OTPVerificationDTO request) {
        log.info("Verifying SMS OTP for: {}", request.getEmail());

        try {
            boolean isValid = otpService.verifyOTPWithAttempts(request.getEmail(), request.getOtpCode());

            if (isValid) {
                log.info("SMS OTP verified successfully for: {}", request.getEmail());
                return ResponseEntity.ok(
                        new ApiResponse("SMS verified successfully", true, null)
                );
            } else {
                otpService.recordFailedAttempt(request.getEmail(), request.getOtpCode());
                log.warn("Invalid SMS OTP for: {}", request.getEmail());
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Invalid or expired OTP", false, null)
                );
            }

        } catch (RuntimeException e) {
            log.error("Error verifying SMS OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    new ApiResponse(e.getMessage(), false, null)
            );
        } catch (Exception e) {
            log.error("Unexpected error verifying SMS OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to verify OTP", false, null)
            );
        }
    }

    /**
     * Step 4: Resend OTP
     */
    @PostMapping("/resend")
    public ResponseEntity<?> resendOTP(@Valid @RequestBody OTPRequestDTO request) {
        log.info("Resending OTP for email: {}", request.getEmail());

        try {
            // Resend email OTP
            OTP emailOTP = otpService.resendOTP(
                    request.getEmail(),
                    OTP.OTPType.EMAIL,
                    OTP.OTPPurpose.REGISTRATION
            );

            emailService.sendOTPEmail(
                    request.getEmail(),
                    emailOTP.getOtpCode(),
                    request.getFirstName()
            );

            // Resend SMS OTP
            OTP smsOTP = otpService.resendOTP(
                    request.getPhoneNumber(),
                    OTP.OTPType.SMS,
                    OTP.OTPPurpose.REGISTRATION
            );

            if (smsService.isValidPhoneNumber(request.getPhoneNumber())) {
                smsService.sendOTPSMS(request.getPhoneNumber(), smsOTP.getOtpCode());
            }

            log.info("OTP resent successfully");
            return ResponseEntity.ok(
                    new ApiResponse("OTP resent successfully", true, null)
            );

        } catch (Exception e) {
            log.error("Error resending OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to resend OTP", false, null)
            );
        }
    }

    /**
     * Get OTP status
     */
    @GetMapping("/status/{identifier}")
    public ResponseEntity<?> getOTPStatus(@PathVariable String identifier) {
        log.info("Getting OTP status for: {}", identifier);

        try {
            OTP.OTPStatus status = otpService.getOTPStatus(identifier);

            if (status == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(
                    new ApiResponse("OTP status retrieved", true, status.name())
            );

        } catch (Exception e) {
            log.error("Error getting OTP status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to get OTP status", false, null)
            );
        }
    }

    /**
     * API Response wrapper class
     */
    public static class ApiResponse {
        private String message;
        private boolean success;
        private Object data;

        public ApiResponse(String message, boolean success, Object data) {
            this.message = message;
            this.success = success;
            this.data = data;
        }

        // Getters
        public String getMessage() { return message; }
        public boolean isSuccess() { return success; }
        public Object getData() { return data; }
    }
}
