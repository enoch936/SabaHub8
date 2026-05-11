package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.domain.UserRole;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.AdminIdentityManagementService;
import com.sabahub.service.AuditService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.web.dto.admin.AdminIdentityDTOs;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/users")
public class UserAdminController {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AdminIdentityManagementService adminIdentityManagementService;

    public UserAdminController(UserRepository userRepository,
                               CurrentUserService currentUserService,
                               PasswordEncoder passwordEncoder,
                               AuditService auditService,
                               AdminIdentityManagementService adminIdentityManagementService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.adminIdentityManagementService = adminIdentityManagementService;
    }

    @GetMapping
    public ResponseEntity<List<AdminIdentityDTOs.IdentityUserSummary>> list() {
        requireAdmin();
        return ResponseEntity.ok(userRepository.findAll().stream().map(adminIdentityManagementService::toUserSummary).toList());
    }

    @GetMapping("/workspace")
    public ResponseEntity<AdminIdentityDTOs.WorkspaceResponse> workspace() {
        requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.getWorkspace());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> patch(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User admin = requireAdmin();
        User user = userRepository.findById(id).orElseThrow();
        boolean previousSuspended = user.isSuspended();
        Set<String> previousRoles = new LinkedHashSet<>(user.getRoles() == null ? Set.of() : user.getRoles());

        if (body.containsKey("email")) {
            String email = requireNonBlank(body.get("email"), "Email is required").toLowerCase();
            if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(email);
        }
        if (body.containsKey("username")) {
            String username = normalizeOptionalString(body.get("username"));
            if (username != null && !username.equalsIgnoreCase(user.getUsername()) && userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username already exists");
            }
            user.setUsername(username);
        }
        if (body.containsKey("fullName")) {
            user.setFullName(requireNonBlank(body.get("fullName"), "Full name is required"));
        }
        if (body.containsKey("suspended")) {
            user.setSuspended(Boolean.TRUE.equals(body.get("suspended")) || Boolean.TRUE.equals(Boolean.valueOf(String.valueOf(body.get("suspended")))));
        }
        if (body.containsKey("documentsVerified")) {
            user.setDocumentsVerified(Boolean.TRUE.equals(body.get("documentsVerified")) || Boolean.TRUE.equals(Boolean.valueOf(String.valueOf(body.get("documentsVerified")))));
            User.IdentityReview identityReview = user.getIdentityReview() != null ? user.getIdentityReview() : new User.IdentityReview();
            identityReview.setDocumentVerified(user.isDocumentsVerified());
            if (Boolean.TRUE.equals(identityReview.getDocumentVerified())) {
                identityReview.setStatus("VERIFIED");
                identityReview.setVerifiedAt(Instant.now());
                identityReview.setVerifiedBy(admin.getId());
            }
            user.setIdentityReview(identityReview);
        }
        if (body.containsKey("roles")) {
            user.setRoles(normalizeRoles(body.get("roles")));
            User.AccessProfile accessProfile = user.getAccessProfile() != null ? user.getAccessProfile() : new User.AccessProfile();
            accessProfile.setRoleVersion("v" + Math.max(1, user.getRoles().size()) + "-" + Instant.now().toEpochMilli());
            user.setAccessProfile(accessProfile);
        }
        if (body.containsKey("password")) {
            String password = normalizeOptionalString(body.get("password"));
            if (password != null && password.length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters");
            }
            if (password != null) {
                user.setPasswordHash(passwordEncoder.encode(password));
                User.SecurityProfile securityProfile = user.getSecurityProfile() != null ? user.getSecurityProfile() : new User.SecurityProfile();
                securityProfile.setPasswordUpdatedAt(Instant.now());
                securityProfile.setForcePasswordReset(false);
                user.setSecurityProfile(securityProfile);
            }
        }

        userRepository.save(user);
        auditService.log("ADMIN_USER_UPDATED", "USER", user.getId(), Map.of(
                "targetEmail", user.getEmail(),
                "actorUserId", admin.getId()
        ));
        if (!previousSuspended && user.isSuspended()) {
            auditService.log("ADMIN_USER_SUSPENDED", "USER", user.getId(), Map.of(
                    "targetEmail", user.getEmail(),
                    "actorUserId", admin.getId()
            ));
        }
        if (previousSuspended && !user.isSuspended()) {
            auditService.log("ADMIN_USER_REACTIVATED", "USER", user.getId(), Map.of(
                    "targetEmail", user.getEmail(),
                    "actorUserId", admin.getId()
            ));
        }
        if (!Objects.equals(previousRoles, user.getRoles())) {
            auditService.log("ADMIN_USER_ROLES_REPLACED", "USER", user.getId(), Map.of(
                    "targetEmail", user.getEmail(),
                    "actorUserId", admin.getId(),
                    "roles", user.getRoles()
            ));
        }
        return ResponseEntity.ok(adminIdentityManagementService.toUserSummary(user));
    }

