package com.sabahub.web.dto.admin;

import java.time.Instant;
import java.util.List;

public final class AdminAnalyticsDTOs {

    private AdminAnalyticsDTOs() {
    }

    public record MetricCard(
            String id,
            String label,
            String value,
            String helper,
            String tone
    ) {
    }

    public record TrendPoint(
            String period,
            long users,
            long jobs,
            long proposals,
            long hires,
            double revenue
    ) {
    }

    public record BreakdownItem(
            String label,
            long value,
            String helper
    ) {
    }

    public record RevenueSlice(
            String label,
            double value,
            long transactions
    ) {
    }

    public record InsightItem(
            String title,
            String detail,
            String tone
    ) {
    }

    public record AiStatus(
            String engine,
            String version,
            String mode,
            String inferenceMode,
            boolean pythonBridgeReachable,
            boolean pythonJobsEnabled,
            boolean pythonFreelancersEnabled,
            boolean pythonFraudEnabled,
            boolean pythonChatEnabled,
            double blendJobs,
            double blendFreelancers,
            double blendFraud,
            double blendChat
    ) {
    }

    public record WorkspaceResponse(
            Instant generatedAt,
            int windowDays,
            List<MetricCard> headlineMetrics,
            List<TrendPoint> trend,
            List<BreakdownItem> roleDistribution,
            List<BreakdownItem> hiringFunnel,
            List<BreakdownItem> jobStatusBreakdown,
            List<BreakdownItem> proposalStatusBreakdown,
            List<BreakdownItem> topCategories,
            List<RevenueSlice> revenueByProvider,
            List<MetricCard> engagementMetrics,
            List<MetricCard> operationsMetrics,
            List<InsightItem> insights,
            AiStatus aiStatus
    ) {
    }

    public record ReportSection(
            String id,
            String title,
            List<String> highlights
    ) {
    }

    public record ExecutiveReportResponse(
            Instant generatedAt,
            int windowDays,
            String title,
            String summary,
            List<MetricCard> headlineMetrics,
            List<ReportSection> sections,
            List<InsightItem> insights,
            AiStatus aiStatus
    ) {
    }

    public record ExportBundle(
            Instant generatedAt,
            int windowDays,
            WorkspaceResponse workspace,
            ExecutiveReportResponse report
    ) {
    }
}
