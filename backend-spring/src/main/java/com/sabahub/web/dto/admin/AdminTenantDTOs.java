package com.sabahub.web.dto.admin;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminTenantDTOs {

    private AdminTenantDTOs() {
    }

    public record TenantQuota(
            Integer maxActiveProjects,
            Integer maxTeamMembers,
            Integer storageLimitGb,
            Integer apiRateLimitPerMinute
    ) {
    }

    public record TenantBilling(
            String plan,
            String status,
            String model,
            String billingEmail,
            String currency,
            String provider,
            String accountId,
            LocalDateTime renewalDate
    ) {
    }

    public record TenantMigration(
            String status,
            String targetRegion,
            String note,
            LocalDateTime requestedAt,
            LocalDateTime completedAt
    ) {
    }

    public record TenantEnvironment(
            String deploymentMode,
            String namespace,
            String cluster,
            String region,
            String infrastructureProvider,
            String computeProfile,
            String storageProfile,
            String networkSegment,
            String environmentTemplate,
            String status,
            boolean autoScalingEnabled,
            boolean selfServiceOnboardingEnabled,
            LocalDateTime provisionedAt
    ) {
    }

    public record TenantUsage(
            double cpuCoresUsed,
            double memoryGbUsed,
            double storageGbUsed,
            long apiRequestsCurrentPeriod,
            double bandwidthMbpsUsed,
            String anomalyStatus,
            double anomalyScore,
            LocalDateTime lastCollectedAt
    ) {
    }

    public record TenantResourceLimits(
            double softCpuCores,
            double hardCpuCores,
            double softMemoryGb,
            double hardMemoryGb,
            double softStorageGb,
            double hardStorageGb,
            double softBandwidthMbps,
            double hardBandwidthMbps,
            boolean throttlingEnabled,
            boolean autoScaleEnabled
    ) {
    }

    public record TenantPermissionProfile(
            String accessModel,
            List<String> adminRoles,
            List<String> permissions,
            boolean isolationEnforced
    ) {
    }

    public record TenantIsolationProfile(
            String databaseIsolationMode,
            String networkPolicy,
            boolean encryptionAtRest,
            boolean encryptionInTransit,
            int crossTenantViolationCount,
            String securityPolicy
    ) {
    }

    public record TenantSuspension(
            String status,
            String reason,
            String note,
            LocalDateTime suspendedAt,
            LocalDateTime resumedAt
    ) {
    }

    public record TenantSummary(
            String id,
            String userId,
            String ownerName,
            String ownerEmail,
            String ownerUsername,
            String companyName,
            String companyWebsite,
            String industry,
            String country,
            Integer employeeCount,
            String tier,
            boolean active,
            boolean ownerSuspended,
            boolean businessVerified,
            boolean paymentVerified,
            String kycStatus,
            long totalProjects,
            long openProjects,
            long totalJobs,
            long activeContracts,
            double totalSpent,
            TenantQuota quota,
            TenantBilling billing,
            TenantMigration migration,
            TenantEnvironment environment,
            TenantUsage usage,
            TenantResourceLimits resourceLimits,
            TenantPermissionProfile permissionProfile,
            TenantIsolationProfile isolationProfile,
            TenantSuspension suspension,
            Instant ownerCreatedAt,
            LocalDateTime updatedAt
    ) {
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

    public record UsageSnapshot(
            String tenantId,
            String tenantName,
            double cpuCoresUsed,
            double memoryGbUsed,
            double storageGbUsed,
            long apiRequestsCurrentPeriod,
            double bandwidthMbpsUsed
    ) {
    }

    public record TenantAlert(
            String key,
            String title,
            String detail,
            String severity,
            String tenantId,
            String actionHint
    ) {
    }

    public record AuditEntry(
            String id,
            String action,
            String entityType,
            String entityId,
            String actorUserId,
            Instant createdAt
    ) {
    }

    public record TenantWorkspaceResponse(
            Instant generatedAt,
            List<MetricCard> metrics,
            List<DistributionItem> lifecycleDistribution,
            List<DistributionItem> billingDistribution,
            List<UsageSnapshot> usageSnapshots,
            List<TenantAlert> alerts,
            List<AuditEntry> auditTrail,
            List<TenantSummary> tenants
    ) {
    }

    public record CreateTenantRequest(
            String ownerFullName,
            String ownerEmail,
            String ownerUsername,
            String ownerPassword,
            String companyName,
            String companyWebsite,
            String industry,
            String country,
            Integer employeeCount,
            String tier,
            String plan,
            String billingModel,
            String billingEmail,
            String billingCurrency,
            String billingProvider,
            String billingAccountId,
            Integer maxActiveProjects,
            Integer maxTeamMembers,
            Integer storageLimitGb,
            Integer apiRateLimitPerMinute
    ) {
    }

    public record UpdateTenantRequest(
            String ownerFullName,
            String ownerEmail,
            String ownerUsername,
            String companyName,
            String companyWebsite,
            String industry,
            String country,
            Integer employeeCount,
            String tier,
            Boolean active,
            Boolean businessVerified,
            Boolean paymentVerified,
            String kycStatus,
            String verificationNote,
            String plan,
            String billingStatus,
            String billingModel,
            String billingEmail,
            String billingCurrency,
            String billingProvider,
            String billingAccountId,
            LocalDateTime renewalDate,
            Integer maxActiveProjects,
            Integer maxTeamMembers,
            Integer storageLimitGb,
            Integer apiRateLimitPerMinute
    ) {
    }

    public record TenantMigrationRequest(
            String targetRegion,
            String note
    ) {
    }

    public record ProvisionEnvironmentRequest(
            String deploymentMode,
            String namespace,
            String cluster,
            String region,
            String infrastructureProvider,
            String computeProfile,
            String storageProfile,
            String networkSegment,
            String environmentTemplate,
            Boolean autoScalingEnabled,
            Boolean selfServiceOnboardingEnabled
    ) {
    }

    public record ResourceLimitRequest(
            Double softCpuCores,
            Double hardCpuCores,
            Double softMemoryGb,
            Double hardMemoryGb,
            Double softStorageGb,
            Double hardStorageGb,
            Double softBandwidthMbps,
            Double hardBandwidthMbps,
            Boolean throttlingEnabled,
            Boolean autoScaleEnabled
    ) {
    }

    public record PermissionProfileRequest(
            String accessModel,
            List<String> adminRoles,
            List<String> permissions,
            Boolean isolationEnforced
    ) {
    }

    public record TenantIsolationRequest(
            String databaseIsolationMode,
            String networkPolicy,
            Boolean encryptionAtRest,
            Boolean encryptionInTransit,
            Integer crossTenantViolationCount,
            String securityPolicy
    ) {
    }

    public record TenantLifecycleRequest(
            String action,
            String reason,
            String note
    ) {
    }

    public record TenantListResponse(
            Instant generatedAt,
            List<TenantSummary> tenants
    ) {
    }
}
