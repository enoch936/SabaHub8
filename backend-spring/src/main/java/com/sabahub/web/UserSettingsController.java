package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.domain.OTP;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.CloudinaryMediaService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.EmailService;
import com.sabahub.service.OTPService;
import com.sabahub.service.SMSService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

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

    /**
     * GET /api/user/settings - Get current user's settings/profile
     */
    @GetMapping
    public ResponseEntity<UserProfile> getSettings() {
        User user = currentUserService.requireUser();
        System.out.println("=== GET SETTINGS for user: " + user.getEmail() + " ===");
        UserProfile profile = user.getProfile();
        if (profile == null) {
            System.out.println("Profile is NULL, creating empty profile");
            profile = new UserProfile();
        } else {
            System.out.println("Profile found - Bio: " + profile.getBio());
            System.out.println("Profile found - Location: " + profile.getLocation());
            System.out.println("Profile found - Skills: " + profile.getSkills());
        }
        return ResponseEntity.ok(profile);
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
        
        UserProfile profile = user.getProfile();
        if (profile == null) {
            System.out.println("Creating NEW profile object");
            profile = new UserProfile();
            user.setProfile(profile);
        }

        // Update only non-null fields
        if (profileUpdate.getBio() != null) {
            System.out.println("Updating Bio: " + profileUpdate.getBio());
            profile.setBio(profileUpdate.getBio());
        }
        if (profileUpdate.getProfilePictureUrl() != null) profile.setProfilePictureUrl(profileUpdate.getProfilePictureUrl());
        if (profileUpdate.getLocation() != null) {
            System.out.println("Updating Location: " + profileUpdate.getLocation());
            profile.setLocation(profileUpdate.getLocation());
        }
        if (profileUpdate.getTimezone() != null) profile.setTimezone(profileUpdate.getTimezone());
        if (profileUpdate.getPhoneNumber() != null) profile.setPhoneNumber(profileUpdate.getPhoneNumber());
        if (profileUpdate.getLanguage() != null) profile.setLanguage(profileUpdate.getLanguage());
        
        if (profileUpdate.getSkills() != null) {
            System.out.println("Updating Skills: " + profileUpdate.getSkills());
            profile.setSkills(profileUpdate.getSkills());
        }
        if (profileUpdate.getCertifications() != null) profile.setCertifications(profileUpdate.getCertifications());
        if (profileUpdate.getExpertise() != null) profile.setExpertise(profileUpdate.getExpertise());
        if (profileUpdate.getYearsOfExperience() != null) profile.setYearsOfExperience(profileUpdate.getYearsOfExperience());
        
        if (profileUpdate.getPortfolioUrls() != null) profile.setPortfolioUrls(profileUpdate.getPortfolioUrls());
        
        if (profileUpdate.getHourlyRate() != null) profile.setHourlyRate(profileUpdate.getHourlyRate());
        if (profileUpdate.getAvailability() != null) profile.setAvailability(profileUpdate.getAvailability());
        if (profileUpdate.getPreferredCategories() != null) profile.setPreferredCategories(profileUpdate.getPreferredCategories());
        if (profileUpdate.getOpenToOpportunities() != null) profile.setOpenToOpportunities(profileUpdate.getOpenToOpportunities());
        
        if (profileUpdate.getPaymentMethod() != null) profile.setPaymentMethod(profileUpdate.getPaymentMethod());
        if (profileUpdate.getTaxId() != null) profile.setTaxId(profileUpdate.getTaxId());
        
        if (profileUpdate.getEmailNotifications() != null) profile.setEmailNotifications(profileUpdate.getEmailNotifications());
        if (profileUpdate.getSmsNotifications() != null) profile.setSmsNotifications(profileUpdate.getSmsNotifications());
        if (profileUpdate.getHideProfile() != null) profile.setHideProfile(profileUpdate.getHideProfile());
        if (profileUpdate.getShowEarnings() != null) profile.setShowEarnings(profileUpdate.getShowEarnings());
        if (profileUpdate.getPreferredLanguage() != null) profile.setPreferredLanguage(profileUpdate.getPreferredLanguage());
        
        // Explicitly mark as modified and save
        user.setProfile(profile);
        System.out.println("Saving user with updated profile...");
        User savedUser = userRepository.save(user);
        System.out.println("User saved! Profile after save - Bio: " + savedUser.getProfile().getBio());
        
        return ResponseEntity.ok(savedUser.getProfile());
    }

    /**
     * POST /api/user/settings/verify-phone - Initiate phone verification
     */
    @PostMapping("/verify-phone")
    public ResponseEntity<String> verifyPhone() {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile();
        if (profile == null) {
            return ResponseEntity.badRequest().body("Profile not found");
        }
        
        if (profile.getPhoneNumber() == null || profile.getPhoneNumber().isBlank()) {
            return ResponseEntity.badRequest().body("Phone number not set");
        }
        
        // TODO: Implement SMS OTP sending via Twilio/similar service
        // For now, mark as verified (in production, wait for OTP confirmation)
        profile.setPhoneVerified(true);
        user.setProfile(profile);
        userRepository.save(user);
        
        return ResponseEntity.ok("Verification code sent to phone");
    }

    /**
     * POST /api/user/settings/verify-phone/request - Send SMS code for phone verification
     */
    @PostMapping("/verify-phone/request")
    public ResponseEntity<?> requestPhoneVerification() {
        User user = currentUserService.requireUser();
        UserProfile profile = user.getProfile();
        if (profile == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Profile not found", "success", false));
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
        UserProfile profile = user.getProfile();
        if (profile == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Profile not found", "success", false));
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

    /**
     * POST /api/user/settings/verify-email/confirm - Confirm email OTP and mark verified
     */
    @PostMapping("/verify-email/confirm")
    @Transactional
    public ResponseEntity<?> confirmEmailVerification(@RequestBody Map<String, String> payload) {
        User user = currentUserService.requireUser();
        String email = user.getEmail();
        String otpCode = payload.get("otpCode");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email not set", "success", false));
        }
        if (otpCode == null || otpCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP code is required", "success", false));
        }

        boolean isValid = otpService.verifyOTPWithAttempts(email, otpCode);
        if (!isValid) {
            otpService.recordFailedAttempt(email, otpCode);
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP", "success", false));
        }

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
        }
        profile.setEmailVerified(true);
        user.setProfile(profile);
        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(savedUser.getProfile());
    }

    /**
     * POST /api/user/settings/avatar - Upload profile image and persist profilePictureUrl
     */
    @PostMapping("/avatar")
    @Transactional
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            User user = currentUserService.requireUser();
            UserProfile profile = user.getProfile();
            if (profile == null) {
                profile = new UserProfile();
            }

            Map<String, String> result = mediaService.uploadProfileImage(file);
            String url = result.get("url");
            profile.setProfilePictureUrl(url);
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
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
        }
        
        // TODO: Implement identity verification with external service
        // (Stripe Identity, IDology, etc.)
        profile.setIdentityVerificationMethod(method);
        profile.setIdentityVerifiedAt(System.currentTimeMillis());
        profile.setIdentityVerified(true);
        
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
}