    @PostMapping
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> create(@RequestBody Map<String, Object> body) {
        User admin = requireAdmin();

        String email = requireNonBlank(body.get("email"), "Email is required").toLowerCase();
        String fullName = requireNonBlank(body.get("fullName"), "Full name is required");
        String password = requireNonBlank(body.get("password"), "Password is required");
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String username = normalizeOptionalString(body.get("username"));
        if (username != null && userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }

        Set<String> roles = body.containsKey("roles") ? normalizeRoles(body.get("roles")) : Set.of(UserRole.FREELANCER.toSpringRole());

        User user = new User(email, username, fullName, passwordEncoder.encode(password), roles);
        user.setSuspended(parseBoolean(body.get("suspended")));
        user.setDocumentsVerified(parseBoolean(body.get("documentsVerified")));
        user.setCreatedAt(Instant.now());
        user.setProfile(new com.sabahub.domain.UserProfile());
        user.setIdentityReview(User.IdentityReview.builder()
                .status(user.isDocumentsVerified() ? "VERIFIED" : "UNVERIFIED")
                .emailVerified(false)
                .phoneVerified(false)
                .documentVerified(user.isDocumentsVerified())
                .verifiedBy(user.isDocumentsVerified() ? admin.getId() : null)
                .verifiedAt(user.isDocumentsVerified() ? Instant.now() : null)
                .build());
        user.setAccessProfile(User.AccessProfile.builder()
                .accessLevel("STANDARD")
                .accessScope("PLATFORM")
                .permissions(new LinkedHashSet<>())
                .roleVersion("v1")
                .build());
        user.setSecurityProfile(User.SecurityProfile.builder()
                .mfaRequired(false)
                .mfaEnabled(false)
                .oauthEnabled(true)
                .ssoEnabled(false)
                .adaptiveAuthEnabled(true)
                .forcePasswordReset(false)
                .banned(false)
                .riskLevel("LOW")
                .failedLoginAttempts(0)
                .passwordUpdatedAt(Instant.now())
                .blacklistedIps(new ArrayList<>())
                .blacklistedDevices(new ArrayList<>())
                .build());
        user.setWarningRecords(new ArrayList<>());

        User saved = userRepository.save(user);
        auditService.log("ADMIN_USER_CREATED", "USER", saved.getId(), Map.of(
                "targetEmail", saved.getEmail(),
                "actorUserId", admin.getId(),
                "roles", saved.getRoles()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(adminIdentityManagementService.toUserSummary(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable String id) {
        User admin = requireAdmin();
        User user = userRepository.findById(id).orElseThrow();

        if (Objects.equals(admin.getId(), user.getId())) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }

        userRepository.delete(user);
        auditService.log("ADMIN_USER_DELETED", "USER", user.getId(), Map.of(
                "targetEmail", user.getEmail(),
                "actorUserId", admin.getId()
        ));

        return ResponseEntity.ok(Map.of("deleted", true, "id", id));
    }

    @PostMapping("/{id}/roles/grant")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> grantRole(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User admin = requireAdmin();
        User user = userRepository.findById(id).orElseThrow();
        String role = normalizeRole(requireNonBlank(body.get("role"), "Role is required"));

        Set<String> roles = new LinkedHashSet<>(user.getRoles() == null ? Set.of() : user.getRoles());
        roles.add(role);
        user.setRoles(roles);
        User.AccessProfile accessProfile = user.getAccessProfile() != null ? user.getAccessProfile() : new User.AccessProfile();
        accessProfile.setRoleVersion("v" + Math.max(1, roles.size()) + "-" + Instant.now().toEpochMilli());
        user.setAccessProfile(accessProfile);
        userRepository.save(user);

        auditService.log("ADMIN_USER_ROLE_GRANTED", "USER", user.getId(), Map.of(
                "targetEmail", user.getEmail(),
                "actorUserId", admin.getId(),
                "role", role
        ));

        return ResponseEntity.ok(adminIdentityManagementService.toUserSummary(user));
    }

    @PostMapping("/{id}/roles/revoke")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> revokeRole(@PathVariable String id, @RequestBody Map<String, Object> body) {
        User admin = requireAdmin();
        User user = userRepository.findById(id).orElseThrow();
        String role = normalizeRole(requireNonBlank(body.get("role"), "Role is required"));

        Set<String> roles = new LinkedHashSet<>(user.getRoles() == null ? Set.of() : user.getRoles());
        roles.remove(role);
        if (roles.isEmpty()) {
            throw new IllegalArgumentException("User must keep at least one role");
        }
        if (Objects.equals(admin.getId(), user.getId()) && !hasAnyAdminRole(roles)) {
            throw new IllegalArgumentException("You cannot revoke your own last admin role");
        }
        user.setRoles(roles);
        User.AccessProfile accessProfile = user.getAccessProfile() != null ? user.getAccessProfile() : new User.AccessProfile();
        accessProfile.setRoleVersion("v" + Math.max(1, roles.size()) + "-" + Instant.now().toEpochMilli());
        user.setAccessProfile(accessProfile);
        userRepository.save(user);

        auditService.log("ADMIN_USER_ROLE_REVOKED", "USER", user.getId(), Map.of(
                "targetEmail", user.getEmail(),
                "actorUserId", admin.getId(),
                "role", role
        ));

        return ResponseEntity.ok(adminIdentityManagementService.toUserSummary(user));
    }

    @PostMapping("/roles")
    public ResponseEntity<AdminIdentityDTOs.RoleDefinitionSummary> createRole(@RequestBody AdminIdentityDTOs.CreateRoleRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED).body(adminIdentityManagementService.createRole(request, actor));
    }

    @PatchMapping("/roles/{roleId}")
    public ResponseEntity<AdminIdentityDTOs.RoleDefinitionSummary> updateRole(@PathVariable String roleId,
                                                                              @RequestBody AdminIdentityDTOs.UpdateRoleRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.updateRole(roleId, request, actor));
    }

    @PostMapping("/{id}/access-control")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> applyAccessControl(@PathVariable String id,
                                                                                    @RequestBody AdminIdentityDTOs.AccessControlRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.applyAccessControl(id, request, actor));
    }

