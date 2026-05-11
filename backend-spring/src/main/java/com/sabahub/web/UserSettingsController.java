package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.domain.OTP;
import com.sabahub.domain.UserRole;
import com.sabahub.config.JwtService;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.AITaxonomyService;
import com.sabahub.service.CloudinaryMediaService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.EmailService;
import com.sabahub.service.OTPService;
import com.sabahub.service.SessionTrackingService;
import com.sabahub.service.SMSService;
import com.sabahub.service.TwoFactorAuthService;
import com.sabahub.service.TwoFactorMethodNormalizer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

/**
 * User Settings & Profile Management API
 * Endpoints for advanced user configuration like Upwork/Fiverr
 */
@RestController
@RequestMapping("/api/user/settings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserSettingsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private CloudinaryMediaService mediaService;

    @Autowired
    private OTPService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SMSService smsService;

    @Autowired
    private AITaxonomyService aiTaxonomyService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SessionTrackingService sessionTrackingService;

    @Autowired
    private TwoFactorAuthService twoFactorAuthService;

    /**
     * GET /api/user/settings - Get current user's settings/profile
     */
    @GetMapping
    public ResponseEntity<UserProfile> getSettings() {
        User user = currentUserService.requireUser();
        System.out.println("=== GET SETTINGS for user: " + user.getEmail() + " ===");
        boolean hadProfile = user.getProfile() != null;
        UserProfile profile = ensureProfile(user);
        if (!hadProfile) {
            System.out.println("Profile is NULL, creating empty profile");
        } else {
            System.out.println("Profile found - Bio: " + profile.getBio());
            System.out.println("Profile found - Location: " + profile.getLocation());
            System.out.println("Profile found - Skills: " + profile.getSkills());
        }
        normalizeTwoFactorConfiguration(profile);
        syncCoreProfileFields(user, profile);
        return ResponseEntity.ok(profile);
    }

    /**
     * PATCH /api/user/settings/contact - Update primary email/phone and return refreshed token.
     */
    @PatchMapping("/contact")
    @Transactional
    public ResponseEntity<?> updateContact(@RequestBody Map<String, String> payload,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader,
                                           HttpServletRequest request) {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);

        String nextEmail = payload.getOrDefault("email", "").trim().toLowerCase(Locale.ROOT);
        if (nextEmail.isBlank() || !nextEmail.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid email is required", "success", false));
        }

        String currentEmail = user.getEmail() != null ? user.getEmail().toLowerCase(Locale.ROOT) : "";
        boolean emailChanged = !nextEmail.equals(currentEmail);
        if (emailChanged && userRepository.existsByEmail(nextEmail)) {
            return ResponseEntity.status(409).body(Map.of("message", "Email already in use", "success", false));
        }

        String nextPhone = payload.get("phoneNumber");
        String nextPhoneCountryCode = normalizeOptional(payload.get("phoneCountryCode"));
        if (nextPhone != null) {
            nextPhone = nextPhone.trim();
            if (!nextPhone.isBlank() && !smsService.isValidPhoneNumber(nextPhone)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid phone number format", "success", false));
            }
        }

        String currentPhone = profile.getPhoneNumber() != null ? profile.getPhoneNumber() : "";
        boolean phoneChanged = nextPhone != null && !nextPhone.equals(currentPhone);

        if (emailChanged) {
            user.setEmail(nextEmail);
            profile.setEmail(nextEmail);
            profile.setEmailVerified(false);
        }

        if (phoneChanged) {
            profile.setPhoneNumber((nextPhone == null || nextPhone.isBlank()) ? null : nextPhone);
            profile.setPhoneVerified(false);
        }
        if (payload.containsKey("phoneCountryCode")) {
            profile.setPhoneCountryCode(nextPhoneCountryCode);
        }
        normalizeTwoFactorConfiguration(profile);

        syncCoreProfileFields(user, profile);
        user.setProfile(profile);
        User savedUser = userRepository.save(user);

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", savedUser.getRoles());
        String roleString = "USER";
        if (savedUser.getRoles() != null && !savedUser.getRoles().isEmpty()) {
            String firstRole = savedUser.getRoles().iterator().next();
            UserRole userRole = UserRole.fromString(firstRole);
            if (userRole != null) {
                roleString = userRole.name();
            }
        }
        claims.put("role", roleString);
        String refreshedToken = jwtService.generateToken(savedUser.getEmail(), claims);
        sessionTrackingService.trackSession(refreshedToken, savedUser.getEmail(), request);

        String previousToken = extractBearerToken(authHeader);
        if (!previousToken.isBlank()) {
            try {
                String previousJti = jwtService.extractJti(previousToken);
                sessionTrackingService.blacklistToken(previousToken);
                sessionTrackingService.removeSessionReference(currentEmail, previousJti);
            } catch (Exception ignored) {
            }
        }

        UserProfile responseProfile = savedUser.getProfile();
        if (responseProfile == null) {
            responseProfile = new UserProfile();
        }
        syncCoreProfileFields(savedUser, responseProfile);

        return ResponseEntity.ok(Map.of(
                "profile", responseProfile,
                "token", refreshedToken,
                "message", "Contact details updated"
        ));
    }

    /**
     * PATCH /api/user/settings - Update user settings/profile (partial update)
     */
    @PatchMapping
    @Transactional
    public ResponseEntity<UserProfile> updateSettings(@RequestBody UserProfile profileUpdate,
                                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        System.out.println("=== PATCH /api/user/settings CALLED ===");
        System.out.println("Authorization header: " + (authHeader != null ? authHeader.substring(0, Math.min(30, authHeader.length())) + "..." : "NULL"));
        
        User user = currentUserService.requireUser();
        System.out.println("=== UPDATE SETTINGS for user: " + user.getEmail() + " ===");
        System.out.println("Received update - Bio: " + profileUpdate.getBio());
        System.out.println("Received update - Location: " + profileUpdate.getLocation());
        System.out.println("Received update - Skills: " + profileUpdate.getSkills());
        
        boolean hadProfile = user.getProfile() != null;
        UserProfile profile = ensureProfile(user);
        if (!hadProfile) {
            System.out.println("Creating NEW profile object");
        }

        if (profileUpdate.getUsername() != null) {
            String requestedUsername = profileUpdate.getUsername().trim().toLowerCase(Locale.ROOT);
            if (requestedUsername.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            String currentUsername = user.getUsername() != null ? user.getUsername().toLowerCase(Locale.ROOT) : "";
            if (!requestedUsername.equals(currentUsername) && userRepository.existsByUsername(requestedUsername)) {
                return ResponseEntity.status(409).build();
            }
            user.setUsername(requestedUsername);
            profile.setUsername(requestedUsername);
        }

        // Update only non-null fields
        if (profileUpdate.getBio() != null) {
            System.out.println("Updating Bio: " + profileUpdate.getBio());
            profile.setBio(normalizeOptional(profileUpdate.getBio()));
        }
        if (profileUpdate.getProfilePictureUrl() != null) profile.setProfilePictureUrl(normalizeOptional(profileUpdate.getProfilePictureUrl()));
        if (profileUpdate.getCountry() != null) profile.setCountry(normalizeOptional(profileUpdate.getCountry()));
        if (profileUpdate.getLocation() != null) {
            System.out.println("Updating Location: " + profileUpdate.getLocation());
            profile.setLocation(normalizeOptional(profileUpdate.getLocation()));
        }
        if (profileUpdate.getTimezone() != null) profile.setTimezone(normalizeOptional(profileUpdate.getTimezone()));
        if (profileUpdate.getPhoneCountryCode() != null) profile.setPhoneCountryCode(normalizeOptional(profileUpdate.getPhoneCountryCode()));
        if (profileUpdate.getPhoneNumber() != null) {
            String nextPhoneNumber = normalizeOptional(profileUpdate.getPhoneNumber());
            if (!Objects.equals(nextPhoneNumber, profile.getPhoneNumber())) {
                profile.setPhoneNumber(nextPhoneNumber);
                profile.setPhoneVerified(false);
                normalizeTwoFactorConfiguration(profile);
            }
        }
        if (profileUpdate.getLanguage() != null) profile.setLanguage(normalizeOptional(profileUpdate.getLanguage()));
        
        if (profileUpdate.getSkills() != null) {
            System.out.println("Updating Skills: " + profileUpdate.getSkills());
            profile.setSkills(profileUpdate.getSkills());
        }
        if (profileUpdate.getCertifications() != null) profile.setCertifications(profileUpdate.getCertifications());
        if (profileUpdate.getExpertise() != null) profile.setExpertise(normalizeOptional(profileUpdate.getExpertise()));
        if (profileUpdate.getYearsOfExperience() != null) profile.setYearsOfExperience(profileUpdate.getYearsOfExperience());
        
        if (profileUpdate.getPortfolioUrls() != null) profile.setPortfolioUrls(profileUpdate.getPortfolioUrls());
        
        if (profileUpdate.getHourlyRate() != null) profile.setHourlyRate(normalizeOptional(profileUpdate.getHourlyRate()));
        if (profileUpdate.getAvailability() != null) profile.setAvailability(normalizeOptional(profileUpdate.getAvailability()));
        if (profileUpdate.getPreferredCategories() != null) profile.setPreferredCategories(profileUpdate.getPreferredCategories());
        if (profileUpdate.getOpenToOpportunities() != null) profile.setOpenToOpportunities(profileUpdate.getOpenToOpportunities());
        
        if (profileUpdate.getPaymentMethod() != null) profile.setPaymentMethod(normalizeOptional(profileUpdate.getPaymentMethod()));
        if (profileUpdate.getTaxId() != null) profile.setTaxId(normalizeOptional(profileUpdate.getTaxId()));
        
        if (profileUpdate.getEmailNotifications() != null) profile.setEmailNotifications(profileUpdate.getEmailNotifications());
        if (profileUpdate.getSmsNotifications() != null) profile.setSmsNotifications(profileUpdate.getSmsNotifications());
        if (profileUpdate.getHideProfile() != null) profile.setHideProfile(profileUpdate.getHideProfile());
        if (profileUpdate.getShowEarnings() != null) profile.setShowEarnings(profileUpdate.getShowEarnings());
        if (profileUpdate.getPreferredLanguage() != null) profile.setPreferredLanguage(normalizeOptional(profileUpdate.getPreferredLanguage()));
        if (profileUpdate.getTwoFactorEnabled() != null) profile.setTwoFactorEnabled(profileUpdate.getTwoFactorEnabled());
        if (profileUpdate.getTwoFactorMethod() != null) {
            String normalizedMethod = normalizeTwoFactorMethod(profileUpdate.getTwoFactorMethod());
            if (normalizedMethod == null) {
                return ResponseEntity.badRequest().build();
            }
            profile.setTwoFactorMethod(normalizedMethod);
        }

        if (Boolean.TRUE.equals(profile.getTwoFactorEnabled())) {
            String method = normalizeTwoFactorMethod(profile.getTwoFactorMethod());
            if (method == null || method.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            if (usesAuthenticatorFactor(method) && !twoFactorAuthService.isAuthenticatorReady(profile)) {
                return ResponseEntity.badRequest().build();
            }
            if (usesPinFactor(method) && !twoFactorAuthService.isPinReady(profile)) {
                return ResponseEntity.badRequest().build();
            }
            if (usesPhoneFactor(method) && !Boolean.TRUE.equals(profile.getPhoneVerified())) {
                return ResponseEntity.badRequest().build();
            }
            if (usesEmailFactor(method) && !Boolean.TRUE.equals(profile.getEmailVerified())) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        // Explicitly mark as modified and save
        syncCoreProfileFields(user, profile);
        user.setProfile(profile);
        System.out.println("Saving user with updated profile...");
        User savedUser = userRepository.save(user);
        syncCoreProfileFields(savedUser, savedUser.getProfile());
        System.out.println("User saved! Profile after save - Bio: " + savedUser.getProfile().getBio());
        
        return ResponseEntity.ok(savedUser.getProfile());
    }

    @PostMapping("/taxonomy/suggest")
    public ResponseEntity<Map<String, Object>> suggestSettingsTaxonomy(@RequestBody(required = false) UserProfile profileUpdate) {
        User user = currentUserService.requireUser();
        UserProfile baseProfile = user.getProfile() == null ? new UserProfile() : user.getProfile();
        UserProfile effectiveProfile = mergeProfilePreview(baseProfile, profileUpdate);
        if (effectiveProfile.getUsername() == null || effectiveProfile.getUsername().isBlank()) {
            effectiveProfile.setUsername(user.getUsername());
        }
        return ResponseEntity.ok(aiTaxonomyService.suggestUserSettings(effectiveProfile));
    }

    @GetMapping("/taxonomy/profile")
    public ResponseEntity<Map<String, Object>> suggestCurrentProfileTaxonomy() {
        return ResponseEntity.ok(aiTaxonomyService.suggestCurrentUserProfile());
    }

    /**
     * POST /api/user/settings/verify-phone - Initiate phone verification
     */
    @PostMapping("/verify-phone")
    public ResponseEntity<?> verifyPhone() {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);

        if (profile.getPhoneNumber() == null || profile.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number not set", "success", false));
        }

        if (!smsService.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "message", "SMS service not configured. Please contact administrator.",
                    "success", false
            ));
        }

        if (!smsService.isValidPhoneNumber(profile.getPhoneNumber())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid phone number format", "success", false));
        }

        smsService.sendVerificationCode(profile.getPhoneNumber());
        return ResponseEntity.ok(Map.of("message", "Verification code sent to phone", "success", true));
    }

    /**
     * POST /api/user/settings/verify-phone/request - Send SMS code for phone verification
     */
    @PostMapping("/verify-phone/request")
    public ResponseEntity<?> requestPhoneVerification() {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);
        if (Boolean.TRUE.equals(profile.getPhoneVerified())) {
            return ResponseEntity.ok(Map.of("message", "Phone already verified", "success", true));
        }
        if (profile.getPhoneNumber() == null || profile.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number not set", "success", false));
        }
        if (!smsService.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "message", "SMS service not configured. Please contact administrator.",
                    "success", false
            ));
        }
        if (!smsService.isValidPhoneNumber(profile.getPhoneNumber())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid phone number format", "success", false));
        }

        smsService.sendVerificationCode(profile.getPhoneNumber());
        return ResponseEntity.ok(Map.of("message", "Verification code sent to phone", "success", true));
    }

    /**
     * POST /api/user/settings/verify-phone/confirm - Confirm SMS code and mark verified
     */
    @PostMapping("/verify-phone/confirm")
    @Transactional
    public ResponseEntity<?> confirmPhoneVerification(@RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);
        if (Boolean.TRUE.equals(profile.getPhoneVerified())) {
            syncCoreProfileFields(user, profile);
            user.setProfile(profile);
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser.getProfile());
        }
        String phoneNumber = profile.getPhoneNumber();
        String otpCode = payload.get("otpCode");

        if (phoneNumber == null || phoneNumber.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Phone number not set", "success", false));
        }
        if (otpCode == null || otpCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP code is required", "success", false));
        }

        boolean approved = smsService.verifyCode(phoneNumber, otpCode);
        if (!approved) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP", "success", false));
        }

        profile.setPhoneVerified(true);
        syncCoreProfileFields(user, profile);
        user.setProfile(profile);
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser.getProfile());
    }

    /**
     * POST /api/user/settings/verify-email/request - Send email OTP for verification
     */
    @PostMapping("/verify-email/request")
    public ResponseEntity<?> requestEmailVerification() {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile();
        if (profile != null && Boolean.TRUE.equals(profile.getEmailVerified())) {
            return ResponseEntity.ok(Map.of("message", "Email already verified", "success", true));
        }
        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email not set", "success", false));
        }

        if (!emailService.isConfigured()) {
            return ResponseEntity.status(503).body(Map.of(
                    "message", "Email service not configured. Please contact administrator.",
                    "success", false
            ));
        }

        OTP otp = otpService.generateOTP(email, OTP.OTPType.EMAIL, OTP.OTPPurpose.EMAIL_VERIFICATION);
        emailService.sendOTPEmail(email, otp.getOtpCode(), user.getFullName());
        return ResponseEntity.ok(Map.of("message", "Verification code sent to your email", "success", true));
    }

    private UserProfile mergeProfilePreview(UserProfile baseProfile, UserProfile preview) {
        if (preview == null) {
            return baseProfile;
        }

        UserProfile merged = new UserProfile();
        merged.setUserId(baseProfile.getUserId());
        merged.setUsername(firstNonBlank(preview.getUsername(), baseProfile.getUsername()));
        merged.setEmail(firstNonBlank(preview.getEmail(), baseProfile.getEmail()));
        merged.setBio(firstNonBlank(preview.getBio(), baseProfile.getBio()));
        merged.setProfilePictureUrl(firstNonBlank(preview.getProfilePictureUrl(), baseProfile.getProfilePictureUrl()));
        merged.setCountry(firstNonBlank(preview.getCountry(), baseProfile.getCountry()));
        merged.setLocation(firstNonBlank(preview.getLocation(), baseProfile.getLocation()));
        merged.setTimezone(firstNonBlank(preview.getTimezone(), baseProfile.getTimezone()));
        merged.setPhoneCountryCode(firstNonBlank(preview.getPhoneCountryCode(), baseProfile.getPhoneCountryCode()));
        merged.setPhoneNumber(firstNonBlank(preview.getPhoneNumber(), baseProfile.getPhoneNumber()));
        merged.setLanguage(firstNonBlank(preview.getLanguage(), baseProfile.getLanguage()));
        merged.setSkills(preview.getSkills() != null ? preview.getSkills() : baseProfile.getSkills());
        merged.setCertifications(preview.getCertifications() != null ? preview.getCertifications() : baseProfile.getCertifications());
        merged.setExpertise(firstNonBlank(preview.getExpertise(), baseProfile.getExpertise()));
        merged.setYearsOfExperience(preview.getYearsOfExperience() != null ? preview.getYearsOfExperience() : baseProfile.getYearsOfExperience());
        merged.setPortfolioUrls(preview.getPortfolioUrls() != null ? preview.getPortfolioUrls() : baseProfile.getPortfolioUrls());
        merged.setCompletedProjects(preview.getCompletedProjects() != null ? preview.getCompletedProjects() : baseProfile.getCompletedProjects());
        merged.setAverageRating(preview.getAverageRating() != null ? preview.getAverageRating() : baseProfile.getAverageRating());
        merged.setTotalReviews(preview.getTotalReviews() != null ? preview.getTotalReviews() : baseProfile.getTotalReviews());
        merged.setHourlyRate(firstNonBlank(preview.getHourlyRate(), baseProfile.getHourlyRate()));
        merged.setAvailability(firstNonBlank(preview.getAvailability(), baseProfile.getAvailability()));
        merged.setPreferredCategories(preview.getPreferredCategories() != null ? preview.getPreferredCategories() : baseProfile.getPreferredCategories());
        merged.setOpenToOpportunities(preview.getOpenToOpportunities() != null ? preview.getOpenToOpportunities() : baseProfile.getOpenToOpportunities());
        merged.setPaymentMethod(firstNonBlank(preview.getPaymentMethod(), baseProfile.getPaymentMethod()));
        merged.setTaxId(firstNonBlank(preview.getTaxId(), baseProfile.getTaxId()));
        merged.setEmailNotifications(preview.getEmailNotifications() != null ? preview.getEmailNotifications() : baseProfile.getEmailNotifications());
        merged.setSmsNotifications(preview.getSmsNotifications() != null ? preview.getSmsNotifications() : baseProfile.getSmsNotifications());
        merged.setHideProfile(preview.getHideProfile() != null ? preview.getHideProfile() : baseProfile.getHideProfile());
        merged.setShowEarnings(preview.getShowEarnings() != null ? preview.getShowEarnings() : baseProfile.getShowEarnings());
        merged.setPreferredLanguage(firstNonBlank(preview.getPreferredLanguage(), baseProfile.getPreferredLanguage()));
        merged.setPhoneVerified(preview.getPhoneVerified() != null ? preview.getPhoneVerified() : baseProfile.getPhoneVerified());
        merged.setEmailVerified(preview.getEmailVerified() != null ? preview.getEmailVerified() : baseProfile.getEmailVerified());
        merged.setTwoFactorEnabled(preview.getTwoFactorEnabled() != null ? preview.getTwoFactorEnabled() : baseProfile.getTwoFactorEnabled());
        merged.setTwoFactorMethod(firstNonBlank(preview.getTwoFactorMethod(), baseProfile.getTwoFactorMethod()));
        merged.setIdentityVerified(preview.getIdentityVerified() != null ? preview.getIdentityVerified() : baseProfile.getIdentityVerified());
        merged.setIdentityVerificationMethod(firstNonBlank(preview.getIdentityVerificationMethod(), baseProfile.getIdentityVerificationMethod()));
        merged.setIdentityVerifiedAt(preview.getIdentityVerifiedAt() != null ? preview.getIdentityVerifiedAt() : baseProfile.getIdentityVerifiedAt());
        merged.setProfileViewsCount(preview.getProfileViewsCount() != null ? preview.getProfileViewsCount() : baseProfile.getProfileViewsCount());
        merged.setProposalsSentCount(preview.getProposalsSentCount() != null ? preview.getProposalsSentCount() : baseProfile.getProposalsSentCount());
        merged.setContractsCompletedCount(preview.getContractsCompletedCount() != null ? preview.getContractsCompletedCount() : baseProfile.getContractsCompletedCount());
        merged.setTotalEarnings(preview.getTotalEarnings() != null ? preview.getTotalEarnings() : baseProfile.getTotalEarnings());
        merged.setSuccessRate(preview.getSuccessRate() != null ? preview.getSuccessRate() : baseProfile.getSuccessRate());
        return merged;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback;
    }

    /**
     * POST /api/user/settings/verify-email/confirm - Confirm email OTP and mark verified
     */
    @PostMapping("/verify-email/confirm")
    @Transactional
    public ResponseEntity<?> confirmEmailVerification(@RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        String email = user.getEmail();
        String otpCode = payload.get("otpCode");
        UserProfile profile = user.getProfile();
        if (profile != null && Boolean.TRUE.equals(profile.getEmailVerified())) {
            syncCoreProfileFields(user, profile);
            user.setProfile(profile);
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser.getProfile());
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email not set", "success", false));
        }
        if (otpCode == null || otpCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP code is required", "success", false));
        }

        boolean isValid = otpService.verifyOTPWithAttempts(email, otpCode, OTP.OTPPurpose.EMAIL_VERIFICATION);
        if (!isValid) {
            otpService.recordFailedAttempt(email, otpCode, OTP.OTPPurpose.EMAIL_VERIFICATION);
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP", "success", false));
        }

        profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
        }
        profile.setEmailVerified(true);
        syncCoreProfileFields(user, profile);
        user.setProfile(profile);
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(savedUser.getProfile());
    }

    @PostMapping("/2fa/authenticator/setup")
    @Transactional
    public ResponseEntity<?> beginAuthenticatorSetup() {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);
        TwoFactorAuthService.AuthenticatorSetup setup = twoFactorAuthService.beginAuthenticatorSetup(user);
        syncCoreProfileFields(user, profile);
        user.setProfile(profile);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "setup", Map.of(
                        "secret", setup.secret(),
                        "otpAuthUrl", setup.otpAuthUrl(),
                        "issuer", setup.issuer(),
                        "accountName", setup.accountName()
                ),
                "profile", profile
        ));
    }

    @PostMapping("/2fa/enable")
    @Transactional
    public ResponseEntity<?> enableTwoFactor(@RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);

        String method = normalizeTwoFactorMethod(payload.get("method"));
        if (method == null || method.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "A valid 2-step method is required", "success", false));
        }

        if (usesPhoneFactor(method) && !Boolean.TRUE.equals(profile.getPhoneVerified())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verify your phone before enabling this method", "success", false));
        }
        if (usesEmailFactor(method) && !Boolean.TRUE.equals(profile.getEmailVerified())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verify your email before enabling this method", "success", false));
        }

        try {
            String authenticatorCode = firstNonBlank(
                payload.get("authenticatorCode"),
                firstNonBlank(
                    payload.get("totpCode"),
                    firstNonBlank(payload.get("toptp"), payload.get("otpAuthenticatorCode"))
                )
            );
            TwoFactorAuthService.ActivationResult result = twoFactorAuthService.enable(
                    user,
                    method,
                    payload.get("currentPassword"),
                authenticatorCode,
                    payload.get("pinCode")
            );
            normalizeTwoFactorConfiguration(profile);
            syncCoreProfileFields(user, profile);
            user.setProfile(profile);
            User savedUser = userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "profile", savedUser.getProfile(),
                    "recoveryCodes", result.recoveryCodes(),
                    "message", "2-step verification enabled"
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage(), "success", false));
        }
    }

    @PostMapping("/2fa/disable")
    @Transactional
    public ResponseEntity<?> disableTwoFactor(@RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);

        try {
            twoFactorAuthService.disable(user, payload.get("currentPassword"));
            syncCoreProfileFields(user, profile);
            user.setProfile(profile);
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "profile", savedUser.getProfile(),
                    "message", "2-step verification disabled"
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage(), "success", false));
        }
    }

    @PostMapping("/2fa/recovery-codes/regenerate")
    @Transactional
    public ResponseEntity<?> regenerateRecoveryCodes(@RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);

        try {
            String authenticatorCode = firstNonBlank(
                payload.get("authenticatorCode"),
                firstNonBlank(
                    payload.get("totpCode"),
                    firstNonBlank(payload.get("toptp"), payload.get("otpAuthenticatorCode"))
                )
            );
            TwoFactorAuthService.ActivationResult result = twoFactorAuthService.regenerateRecoveryCodes(
                    user,
                    payload.get("currentPassword"),
                authenticatorCode,
                    payload.get("recoveryCode")
            );
            syncCoreProfileFields(user, profile);
            user.setProfile(profile);
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "profile", savedUser.getProfile(),
                    "recoveryCodes", result.recoveryCodes(),
                    "message", "Recovery codes regenerated"
            ));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage(), "success", false));
        }
    }

    /**
     * POST /api/user/settings/avatar - Upload profile image and persist profilePictureUrl
     */
    @PostMapping("/avatar")
    @Transactional
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            User user = currentUserService.requireUser();
            UserProfile profile = ensureProfile(user);

            Map<String, String> result = mediaService.uploadProfileImage(file);
            String url = result.get("url");
            profile.setProfilePictureUrl(url);
            syncCoreProfileFields(user, profile);
            user.setProfile(profile);
            User savedUser = userRepository.save(user);

            return ResponseEntity.ok(savedUser.getProfile());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload avatar");
        }
    }

    /**
     * POST /api/user/settings/verify-identity - Initiate identity verification
     */
    @PostMapping("/verify-identity")
    public ResponseEntity<String> verifyIdentity(@RequestParam String method) {
        User user = currentUserService.requireUser();
        UserProfile profile = ensureProfile(user);
        
        // Placeholder implementation pending external identity-provider integration.
        // (Stripe Identity, IDology, etc.)
        profile.setIdentityVerificationMethod(method);
        profile.setIdentityVerifiedAt(System.currentTimeMillis());
        profile.setIdentityVerified(true);
        
        syncCoreProfileFields(user, profile);
        user.setProfile(profile);
        userRepository.save(user);
        
        return ResponseEntity.ok("Identity verification initiated: " + method);
    }

    /**
     * GET /api/user/profile/{userId} - Get public profile (for viewing other users)
     */
    @GetMapping("/public/{userId}")
    public ResponseEntity<UserProfile> getPublicProfile(@PathVariable String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        UserProfile profile = user.getProfile();
        if (profile == null || (profile.getHideProfile() != null && profile.getHideProfile())) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(profile);
    }

    private UserProfile ensureProfile(User user) {
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            user.setProfile(profile);
        }
        return profile;
    }

    private void syncCoreProfileFields(User user, UserProfile profile) {
        if (profile == null || user == null) {
            return;
        }
        profile.setUserId(user.getId());
        profile.setUsername(user.getUsername());
        profile.setEmail(user.getEmail());
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeTwoFactorMethod(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return "";
        }
        String normalized = TwoFactorMethodNormalizer.normalize(trimmed);
        return normalized.isBlank() ? null : normalized;
    }

    private boolean usesEmailFactor(String method) {
        return TwoFactorMethodNormalizer.usesEmailFactor(method);
    }

    private boolean usesPhoneFactor(String method) {
        return TwoFactorMethodNormalizer.usesPhoneFactor(method);
    }

    private boolean usesAuthenticatorFactor(String method) {
        return TwoFactorMethodNormalizer.isAuthenticatorFactor(method);
    }

    private boolean usesPinFactor(String method) {
        return TwoFactorMethodNormalizer.isPinFactor(method);
    }

    private void normalizeTwoFactorConfiguration(UserProfile profile) {
        if (profile == null || !Boolean.TRUE.equals(profile.getTwoFactorEnabled())) {
            return;
        }

        String method = normalizeTwoFactorMethod(profile.getTwoFactorMethod());
        boolean emailVerified = Boolean.TRUE.equals(profile.getEmailVerified());
        boolean phoneVerified = Boolean.TRUE.equals(profile.getPhoneVerified());
        boolean authenticatorReady = twoFactorAuthService.isAuthenticatorReady(profile);
        boolean pinReady = twoFactorAuthService.isPinReady(profile);

        if (!emailVerified && !phoneVerified && !authenticatorReady && !pinReady) {
            profile.setTwoFactorEnabled(false);
            profile.setTwoFactorMethod("");
            return;
        }

        String readyMethod = buildReadyTwoFactorMethod(emailVerified, phoneVerified, authenticatorReady, pinReady);
        if (readyMethod.isBlank()) {
            profile.setTwoFactorEnabled(false);
            profile.setTwoFactorMethod("");
            return;
        }

        if (method == null || method.isBlank()) {
            profile.setTwoFactorMethod(readyMethod);
            return;
        }

        var readyFactors = TwoFactorMethodNormalizer.normalizeFactors(readyMethod);
        var configuredFactors = TwoFactorMethodNormalizer.normalizeFactors(method);
        var availableConfiguredFactors = configuredFactors.stream()
                .filter(readyFactors::contains)
                .toList();

        if (!availableConfiguredFactors.isEmpty()) {
            profile.setTwoFactorMethod(String.join("+", availableConfiguredFactors));
        } else {
            profile.setTwoFactorMethod(readyMethod);
        }
    }

    private String buildReadyTwoFactorMethod(boolean emailVerified, boolean phoneVerified, boolean authenticatorReady, boolean pinReady) {
        StringBuilder builder = new StringBuilder();
        if (emailVerified) {
            builder.append("EMAIL");
        }
        if (phoneVerified) {
            if (builder.length() > 0) {
                builder.append('+');
            }
            builder.append("PHONE");
        }
        if (authenticatorReady) {
            if (builder.length() > 0) {
                builder.append('+');
            }
            builder.append("AUTHENTICATOR");
        }
        if (pinReady) {
            if (builder.length() > 0) {
                builder.append('+');
            }
            builder.append("PIN");
        }
        return builder.toString();
    }

    private String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "";
        }
        return authHeader.substring(7);
    }
}
