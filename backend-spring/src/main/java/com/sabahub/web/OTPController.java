package com.sabahub.web;

import com.sabahub.domain.OTP;
import com.sabahub.dto.OTPRequestDTO;
import com.sabahub.dto.OTPVerificationDTO;
import com.sabahub.service.AuthService;
import com.sabahub.service.EmailService;
import com.sabahub.service.OTPService;
import com.sabahub.service.SessionTrackingService;
import com.sabahub.service.SMSService;
import com.sabahub.service.TwoFactorMethodNormalizer;
import com.sabahub.service.VerificationChallengeService;
import com.sabahub.web.dto.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Locale;
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
    private final SessionTrackingService sessionTrackingService;
    private final VerificationChallengeService verificationChallengeService;

    public OTPController(OTPService otpService,
                         EmailService emailService,
                         SMSService smsService,
                         AuthService authService,
                         SessionTrackingService sessionTrackingService,
                         VerificationChallengeService verificationChallengeService) {
        this.otpService = otpService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.authService = authService;
        this.sessionTrackingService = sessionTrackingService;
        this.verificationChallengeService = verificationChallengeService;
    }

    /**
     * Step 1: Request OTP for registration
     * Sends OTP only through the selected verification channel
     */
    @PostMapping("/request-registration")
    public ResponseEntity<?> requestRegistrationOTP(@Valid @RequestBody OTPRequestDTO request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase(Locale.ROOT) : "";
        String phoneNumber = normalizeOptional(request.getPhoneNumber());
        String verificationMethod = normalizeRegistrationMethod(request.getVerificationMethod());
        log.info("Requesting registration OTP for email: {} via {}", email, verificationMethod);

        try {
            boolean needsEmail = usesRegistrationEmailFactor(verificationMethod);
            boolean needsPhone = usesRegistrationPhoneFactor(verificationMethod);

            if (needsPhone) {
                if (phoneNumber == null) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse("Phone number is required for phone verification.", false, null)
                    );
                }
                if (!smsService.isConfigured()) {
                    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                            new ApiResponse("SMS service not configured. Please contact administrator.", false, null)
                    );
                }
                if (!smsService.isValidPhoneNumber(phoneNumber)) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse("Invalid phone number format", false, null)
                    );
                }
            }

            if (needsEmail && !emailService.isConfigured()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                        new ApiResponse("Email service not configured. Please contact administrator.", false, null)
                );
            }

            if (needsPhone) {
                smsService.sendVerificationCode(phoneNumber);
            }

            if (needsEmail) {
                OTP emailOTP = otpService.generateOTP(email, OTP.OTPType.EMAIL, OTP.OTPPurpose.REGISTRATION);
                emailService.sendOTPEmail(email, emailOTP.getOtpCode(), request.getFirstName());
            }

            String challengeId = verificationChallengeService.createRegistrationChallenge(email, phoneNumber, verificationMethod);

            return ResponseEntity.ok(new ApiResponse(
                    registrationDeliveryMessage(verificationMethod),
                    true,
                    Map.of("challengeId", challengeId, "verificationMethod", verificationMethod)
            ));
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
            VerificationChallengeService.RegistrationChallenge challenge =
                    verificationChallengeService.requireRegistrationChallenge(request.getChallengeId());
            String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!email.equalsIgnoreCase(challenge.email())) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Registration challenge does not match this email.", false, null)
                );
            }
            if (!usesRegistrationEmailFactor(challenge.verificationMethod())) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Email OTP is not selected for this registration challenge.", false, null)
                );
            }

            boolean isValid = otpService.verifyOTPWithAttempts(
                email,
                request.getOtpCode(),
                OTP.OTPPurpose.REGISTRATION
            );

            if (isValid) {
                verificationChallengeService.markRegistrationChannelVerified(request.getChallengeId(), "EMAIL");
                log.info("Email OTP verified successfully for: {}", email);
                return ResponseEntity.ok(
                        new ApiResponse("Email verified successfully", true, Map.of("challengeId", request.getChallengeId()))
                );
            } else {
                otpService.recordFailedAttempt(email, request.getOtpCode(), OTP.OTPPurpose.REGISTRATION);
                log.warn("Invalid email OTP for: {}", email);
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
            VerificationChallengeService.RegistrationChallenge challenge =
                    verificationChallengeService.requireRegistrationChallenge(request.getChallengeId());
            String phoneNumber = normalizeOptional(request.getPhoneNumber());
            if (phoneNumber == null || challenge.phoneNumber() == null || !phoneNumber.equals(challenge.phoneNumber())) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Registration challenge does not match this phone number.", false, null)
                );
            }
            if (!usesRegistrationPhoneFactor(challenge.verificationMethod())) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Phone OTP is not selected for this registration challenge.", false, null)
                );
            }

            boolean isValid = smsService.verifyCode(phoneNumber, request.getOtpCode());
            if (isValid) {
                verificationChallengeService.markRegistrationChannelVerified(request.getChallengeId(), "PHONE");
                log.info("SMS OTP verified successfully for: {}", phoneNumber);
                return ResponseEntity.ok(
                        new ApiResponse("SMS verified successfully", true, Map.of("challengeId", request.getChallengeId()))
                );
            } else {
                log.warn("Invalid SMS OTP for: {}", phoneNumber);
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
            String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase(Locale.ROOT) : "";
            String phoneNumber = normalizeOptional(request.getPhoneNumber());
            String verificationMethod = normalizeRegistrationMethod(request.getVerificationMethod());

            if (request.getChallengeId() != null && !request.getChallengeId().isBlank()) {
                VerificationChallengeService.RegistrationChallenge challenge =
                        verificationChallengeService.requireRegistrationChallenge(request.getChallengeId());
                email = challenge.email();
                phoneNumber = challenge.phoneNumber();
                verificationMethod = challenge.verificationMethod();
                verificationChallengeService.deleteRegistrationChallenge(request.getChallengeId());
            }

            if (usesRegistrationPhoneFactor(verificationMethod)) {
                if (phoneNumber == null || !smsService.isValidPhoneNumber(phoneNumber)) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse("Invalid phone number format", false, null)
                    );
                }
                smsService.sendVerificationCode(phoneNumber);
            }

            if (usesRegistrationEmailFactor(verificationMethod)) {
                OTP emailOTP = otpService.resendOTP(
                        email,
                        OTP.OTPType.EMAIL,
                        OTP.OTPPurpose.REGISTRATION
                );
                emailService.sendOTPEmail(
                        email,
                        emailOTP.getOtpCode(),
                        request.getFirstName()
                );
            }

            String challengeId = verificationChallengeService.createRegistrationChallenge(email, phoneNumber, verificationMethod);
            log.info("OTP resent successfully for {}", email);
            return ResponseEntity.ok(
                    new ApiResponse(registrationDeliveryMessage(verificationMethod), true, Map.of(
                            "challengeId", challengeId,
                            "verificationMethod", verificationMethod
                    ))
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
    public ResponseEntity<?> completeRegistration(@Valid @RequestBody Map<String, String> request,
                                                  HttpServletRequest httpRequest) {
        String email = request.get("email") != null ? request.get("email").trim().toLowerCase(Locale.ROOT) : null;
        String password = request.get("password");
        String fullName = request.get("fullName");
        String role = request.get("role"); // Optional: defaults to FREELANCER
        String username = request.get("username");
        String country = request.get("country");
        String location = request.get("location");
        String timezone = request.get("timezone");
        String phoneCountryCode = request.get("phoneCountryCode");
        String phoneNumber = normalizeOptional(request.get("phoneNumber"));
        String challengeId = request.get("challengeId");

        if (fullName == null || fullName.isBlank()) {
            String firstName = request.getOrDefault("firstName", "").trim();
            String middleName = request.getOrDefault("middleName", "").trim();
            String lastName = request.getOrDefault("lastName", "").trim();
            fullName = String.join(" ", firstName, middleName, lastName).trim().replaceAll("\\s+", " ");
        }

        log.info("Completing registration for: {} with role: {}", email, role != null ? role : "FREELANCER");

        try {
            VerificationChallengeService.RegistrationChallenge challenge =
                    verificationChallengeService.requireRegistrationChallenge(challengeId);
            String verificationMethod = challenge.verificationMethod();

            if (challenge.email() != null && email != null && !challenge.email().equalsIgnoreCase(email)) {
                return ResponseEntity.badRequest().body(
                        new ApiResponse("Registration challenge does not match this email.", false, null)
                );
            }
            email = challenge.email() != null ? challenge.email() : email;

            if (challenge.phoneNumber() != null) {
                if (phoneNumber != null && !challenge.phoneNumber().equals(phoneNumber)) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse("Registration challenge does not match this phone number.", false, null)
                    );
                }
                phoneNumber = challenge.phoneNumber();
            }

            if (usesRegistrationPhoneFactor(verificationMethod)) {
                if (phoneNumber == null) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse("Phone number is required for phone verification.", false, null)
                    );
                }
                if (!challenge.phoneVerified()) {
                    return ResponseEntity.badRequest().body(
                        new ApiResponse("Phone not verified. Please verify SMS OTP first.", false, null)
                    );
                }
            }
            if (usesRegistrationEmailFactor(verificationMethod)) {
                if (!challenge.emailVerified()) {
                    return ResponseEntity.badRequest().body(
                            new ApiResponse("Email not verified. Please verify email OTP first.", false, null)
                    );
                }
            }

            // Create user account with role
                AuthResponse authResponse = authService.registerWithOTP(
                    email,
                    fullName,
                    password,
                    role,
                    username,
                    verificationMethod,
                    country,
                    location,
                    timezone,
                    phoneCountryCode,
                    phoneNumber
                );

            sessionTrackingService.trackSession(authResponse.token(), authResponse.email(), httpRequest);
            verificationChallengeService.deleteRegistrationChallenge(challengeId);
            if ("EMAIL".equalsIgnoreCase(verificationMethod) && email != null) {
                otpService.expireLatestOTP(email, OTP.OTPPurpose.REGISTRATION);
            }
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
     * Request OTPs for password reset (email + optional SMS)
     */
    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestPasswordResetOTP(@Valid @RequestBody OTPRequestDTO request) {
        log.info("Requesting password-reset OTP for email: {}", request.getEmail());

        try {
            boolean emailConfigured = emailService.isConfigured();
            boolean smsConfigured = smsService.isConfigured();

            if (!emailConfigured && !smsConfigured) {
                String errorMsg = "OTP services not configured. Please contact administrator to set up SMTP and Twilio credentials.";
                log.error(errorMsg);
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ApiResponse(errorMsg, false, null));
            }

            boolean emailSent = false;
            boolean smsSent = false;

            if (emailConfigured) {
                OTP emailOTP = otpService.generateOTP(request.getEmail(), OTP.OTPType.EMAIL, OTP.OTPPurpose.PASSWORD_RESET);
                emailService.sendPasswordResetEmail(request.getEmail(), emailOTP.getOtpCode(), request.getFirstName());
                emailSent = true;
            }

            if (smsConfigured && request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
                if (smsService.isValidPhoneNumber(request.getPhoneNumber())) {
                    OTP smsOTP = otpService.generateOTP(request.getPhoneNumber(), OTP.OTPType.SMS, OTP.OTPPurpose.PASSWORD_RESET);
                    smsService.sendPasswordResetSMS(request.getPhoneNumber(), smsOTP.getOtpCode());
                    smsSent = true;
                }
            }

            if (!emailSent && !smsSent) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(new ApiResponse("Unable to send password reset OTP", false, null));
            }

            return ResponseEntity.ok(new ApiResponse("Password reset OTP sent", true, Map.of(
                    "emailSent", emailSent,
                    "smsSent", smsSent
            )));
        } catch (Exception e) {
            log.error("Error requesting password reset OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("Failed to process password reset OTP request", false, null));
        }
    }

    /**
     * Verify email OTP for password reset purpose
     */
    @PostMapping("/verify-email-password-reset")
    public ResponseEntity<?> verifyEmailOTPForPasswordReset(@Valid @RequestBody OTPVerificationDTO request) {
        try {
            boolean isValid = otpService.verifyOTPWithAttempts(
                    request.getEmail(),
                    request.getOtpCode(),
                    OTP.OTPPurpose.PASSWORD_RESET
            );

            if (!isValid) {
                otpService.recordFailedAttempt(request.getEmail(), request.getOtpCode(), OTP.OTPPurpose.PASSWORD_RESET);
                return ResponseEntity.badRequest().body(new ApiResponse("Invalid or expired OTP", false, null));
            }

            return ResponseEntity.ok(new ApiResponse("Email verified successfully", true, null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ApiResponse(e.getMessage(), false, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse("Failed to verify OTP", false, null));
        }
    }

    /**
     * Verify SMS OTP for password reset purpose
     */
    @PostMapping("/verify-sms-password-reset")
    public ResponseEntity<?> verifySMSOTPForPasswordReset(@Valid @RequestBody com.sabahub.dto.OTPVerificationPhoneDTO request) {
        try {
            boolean isValid = otpService.verifyOTPWithAttempts(
                    request.getPhoneNumber(),
                    request.getOtpCode(),
                    OTP.OTPPurpose.PASSWORD_RESET
            );

            if (!isValid) {
                otpService.recordFailedAttempt(request.getPhoneNumber(), request.getOtpCode(), OTP.OTPPurpose.PASSWORD_RESET);
                return ResponseEntity.badRequest().body(new ApiResponse("Invalid or expired OTP", false, null));
            }

            return ResponseEntity.ok(new ApiResponse("SMS verified successfully", true, null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ApiResponse(e.getMessage(), false, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse("Failed to verify OTP", false, null));
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

    private String normalizeRegistrationMethod(String method) {
        var factors = TwoFactorMethodNormalizer.normalizeFactors(method).stream()
                .filter(factor -> "EMAIL".equals(factor) || "PHONE".equals(factor))
                .toList();
        return factors.isEmpty() ? "EMAIL" : String.join("+", factors);
    }

    private boolean usesRegistrationEmailFactor(String method) {
        return TwoFactorMethodNormalizer.usesEmailFactor(method);
    }

    private boolean usesRegistrationPhoneFactor(String method) {
        return TwoFactorMethodNormalizer.usesPhoneFactor(method);
    }

    private String registrationDeliveryMessage(String verificationMethod) {
        if (usesRegistrationEmailFactor(verificationMethod) && usesRegistrationPhoneFactor(verificationMethod)) {
            return "Verification codes sent to email and phone";
        }
        return usesRegistrationPhoneFactor(verificationMethod)
                ? "Verification code sent to phone"
                : "Verification code sent to email";
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