    @PostMapping("/{id}/identity-verification")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> reviewIdentity(@PathVariable String id,
                                                                                @RequestBody AdminIdentityDTOs.IdentityVerificationRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.reviewIdentity(id, request, actor));
    }

    @PostMapping("/{id}/credential-reset")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> resetCredentials(@PathVariable String id,
                                                                                  @RequestBody AdminIdentityDTOs.CredentialResetRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.resetCredentials(id, request, actor));
    }

    @PostMapping("/{id}/warnings")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> issueWarning(@PathVariable String id,
                                                                              @RequestBody AdminIdentityDTOs.WarningRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.issueWarning(id, request, actor));
    }

    @PostMapping("/{id}/warnings/{warningId}/resolve")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> resolveWarning(@PathVariable String id,
                                                                                @PathVariable String warningId,
                                                                                @RequestBody AdminIdentityDTOs.WarningResolutionRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.resolveWarning(id, warningId, request, actor));
    }

    @PostMapping("/{id}/malicious-control")
    public ResponseEntity<AdminIdentityDTOs.IdentityUserSummary> maliciousControl(@PathVariable String id,
                                                                                  @RequestBody AdminIdentityDTOs.MaliciousControlRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.handleMaliciousControl(id, request, actor));
    }

    @PostMapping("/policies")
    public ResponseEntity<AdminIdentityDTOs.PolicySummary> updatePolicies(@RequestBody AdminIdentityDTOs.UpdatePoliciesRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminIdentityManagementService.updatePolicies(request, actor));
    }

    private User requireAdmin() {
        User me = currentUserService.requireUser();
        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN")
                || currentUserService.hasRole(me, "SUPPORT_ADMIN")
                || currentUserService.hasRole(me, "FINANCE_ADMIN");
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }
        return me;
    }

    private Set<String> normalizeRoles(Object rawRoles) {
        if (!(rawRoles instanceof List<?> items)) {
            throw new IllegalArgumentException("Roles must be a list");
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (Object item : items) {
            String role = normalizeRole(requireNonBlank(item, "Role is required"));
            normalized.add(role);
        }
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("At least one role is required");
        }
        return normalized;
    }

    private String normalizeRole(String role) {
        UserRole parsed = UserRole.fromString(role);
        if (parsed != null) {
            return parsed.toSpringRole();
        }
        String normalized = role.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        return normalized;
    }

    private String requireNonBlank(Object value, String message) {
        String normalized = normalizeOptionalString(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptionalString(Object value) {
        if (value == null) {
            return null;
        }
        String normalized = String.valueOf(value).trim();
        return normalized.isBlank() ? null : normalized;
    }

    private boolean parseBoolean(Object value) {
        return Boolean.TRUE.equals(value) || Boolean.parseBoolean(String.valueOf(value));
    }

    private boolean hasAnyAdminRole(Set<String> roles) {
        return roles.stream().anyMatch(role -> {
            UserRole parsed = UserRole.fromString(role);
            return parsed != null && parsed.isAdmin();
        });
    }
}
