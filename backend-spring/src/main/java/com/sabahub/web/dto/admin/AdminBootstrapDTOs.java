package com.sabahub.web.dto.admin;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class AdminBootstrapDTOs {

    private AdminBootstrapDTOs() {
    }

    /**
     * Request to initialize the first admin user in the system.
     * Only valid when no admins exist.
     */
    public record InitializeAdminRequest(
            String email,
            String fullName,
            String password
    ) {
        public void validate() {
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Email is required");
            }
            if (fullName == null || fullName.isBlank()) {
                throw new IllegalArgumentException("Full name is required");
            }
            if (password == null || password.length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters");
            }
            String normalizedEmail = email.trim().toLowerCase();
            if (!normalizedEmail.contains("@")) {
                throw new IllegalArgumentException("Email must be valid");
            }
        }
    }

    /**
     * Response after successfully initializing an admin user.
     */
    public record InitializeAdminResponse(
            String userId,
            String email,
            String fullName,
            Set<String> roles,
            Instant createdAt,
            String message,
            boolean systemInitialized
    ) {
    }

    /**
     * Status of admin system initialization.
     */
    public record AdminSystemStatus(
            boolean initialized,
            long totalAdmins,
            String systemStatus,
            String message,
            Instant lastUpdated
    ) {
    }

    /**
     * Request to promote an existing user to admin.
     * Requires authentication and existing admin role.
     */
    public record PromoteUserToAdminRequest(
            String userId,
            String reason
    ) {
        public void validate() {
            if (userId == null || userId.isBlank()) {
                throw new IllegalArgumentException("User ID is required");
            }
            if (reason == null || reason.isBlank()) {
                throw new IllegalArgumentException("Reason is required");
            }
        }
    }

    /**
     * Audit record for admin initialization events.
     */
    public record AdminInitializationAudit(
            String eventId,
            String action,
            String email,
            String ipAddress,
            String userAgent,
            Instant timestamp,
            String status,
            String details
    ) {
    }
}
