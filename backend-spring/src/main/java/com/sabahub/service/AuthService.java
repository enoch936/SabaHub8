package com.sabahub.service;

import com.sabahub.config.JwtService;
import com.sabahub.domain.OTP;
import com.sabahub.domain.User;
import com.sabahub.domain.UserRole;
import com.sabahub.domain.UserProfile;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.AuthRequest;
import com.sabahub.web.dto.AuthResponse;
import com.sabahub.web.dto.LoginResponse;
import com.sabahub.web.dto.RegisterRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final OTPService otpService;
    private final EmailService emailService;
    private final SMSService smsService;
    private final VerificationChallengeService verificationChallengeService;
    private final TwoFactorAuthService twoFactorAuthService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       AuditService auditService,
                       OTPService otpService,
                       EmailService emailService,
                       SMSService smsService,
                       VerificationChallengeService verificationChallengeService,
                       TwoFactorAuthService twoFactorAuthService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.otpService = otpService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.verificationChallengeService = verificationChallengeService;
        this.twoFactorAuthService = twoFactorAuthService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email() != null ? request.email().toLowerCase() : null;
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String fullName = request.resolvedFullName();
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String username = resolveAndEnsureUniqueUsername(request.username(), email);

        String hashed = passwordEncoder.encode(request.password());
        
        // Determine role (default to FREELANCER if not specified)
        String roleString = request.role() != null ? request.role().toUpperCase() : "FREELANCER";
        UserRole userRole = UserRole.fromString(roleString);
        if (userRole == null) {
            userRole = UserRole.FREELANCER; // Default to freelancer
        }
        
        // Non-admin users can only register as EMPLOYER or FREELANCER
        if (userRole.isAdmin()) {
            throw new IllegalArgumentException("Admin roles must be assigned by system administrator");
        }
        
        Set<String> roles = Set.of(userRole.toSpringRole());
        User user = new User(email, username, fullName, hashed, roles);
        user.setProfile(buildInitialProfile(
                email,
                username,
                request.country(),
                request.location(),
                request.timezone(),
                request.phoneCountryCode(),
                request.phoneNumber(),
                "EMAIL",
                false,
                false
        ));
        userRepository.save(user);
        
        // Build JWT claims with roles
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());
        claims.put("role", userRole.name());
        String token = jwtService.generateToken(user.getEmail(), claims);

        // Audit log: registration successful
        safeAuditLog("REGISTER", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "role", userRole.name(),
            "status", "SUCCESS"
        ));

        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getFullName());
    }

    /**
     * Register user after OTP verification (with role support)
     */
    @Transactional
    public AuthResponse registerWithOTP(
            String email,
            String fullName,
            String password,
            String roleString,
            String requestedUsername,
            String verificationMethod,
            String country,
            String location,
            String timezone,
            String phoneCountryCode,
            String phoneNumber
    ) {
        email = email.toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String username = resolveAndEnsureUniqueUsername(requestedUsername, email);

        String hashed = passwordEncoder.encode(password);
        
        // Determine role (default to FREELANCER if not specified)
        UserRole userRole = UserRole.FREELANCER;
        if (roleString != null && !roleString.isBlank()) {
            UserRole parsed = UserRole.fromString(roleString);
            if (parsed != null && !parsed.isAdmin()) {
                userRole = parsed;
            }
        }
        
        Set<String> roles = Set.of(userRole.toSpringRole());
        User user = new User(email, username, fullName, hashed, roles);

        String normalizedMethod = verificationMethod != null ? verificationMethod.trim().toUpperCase(Locale.ROOT) : "EMAIL";
        boolean phoneMethod = "PHONE".equals(normalizedMethod);
        user.setProfile(buildInitialProfile(
                email,
                username,
                country,
                location,
                timezone,
                phoneCountryCode,
                phoneNumber,
                normalizedMethod,
                !phoneMethod,
                phoneMethod
        ));

        userRepository.save(user);

        // Build JWT claims with roles
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());
        claims.put("role", userRole.name());
        String token = jwtService.generateToken(user.getEmail(), claims);

        // Audit log: OTP-verified registration
        safeAuditLog("REGISTER_OTP", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "role", userRole.name(),
            "status", "SUCCESS",
            "verified", "true"
        ));

        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getFullName());
    }

    /**
     * Overload for backward compatibility
     */
    @Transactional
    public AuthResponse registerWithOTP(String email, String fullName, String password) {
        return registerWithOTP(email, fullName, password, "FREELANCER", null, "EMAIL", null, null, null, null, null);
    }

    public LoginResponse login(AuthRequest request) {
        String identifier = request.identifier() != null ? request.identifier().trim() : "";
        User user = findUserByIdentifier(identifier);
        if (user == null) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail().toLowerCase(), request.password())
        );
        String email = authentication.getName();
        user = userRepository.findByEmail(email).orElseThrow();

        if (isTwoFactorEnabled(user)) {
            String method = resolveTwoFactorMethod(user);
            String challengeId = verificationChallengeService.createLoginChallenge(user.getEmail(), method);
            try {
                issueLoginOtpChallenge(user, method);
            } catch (RuntimeException ex) {
                verificationChallengeService.deleteLoginChallenge(challengeId);
                throw ex;
            }

            safeAuditLog("LOGIN_CHALLENGE", "USER", user.getId(), Map.of(
                    "email", user.getEmail(),
                    "status", "PENDING",
                    "method", method,
                    "challengeId", challengeId
            ));

            return new LoginResponse(
                    null,
                    user.getEmail(),
                    user.getUsername(),
                    user.getFullName(),
                    true,
                    challengeId,
                    method,
                    "Two-step verification code sent"
            );
        }

        Map<String, Object> claims = buildClaims(user);
        String token = jwtService.generateToken(user.getEmail(), claims);
        String roleString = String.valueOf(claims.get("role"));

        // Audit log: login successful
        safeAuditLog("LOGIN", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "role", roleString,
            "status", "SUCCESS"
        ));

        return new LoginResponse(
                token,
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                false,
                null,
                null,
                "Login successful"
        );
    }

    public AuthResponse verifyLoginTwoFactor(
            String challengeId,
            String otpCode,
            String emailOtp,
            String phoneOtp,
            String authenticatorCode,
            String pinCode,
            String recoveryCode
    ) {
        if (challengeId == null || challengeId.isBlank()) {
            throw new IllegalArgumentException("Challenge ID is required");
        }

        VerificationChallengeService.LoginChallenge challenge = verificationChallengeService.requireLoginChallenge(challengeId);
        String email = challenge.email();
        String method = challenge.method();
        List<String> requiredChannels = challenge.requiredChannels() != null ? challenge.requiredChannels() : List.of("EMAIL");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean singleFactor = requiredChannels.size() == 1;
        boolean usedRecoveryCode = false;

        if (requiredChannels.contains("EMAIL")) {
            String emailCode = singleFactor
                    ? firstPresent(emailOtp, otpCode)
                    : emailOtp;
            if (emailCode == null || emailCode.isBlank()) {
                throw new IllegalArgumentException(singleFactor ? "OTP code is required" : "Email OTP is required");
            }

            boolean validEmail = otpService.verifyOTPWithAttempts(email, emailCode.trim(), OTP.OTPPurpose.LOGIN);
            if (!validEmail) {
                otpService.recordFailedAttempt(email, emailCode.trim(), OTP.OTPPurpose.LOGIN);
                throw new IllegalArgumentException("Invalid or expired verification code");
            }
        }

        if (requiredChannels.contains("PHONE")) {
            String smsCode = singleFactor
                    ? firstPresent(phoneOtp, otpCode)
                    : phoneOtp;
            if (smsCode == null || smsCode.isBlank()) {
                throw new IllegalArgumentException(singleFactor ? "OTP code is required" : "Phone OTP is required");
            }

            UserProfile profile = user.getProfile();
            String phoneNumber = profile != null ? profile.getPhoneNumber() : null;
            if (phoneNumber == null || phoneNumber.isBlank()) {
                throw new IllegalArgumentException("Phone number is not available for 2-step verification");
            }

            boolean validPhone = smsService.verifyCode(phoneNumber, smsCode.trim());
            if (!validPhone) {
                throw new IllegalArgumentException("Invalid or expired verification code");
            }
        }

        if (requiredChannels.contains("AUTHENTICATOR")) {
            String effectiveAuthenticatorCode = singleFactor
                    ? firstPresent(authenticatorCode, otpCode)
                    : authenticatorCode;
            usedRecoveryCode = twoFactorAuthService.verifyAuthenticatorChallenge(user, effectiveAuthenticatorCode, recoveryCode);
        }

        if (requiredChannels.contains("PIN")) {
            String effectivePinCode = singleFactor
                    ? firstPresent(pinCode, otpCode)
                    : pinCode;
            if (effectivePinCode == null || effectivePinCode.isBlank()) {
                throw new IllegalArgumentException(singleFactor ? "OTP code is required" : "Security PIN is required");
            }
            twoFactorAuthService.verifyPinChallenge(user, effectivePinCode);
        }

        verificationChallengeService.deleteLoginChallenge(challengeId);
        if (usedRecoveryCode) {
            userRepository.save(user);
        }

        Map<String, Object> claims = buildClaims(user);
        String token = jwtService.generateToken(user.getEmail(), claims);
        String roleString = String.valueOf(claims.get("role"));

        safeAuditLog("LOGIN", "USER", user.getId(), Map.of(
                "email", user.getEmail(),
                "role", roleString,
                "status", "SUCCESS",
                "twoFactor", "VERIFIED",
                "method", method,
                "recoveryCodeUsed", usedRecoveryCode
        ));

        return new AuthResponse(token, user.getEmail(), user.getUsername(), user.getFullName());
    }

    public void resendLoginTwoFactor(String challengeId) {
        if (challengeId == null || challengeId.isBlank()) {
            throw new IllegalArgumentException("Challenge ID is required");
        }

        VerificationChallengeService.LoginChallenge challenge = verificationChallengeService.requireLoginChallenge(challengeId);
        User user = userRepository.findByEmail(challenge.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String method = challenge.method();
        issueLoginOtpChallenge(user, method);
        verificationChallengeService.refreshLoginChallenge(challengeId, challenge);
    }

    private void safeAuditLog(String action, String entityType, String entityId, Map<String, Object> details) {
        try {
            auditService.log(action, entityType, entityId, details);
        } catch (Exception ex) {
            // Keep authentication flow available when audit persistence is transiently unavailable.
            log.warn("Audit logging failed for action {}: {}", action, ex.getMessage());
        }
    }

    private void issueLoginOtpChallenge(User user, String method) {
        if (usesPhoneFactor(method)) {
            UserProfile profile = user.getProfile();
            String phoneNumber = profile != null ? profile.getPhoneNumber() : null;
            if (phoneNumber == null || phoneNumber.isBlank()) {
                throw new IllegalArgumentException("2-step is enabled but no phone number is configured");
            }
            if (!smsService.isConfigured()) {
                throw new IllegalArgumentException("SMS service is not configured");
            }
            if (!smsService.isValidPhoneNumber(phoneNumber)) {
                throw new IllegalArgumentException("Phone number format is invalid for SMS verification");
            }
            smsService.sendVerificationCode(phoneNumber);
        }

        if (usesEmailFactor(method)) {
            if (!emailService.isConfigured()) {
                throw new IllegalArgumentException("Email service is not configured");
            }
            OTP otp = otpService.generateOTP(user.getEmail(), OTP.OTPType.EMAIL, OTP.OTPPurpose.LOGIN);
            emailService.sendOTPEmail(user.getEmail(), otp.getOtpCode(), user.getFullName());
        }
    }

    private boolean isTwoFactorEnabled(User user) {
        UserProfile profile = user.getProfile();
        return profile != null && Boolean.TRUE.equals(profile.getTwoFactorEnabled());
    }

    private String resolveTwoFactorMethod(User user) {
        UserProfile profile = user.getProfile();
        if (profile == null) {
            return "EMAIL";
        }

        String configured = normalizeConfiguredTwoFactorMethod(profile.getTwoFactorMethod());
        String fallback = resolveReadyTwoFactorMethod(profile);

        if (fallback.isBlank()) {
            throw new IllegalArgumentException("2-step verification is enabled but no verified factor is available");
        }

        if (configured.isBlank()) {
            return fallback;
        }

        List<String> readyFactors = TwoFactorMethodNormalizer.normalizeFactors(fallback);
        List<String> configuredFactors = TwoFactorMethodNormalizer.normalizeFactors(configured);
        List<String> availableConfiguredFactors = configuredFactors.stream()
                .filter(readyFactors::contains)
                .toList();

        if (!availableConfiguredFactors.isEmpty()) {
            return String.join("+", availableConfiguredFactors);
        }
        return fallback;
    }

    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());

        String roleString = "USER";
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            String firstRole = user.getRoles().iterator().next();
            UserRole userRole = UserRole.fromString(firstRole);
            if (userRole != null) {
                roleString = userRole.name();
            }
        }
        claims.put("role", roleString);
        return claims;
    }

    private User findUserByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return null;
        }

        String normalized = identifier.trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("@")) {
            return userRepository.findByEmail(normalized).orElse(null);
        }
        return userRepository.findByUsername(normalized).orElse(null);
    }

    private String resolveAndEnsureUniqueUsername(String requestedUsername, String email) {
        String requested = requestedUsername != null ? requestedUsername.trim().toLowerCase(Locale.ROOT) : "";
        String candidate = requested.isBlank() ? deriveUsernameFromEmail(email) : requested;
        candidate = sanitizeUsername(candidate);

        if (candidate.isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }

        String unique = candidate;
        int suffix = 1;
        while (userRepository.existsByUsername(unique)) {
            unique = candidate + suffix;
            suffix++;
        }
        return unique;
    }

    private String deriveUsernameFromEmail(String email) {
        if (email == null || email.isBlank()) {
            return "";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "";
        }
        return email.substring(0, atIndex);
    }

    private String sanitizeUsername(String username) {
        String cleaned = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        cleaned = cleaned.replaceAll("[^a-z0-9._-]", "");
        return cleaned.length() > 30 ? cleaned.substring(0, 30) : cleaned;
    }

    private UserProfile buildInitialProfile(
            String email,
            String username,
            String country,
            String location,
            String timezone,
            String phoneCountryCode,
            String phoneNumber,
            String verificationMethod,
            boolean emailVerified,
            boolean phoneVerified
    ) {
        UserProfile profile = new UserProfile();
        profile.setEmail(normalizeOptional(email));
        profile.setUsername(normalizeOptional(username));
        profile.setCountry(normalizeOptional(country));
        profile.setLocation(normalizeOptional(location));
        profile.setTimezone(normalizeOptional(timezone));
        profile.setPhoneCountryCode(normalizeOptional(phoneCountryCode));
        profile.setPhoneNumber(normalizeOptional(phoneNumber));
        profile.setTwoFactorMethod(normalizeTwoFactorMethod(verificationMethod));
        profile.setTwoFactorEnabled(false);
        profile.setEmailVerified(emailVerified);
        profile.setPhoneVerified(phoneVerified);
        return profile;
    }

    private String normalizeTwoFactorMethod(String method) {
        return TwoFactorMethodNormalizer.normalizeOrDefault(method, "EMAIL");
    }

    private String normalizeConfiguredTwoFactorMethod(String method) {
        return TwoFactorMethodNormalizer.normalize(method);
    }

    private String resolveReadyTwoFactorMethod(UserProfile profile) {
        List<String> factors = new ArrayList<>();
        boolean emailVerified = profile != null && Boolean.TRUE.equals(profile.getEmailVerified());
        boolean phoneVerified = profile != null && Boolean.TRUE.equals(profile.getPhoneVerified());

        if (emailVerified) {
            factors.add("EMAIL");
        }
        if (phoneVerified) {
            factors.add("PHONE");
        }
        if (twoFactorAuthService.isAuthenticatorReady(profile)) {
            factors.add("AUTHENTICATOR");
        }
        if (twoFactorAuthService.isPinReady(profile)) {
            factors.add("PIN");
        }
        return factors.isEmpty() ? "" : String.join("+", factors);
    }

    private boolean usesEmailFactor(String method) {
        return TwoFactorMethodNormalizer.usesEmailFactor(method);
    }

    private boolean usesPhoneFactor(String method) {
        return TwoFactorMethodNormalizer.usesPhoneFactor(method);
    }

    private String firstPresent(String primary, String fallback) {
        String normalizedPrimary = normalizeOptional(primary);
        if (normalizedPrimary != null) {
            return normalizedPrimary;
        }
        return normalizeOptional(fallback);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    /**
     * Reset password after OTP verification
     */
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        OTP.OTPStatus emailResetStatus = otpService.getOTPStatus(user.getEmail(), OTP.OTPPurpose.PASSWORD_RESET);
        if (emailResetStatus != OTP.OTPStatus.VERIFIED) {
            throw new IllegalArgumentException("Email OTP verification is required before password reset");
        }

        UserProfile profile = user.getProfile();
        String phoneNumber = profile != null ? profile.getPhoneNumber() : null;
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            OTP.OTPStatus phoneResetStatus = otpService.getOTPStatus(phoneNumber, OTP.OTPPurpose.PASSWORD_RESET);
            if (phoneResetStatus != OTP.OTPStatus.VERIFIED) {
                throw new IllegalArgumentException("Phone OTP verification is required before password reset");
            }
        }

        // Encode the new password
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hashedPassword);

        userRepository.save(user);

        // Consume OTPs after successful reset so they cannot be reused.
        otpService.expireLatestOTP(user.getEmail(), OTP.OTPPurpose.PASSWORD_RESET);
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            otpService.expireLatestOTP(phoneNumber, OTP.OTPPurpose.PASSWORD_RESET);
        }
    }
}
