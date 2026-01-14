package com.sabahub.domain;

/**
 * User roles for SabaHub platform
 * 
 * Roles:
 * - EMPLOYER: Client who posts jobs/projects
 * - FREELANCER: Professional who completes work
 * - SUPER_ADMIN: Full platform access (user management, finance, support)
 * - SUPPORT_ADMIN: Support ticket handling, user disputes
 * - FINANCE_ADMIN: Payment/escrow/invoice management
 */
public enum UserRole {
    EMPLOYER("Employer", "Client who posts jobs"),
    FREELANCER("Freelancer", "Professional who completes work"),
    SUPER_ADMIN("Super Admin", "Full platform access"),
    SUPPORT_ADMIN("Support Admin", "User support & disputes"),
    FINANCE_ADMIN("Finance Admin", "Payments & escrow");

    private final String displayName;
    private final String description;

    UserRole(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if this role is an admin role
     */
    public boolean isAdmin() {
        return this == SUPER_ADMIN || this == SUPPORT_ADMIN || this == FINANCE_ADMIN;
    }

    /**
     * Convert to ROLE_ prefix format for Spring Security
     */
    public String toSpringRole() {
        return "ROLE_" + this.name();
    }

    /**
     * Parse role from string (handles both formats: ADMIN, ROLE_ADMIN, etc.)
     */
    public static UserRole fromString(String role) {
        if (role == null) return null;
        
        String normalized = role.trim().toUpperCase().replaceFirst("^ROLE_", "");
        
        try {
            return UserRole.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Fallback for old role names
            if ("ADMIN".equals(normalized)) {
                return SUPER_ADMIN;
            } else if ("USER".equals(normalized)) {
                return FREELANCER;
            }
            return null;
        }
    }
}
