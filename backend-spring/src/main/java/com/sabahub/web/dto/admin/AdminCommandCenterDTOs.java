package com.sabahub.web.dto.admin;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class AdminCommandCenterDTOs {

    private AdminCommandCenterDTOs() {
    }

    public record MetricCard(
            String id,
            String label,
            String value,
            String trend,
            String tone
    ) {
    }

    public record AlertItem(
            String id,
            String level,
            String title,
            String detail
    ) {
    }

    public record DomainSummary(
            String id,
            String title,
            String description,
            String route,
            int responsibilitiesCount,
            String status
    ) {
    }

    public record RunbookOperation(
            String id,
            String title,
            String description,
            String impact,
            String status
    ) {
    }

    public record ResponsibilityDomain(
            String id,
            String title,
            String description,
            String route,
            List<String> responsibilities,
            List<RunbookOperation> operations,
            String status,
            String owner
    ) {
    }

    public record FeatureFlag(
            String key,
            boolean enabled,
            String owner,
            String description,
            Instant updatedAt
    ) {
    }

    public record OverviewResponse(
            Instant generatedAt,
            List<MetricCard> metrics,
            List<AlertItem> alerts,
            List<DomainSummary> domains,
            List<FeatureFlag> featureFlags
    ) {
    }

    public record DomainResponse(
            Instant generatedAt,
            ResponsibilityDomain domain,
            List<MetricCard> metrics,
            List<AlertItem> alerts,
            List<FeatureFlag> featureFlags
    ) {
    }

    public record CapabilityGroup(
            String id,
            String title,
            String objective,
            List<String> responsibilities,
            List<RunbookOperation> operations,
            String status,
            String owner
    ) {
    }

    public record PlatformControlResponse(
            Instant generatedAt,
            String title,
            String objective,
            List<MetricCard> metrics,
            List<CapabilityGroup> capabilityGroups,
            List<AlertItem> alerts,
            List<FeatureFlag> featureFlags
    ) {
    }

    public record ThreatDistribution(
            String label,
            int value,
            String tone
    ) {
    }

    public record ThreatTrendPoint(
            String period,
            int threats,
            int baseline
    ) {
    }

    public record ComplianceGauge(
            String id,
            String label,
            int value,
            String tone
    ) {
    }

    public record SecurityGovernanceResponse(
            Instant generatedAt,
            String title,
            String objective,
            List<MetricCard> metrics,
            List<CapabilityGroup> capabilityGroups,
            List<ThreatDistribution> topThreats,
            List<ThreatTrendPoint> monthlyThreats,
            List<ComplianceGauge> complianceGauges,
            List<AlertItem> alerts,
            List<FeatureFlag> featureFlags
    ) {
    }

    public record SectionSignal(
            String label,
            String value,
            String trend
    ) {
    }

    public record SectionInsightResponse(
            Instant generatedAt,
            String parentKey,
            String sectionKey,
            String sectionLabel,
            String status,
            String statusNote,
            List<SectionSignal> signals,
            List<String> actions,
            List<String> checklist
    ) {
    }

    public record ExecuteOperationRequest(
            String note,
            Boolean dryRun,
            Map<String, Object> parameters
    ) {
    }

    public record FeatureFlagUpdateRequest(
            Boolean enabled,
            String owner,
            String description
    ) {
    }
}
