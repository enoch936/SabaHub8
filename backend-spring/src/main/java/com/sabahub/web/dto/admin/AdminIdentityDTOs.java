package com.sabahub.web.dto.admin;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AdminIdentityDTOs {

    private AdminIdentityDTOs() {
    }

    public record MetricCard(
            String key,
            String label,
            String value,
            String tone
    ) {
    }

    public record DistributionItem(
            String label,
            long value,
            String tone
    ) {
    }

    public record ActivityPoint(
            String month,
            long newUsers,
            long activeUsers,
            long credentialResets,
            long suspensions
    ) {
    }

    public record WarningSummary(
            String id,
            String severity,
            String reason,
            String note,
            String status,
            String issuedBy,
            Instant issuedAt,
            Instant resolvedAt,
            String resolutionNote
    ) {
    }

    public record IdentityReviewSummary(
            String status,
            boolean emailVerified,
            boolean phoneVerified,
            boolean documentVerified,
            String reviewNote,
            String kycMethod,
            String verifiedBy,
            Instant verifiedAt
    ) {
    }

    public record AccessProfileSummary(
            String accessLevel,
            String accessScope,
            List<String> permissions,
            String privilegeNote,
            Instant elevatedUntil,
            String roleVersion
    ) {
    }

    public record SecurityProfileSummary(
            boolean mfaRequired,
            boolean mfaEnabled,
            boolean oauthEnabled,
            boolean ssoEnabled,
            boolean adaptiveAuthEnabled,
            boolean forcePasswordReset,
            boolean banned,
            String riskLevel,
            String riskReason,
            int failedLoginAttempts,
            Instant passwordUpdatedAt,
            Instant lastCredentialResetAt,
            String credentialResetChannel,
            Instant lastWarningAt,
            List<String> blacklistedIps,
            List<String> blacklistedDevices
    ) {
    }

    public record IdentityUserSummary(
            String id,
            String email,
            String username,
            String fullName,
            List<String> roles,
            boolean suspended,
            boolean documentsVerified,
            Instant createdAt,
            Instant lastSeenAt,
            boolean online,
            String accountType,
            String companyName,
            String employerKycStatus,
            String freelancerVerificationStatus,
            IdentityReviewSummary identity,
            AccessProfileSummary access,
            SecurityProfileSummary security,
            List<WarningSummary> warnings
    ) {
    }

    public record RoleDefinitionSummary(
            String id,
            String key,
            String label,
            String description,
            boolean systemRole,
            int version,
            List<String> inherits,
            List<String> permissions,
            long assignedUsers
    ) {
    }

    public record PasswordPolicy(
            Integer minLength,
            Boolean requireUppercase,
            Boolean requireLowercase,
            Boolean requireNumber,
            Boolean requireSymbol,
            Integer expiryDays,
            Integer passwordReuseLimit
    ) {
    }

    public record AuthenticationPolicy(
            Boolean mfaRequiredForAdmins,
            Boolean oauthEnabled,
            Boolean ssoEnabled,
            Boolean adaptiveAuthEnabled,
            Boolean zeroTrustEnabled,
            Boolean abacEnabled,
            Integer rateLimitPerMinute,
            Integer maxFailedLoginAttempts,
            Integer sessionTimeoutMinutes
    ) {
    }

    public record GovernancePolicy(
            Boolean leastPrivilegeEnforced,
            Boolean auditTrailEnabled,
            Boolean anomalyAlertsEnabled,
            Boolean automatedProvisioningEnabled
    ) {
    }

    public record PolicySummary(
            PasswordPolicy passwordPolicy,
            AuthenticationPolicy authenticationPolicy,
            GovernancePolicy governancePolicy,
            Instant updatedAt
    ) {
    }

    public record SecurityAlert(
            String key,
            String title,
            String detail,
            String severity,
            String userId,
            String actionHint
    ) {
    }

    public record AuditEntry(
            String id,
            String action,
            String entityType,
            String entityId,
            String actorUserId,
            Instant createdAt,
            Map<String, Object> metadata
    ) {
    }

    public record WorkspaceResponse(
            Instant generatedAt,
            List<MetricCard> metrics,
            List<ActivityPoint> activityTrend,
            List<DistributionItem> roleDistribution,
            List<DistributionItem> verificationDistribution,
            List<DistributionItem> stateDistribution,
            List<IdentityUserSummary> users,
            List<RoleDefinitionSummary> roles,
            PolicySummary policies,
            List<SecurityAlert> alerts,
            List<AuditEntry> auditTrail
    ) {
    }

    public record CreateRoleRequest(
            String key,
            String label,
            String description,
            List<String> inherits,
            List<String> permissions
    ) {
    }

    public record UpdateRoleRequest(
            String label,
            String description,
            List<String> inherits,
            List<String> permissions
    ) {
    }

    public record AccessControlRequest(
            String accessLevel,
            String accessScope,
            List<String> permissions,
            String privilegeNote,
            Instant elevatedUntil,
            Boolean mfaRequired,
            Boolean mfaEnabled,
            Boolean oauthEnabled,
            Boolean ssoEnabled,
            Boolean adaptiveAuthEnabled,
            Boolean forcePasswordReset,
            String riskLevel,
            String riskReason,
            Integer failedLoginAttempts
    ) {
    }

    public record IdentityVerificationRequest(
            Boolean emailVerified,
            Boolean phoneVerified,
            Boolean documentVerified,
            String status,
            String reviewNote,
            String kycMethod
    ) {
    }

    public record CredentialResetRequest(
            String newPassword,
            Boolean forceReset,
            String channel
    ) {
    }

    public record WarningRequest(
            String severity,
            String reason,
            String note,
            Boolean suspendUser
    ) {
    }

    public record WarningResolutionRequest(
            String note
    ) {
    }

    public record MaliciousControlRequest(
            String action,
            String reason,
            List<String> ipAddresses,
            List<String> deviceIds
    ) {
    }

    public record UpdatePoliciesRequest(
            PasswordPolicy passwordPolicy,
            AuthenticationPolicy authenticationPolicy,
            GovernancePolicy governancePolicy
    ) {
    }
}
