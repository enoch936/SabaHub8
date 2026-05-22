package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.service.AdminBootstrapService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.web.dto.admin.AdminBootstrapDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Admin Bootstrap Controller
 * 
 * Enterprise-grade initialization endpoint for admin system setup.
 * Provides secure first-time admin initialization and promotion workflows.
 * 
 * Endpoints:
 * - POST /api/admin/bootstrap/initialize - Initialize first admin (requires no existing admins)
 * - GET /api/admin/bootstrap/status - Check system initialization status
 * - POST /api/admin/bootstrap/promote - Promote user to admin (requires admin authentication)
 */
@RestController
@RequestMapping("/api/admin/bootstrap")
@RequiredArgsConstructor
public class AdminBootstrapController {

    private final AdminBootstrapService bootstrapService;
    private final CurrentUserService currentUserService;

    /**
     * Initialize the first admin user in the system.
     * 
     * This endpoint is only accessible when NO admin users exist in the system.
     * After the first admin is created, this endpoint returns 403 Forbidden.
     * 
     * Security Features:
     * - Validates that no admins already exist
     * - Hashes password securely
     * - Enables MFA requirement
     * - Comprehensive audit logging
     * - Validates email uniqueness
     * 
     * @param request containing email, fullName, and password
     * @return 200 OK with created admin details and system initialized=true
     * @return 403 FORBIDDEN if admins already exist
     * @return 400 BAD_REQUEST if validation fails
     */
    @PostMapping("/initialize")
    public ResponseEntity<AdminBootstrapDTOs.InitializeAdminResponse> initializeFirstAdmin(
            @RequestBody AdminBootstrapDTOs.InitializeAdminRequest request) {
        try {
            AdminBootstrapDTOs.InitializeAdminResponse response = bootstrapService.initializeFirstAdmin(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            // Already has admins - return 403
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    /**
     * Check admin system initialization status.
     * 
     * Public endpoint (no authentication required) that returns:
     * - Whether system is initialized
     * - Total count of admin users
     * - Current system status
     * 
     * This is useful for UI logic to determine if setup wizard should be shown.
     * 
     * @return 200 OK with system status details
     */
    @GetMapping("/status")
    public ResponseEntity<AdminBootstrapDTOs.AdminSystemStatus> getSystemStatus() {
        AdminBootstrapDTOs.AdminSystemStatus status = bootstrapService.getSystemStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * Promote an existing user to admin status.
     * 
     * Requires the caller to already have admin privileges.
     * Useful for granting admin access to additional users after bootstrap.
     * 
     * Security Features:
     * - Requires authentication with ADMIN role
     * - Validates user exists
     * - Prevents re-promotion of existing admins
     * - Full audit trail with reason
     * 
     * @param promoteRequest containing userId and reason
     * @return 200 OK if promotion successful
     * @return 401 UNAUTHORIZED if caller is not authenticated
     * @return 403 FORBIDDEN if caller doesn't have admin role
     * @return 404 NOT_FOUND if user doesn't exist
     * @return 400 BAD_REQUEST if user already is admin
     */
    @PostMapping("/promote")
    public ResponseEntity<?> promoteUserToAdmin(
            @RequestBody AdminBootstrapDTOs.PromoteUserToAdminRequest promoteRequest) {
        try {
            User currentAdmin = currentUserService.requireUser();
            currentUserService.requireRole(currentAdmin, "ADMIN");
            
            promoteRequest.validate();
            User promotedUser = bootstrapService.promoteUserToAdmin(
                    promoteRequest.userId(),
                    currentAdmin,
                    promoteRequest.reason()
            );
            
            return ResponseEntity.ok(Map.of(
                    "message", "User promoted to admin successfully",
                    "userId", promotedUser.getId(),
                    "email", promotedUser.getEmail(),
                    "roles", promotedUser.getRoles()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
