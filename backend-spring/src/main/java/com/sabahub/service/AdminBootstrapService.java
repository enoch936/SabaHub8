package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.admin.AdminBootstrapDTOs;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Enterprise-grade admin bootstrap service.
 * Handles secure initialization of the first admin user and promotion workflows.
 */
@Service
@RequiredArgsConstructor
public class AdminBootstrapService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final HttpServletRequest request;

    /**
     * Check if the system has any admins initialized.
     * @return true if at least one admin exists
     */
    public boolean hasAdminUsers() {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .anyMatch(user -> user.getRoles() != null && 
                                 user.getRoles().stream()
                                     .anyMatch(role -> role.toUpperCase().contains("ADMIN")));
    }

    /**
     * Count total admin users in system.
     */
    public long countAdminUsers() {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .filter(user -> user.getRoles() != null && 
                               user.getRoles().stream()
                                   .anyMatch(role -> role.toUpperCase().contains("ADMIN")))
                .count();
    }

    /**
     * Initialize the first admin user in the system.
     * Only callable when no admins exist.
     * 
     * @param request the initialization request with email, name, password
     * @return response with newly created admin user details
     * @throws IllegalStateException if admins already exist
     */
    public AdminBootstrapDTOs.InitializeAdminResponse initializeFirstAdmin(
            AdminBootstrapDTOs.InitializeAdminRequest request) {
        
        // Validate request
        request.validate();
        
        // Security check: prevent initialization if admins already exist
        if (hasAdminUsers()) {
            String message = "System already has " + countAdminUsers() + " admin(s). " +
                           "Bootstrap initialization is locked. Use admin promotion workflow instead.";
            auditService.log(
                    "ADMIN_BOOTSTRAP_DENIED_ADMINS_EXIST",
                    "SECURITY_EVENT",
                    null,
                    Map.of("email", request.email(), "reason", "Admins already exist")
            );
            throw new IllegalStateException(message);
        }
        
        // Check if email already exists
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            auditService.log(
                    "ADMIN_BOOTSTRAP_DENIED_EMAIL_EXISTS",
                    "SECURITY_EVENT",
                    null,
                    Map.of("email", normalizedEmail)
            );
            throw new IllegalArgumentException("Email already exists in system");
        }
        
        // Create the admin user
        User adminUser = new User();
        adminUser.setEmail(normalizedEmail);
        adminUser.setFullName(request.fullName());
        adminUser.setPasswordHash(passwordEncoder.encode(request.password()));
        adminUser.setRoles(Set.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN"));
        adminUser.setSuspended(false);
        adminUser.setDocumentsVerified(true);
        
        // Set up access profile
        User.AccessProfile accessProfile = new User.AccessProfile();
        accessProfile.setRoleVersion("v1-bootstrap");
        accessProfile.setBootstrappedAt(Instant.now());
        adminUser.setAccessProfile(accessProfile);
        
        // Set up security profile
        User.SecurityProfile securityProfile = new User.SecurityProfile();
        securityProfile.setMfaRequired(true);
        securityProfile.setBootstrapInitialization(true);
        securityProfile.setBootstrappedAt(Instant.now());
        adminUser.setSecurityProfile(securityProfile);
        
        // Save to database
        User savedUser = userRepository.save(adminUser);
        
        // Audit logging - comprehensive security event
        Map<String, Object> auditMetadata = new HashMap<>();
        auditMetadata.put("email", normalizedEmail);
        auditMetadata.put("fullName", request.fullName());
        auditMetadata.put("roles", savedUser.getRoles());
        auditMetadata.put("userId", savedUser.getId());
        auditMetadata.put("mfaRequired", true);
        auditMetadata.put("bootstrapType", "FIRST_ADMIN_INITIALIZATION");
        
        auditService.log(
                "ADMIN_BOOTSTRAP_INITIALIZED",
                "ADMIN",
                savedUser.getId(),
                auditMetadata
        );
        
        return new AdminBootstrapDTOs.InitializeAdminResponse(
                savedUser.getId(),
                normalizedEmail,
                request.fullName(),
                savedUser.getRoles(),
                savedUser.getCreatedAt(),
                "Admin user successfully initialized. " +
                "MFA setup is required on first login. " +
                "You now have full platform administration access.",
                true
        );
    }

    /**
     * Get current admin system initialization status.
     */
    public AdminBootstrapDTOs.AdminSystemStatus getSystemStatus() {
        long adminCount = countAdminUsers();
        boolean initialized = adminCount > 0;
        
        String systemStatus;
        String message;
        
        if (initialized) {
            systemStatus = "INITIALIZED";
            message = "Admin system is initialized with " + adminCount + " admin(s).";
        } else {
            systemStatus = "AWAITING_INITIALIZATION";
            message = "No admin users found. System is ready for bootstrap initialization.";
        }
        
        return new AdminBootstrapDTOs.AdminSystemStatus(
                initialized,
                adminCount,
                systemStatus,
                message,
                Instant.now()
        );
    }

    /**
     * Promote an existing user to admin.
     * Requires the caller to already have admin privileges.
     * 
     * @param userId the user ID to promote
     * @param currentAdmin the admin user performing the promotion
     * @param reason audit reason for the promotion
     * @return updated user with admin roles
     */
    public User promoteUserToAdmin(String userId, User currentAdmin, String reason) {
        if (currentAdmin == null || !hasAdminRole(currentAdmin)) {
            auditService.log(
                    "ADMIN_PROMOTION_DENIED",
                    "SECURITY_EVENT",
                    userId,
                    Map.of("reason", "Unauthorized promotion attempt", "actorId", 
                           currentAdmin != null ? currentAdmin.getId() : "unknown")
            );
            throw new IllegalStateException("Only admins can promote users to admin");
        }
        
        User userToPromote = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        if (hasAdminRole(userToPromote)) {
            throw new IllegalArgumentException("User is already an admin");
        }
        
        // Add admin roles
        Set<String> updatedRoles = new java.util.LinkedHashSet<>(userToPromote.getRoles() != null ? 
                                                                   userToPromote.getRoles() : Set.of());
        updatedRoles.add("ROLE_ADMIN");
        userToPromote.setRoles(updatedRoles);
        
        User savedUser = userRepository.save(userToPromote);
        
        // Audit the promotion
        auditService.log(
                "ADMIN_USER_PROMOTED",
                "ADMIN",
                userId,
                Map.of(
                        "promotedUserEmail", userToPromote.getEmail(),
                        "promotionReason", reason,
                        "promotedBy", currentAdmin.getId(),
                        "promotedByEmail", currentAdmin.getEmail()
                )
        );
        
        return savedUser;
    }

    private boolean hasAdminRole(User user) {
        return user != null && user.getRoles() != null && 
               user.getRoles().stream()
                   .anyMatch(role -> role.toUpperCase().contains("ADMIN"));
    }
}
