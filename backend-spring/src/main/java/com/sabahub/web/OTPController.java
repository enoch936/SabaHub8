package com.sabahub.web;

import com.sabahub.domain.OTP;
import com.sabahub.dto.OTPRequestDTO;
import com.sabahub.dto.OTPVerificationDTO;
import com.sabahub.dto.RegisterWithOTPDTO;
import com.sabahub.service.AuthService;
import com.sabahub.service.EmailService;
import com.sabahub.service.OTPService;
import com.sabahub.service.SMSService;
import com.sabahub.web.dto.AuthResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

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
    private final AuthService authService;

    public OTPController(OTPService otpService, EmailService emailService, SMSService smsService, AuthService authService) {
        this.otpService = otpService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.authService = authService;
    }

    /**
     * Step 1: Request OTP for registration
     * Sends OTP via both email and SMS
     */
    @PostMapping("/request-registration")
    public ResponseEntity<?> requestRegistrationOTP(@Valid @RequestBody OTPRequestDTO request) {
        log.info("Requesting registration OTP for email: {}", request.getEmail());

        try {
            // Check if services are configured
            boolean emailConfigured = emailService.isConfigured();
            boolean smsConfigured = smsService.isConfigured();
            
            if (!emailConfigured && !smsConfigured) {
                String errorMsg = "OTP services not configured. Please contact administrator to set up SMTP and Twilio credentials.";
                log.error(errorMsg);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                        new ApiResponse(errorMsg, false, null)
                );
            }
            
            boolean emailSent = false;
            boolean smsSent = false;
            StringBuilder responseMsg = new StringBuilder();
            
            // Try to send email OTP
            if (emailConfigured) {
                try {
                    OTP emailOTP = otpService.generateOTP(
                            request.getEmail(),
                            OTP.OTPType.EMAIL,
                            OTP.OTPPurpose.REGISTRATION
                    );
                    emailService.sendOTPEmail(
                            request.getEmail(),
                            emailOTP.getOtpCode(),
                            request.getFirstName()
                    );
                    emailSent = true;
                    responseMsg.append("OTP sent to email");
                } catch (Exception e) {
                    log.error("Failed to send email OTP: {}", e.getMessage());
                    responseMsg.append("Failed to send email OTP");
                }
            } else {
                log.warn("Email service not configured - skipping email OTP");
                responseMsg.append("Email service not configured");
            }

            // Try to send SMS OTP (only if phone number provided)
            if (smsConfigured && request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                if (smsService.isValidPhoneNumber(request.getPhoneNumber())) {
                    try {
                        OTP smsOTP = otpService.generateOTP(
                                request.getPhoneNumber(),
                                OTP.OTPType.SMS,
                                OTP.OTPPurpose.REGISTRATION
                        );
                        smsService.sendOTPSMS(request.getPhoneNumber(), smsOTP.getOtpCode());
                        smsSent = true;
                        if (emailSent) responseMsg.append(" and ");
                        responseMsg.append("SMS");
                    } catch (Exception e) {
                        log.error("Failed to send SMS OTP: {}", e.getMessage());
                        if (emailSent) responseMsg.append("; ");
                        responseMsg.append("Failed to send SMS OTP");
                    }
                } else {
                    log.warn("Invalid phone number format: {}", request.getPhoneNumber());
                    if (emailSent) responseMsg.append("; ");
                    responseMsg.append("Invalid phone number format");
                }
            } else if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
                log.info("No phone number provided - skipping SMS OTP");
            } else {
                log.warn("SMS service not configured - skipping SMS OTP");
                if (emailSent) responseMsg.append("; ");
                responseMsg.append("SMS service not configured");
            }

            // Return appropriate response
            if (emailSent || smsSent) {
                log.info("Registration OTP request completed. Email sent: {}, SMS sent: {}", emailSent, smsSent);
                return ResponseEntity.ok(
                        new ApiResponse(responseMsg.toString(), true, null)
                );
            } else {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                        new ApiResponse(responseMsg.toString(), false, null)
                );
            }

        } catch (Exception e) {
            log.error("Error requesting registration OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to process OTP request: " + e.getMessage(), false, null)
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
    public ResponseEntity<?> verifySMSOTP(@Valid @RequestBody com.sabahub.dto.OTPVerificationPhoneDTO request) {
        log.info("Verifying SMS OTP for phone: {}", request.getPhoneNumber());

        try {
            boolean isValid = otpService.verifyOTPWithAttempts(request.getPhoneNumber(), request.getOtpCode());

            if (isValid) {
                log.info("SMS OTP verified successfully for: {}", request.getPhoneNumber());
                return ResponseEntity.ok(
                        new ApiResponse("SMS verified successfully", true, null)
                );
            } else {
                otpService.recordFailedAttempt(request.getPhoneNumber(), request.getOtpCode());
                log.warn("Invalid SMS OTP for: {}", request.getPhoneNumber());
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
     * Complete registration with verified OTP
     * Call this after email OTP is verified
     */
    @PostMapping("/complete-registration")
    public ResponseEntity<?> completeRegistration(@Valid @RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String fullName = request.get("fullName");
        String role = request.get("role"); // Optional: defaults to FREELANCER

        log.info("Completing registration for: {} with role: {}", email, role != null ? role : "FREELANCER");

        try {
            // Verify that email OTP was verified
            OTP.OTPStatus emailStatus = otpService.getOTPStatus(email);
            if (emailStatus != OTP.OTPStatus.VERIFIED) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Email not verified. Please verify email OTP first.", false, null)
                );
            }

            // Create user account with role
            AuthResponse authResponse = authService.registerWithOTP(email, fullName, password, role);

            log.info("Registration completed successfully for: {} with role: {}", email, role != null ? role : "FREELANCER");
            return ResponseEntity.ok(authResponse);

        } catch (IllegalArgumentException e) {
            log.warn("Registration validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    new ApiResponse(e.getMessage(), false, null)
            );
        } catch (Exception e) {
            log.error("Error completing registration: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ApiResponse("Failed to complete registration", false, null)
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
