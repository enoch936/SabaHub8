package com.sabahub.service;

import com.sabahub.domain.AuditLog;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.IdentityPolicyConfig;
import com.sabahub.domain.IdentityRoleDefinition;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.domain.UserRole;
import com.sabahub.repository.AuditLogRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.IdentityPolicyConfigRepository;
import com.sabahub.repository.IdentityRoleDefinitionRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.admin.AdminIdentityDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminIdentityManagementService {

    private static final String POLICY_ID = "identity-policy";
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    private static final List<SeedRole> SEED_ROLES = List.of(
            new SeedRole("ROLE_SUPER_ADMIN", "Super Admin", "Full platform administration and identity governance", List.of(
                    "users.read", "users.write", "users.delete", "roles.manage", "permissions.manage", "security.audit", "policies.manage", "iam.export"
            )),
            new SeedRole("ROLE_SUPPORT_ADMIN", "Support Admin", "Customer operations and account remediation", List.of(
                    "users.read", "users.suspend", "warnings.manage", "verification.review", "activity.read"
            )),
            new SeedRole("ROLE_FINANCE_ADMIN", "Finance Admin", "Financial risk and controlled payout access", List.of(
                    "users.read", "finance.review", "fraud.review", "activity.read"
            )),
            new SeedRole("ROLE_EMPLOYER", "Employer", "Organization account with team and hiring permissions", List.of(
                    "jobs.create", "jobs.manage", "proposals.review", "contracts.manage"
            )),
            new SeedRole("ROLE_FREELANCER", "Freelancer", "Independent contributor with proposal and contract access", List.of(
                    "profile.manage", "proposals.submit", "contracts.view", "wallet.view"
            ))
    );

    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;
    private final AuditLogRepository auditLogRepository;
    private final IdentityRoleDefinitionRepository identityRoleDefinitionRepository;
    private final IdentityPolicyConfigRepository identityPolicyConfigRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final ChatPresenceService chatPresenceService;

    public AdminIdentityDTOs.WorkspaceResponse getWorkspace() {
        ensureSeedRoles();
        IdentityPolicyConfig policies = ensurePolicyConfig();

        List<User> users = userRepository.findAll().stream()
                .sorted(Comparator.comparing(this::sortName))
                .toList();

        Map<String, Employer> employersByUserId = employerRepository.findAll().stream()
                .filter(employer -> employer.getUserId() != null)
                .collect(Collectors.toMap(Employer::getUserId, Function.identity(), (left, right) -> left));

        Map<String, Freelancer> freelancersByUserId = freelancerRepository.findAll().stream()
                .filter(freelancer -> freelancer.getUserId() != null)
                .collect(Collectors.toMap(Freelancer::getUserId, Function.identity(), (left, right) -> left));

        List<IdentityRoleDefinition> roleDefinitions = identityRoleDefinitionRepository.findAll().stream()
                .sorted(Comparator.comparing(role -> defaultString(role.getLabel(), defaultString(role.getKey(), "~")), String.CASE_INSENSITIVE_ORDER))
                .toList();

        Map<String, Long> assignedUsersByRole = buildAssignedUsersByRole(users);
        List<AuditLog> auditLogs = auditLogRepository.findAll().stream()
                .filter(this::isIdentityAudit)
                .sorted(Comparator.comparing(AuditLog::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();

        List<AdminIdentityDTOs.IdentityUserSummary> userSummaries = users.stream()
                .map(user -> toUserSummary(user, employersByUserId.get(user.getId()), freelancersByUserId.get(user.getId())))
                .toList();

        return new AdminIdentityDTOs.WorkspaceResponse(
                Instant.now(),
                buildMetrics(userSummaries),
                buildActivityTrend(users, auditLogs),
                buildRoleDistribution(roleDefinitions, assignedUsersByRole),
                buildVerificationDistribution(userSummaries),
                buildStateDistribution(userSummaries),
                userSummaries,
                roleDefinitions.stream().map(role -> toRoleSummary(role, assignedUsersByRole.getOrDefault(role.getKey(), 0L))).toList(),
                toPolicySummary(policies),
                buildAlerts(userSummaries, policies),
                auditLogs.stream().limit(40).map(this::toAuditEntry).toList()
        );
    }

    public AdminIdentityDTOs.RoleDefinitionSummary createRole(AdminIdentityDTOs.CreateRoleRequest request, User actor) {
        ensureSeedRoles();

        String key = normalizeRoleKey(requireNonBlank(request.key(), "Role key is required"));
        if (identityRoleDefinitionRepository.existsByKey(key)) {
            throw new IllegalArgumentException("Role key already exists");
        }

        IdentityRoleDefinition roleDefinition = IdentityRoleDefinition.builder()
                .key(key)
                .label(requireNonBlank(request.label(), "Role label is required"))
                .description(normalizeOptionalString(request.description()))
                .inherits(normalizeRoleList(request.inherits()))
                .permissions(normalizePermissionList(request.permissions()))
                .systemRole(false)
                .version(1)
                .build();

        IdentityRoleDefinition saved = identityRoleDefinitionRepository.save(roleDefinition);
        auditService.log("IAM_ROLE_CREATED", "ROLE", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "key", saved.getKey(),
                "permissions", saved.getPermissions()
        ));

        long assignedUsers = userRepository.findAll().stream()
                .filter(user -> safeRoles(user).contains(saved.getKey()))
                .count();
        return toRoleSummary(saved, assignedUsers);
    }

    public AdminIdentityDTOs.RoleDefinitionSummary updateRole(String roleId, AdminIdentityDTOs.UpdateRoleRequest request, User actor) {
        IdentityRoleDefinition roleDefinition = identityRoleDefinitionRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role definition not found"));

        if (request.label() != null) {
            roleDefinition.setLabel(requireNonBlank(request.label(), "Role label is required"));
        }
        if (request.description() != null) {
            roleDefinition.setDescription(normalizeOptionalString(request.description()));
        }
        if (request.inherits() != null) {
            roleDefinition.setInherits(normalizeRoleList(request.inherits()));
        }
        if (request.permissions() != null) {
            roleDefinition.setPermissions(normalizePermissionList(request.permissions()));
        }
        roleDefinition.setVersion(Math.max(1, roleDefinition.getVersion()) + 1);

        IdentityRoleDefinition saved = identityRoleDefinitionRepository.save(roleDefinition);
        auditService.log("IAM_ROLE_UPDATED", "ROLE", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "key", saved.getKey(),
                "version", saved.getVersion()
        ));

        long assignedUsers = userRepository.findAll().stream()
                .filter(user -> safeRoles(user).contains(saved.getKey()))
                .count();
        return toRoleSummary(saved, assignedUsers);
    }

    public AdminIdentityDTOs.IdentityUserSummary applyAccessControl(String userId,
                                                                    AdminIdentityDTOs.AccessControlRequest request,
                                                                    User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        User.AccessProfile accessProfile = ensureAccessProfile(user);
        User.SecurityProfile securityProfile = ensureSecurityProfile(user);

        if (request.accessLevel() != null) {
            accessProfile.setAccessLevel(normalizeUpperOrDefault(request.accessLevel(), accessProfile.getAccessLevel()));
        }
        if (request.accessScope() != null) {
            accessProfile.setAccessScope(normalizeOptionalString(request.accessScope()));
        }
        if (request.permissions() != null) {
            accessProfile.setPermissions(new LinkedHashSet<>(normalizePermissionList(request.permissions())));
        }
        if (request.privilegeNote() != null) {
            accessProfile.setPrivilegeNote(normalizeOptionalString(request.privilegeNote()));
        }
        if (request.elevatedUntil() != null) {
            accessProfile.setElevatedUntil(request.elevatedUntil());
        }
        if (request.mfaRequired() != null) {
            securityProfile.setMfaRequired(request.mfaRequired());
        }
        if (request.mfaEnabled() != null) {
            securityProfile.setMfaEnabled(request.mfaEnabled());
        }
        if (request.oauthEnabled() != null) {
            securityProfile.setOauthEnabled(request.oauthEnabled());
        }
        if (request.ssoEnabled() != null) {
            securityProfile.setSsoEnabled(request.ssoEnabled());
        }
        if (request.adaptiveAuthEnabled() != null) {
            securityProfile.setAdaptiveAuthEnabled(request.adaptiveAuthEnabled());
        }
        if (request.forcePasswordReset() != null) {
            securityProfile.setForcePasswordReset(request.forcePasswordReset());
        }
        if (request.riskLevel() != null) {
            securityProfile.setRiskLevel(normalizeUpperOrDefault(request.riskLevel(), securityProfile.getRiskLevel()));
        }
        if (request.riskReason() != null) {
            securityProfile.setRiskReason(normalizeOptionalString(request.riskReason()));
        }
        if (request.failedLoginAttempts() != null) {
            securityProfile.setFailedLoginAttempts(Math.max(0, request.failedLoginAttempts()));
        }

        String roleVersion = "v" + Math.max(1, safeRoles(user).size()) + "-" + Instant.now().toEpochMilli();
        accessProfile.setRoleVersion(roleVersion);

        User saved = userRepository.save(user);
        auditService.log("IAM_ACCESS_CONTROL_UPDATED", "USER", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "accessLevel", defaultString(accessProfile.getAccessLevel(), "STANDARD"),
                "permissionCount", safeSet(accessProfile.getPermissions()).size()
        ));

        return toUserSummary(saved);
    }

    public AdminIdentityDTOs.IdentityUserSummary reviewIdentity(String userId,
                                                                AdminIdentityDTOs.IdentityVerificationRequest request,
                                                                User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserProfile profile = ensureUserProfile(user);
        User.IdentityReview identityReview = ensureIdentityReview(user);
        Employer employer = employerRepository.findByUserId(user.getId()).orElse(null);
        Freelancer freelancer = freelancerRepository.findByUserId(user.getId()).orElse(null);

        Boolean emailVerified = request.emailVerified() != null ? request.emailVerified() : defaultBoolean(identityReview.getEmailVerified());
        Boolean phoneVerified = request.phoneVerified() != null ? request.phoneVerified() : defaultBoolean(identityReview.getPhoneVerified());
        Boolean documentVerified = request.documentVerified() != null ? request.documentVerified() : defaultBoolean(identityReview.getDocumentVerified());

        identityReview.setEmailVerified(emailVerified);
        identityReview.setPhoneVerified(phoneVerified);
        identityReview.setDocumentVerified(documentVerified);
        if (request.status() != null) {
            identityReview.setStatus(normalizeUpperOrDefault(request.status(), identityReview.getStatus()));
        } else if (Boolean.TRUE.equals(documentVerified) && Boolean.TRUE.equals(emailVerified)) {
            identityReview.setStatus("VERIFIED");
        }
        if (request.reviewNote() != null) {
            identityReview.setReviewNote(normalizeOptionalString(request.reviewNote()));
        }
        if (request.kycMethod() != null) {
            identityReview.setKycMethod(normalizeUpperOrDefault(request.kycMethod(), identityReview.getKycMethod()));
        }

        profile.setEmailVerified(emailVerified);
        profile.setPhoneVerified(phoneVerified);
        profile.setIdentityVerified(documentVerified);
        if (request.kycMethod() != null) {
            profile.setIdentityVerificationMethod(normalizeUpperOrDefault(request.kycMethod(), profile.getIdentityVerificationMethod()));
        }

        if ("VERIFIED".equals(identityReview.getStatus())) {
            Instant verifiedAt = Instant.now();
            identityReview.setVerifiedAt(verifiedAt);
            identityReview.setVerifiedBy(actor.getId());
            profile.setIdentityVerifiedAt(verifiedAt.toEpochMilli());
        }

        user.setDocumentsVerified(Boolean.TRUE.equals(documentVerified));

        if (employer != null) {
            Employer.VerificationStatus verificationStatus = employer.getVerificationStatus() != null
                    ? employer.getVerificationStatus()
                    : Employer.VerificationStatus.builder().build();
            verificationStatus.setEmail(user.getEmail());
            verificationStatus.setEmailVerified(emailVerified);
            verificationStatus.setPhoneVerified(phoneVerified);
            verificationStatus.setBusinessVerified(documentVerified);
            employer.setVerificationStatus(verificationStatus);

            Employer.KYCVerification kycVerification = employer.getKycVerification() != null
                    ? employer.getKycVerification()
                    : Employer.KYCVerification.builder().build();
            kycVerification.setStatus(defaultString(identityReview.getStatus(), documentVerified ? "VERIFIED" : "PENDING"));
            kycVerification.setVerificationNotes(identityReview.getReviewNote());
            if (Boolean.TRUE.equals(documentVerified)) {
                kycVerification.setVerifiedAt(LocalDateTime.now());
            }
            employer.setKycVerification(kycVerification);
            employerRepository.save(employer);
        }

        if (freelancer != null) {
            freelancer.setEmailVerified(emailVerified);
            freelancer.setPhoneVerified(phoneVerified);
            freelancer.setIdentityVerified(documentVerified);
            freelancer.setVerificationStatus(defaultString(identityReview.getStatus(), documentVerified ? "VERIFIED" : "PENDING"));
            if (Boolean.TRUE.equals(documentVerified)) {
                freelancer.setVerifiedAt(LocalDateTime.now());
                freelancer.setVerifiedBy(actor.getId());
            }
            freelancerRepository.save(freelancer);
        }

        User saved = userRepository.save(user);
        auditService.log("IAM_USER_VERIFICATION_UPDATED", "USER", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "status", defaultString(identityReview.getStatus(), "PENDING"),
                "documentVerified", Boolean.TRUE.equals(identityReview.getDocumentVerified())
        ));

        return toUserSummary(saved, employer, freelancer);
    }

    public AdminIdentityDTOs.IdentityUserSummary resetCredentials(String userId,
                                                                  AdminIdentityDTOs.CredentialResetRequest request,
                                                                  User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User.SecurityProfile securityProfile = ensureSecurityProfile(user);

        String newPassword = normalizeOptionalString(request.newPassword());
        if (newPassword != null) {
            if (newPassword.length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            securityProfile.setPasswordUpdatedAt(Instant.now());
            securityProfile.setForcePasswordReset(false);
        } else if (Boolean.TRUE.equals(request.forceReset())) {
            securityProfile.setForcePasswordReset(true);
        } else {
            throw new IllegalArgumentException("Provide a new password or enable force reset");
        }

        securityProfile.setLastCredentialResetAt(Instant.now());
        securityProfile.setCredentialResetChannel(normalizeUpperOrDefault(request.channel(), "ADMIN_CONSOLE"));
        securityProfile.setFailedLoginAttempts(0);

        User saved = userRepository.save(user);
        auditService.log("IAM_CREDENTIAL_RESET_TRIGGERED", "USER", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "channel", defaultString(securityProfile.getCredentialResetChannel(), "ADMIN_CONSOLE"),
                "forceReset", Boolean.TRUE.equals(securityProfile.getForcePasswordReset())
        ));

        return toUserSummary(saved);
    }

    public AdminIdentityDTOs.IdentityUserSummary issueWarning(String userId,
                                                              AdminIdentityDTOs.WarningRequest request,
                                                              User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User.SecurityProfile securityProfile = ensureSecurityProfile(user);
        List<User.WarningRecord> warningRecords = ensureWarningRecords(user);

        User.WarningRecord warningRecord = User.WarningRecord.builder()
                .id(UUID.randomUUID().toString())
                .severity(normalizeUpperOrDefault(request.severity(), "MEDIUM"))
                .reason(requireNonBlank(request.reason(), "Warning reason is required"))
                .note(normalizeOptionalString(request.note()))
                .status("OPEN")
                .issuedBy(actor.getId())
                .issuedAt(Instant.now())
                .build();

        warningRecords.add(0, warningRecord);
        securityProfile.setLastWarningAt(warningRecord.getIssuedAt());
        securityProfile.setRiskLevel(escalateRiskLevel(securityProfile.getRiskLevel(), warningRecord.getSeverity()));
        securityProfile.setRiskReason(warningRecord.getReason());

        if (Boolean.TRUE.equals(request.suspendUser())) {
            user.setSuspended(true);
        }

        User saved = userRepository.save(user);
        auditService.log("IAM_USER_WARNING_ISSUED", "USER", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "warningId", warningRecord.getId(),
                "severity", warningRecord.getSeverity(),
                "suspended", saved.isSuspended()
        ));

        return toUserSummary(saved);
    }

    public AdminIdentityDTOs.IdentityUserSummary resolveWarning(String userId,
                                                                String warningId,
                                                                AdminIdentityDTOs.WarningResolutionRequest request,
                                                                User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        User.WarningRecord warningRecord = ensureWarningRecords(user).stream()
                .filter(item -> Objects.equals(item.getId(), warningId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Warning not found"));

        warningRecord.setStatus("RESOLVED");
        warningRecord.setResolvedAt(Instant.now());
        warningRecord.setResolutionNote(normalizeOptionalString(request.note()));

        User saved = userRepository.save(user);
        auditService.log("IAM_USER_WARNING_RESOLVED", "USER", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "warningId", warningRecord.getId()
        ));

        return toUserSummary(saved);
    }

    public AdminIdentityDTOs.IdentityUserSummary handleMaliciousControl(String userId,
                                                                        AdminIdentityDTOs.MaliciousControlRequest request,
                                                                        User actor) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        User.SecurityProfile securityProfile = ensureSecurityProfile(user);
        String action = normalizeUpperOrDefault(request.action(), "BAN");
        List<String> ipAddresses = normalizeStringList(request.ipAddresses());
        List<String> deviceIds = normalizeStringList(request.deviceIds());

        switch (action) {
            case "BAN" -> {
                securityProfile.setBanned(true);
                user.setSuspended(true);
                mergeIntoList(securityProfile.getBlacklistedIps(), ipAddresses);
                mergeIntoList(securityProfile.getBlacklistedDevices(), deviceIds);
            }
            case "BLOCK" -> {
                mergeIntoList(securityProfile.getBlacklistedIps(), ipAddresses);
                mergeIntoList(securityProfile.getBlacklistedDevices(), deviceIds);
            }
            case "UNBLOCK" -> {
                securityProfile.setBanned(false);
                user.setSuspended(false);
                if (ipAddresses.isEmpty()) {
                    securityProfile.setBlacklistedIps(new ArrayList<>());
                } else {
                    removeFromList(securityProfile.getBlacklistedIps(), ipAddresses);
                }
                if (deviceIds.isEmpty()) {
                    securityProfile.setBlacklistedDevices(new ArrayList<>());
                } else {
                    removeFromList(securityProfile.getBlacklistedDevices(), deviceIds);
                }
            }
            default -> throw new IllegalArgumentException("Unsupported malicious control action");
        }

        securityProfile.setRiskLevel("CRITICAL");
        securityProfile.setRiskReason(requireNonBlank(request.reason(), "Reason is required"));

        Employer employer = employerRepository.findByUserId(user.getId()).orElse(null);
        if (employer != null && user.isSuspended()) {
            employer.setIsActive(false);
            employerRepository.save(employer);
        }

        Freelancer freelancer = freelancerRepository.findByUserId(user.getId()).orElse(null);
        if (freelancer != null && user.isSuspended()) {
            freelancer.setIsActive(false);
            freelancerRepository.save(freelancer);
        }

        User saved = userRepository.save(user);
        auditService.log("IAM_MALICIOUS_USER_CONTROL", "USER", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "action", action,
                "reason", securityProfile.getRiskReason(),
                "ipCount", safeList(securityProfile.getBlacklistedIps()).size(),
                "deviceCount", safeList(securityProfile.getBlacklistedDevices()).size()
        ));

        return toUserSummary(saved, employer, freelancer);
    }

    public AdminIdentityDTOs.PolicySummary updatePolicies(AdminIdentityDTOs.UpdatePoliciesRequest request, User actor) {
        IdentityPolicyConfig config = ensurePolicyConfig();

        if (request.passwordPolicy() != null) {
            config.setPasswordPolicy(toPasswordPolicy(request.passwordPolicy()));
        }
        if (request.authenticationPolicy() != null) {
            config.setAuthenticationPolicy(toAuthenticationPolicy(request.authenticationPolicy()));
        }
        if (request.governancePolicy() != null) {
            config.setGovernancePolicy(toGovernancePolicy(request.governancePolicy()));
        }

        IdentityPolicyConfig saved = identityPolicyConfigRepository.save(config);
        auditService.log("IAM_POLICY_UPDATED", "IAM_POLICY", saved.getId(), Map.of(
                "actorUserId", actor.getId(),
                "minLength", saved.getPasswordPolicy() != null ? saved.getPasswordPolicy().getMinLength() : null,
                "mfaRequiredForAdmins", saved.getAuthenticationPolicy() != null ? saved.getAuthenticationPolicy().getMfaRequiredForAdmins() : null
        ));

        return toPolicySummary(saved);
    }

    public AdminIdentityDTOs.IdentityUserSummary toUserSummary(User user) {
        Employer employer = employerRepository.findByUserId(user.getId()).orElse(null);
        Freelancer freelancer = freelancerRepository.findByUserId(user.getId()).orElse(null);
        return toUserSummary(user, employer, freelancer);
    }

    private AdminIdentityDTOs.IdentityUserSummary toUserSummary(User user, Employer employer, Freelancer freelancer) {
        UserProfile profile = ensureUserProfile(user);
        User.IdentityReview identityReview = ensureIdentityReview(user);
        User.AccessProfile accessProfile = ensureAccessProfile(user);
        User.SecurityProfile securityProfile = ensureSecurityProfile(user);
        List<User.WarningRecord> warningRecords = ensureWarningRecords(user);

        boolean emailVerified = coalesceBoolean(identityReview.getEmailVerified(), profile.getEmailVerified(), employerEmailVerified(employer), freelancerEmailVerified(freelancer));
        boolean phoneVerified = coalesceBoolean(identityReview.getPhoneVerified(), profile.getPhoneVerified(), employerPhoneVerified(employer), freelancerPhoneVerified(freelancer));
        boolean documentVerified = coalesceBoolean(identityReview.getDocumentVerified(), user.isDocumentsVerified(), employerBusinessVerified(employer), freelancerIdentityVerified(freelancer));
        String identityStatus = defaultString(identityReview.getStatus(), documentVerified ? "VERIFIED" : "UNVERIFIED");

        return new AdminIdentityDTOs.IdentityUserSummary(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                new ArrayList<>(safeRoles(user)),
                user.isSuspended(),
                user.isDocumentsVerified(),
                user.getCreatedAt(),
                user.getLastSeenAt(),
                user.getId() != null && chatPresenceService.isOnline(user.getId()),
                resolveAccountType(user, employer, freelancer),
                employerCompanyName(employer),
                employerKycStatus(employer),
                freelancer != null ? defaultString(freelancer.getVerificationStatus(), "PENDING") : null,
                new AdminIdentityDTOs.IdentityReviewSummary(
                        identityStatus,
                        emailVerified,
                        phoneVerified,
                        documentVerified,
                        identityReview.getReviewNote(),
                        identityReview.getKycMethod(),
                        identityReview.getVerifiedBy(),
                        identityReview.getVerifiedAt()
                ),
                new AdminIdentityDTOs.AccessProfileSummary(
                        defaultString(accessProfile.getAccessLevel(), "STANDARD"),
                        defaultString(accessProfile.getAccessScope(), "PLATFORM"),
                        new ArrayList<>(safeSet(accessProfile.getPermissions())),
                        accessProfile.getPrivilegeNote(),
                        accessProfile.getElevatedUntil(),
                        defaultString(accessProfile.getRoleVersion(), "v1")
                ),
                new AdminIdentityDTOs.SecurityProfileSummary(
                        defaultBoolean(securityProfile.getMfaRequired()),
                        defaultBoolean(securityProfile.getMfaEnabled()),
                        defaultBoolean(securityProfile.getOauthEnabled()),
                        defaultBoolean(securityProfile.getSsoEnabled()),
                        defaultBoolean(securityProfile.getAdaptiveAuthEnabled()),
                        defaultBoolean(securityProfile.getForcePasswordReset()),
                        defaultBoolean(securityProfile.getBanned()),
                        defaultString(securityProfile.getRiskLevel(), "LOW"),
                        securityProfile.getRiskReason(),
                        defaultInt(securityProfile.getFailedLoginAttempts()),
                        securityProfile.getPasswordUpdatedAt(),
                        securityProfile.getLastCredentialResetAt(),
                        securityProfile.getCredentialResetChannel(),
                        securityProfile.getLastWarningAt(),
                        new ArrayList<>(safeList(securityProfile.getBlacklistedIps())),
                        new ArrayList<>(safeList(securityProfile.getBlacklistedDevices()))
                ),
                warningRecords.stream()
                        .sorted(Comparator.comparing(User.WarningRecord::getIssuedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                        .limit(6)
                        .map(this::toWarningSummary)
                        .toList()
        );
    }

    private AdminIdentityDTOs.WarningSummary toWarningSummary(User.WarningRecord warningRecord) {
        return new AdminIdentityDTOs.WarningSummary(
                warningRecord.getId(),
                defaultString(warningRecord.getSeverity(), "MEDIUM"),
                warningRecord.getReason(),
                warningRecord.getNote(),
                defaultString(warningRecord.getStatus(), "OPEN"),
                warningRecord.getIssuedBy(),
                warningRecord.getIssuedAt(),
                warningRecord.getResolvedAt(),
                warningRecord.getResolutionNote()
        );
    }

    private List<AdminIdentityDTOs.MetricCard> buildMetrics(List<AdminIdentityDTOs.IdentityUserSummary> users) {
        long admins = users.stream().filter(user -> user.roles().stream().anyMatch(role -> role.contains("ADMIN"))).count();
        long suspended = users.stream().filter(AdminIdentityDTOs.IdentityUserSummary::suspended).count();
        long verified = users.stream().filter(user -> user.identity().documentVerified()).count();
        long highRisk = users.stream().filter(user -> {
            String riskLevel = user.security().riskLevel();
            return "HIGH".equals(riskLevel) || "CRITICAL".equals(riskLevel);
        }).count();
        long forceReset = users.stream().filter(user -> user.security().forcePasswordReset()).count();
        long banned = users.stream().filter(user -> user.security().banned()).count();

        return List.of(
                new AdminIdentityDTOs.MetricCard("total-users", "Total Users", String.valueOf(users.size()), "info"),
                new AdminIdentityDTOs.MetricCard("admin-coverage", "Admin Accounts", String.valueOf(admins), admins > 0 ? "success" : "warning"),
                new AdminIdentityDTOs.MetricCard("verified-identities", "Verified Identities", String.valueOf(verified), verified >= users.size() / 2 ? "success" : "warning"),
                new AdminIdentityDTOs.MetricCard("suspended-accounts", "Suspended", String.valueOf(suspended), suspended > 0 ? "warning" : "success"),
                new AdminIdentityDTOs.MetricCard("force-resets", "Forced Resets", String.valueOf(forceReset), forceReset > 0 ? "warning" : "success"),
                new AdminIdentityDTOs.MetricCard("high-risk-users", "High Risk", String.valueOf(highRisk + banned), highRisk + banned > 0 ? "critical" : "success")
        );
    }

    private List<AdminIdentityDTOs.ActivityPoint> buildActivityTrend(List<User> users, List<AuditLog> auditLogs) {
        List<YearMonth> months = new ArrayList<>();
        YearMonth current = YearMonth.now(ZoneOffset.UTC).minusMonths(5);
        for (int i = 0; i < 6; i++) {
            months.add(current.plusMonths(i));
        }

        return months.stream().map(month -> new AdminIdentityDTOs.ActivityPoint(
                month.format(MONTH_FORMATTER),
                users.stream().filter(user -> month.equals(toMonth(user.getCreatedAt()))).count(),
                users.stream().filter(user -> month.equals(toMonth(user.getLastSeenAt()))).count(),
                auditLogs.stream().filter(log -> month.equals(toMonth(log.getCreatedAt())) && "IAM_CREDENTIAL_RESET_TRIGGERED".equals(log.getAction())).count(),
                auditLogs.stream().filter(log -> month.equals(toMonth(log.getCreatedAt())) && (
                        "ADMIN_USER_SUSPENDED".equals(log.getAction())
                                || ("IAM_MALICIOUS_USER_CONTROL".equals(log.getAction()) && "BAN".equals(String.valueOf(metadataValue(log, "action"))))
                )).count()
        )).toList();
    }

    private List<AdminIdentityDTOs.DistributionItem> buildRoleDistribution(List<IdentityRoleDefinition> roleDefinitions,
                                                                           Map<String, Long> assignedUsersByRole) {
        return roleDefinitions.stream()
                .map(role -> new AdminIdentityDTOs.DistributionItem(
                        defaultString(role.getLabel(), defaultString(role.getKey(), "Unlabeled Role")),
                        assignedUsersByRole.getOrDefault(role.getKey(), 0L),
                        role.isSystemRole() ? "info" : "success"
                ))
                .filter(item -> item.value() > 0)
                .limit(8)
                .toList();
    }

    private List<AdminIdentityDTOs.DistributionItem> buildVerificationDistribution(List<AdminIdentityDTOs.IdentityUserSummary> users) {
        long verified = users.stream().filter(user -> "VERIFIED".equals(user.identity().status())).count();
        long inReview = users.stream().filter(user -> "REVIEW".equals(user.identity().status()) || "PENDING".equals(user.identity().status())).count();
        long unverified = Math.max(0, users.size() - verified - inReview);
        return List.of(
                new AdminIdentityDTOs.DistributionItem("Verified", verified, "success"),
                new AdminIdentityDTOs.DistributionItem("In Review", inReview, "warning"),
                new AdminIdentityDTOs.DistributionItem("Unverified", unverified, "critical")
        );
    }

    private List<AdminIdentityDTOs.DistributionItem> buildStateDistribution(List<AdminIdentityDTOs.IdentityUserSummary> users) {
        long banned = users.stream().filter(user -> user.security().banned()).count();
        long suspended = users.stream().filter(user -> user.suspended() && !user.security().banned()).count();
        long warned = users.stream().filter(user -> user.warnings().stream().anyMatch(warning -> "OPEN".equals(warning.status()))).count();
        long active = Math.max(0, users.size() - banned - suspended);
        return List.of(
                new AdminIdentityDTOs.DistributionItem("Active", active, "success"),
                new AdminIdentityDTOs.DistributionItem("Suspended", suspended, "warning"),
                new AdminIdentityDTOs.DistributionItem("Banned", banned, "critical"),
                new AdminIdentityDTOs.DistributionItem("Warnings", warned, "info")
        );
    }

    private List<AdminIdentityDTOs.SecurityAlert> buildAlerts(List<AdminIdentityDTOs.IdentityUserSummary> users, IdentityPolicyConfig policies) {
        boolean adminMfaRequired = policies.getAuthenticationPolicy() != null && Boolean.TRUE.equals(policies.getAuthenticationPolicy().getMfaRequiredForAdmins());

        return users.stream()
                .flatMap(user -> {
                    List<AdminIdentityDTOs.SecurityAlert> alerts = new ArrayList<>();
                    if (user.security().banned()) {
                        alerts.add(new AdminIdentityDTOs.SecurityAlert(
                                "banned-" + user.id(),
                                "Banned account on active blacklist",
                                user.fullName() + " remains banned with persisted blacklist controls.",
                                "critical",
                                user.id(),
                                "Review blacklist evidence"
                        ));
                    }
                    if (user.security().forcePasswordReset()) {
                        alerts.add(new AdminIdentityDTOs.SecurityAlert(
                                "reset-" + user.id(),
                                "Credential reset pending",
                                user.fullName() + " must reset credentials before trusted access is restored.",
                                "warning",
                                user.id(),
                                "Complete credential reset"
                        ));
                    }
                    if (!user.identity().documentVerified() && ("employer".equals(user.accountType()) || "freelancer".equals(user.accountType()))) {
                        alerts.add(new AdminIdentityDTOs.SecurityAlert(
                                "verify-" + user.id(),
                                "Identity verification incomplete",
                                user.fullName() + " still requires document verification for compliant access.",
                                "warning",
                                user.id(),
                                "Review identity verification"
                        ));
                    }
                    if (adminMfaRequired && user.roles().stream().anyMatch(role -> role.contains("ADMIN")) && !user.security().mfaRequired()) {
                        alerts.add(new AdminIdentityDTOs.SecurityAlert(
                                "mfa-" + user.id(),
                                "Admin account missing MFA enforcement",
                                user.fullName() + " has admin access without a required MFA enforcement flag.",
                                "critical",
                                user.id(),
                                "Apply access control policy"
                        ));
                    }
                    if (user.warnings().stream().filter(warning -> "OPEN".equals(warning.status())).count() >= 2) {
                        alerts.add(new AdminIdentityDTOs.SecurityAlert(
                                "warnings-" + user.id(),
                                "Repeated user policy warnings",
                                user.fullName() + " has multiple unresolved policy warnings.",
                                "warning",
                                user.id(),
                                "Investigate warning history"
                        ));
                    }
                    return alerts.stream();
                })
                .sorted(Comparator.comparing(AdminIdentityDTOs.SecurityAlert::severity))
                .limit(18)
                .toList();
    }

    private AdminIdentityDTOs.RoleDefinitionSummary toRoleSummary(IdentityRoleDefinition roleDefinition, long assignedUsers) {
        return new AdminIdentityDTOs.RoleDefinitionSummary(
                roleDefinition.getId(),
                roleDefinition.getKey(),
                defaultString(roleDefinition.getLabel(), defaultString(roleDefinition.getKey(), "Unlabeled Role")),
                roleDefinition.getDescription(),
                roleDefinition.isSystemRole(),
                Math.max(1, roleDefinition.getVersion()),
                safeList(roleDefinition.getInherits()),
                safeList(roleDefinition.getPermissions()),
                assignedUsers
        );
    }

    private AdminIdentityDTOs.PolicySummary toPolicySummary(IdentityPolicyConfig config) {
        IdentityPolicyConfig.PasswordPolicy passwordPolicy = config.getPasswordPolicy() != null ? config.getPasswordPolicy() : defaultPasswordPolicy();
        IdentityPolicyConfig.AuthenticationPolicy authenticationPolicy = config.getAuthenticationPolicy() != null ? config.getAuthenticationPolicy() : defaultAuthenticationPolicy();
        IdentityPolicyConfig.GovernancePolicy governancePolicy = config.getGovernancePolicy() != null ? config.getGovernancePolicy() : defaultGovernancePolicy();

        return new AdminIdentityDTOs.PolicySummary(
                new AdminIdentityDTOs.PasswordPolicy(
                        passwordPolicy.getMinLength(),
                        passwordPolicy.getRequireUppercase(),
                        passwordPolicy.getRequireLowercase(),
                        passwordPolicy.getRequireNumber(),
                        passwordPolicy.getRequireSymbol(),
                        passwordPolicy.getExpiryDays(),
                        passwordPolicy.getPasswordReuseLimit()
                ),
                new AdminIdentityDTOs.AuthenticationPolicy(
                        authenticationPolicy.getMfaRequiredForAdmins(),
                        authenticationPolicy.getOauthEnabled(),
                        authenticationPolicy.getSsoEnabled(),
                        authenticationPolicy.getAdaptiveAuthEnabled(),
                        authenticationPolicy.getZeroTrustEnabled(),
                        authenticationPolicy.getAbacEnabled(),
                        authenticationPolicy.getRateLimitPerMinute(),
                        authenticationPolicy.getMaxFailedLoginAttempts(),
                        authenticationPolicy.getSessionTimeoutMinutes()
                ),
                new AdminIdentityDTOs.GovernancePolicy(
                        governancePolicy.getLeastPrivilegeEnforced(),
                        governancePolicy.getAuditTrailEnabled(),
                        governancePolicy.getAnomalyAlertsEnabled(),
                        governancePolicy.getAutomatedProvisioningEnabled()
                ),
                config.getUpdatedAt()
        );
    }

    private AdminIdentityDTOs.AuditEntry toAuditEntry(AuditLog auditLog) {
        return new AdminIdentityDTOs.AuditEntry(
                auditLog.getId(),
                auditLog.getAction(),
                auditLog.getEntityType(),
                auditLog.getEntityId(),
                auditLog.getActorUserId(),
                auditLog.getCreatedAt(),
                auditLog.getMetadata()
        );
    }

    private Map<String, Long> buildAssignedUsersByRole(List<User> users) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (User user : users) {
            for (String role : safeRoles(user)) {
                counts.merge(role, 1L, Long::sum);
            }
        }
        return counts;
    }

    private boolean isIdentityAudit(AuditLog auditLog) {
        if (auditLog == null) {
            return false;
        }
        String entityType = defaultString(auditLog.getEntityType(), "");
        String action = defaultString(auditLog.getAction(), "");
        return "USER".equals(entityType)
                || "ROLE".equals(entityType)
                || "IAM_POLICY".equals(entityType)
                || action.startsWith("ADMIN_USER_")
                || action.startsWith("IAM_");
    }

    private void ensureSeedRoles() {
        for (SeedRole seedRole : SEED_ROLES) {
            identityRoleDefinitionRepository.findByKey(seedRole.key())
                    .or(() -> createSeedRole(seedRole));
        }
    }

    private java.util.Optional<IdentityRoleDefinition> createSeedRole(SeedRole seedRole) {
        IdentityRoleDefinition definition = IdentityRoleDefinition.builder()
                .key(seedRole.key())
                .label(seedRole.label())
                .description(seedRole.description())
                .inherits(List.of())
                .permissions(seedRole.permissions())
                .systemRole(true)
                .version(1)
                .build();
        return java.util.Optional.of(identityRoleDefinitionRepository.save(definition));
    }

    private IdentityPolicyConfig ensurePolicyConfig() {
        return identityPolicyConfigRepository.findById(POLICY_ID)
                .orElseGet(() -> identityPolicyConfigRepository.save(IdentityPolicyConfig.builder()
                        .id(POLICY_ID)
                        .passwordPolicy(defaultPasswordPolicy())
                        .authenticationPolicy(defaultAuthenticationPolicy())
                        .governancePolicy(defaultGovernancePolicy())
                        .build()));
    }

    private IdentityPolicyConfig.PasswordPolicy toPasswordPolicy(AdminIdentityDTOs.PasswordPolicy policy) {
        return IdentityPolicyConfig.PasswordPolicy.builder()
                .minLength(defaultInteger(policy.minLength(), 12))
                .requireUppercase(defaultBoolean(policy.requireUppercase()))
                .requireLowercase(defaultBoolean(policy.requireLowercase()))
                .requireNumber(defaultBoolean(policy.requireNumber()))
                .requireSymbol(defaultBoolean(policy.requireSymbol()))
                .expiryDays(defaultInteger(policy.expiryDays(), 90))
                .passwordReuseLimit(defaultInteger(policy.passwordReuseLimit(), 5))
                .build();
    }

    private IdentityPolicyConfig.AuthenticationPolicy toAuthenticationPolicy(AdminIdentityDTOs.AuthenticationPolicy policy) {
        return IdentityPolicyConfig.AuthenticationPolicy.builder()
                .mfaRequiredForAdmins(defaultBoolean(policy.mfaRequiredForAdmins()))
                .oauthEnabled(defaultBoolean(policy.oauthEnabled()))
                .ssoEnabled(defaultBoolean(policy.ssoEnabled()))
                .adaptiveAuthEnabled(defaultBoolean(policy.adaptiveAuthEnabled()))
                .zeroTrustEnabled(defaultBoolean(policy.zeroTrustEnabled()))
                .abacEnabled(defaultBoolean(policy.abacEnabled()))
                .rateLimitPerMinute(defaultInteger(policy.rateLimitPerMinute(), 120))
                .maxFailedLoginAttempts(defaultInteger(policy.maxFailedLoginAttempts(), 5))
                .sessionTimeoutMinutes(defaultInteger(policy.sessionTimeoutMinutes(), 30))
                .build();
    }

    private IdentityPolicyConfig.GovernancePolicy toGovernancePolicy(AdminIdentityDTOs.GovernancePolicy policy) {
        return IdentityPolicyConfig.GovernancePolicy.builder()
                .leastPrivilegeEnforced(defaultBoolean(policy.leastPrivilegeEnforced()))
                .auditTrailEnabled(defaultBoolean(policy.auditTrailEnabled()))
                .anomalyAlertsEnabled(defaultBoolean(policy.anomalyAlertsEnabled()))
                .automatedProvisioningEnabled(defaultBoolean(policy.automatedProvisioningEnabled()))
                .build();
    }

    private IdentityPolicyConfig.PasswordPolicy defaultPasswordPolicy() {
        return IdentityPolicyConfig.PasswordPolicy.builder()
                .minLength(12)
                .requireUppercase(true)
                .requireLowercase(true)
                .requireNumber(true)
                .requireSymbol(true)
                .expiryDays(90)
                .passwordReuseLimit(5)
                .build();
    }

    private IdentityPolicyConfig.AuthenticationPolicy defaultAuthenticationPolicy() {
        return IdentityPolicyConfig.AuthenticationPolicy.builder()
                .mfaRequiredForAdmins(true)
                .oauthEnabled(true)
                .ssoEnabled(false)
                .adaptiveAuthEnabled(true)
                .zeroTrustEnabled(true)
                .abacEnabled(false)
                .rateLimitPerMinute(120)
                .maxFailedLoginAttempts(5)
                .sessionTimeoutMinutes(30)
                .build();
    }

    private IdentityPolicyConfig.GovernancePolicy defaultGovernancePolicy() {
        return IdentityPolicyConfig.GovernancePolicy.builder()
                .leastPrivilegeEnforced(true)
                .auditTrailEnabled(true)
                .anomalyAlertsEnabled(true)
                .automatedProvisioningEnabled(true)
                .build();
    }

    private UserProfile ensureUserProfile(User user) {
        if (user.getProfile() == null) {
            user.setProfile(new UserProfile());
        }
        return user.getProfile();
    }

    private User.IdentityReview ensureIdentityReview(User user) {
        if (user.getIdentityReview() == null) {
            user.setIdentityReview(User.IdentityReview.builder()
                    .status(user.isDocumentsVerified() ? "VERIFIED" : "UNVERIFIED")
                    .emailVerified(false)
                    .phoneVerified(false)
                    .documentVerified(user.isDocumentsVerified())
                    .build());
        }
        return user.getIdentityReview();
    }

    private User.AccessProfile ensureAccessProfile(User user) {
        if (user.getAccessProfile() == null) {
            user.setAccessProfile(User.AccessProfile.builder()
                    .accessLevel("STANDARD")
                    .accessScope("PLATFORM")
                    .permissions(new LinkedHashSet<>())
                    .roleVersion("v1")
                    .build());
        }
        if (user.getAccessProfile().getPermissions() == null) {
            user.getAccessProfile().setPermissions(new LinkedHashSet<>());
        }
        return user.getAccessProfile();
    }

    private User.SecurityProfile ensureSecurityProfile(User user) {
        if (user.getSecurityProfile() == null) {
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
                    .blacklistedIps(new ArrayList<>())
                    .blacklistedDevices(new ArrayList<>())
                    .build());
        }
        if (user.getSecurityProfile().getBlacklistedIps() == null) {
            user.getSecurityProfile().setBlacklistedIps(new ArrayList<>());
        }
        if (user.getSecurityProfile().getBlacklistedDevices() == null) {
            user.getSecurityProfile().setBlacklistedDevices(new ArrayList<>());
        }
        return user.getSecurityProfile();
    }

    private List<User.WarningRecord> ensureWarningRecords(User user) {
        if (user.getWarningRecords() == null) {
            user.setWarningRecords(new ArrayList<>());
        }
        return user.getWarningRecords();
    }

    private String resolveAccountType(User user, Employer employer, Freelancer freelancer) {
        if (employer != null) {
            return "employer";
        }
        if (freelancer != null) {
            return "freelancer";
        }
        return user.getRoles() != null && user.getRoles().stream().anyMatch(role -> role.contains("ADMIN")) ? "admin" : "user";
    }

    private String sortName(User user) {
        String fullName = normalizeOptionalString(user.getFullName());
        if (fullName != null) {
            return fullName.toLowerCase();
        }
        return defaultString(user.getEmail(), "~");
    }

    private String employerCompanyName(Employer employer) {
        if (employer == null || employer.getCompanyProfile() == null) {
            return null;
        }
        return employer.getCompanyProfile().getCompanyName();
    }

    private String employerKycStatus(Employer employer) {
        if (employer == null || employer.getKycVerification() == null) {
            return null;
        }
        return employer.getKycVerification().getStatus();
    }

    private boolean employerEmailVerified(Employer employer) {
        return employer != null
                && employer.getVerificationStatus() != null
                && Boolean.TRUE.equals(employer.getVerificationStatus().getEmailVerified());
    }

    private boolean employerPhoneVerified(Employer employer) {
        return employer != null
                && employer.getVerificationStatus() != null
                && Boolean.TRUE.equals(employer.getVerificationStatus().getPhoneVerified());
    }

    private boolean employerBusinessVerified(Employer employer) {
        return employer != null
                && employer.getVerificationStatus() != null
                && Boolean.TRUE.equals(employer.getVerificationStatus().getBusinessVerified());
    }

    private boolean freelancerEmailVerified(Freelancer freelancer) {
        return freelancer != null && Boolean.TRUE.equals(freelancer.getEmailVerified());
    }

    private boolean freelancerPhoneVerified(Freelancer freelancer) {
        return freelancer != null && Boolean.TRUE.equals(freelancer.getPhoneVerified());
    }

    private boolean freelancerIdentityVerified(Freelancer freelancer) {
        return freelancer != null && Boolean.TRUE.equals(freelancer.getIdentityVerified());
    }

    private Set<String> safeRoles(User user) {
        return user.getRoles() == null ? Set.of() : user.getRoles();
    }

    private <T> Set<T> safeSet(Set<T> values) {
        return values == null ? Set.of() : values;
    }

    private <T> List<T> safeList(List<T> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream().filter(Objects::nonNull).toList();
    }

    private Object metadataValue(AuditLog auditLog, String key) {
        if (auditLog == null || auditLog.getMetadata() == null || key == null) {
            return null;
        }
        return auditLog.getMetadata().get(key);
    }

    private String requireNonBlank(String value, String message) {
        String normalized = normalizeOptionalString(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptionalString(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private List<String> normalizePermissionList(List<String> permissions) {
        if (permissions == null) {
            return List.of();
        }
        return permissions.stream()
                .map(this::normalizeOptionalString)
                .filter(Objects::nonNull)
                .map(String::toLowerCase)
                .distinct()
                .toList();
    }

    private List<String> normalizeRoleList(List<String> roles) {
        if (roles == null) {
            return List.of();
        }
        return roles.stream()
                .map(this::normalizeOptionalString)
                .filter(Objects::nonNull)
                .map(this::normalizeRoleKey)
                .distinct()
                .toList();
    }

    private List<String> normalizeStringList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .map(this::normalizeOptionalString)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private String normalizeRoleKey(String role) {
        UserRole userRole = UserRole.fromString(role);
        if (userRole != null) {
            return userRole.toSpringRole();
        }
        String normalized = role.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        return normalized;
    }

    private String normalizeUpperOrDefault(String value, String defaultValue) {
        String normalized = normalizeOptionalString(value);
        if (normalized == null) {
            return defaultValue;
        }
        return normalized.toUpperCase();
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private boolean defaultBoolean(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private boolean coalesceBoolean(Boolean... values) {
        for (Boolean value : values) {
            if (value != null) {
                return Boolean.TRUE.equals(value);
            }
        }
        return false;
    }

    private int defaultInt(Integer value) {
        return value == null ? 0 : value;
    }

    private int defaultInteger(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private YearMonth toMonth(Instant instant) {
        if (instant == null) {
            return null;
        }
        return YearMonth.from(instant.atZone(ZoneOffset.UTC));
    }

    private String escalateRiskLevel(String currentRiskLevel, String severity) {
        String normalizedCurrent = normalizeUpperOrDefault(currentRiskLevel, "LOW");
        String normalizedSeverity = normalizeUpperOrDefault(severity, "MEDIUM");
        if ("CRITICAL".equals(normalizedSeverity)) {
            return "CRITICAL";
        }
        if ("HIGH".equals(normalizedSeverity) || "CRITICAL".equals(normalizedCurrent)) {
            return "HIGH";
        }
        if ("MEDIUM".equals(normalizedSeverity) || "HIGH".equals(normalizedCurrent)) {
            return "MEDIUM";
        }
        return normalizedCurrent;
    }

    private <T> void mergeIntoList(List<T> target, Collection<T> values) {
        if (target == null || values == null || values.isEmpty()) {
            return;
        }
        LinkedHashSet<T> merged = new LinkedHashSet<>(target);
        merged.addAll(values);
        target.clear();
        target.addAll(merged);
    }

    private <T> void removeFromList(List<T> target, Collection<T> values) {
        if (target == null || values == null || values.isEmpty()) {
            return;
        }
        target.removeIf(values::contains);
    }

    private record SeedRole(String key, String label, String description, List<String> permissions) {
    }
}
