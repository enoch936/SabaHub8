package com.sabahub.service;

import com.sabahub.domain.AuditLog;
import com.sabahub.domain.Contract;
import com.sabahub.domain.Dispute;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.Transaction;
import com.sabahub.domain.User;
import com.sabahub.repository.AuditLogRepository;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.DisputeRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.admin.AdminAnalyticsDTOs;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsReportingService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ProposalRepository proposalRepository;
    private final ContractRepository contractRepository;
    private final TransactionRepository transactionRepository;
    private final DisputeRepository disputeRepository;
    private final FreelancerRepository freelancerRepository;
    private final AuditLogRepository auditLogRepository;
    private final AIInsightsService aiInsightsService;

    public AdminAnalyticsReportingService(UserRepository userRepository,
                                          JobRepository jobRepository,
                                          ProposalRepository proposalRepository,
                                          ContractRepository contractRepository,
                                          TransactionRepository transactionRepository,
                                          DisputeRepository disputeRepository,
                                          FreelancerRepository freelancerRepository,
                                          AuditLogRepository auditLogRepository,
                                          AIInsightsService aiInsightsService) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.proposalRepository = proposalRepository;
        this.contractRepository = contractRepository;
        this.transactionRepository = transactionRepository;
        this.disputeRepository = disputeRepository;
        this.freelancerRepository = freelancerRepository;
        this.auditLogRepository = auditLogRepository;
        this.aiInsightsService = aiInsightsService;
    }

    public AdminAnalyticsDTOs.WorkspaceResponse getWorkspace(int days) {
        AnalyticsComputation computation = compute(days);
        return toWorkspace(computation);
    }

    public AdminAnalyticsDTOs.ExecutiveReportResponse generateExecutiveReport(int days) {
        AnalyticsComputation computation = compute(days);
        return toExecutiveReport(computation);
    }

    public AdminAnalyticsDTOs.ExportBundle exportBundle(int days) {
        AnalyticsComputation computation = compute(days);
        AdminAnalyticsDTOs.WorkspaceResponse workspace = toWorkspace(computation);
        AdminAnalyticsDTOs.ExecutiveReportResponse report = toExecutiveReport(computation);
        return new AdminAnalyticsDTOs.ExportBundle(
                Instant.now(),
                computation.days(),
                workspace,
                report
        );
    }

    public String exportCsv(int days) {
        AdminAnalyticsDTOs.ExportBundle bundle = exportBundle(days);
        StringBuilder csv = new StringBuilder();

        appendRow(csv, "section", "label", "value", "helper", "period", "users", "jobs", "proposals", "hires", "revenue", "transactions", "tone");

        for (AdminAnalyticsDTOs.MetricCard card : bundle.workspace().headlineMetrics()) {
            appendRow(csv, "headline_metric", card.label(), card.value(), card.helper(), "", "", "", "", "", "", "", card.tone());
        }
        for (AdminAnalyticsDTOs.MetricCard card : bundle.workspace().engagementMetrics()) {
            appendRow(csv, "engagement_metric", card.label(), card.value(), card.helper(), "", "", "", "", "", "", "", card.tone());
        }
        for (AdminAnalyticsDTOs.MetricCard card : bundle.workspace().operationsMetrics()) {
            appendRow(csv, "operations_metric", card.label(), card.value(), card.helper(), "", "", "", "", "", "", "", card.tone());
        }
        for (AdminAnalyticsDTOs.BreakdownItem item : bundle.workspace().roleDistribution()) {
            appendRow(csv, "role_distribution", item.label(), String.valueOf(item.value()), item.helper(), "", "", "", "", "", "", "", "");
        }
        for (AdminAnalyticsDTOs.BreakdownItem item : bundle.workspace().hiringFunnel()) {
            appendRow(csv, "hiring_funnel", item.label(), String.valueOf(item.value()), item.helper(), "", "", "", "", "", "", "", "");
        }
        for (AdminAnalyticsDTOs.BreakdownItem item : bundle.workspace().jobStatusBreakdown()) {
            appendRow(csv, "job_status", item.label(), String.valueOf(item.value()), item.helper(), "", "", "", "", "", "", "", "");
        }
        for (AdminAnalyticsDTOs.BreakdownItem item : bundle.workspace().proposalStatusBreakdown()) {
            appendRow(csv, "proposal_status", item.label(), String.valueOf(item.value()), item.helper(), "", "", "", "", "", "", "", "");
        }
        for (AdminAnalyticsDTOs.BreakdownItem item : bundle.workspace().topCategories()) {
            appendRow(csv, "top_category", item.label(), String.valueOf(item.value()), item.helper(), "", "", "", "", "", "", "", "");
        }
        for (AdminAnalyticsDTOs.RevenueSlice slice : bundle.workspace().revenueByProvider()) {
            appendRow(csv, "revenue_provider", slice.label(), formatCurrency(slice.value()), "", "", "", "", "", "", formatDecimal(slice.value()), String.valueOf(slice.transactions()), "");
        }
        for (AdminAnalyticsDTOs.TrendPoint point : bundle.workspace().trend()) {
            appendRow(
                    csv,
                    "trend",
                    "Daily Trend",
                    "",
                    "",
                    point.period(),
                    String.valueOf(point.users()),
                    String.valueOf(point.jobs()),
                    String.valueOf(point.proposals()),
                    String.valueOf(point.hires()),
                    formatDecimal(point.revenue()),
                    "",
                    ""
            );
        }
        for (AdminAnalyticsDTOs.InsightItem insight : bundle.workspace().insights()) {
            appendRow(csv, "insight", insight.title(), insight.detail(), "", "", "", "", "", "", "", "", insight.tone());
        }
        for (AdminAnalyticsDTOs.ReportSection section : bundle.report().sections()) {
            for (String highlight : section.highlights()) {
                appendRow(csv, "report_section", section.title(), highlight, "", "", "", "", "", "", "", "", "");
            }
        }

        return csv.toString();
    }

    private AnalyticsComputation compute(int requestedDays) {
        int days = Math.max(7, Math.min(365, requestedDays));
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate currentStartDate = today.minusDays(days - 1L);
        LocalDate previousStartDate = currentStartDate.minusDays(days);
        LocalDate previousEndExclusive = currentStartDate;
        LocalDate currentEndExclusive = today.plusDays(1);

        List<User> users = userRepository.findAll();
        List<Job> jobs = jobRepository.findAll();
        List<Proposal> proposals = proposalRepository.findAll();
        List<Contract> contracts = contractRepository.findAll();
        List<Transaction> transactions = transactionRepository.findAll();
        List<Dispute> disputes = disputeRepository.findAll();
        List<Freelancer> freelancers = freelancerRepository.findAll();
        List<AuditLog> auditLogs = auditLogRepository.findAll();

        return new AnalyticsComputation(
                days,
                today,
                currentStartDate,
                currentEndExclusive,
                previousStartDate,
                previousEndExclusive,
                users,
                jobs,
                proposals,
                contracts,
                transactions,
                disputes,
                freelancers,
                auditLogs,
                toAiStatus(aiInsightsService.engineStatus())
        );
    }

    private AdminAnalyticsDTOs.WorkspaceResponse toWorkspace(AnalyticsComputation c) {
        return new AdminAnalyticsDTOs.WorkspaceResponse(
                Instant.now(),
                c.days(),
                buildHeadlineMetrics(c),
                buildTrend(c),
                buildRoleDistribution(c.users()),
                buildHiringFunnel(c),
                buildJobStatusBreakdown(c.jobs()),
                buildProposalStatusBreakdown(c.proposals()),
                buildTopCategories(c),
                buildRevenueByProvider(c),
                buildEngagementMetrics(c),
                buildOperationsMetrics(c),
                buildInsights(c),
                c.aiStatus()
        );
    }

    private AdminAnalyticsDTOs.ExecutiveReportResponse toExecutiveReport(AnalyticsComputation c) {
        List<AdminAnalyticsDTOs.MetricCard> headlineMetrics = buildHeadlineMetrics(c);
        List<AdminAnalyticsDTOs.InsightItem> insights = buildInsights(c);

        long currentJobs = countByDate(c.jobs(), Job::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        long currentProposals = countByDate(c.proposals(), Proposal::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        long currentContracts = countByDate(c.contracts(), Contract::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        double currentRevenue = sumByDate(
                c.transactions().stream()
                        .filter(this::isSuccessfulInbound)
                        .toList(),
                Transaction::getCreatedAt,
                Transaction::getAmount,
                c.currentStartDate(),
                c.currentEndExclusive()
        );
        long activeUsers = countUsersByActivity(c.users(), c.currentStartDate(), c.currentEndExclusive());
        long openDisputes = c.disputes().stream()
                .filter(this::isOpenDispute)
                .count();
        double paymentSuccessRate = paymentSuccessRate(c);

        List<AdminAnalyticsDTOs.ReportSection> sections = List.of(
                new AdminAnalyticsDTOs.ReportSection(
                        "growth",
                        "Marketplace Growth",
                        List.of(
                                formatLong(activeUsers) + " users were active during the last " + c.days() + " days.",
                                formatLong(currentJobs) + " jobs were posted and " + formatLong(currentProposals) + " proposals entered the marketplace.",
                                topCategoryNarrative(c)
                        )
                ),
                new AdminAnalyticsDTOs.ReportSection(
                        "hiring",
                        "Hiring Efficiency",
                        List.of(
                                formatLong(currentContracts) + " hires were created in the current reporting window.",
                                "Proposal acceptance is running at " + formatPercent(proposalAcceptanceRate(c)) + ".",
                                "Active employers: " + formatLong(activeEmployers(c)) + " | Active freelancers: " + formatLong(activeFreelancers(c))
                        )
                ),
                new AdminAnalyticsDTOs.ReportSection(
                        "revenue",
                        "Revenue & Payments",
                        List.of(
                                "Successful inbound volume reached " + formatCurrency(currentRevenue) + ".",
                                "Payment success rate is " + formatPercent(paymentSuccessRate) + ".",
                                revenueNarrative(c)
                        )
                ),
                new AdminAnalyticsDTOs.ReportSection(
                        "operations",
                        "Operations & Risk",
                        List.of(
                                formatLong(openDisputes) + " disputes are currently unresolved.",
                                formatLong(auditEvents(c)) + " audit events were captured during the reporting window.",
                                "Verified freelancer ratio stands at " + formatPercent(verifiedFreelancerRatio(c)) + "."
                        )
                ),
                new AdminAnalyticsDTOs.ReportSection(
                        "ai",
                        "AI Operations",
                        List.of(
                                "Inference mode: " + emptyFallback(c.aiStatus().inferenceMode(), "Unknown"),
                                "Python bridge reachable: " + (c.aiStatus().pythonBridgeReachable() ? "Yes" : "No"),
                                "Fraud model enabled: " + (c.aiStatus().pythonFraudEnabled() ? "Yes" : "No")
                        )
                )
        );

        String summary = "Over the last " + c.days() + " days, SabaHub recorded "
                + formatLong(currentJobs) + " jobs, "
                + formatLong(currentProposals) + " proposals, "
                + formatLong(currentContracts) + " hires, and "
                + formatCurrency(currentRevenue) + " in successful inbound revenue.";

        return new AdminAnalyticsDTOs.ExecutiveReportResponse(
                Instant.now(),
                c.days(),
                "Executive Report",
                summary,
                headlineMetrics,
                sections,
                insights,
                c.aiStatus()
        );
    }

    private List<AdminAnalyticsDTOs.MetricCard> buildHeadlineMetrics(AnalyticsComputation c) {
        long activeUsers = countUsersByActivity(c.users(), c.currentStartDate(), c.currentEndExclusive());
        long previousActiveUsers = countUsersByActivity(c.users(), c.previousStartDate(), c.previousEndExclusive());
        long currentJobs = countByDate(c.jobs(), Job::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        long previousJobs = countByDate(c.jobs(), Job::getCreatedAt, c.previousStartDate(), c.previousEndExclusive());
        long currentProposals = countByDate(c.proposals(), Proposal::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        long previousProposals = countByDate(c.proposals(), Proposal::getCreatedAt, c.previousStartDate(), c.previousEndExclusive());
        long currentContracts = countByDate(c.contracts(), Contract::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        long previousContracts = countByDate(c.contracts(), Contract::getCreatedAt, c.previousStartDate(), c.previousEndExclusive());
        double currentRevenue = sumByDate(
                c.transactions().stream().filter(this::isSuccessfulInbound).toList(),
                Transaction::getCreatedAt,
                Transaction::getAmount,
                c.currentStartDate(),
                c.currentEndExclusive()
        );
        double previousRevenue = sumByDate(
                c.transactions().stream().filter(this::isSuccessfulInbound).toList(),
                Transaction::getCreatedAt,
                Transaction::getAmount,
                c.previousStartDate(),
                c.previousEndExclusive()
        );
        long openDisputes = c.disputes().stream()
                .filter(this::isOpenDispute)
                .count();
        long currentDisputes = countByDate(c.disputes(), Dispute::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());

        return List.of(
                new AdminAnalyticsDTOs.MetricCard(
                        "active-users",
                        "Active Users",
                        formatLong(activeUsers),
                        compareCounts(activeUsers, previousActiveUsers, c.days()),
                        activeUsers >= previousActiveUsers ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "jobs-posted",
                        "Jobs Posted",
                        formatLong(currentJobs),
                        compareCounts(currentJobs, previousJobs, c.days()),
                        currentJobs >= previousJobs ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "proposals-submitted",
                        "Proposals Submitted",
                        formatLong(currentProposals),
                        compareCounts(currentProposals, previousProposals, c.days()),
                        currentProposals >= previousProposals ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "hires-created",
                        "Hires Created",
                        formatLong(currentContracts),
                        compareCounts(currentContracts, previousContracts, c.days()),
                        currentContracts >= previousContracts ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "revenue-captured",
                        "Revenue Captured",
                        formatCurrency(currentRevenue),
                        compareAmounts(currentRevenue, previousRevenue, c.days()),
                        currentRevenue >= previousRevenue ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "open-disputes",
                        "Open Disputes",
                        formatLong(openDisputes),
                        formatLong(currentDisputes) + " opened in the last " + c.days() + " days",
                        openDisputes > 0 ? "warning" : "success"
                )
        );
    }

    private List<AdminAnalyticsDTOs.TrendPoint> buildTrend(AnalyticsComputation c) {
        Map<LocalDate, Long> users = countSeries(c.users(), User::getCreatedAt, c.currentStartDate(), c.today());
        Map<LocalDate, Long> jobs = countSeries(c.jobs(), Job::getCreatedAt, c.currentStartDate(), c.today());
        Map<LocalDate, Long> proposals = countSeries(c.proposals(), Proposal::getCreatedAt, c.currentStartDate(), c.today());
        Map<LocalDate, Long> hires = countSeries(c.contracts(), Contract::getCreatedAt, c.currentStartDate(), c.today());
        Map<LocalDate, Double> revenue = sumSeries(
                c.transactions().stream()
                        .filter(this::isSuccessfulInbound)
                        .toList(),
                Transaction::getCreatedAt,
                Transaction::getAmount,
                c.currentStartDate(),
                c.today()
        );

        List<AdminAnalyticsDTOs.TrendPoint> points = new ArrayList<>();
        for (LocalDate day = c.currentStartDate(); !day.isAfter(c.today()); day = day.plusDays(1)) {
            points.add(new AdminAnalyticsDTOs.TrendPoint(
                    day.toString(),
                    users.getOrDefault(day, 0L),
                    jobs.getOrDefault(day, 0L),
                    proposals.getOrDefault(day, 0L),
                    hires.getOrDefault(day, 0L),
                    revenue.getOrDefault(day, 0.0)
            ));
        }
        return points;
    }

    private List<AdminAnalyticsDTOs.BreakdownItem> buildRoleDistribution(List<User> users) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("Freelancers", users.stream().filter(user -> hasRole(user, "FREELANCER")).count());
        counts.put("Employers", users.stream().filter(user -> hasRole(user, "EMPLOYER")).count());
        counts.put("Admins", users.stream().filter(user -> hasRole(user, "ADMIN") || hasRole(user, "SUPER_ADMIN")).count());
        counts.put("Other", users.stream().filter(user -> !hasRole(user, "FREELANCER") && !hasRole(user, "EMPLOYER") && !hasRole(user, "ADMIN") && !hasRole(user, "SUPER_ADMIN")).count());

        return counts.entrySet().stream()
                .map(entry -> new AdminAnalyticsDTOs.BreakdownItem(entry.getKey(), entry.getValue(), "Registered accounts"))
                .toList();
    }

    private List<AdminAnalyticsDTOs.BreakdownItem> buildHiringFunnel(AnalyticsComputation c) {
        long openJobs = c.jobs().stream().filter(job -> job.getStatus() == Job.Status.OPEN).count();
        long submitted = c.proposals().stream().filter(proposal -> proposal.getStatus() == Proposal.Status.SUBMITTED).count();
        long shortlisted = c.proposals().stream().filter(proposal -> proposal.getStatus() == Proposal.Status.SHORTLISTED).count();
        long accepted = c.proposals().stream().filter(proposal -> proposal.getStatus() == Proposal.Status.ACCEPTED).count();
        long activeContracts = c.contracts().stream()
                .filter(contract -> contract.getStatus() == Contract.Status.ACTIVE
                        || contract.getStatus() == Contract.Status.IN_PROGRESS
                        || contract.getStatus() == Contract.Status.DELIVERED)
                .count();

        return List.of(
                new AdminAnalyticsDTOs.BreakdownItem("Open Jobs", openJobs, "Live marketplace demand"),
                new AdminAnalyticsDTOs.BreakdownItem("Submitted Proposals", submitted, "Awaiting employer review"),
                new AdminAnalyticsDTOs.BreakdownItem("Shortlisted", shortlisted, "Active employer consideration"),
                new AdminAnalyticsDTOs.BreakdownItem("Accepted", accepted, "Converted proposals"),
                new AdminAnalyticsDTOs.BreakdownItem("Active Contracts", activeContracts, "Delivery in progress")
        );
    }

    private List<AdminAnalyticsDTOs.BreakdownItem> buildJobStatusBreakdown(List<Job> jobs) {
        return countByLabel(
                jobs,
                job -> titleCase(job.getStatus() == null ? "UNKNOWN" : job.getStatus().name()),
                "Jobs in status"
        );
    }

    private List<AdminAnalyticsDTOs.BreakdownItem> buildProposalStatusBreakdown(List<Proposal> proposals) {
        return countByLabel(
                proposals,
                proposal -> titleCase(proposal.getStatus() == null ? "UNKNOWN" : proposal.getStatus().name()),
                "Proposals in status"
        );
    }

    private List<AdminAnalyticsDTOs.BreakdownItem> buildTopCategories(AnalyticsComputation c) {
        List<Job> source = c.jobs().stream()
                .filter(job -> withinRange(toDate(job.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .toList();

        if (source.isEmpty()) {
            source = c.jobs().stream()
                    .filter(job -> job.getStatus() == Job.Status.OPEN)
                    .toList();
        }
        if (source.isEmpty()) {
            source = c.jobs();
        }

        long total = source.size();
        Map<String, Long> counts = source.stream()
                .collect(Collectors.groupingBy(
                        job -> normalizeCategory(job.getCategoryId()),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(entry -> new AdminAnalyticsDTOs.BreakdownItem(
                        entry.getKey(),
                        entry.getValue(),
                        total == 0 ? "No jobs tracked" : formatPercent(entry.getValue() / (double) total) + " of tracked jobs"
                ))
                .toList();
    }

    private List<AdminAnalyticsDTOs.RevenueSlice> buildRevenueByProvider(AnalyticsComputation c) {
        List<Transaction> currentTransactions = c.transactions().stream()
                .filter(this::isSuccessfulInbound)
                .filter(tx -> withinRange(toDate(tx.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .toList();

        if (currentTransactions.isEmpty()) {
            currentTransactions = c.transactions().stream()
                    .filter(this::isSuccessfulInbound)
                    .toList();
        }

        Map<String, Double> totals = new LinkedHashMap<>();
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Transaction tx : currentTransactions) {
            String label = titleCase(tx.getProvider() == null ? "UNKNOWN" : tx.getProvider().name());
            totals.put(label, totals.getOrDefault(label, 0.0) + defaultNumber(tx.getAmount()));
            counts.put(label, counts.getOrDefault(label, 0L) + 1L);
        }

        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(entry -> new AdminAnalyticsDTOs.RevenueSlice(
                        entry.getKey(),
                        entry.getValue(),
                        counts.getOrDefault(entry.getKey(), 0L)
                ))
                .toList();
    }

    private List<AdminAnalyticsDTOs.MetricCard> buildEngagementMetrics(AnalyticsComputation c) {
        long activeEmployers = activeEmployers(c);
        long activeFreelancers = activeFreelancers(c);
        double proposalsPerOpenJob = safeDivide(
                countByDate(c.proposals(), Proposal::getCreatedAt, c.currentStartDate(), c.currentEndExclusive()),
                Math.max(1, c.jobs().stream().filter(job -> job.getStatus() == Job.Status.OPEN).count())
        );
        double acceptanceRate = proposalAcceptanceRate(c);
        double averageBid = averageProposalBid(c);
        double verifiedFreelancerRatio = verifiedFreelancerRatio(c);

        return List.of(
                new AdminAnalyticsDTOs.MetricCard(
                        "active-employers",
                        "Active Employers",
                        formatLong(activeEmployers),
                        "Distinct employers with job activity in the current window",
                        "info"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "active-freelancers",
                        "Active Freelancers",
                        formatLong(activeFreelancers),
                        "Distinct freelancers submitting proposals in the current window",
                        "info"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "proposal-acceptance-rate",
                        "Proposal Acceptance Rate",
                        formatPercent(acceptanceRate),
                        "Accepted proposals / total proposals in the current window",
                        acceptanceRate >= 0.12 ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "proposals-per-open-job",
                        "Proposals Per Open Job",
                        formatDecimal(proposalsPerOpenJob),
                        "Current-window proposal density across open jobs",
                        proposalsPerOpenJob >= 2 ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "average-bid",
                        "Average Proposal Bid",
                        formatCurrency(averageBid),
                        "Mean bid amount from proposals submitted in the current window",
                        "primary"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "verified-freelancer-ratio",
                        "Verified Freelancer Ratio",
                        formatPercent(verifiedFreelancerRatio),
                        "Verified freelancer profiles / total freelancer profiles",
                        verifiedFreelancerRatio >= 0.7 ? "success" : "warning"
                )
        );
    }

    private List<AdminAnalyticsDTOs.MetricCard> buildOperationsMetrics(AnalyticsComputation c) {
        double successRate = paymentSuccessRate(c);
        long failedPayments = c.transactions().stream()
                .filter(tx -> tx.getStatus() == Transaction.Status.FAILED)
                .filter(tx -> withinRange(toDate(tx.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .count();
        long audits = auditEvents(c);
        double disputeIncidence = safeDivide(
                countByDate(c.disputes(), Dispute::getCreatedAt, c.currentStartDate(), c.currentEndExclusive()),
                Math.max(1, countByDate(c.contracts(), Contract::getCreatedAt, c.currentStartDate(), c.currentEndExclusive()))
        );

        return List.of(
                new AdminAnalyticsDTOs.MetricCard(
                        "payment-success-rate",
                        "Payment Success Rate",
                        formatPercent(successRate),
                        "Successful inbound payments / terminal inbound payments",
                        successRate >= 0.9 ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "failed-payments",
                        "Failed Payments",
                        formatLong(failedPayments),
                        "Inbound payment failures in the current window",
                        failedPayments == 0 ? "success" : "warning"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "audit-events",
                        "Audit Events",
                        formatLong(audits),
                        "Governance events captured in the current window",
                        "info"
                ),
                new AdminAnalyticsDTOs.MetricCard(
                        "dispute-incidence",
                        "Dispute Incidence",
                        formatPercent(disputeIncidence),
                        "Disputes opened / hires created in the current window",
                        disputeIncidence <= 0.08 ? "success" : "warning"
                )
        );
    }

    private List<AdminAnalyticsDTOs.InsightItem> buildInsights(AnalyticsComputation c) {
        List<AdminAnalyticsDTOs.InsightItem> insights = new ArrayList<>();

        long currentJobs = countByDate(c.jobs(), Job::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
        long previousJobs = countByDate(c.jobs(), Job::getCreatedAt, c.previousStartDate(), c.previousEndExclusive());
        double currentRevenue = sumByDate(
                c.transactions().stream().filter(this::isSuccessfulInbound).toList(),
                Transaction::getCreatedAt,
                Transaction::getAmount,
                c.currentStartDate(),
                c.currentEndExclusive()
        );
        double previousRevenue = sumByDate(
                c.transactions().stream().filter(this::isSuccessfulInbound).toList(),
                Transaction::getCreatedAt,
                Transaction::getAmount,
                c.previousStartDate(),
                c.previousEndExclusive()
        );
        double proposalsPerOpenJob = safeDivide(
                countByDate(c.proposals(), Proposal::getCreatedAt, c.currentStartDate(), c.currentEndExclusive()),
                Math.max(1, c.jobs().stream().filter(job -> job.getStatus() == Job.Status.OPEN).count())
        );
        double successRate = paymentSuccessRate(c);
        double disputeIncidence = safeDivide(
                countByDate(c.disputes(), Dispute::getCreatedAt, c.currentStartDate(), c.currentEndExclusive()),
                Math.max(1, countByDate(c.contracts(), Contract::getCreatedAt, c.currentStartDate(), c.currentEndExclusive()))
        );

        insights.add(new AdminAnalyticsDTOs.InsightItem(
                "Marketplace Growth",
                currentJobs >= previousJobs
                        ? "Job creation is ahead of the prior " + c.days() + "-day window by " + compareDeltaPercent(currentJobs, previousJobs) + "."
                        : "Job creation is trailing the prior " + c.days() + "-day window by " + compareDeltaPercent(previousJobs, currentJobs) + ".",
                currentJobs >= previousJobs ? "success" : "warning"
        ));

        insights.add(new AdminAnalyticsDTOs.InsightItem(
                "Revenue Momentum",
                currentRevenue >= previousRevenue
                        ? "Successful inbound revenue improved by " + compareDeltaPercent(currentRevenue, previousRevenue) + "."
                        : "Successful inbound revenue softened by " + compareDeltaPercent(previousRevenue, currentRevenue) + ".",
                currentRevenue >= previousRevenue ? "success" : "warning"
        ));

        insights.add(new AdminAnalyticsDTOs.InsightItem(
                "Funnel Pressure",
                proposalsPerOpenJob >= 2
                        ? "Proposal flow is healthy at " + formatDecimal(proposalsPerOpenJob) + " proposals per open job."
                        : "Demand is outpacing supply at " + formatDecimal(proposalsPerOpenJob) + " proposals per open job.",
                proposalsPerOpenJob >= 2 ? "success" : "warning"
        ));

        insights.add(new AdminAnalyticsDTOs.InsightItem(
                "Payments & Risk",
                "Payment success is " + formatPercent(successRate) + " while dispute incidence is " + formatPercent(disputeIncidence) + ".",
                successRate >= 0.9 && disputeIncidence <= 0.08 ? "success" : "warning"
        ));

        insights.add(new AdminAnalyticsDTOs.InsightItem(
                "AI Operations",
                c.aiStatus().pythonBridgeReachable()
                        ? "AI bridge is reachable with " + emptyFallback(c.aiStatus().mode(), "unknown mode") + " execution."
                        : "AI bridge is unreachable; local engine mode is " + emptyFallback(c.aiStatus().mode(), "unknown") + ".",
                c.aiStatus().pythonBridgeReachable() ? "info" : "warning"
        ));

        return insights;
    }

    private long activeEmployers(AnalyticsComputation c) {
        return c.jobs().stream()
                .filter(job -> withinRange(toDate(job.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .map(Job::getEmployerId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
    }

    private long activeFreelancers(AnalyticsComputation c) {
        return c.proposals().stream()
                .filter(proposal -> withinRange(toDate(proposal.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .map(Proposal::getFreelancerId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
    }

    private long auditEvents(AnalyticsComputation c) {
        return countByDate(c.auditLogs(), AuditLog::getCreatedAt, c.currentStartDate(), c.currentEndExclusive());
    }

    private double verifiedFreelancerRatio(AnalyticsComputation c) {
        if (c.freelancers().isEmpty()) {
            return 0;
        }
        long verified = c.freelancers().stream()
                .filter(freelancer -> "VERIFIED".equalsIgnoreCase(emptyFallback(freelancer.getVerificationStatus(), "")))
                .count();
        return safeDivide(verified, c.freelancers().size());
    }

    private double averageProposalBid(AnalyticsComputation c) {
        List<Proposal> proposals = c.proposals().stream()
                .filter(proposal -> withinRange(toDate(proposal.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .filter(proposal -> proposal.getBidAmount() != null)
                .toList();
        if (proposals.isEmpty()) {
            return 0;
        }
        return proposals.stream()
                .mapToDouble(proposal -> defaultNumber(proposal.getBidAmount()))
                .average()
                .orElse(0);
    }

    private double proposalAcceptanceRate(AnalyticsComputation c) {
        List<Proposal> proposals = c.proposals().stream()
                .filter(proposal -> withinRange(toDate(proposal.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .toList();
        if (proposals.isEmpty()) {
            return 0;
        }
        long accepted = proposals.stream()
                .filter(proposal -> proposal.getStatus() == Proposal.Status.ACCEPTED)
                .count();
        return safeDivide(accepted, proposals.size());
    }

    private double paymentSuccessRate(AnalyticsComputation c) {
        List<Transaction> terminalInbound = c.transactions().stream()
                .filter(tx -> tx.getDirection() == Transaction.Direction.IN)
                .filter(tx -> tx.getStatus() == Transaction.Status.SUCCESS || tx.getStatus() == Transaction.Status.FAILED)
                .filter(tx -> withinRange(toDate(tx.getCreatedAt()), c.currentStartDate(), c.currentEndExclusive()))
                .toList();
        if (terminalInbound.isEmpty()) {
            return 0;
        }
        long success = terminalInbound.stream()
                .filter(tx -> tx.getStatus() == Transaction.Status.SUCCESS)
                .count();
        return safeDivide(success, terminalInbound.size());
    }

    private String topCategoryNarrative(AnalyticsComputation c) {
        List<AdminAnalyticsDTOs.BreakdownItem> categories = buildTopCategories(c);
        if (categories.isEmpty()) {
            return "No job categories have enough activity for ranking.";
        }
        AdminAnalyticsDTOs.BreakdownItem lead = categories.getFirst();
        return lead.label() + " is the leading demand segment with " + formatLong(lead.value()) + " tracked jobs.";
    }

    private String revenueNarrative(AnalyticsComputation c) {
        List<AdminAnalyticsDTOs.RevenueSlice> providers = buildRevenueByProvider(c);
        if (providers.isEmpty()) {
            return "No successful inbound transactions were recorded in the selected window.";
        }
        AdminAnalyticsDTOs.RevenueSlice lead = providers.getFirst();
        return lead.label() + " contributed the largest inbound share at " + formatCurrency(lead.value()) + ".";
    }

    private <T> long countByDate(List<T> items,
                                 Function<T, Instant> dateExtractor,
                                 LocalDate startInclusive,
                                 LocalDate endExclusive) {
        return items.stream()
                .map(dateExtractor)
                .map(this::toDate)
                .filter(date -> withinRange(date, startInclusive, endExclusive))
                .count();
    }

    private <T> double sumByDate(List<T> items,
                                 Function<T, Instant> dateExtractor,
                                 Function<T, Double> valueExtractor,
                                 LocalDate startInclusive,
                                 LocalDate endExclusive) {
        return items.stream()
                .filter(item -> withinRange(toDate(dateExtractor.apply(item)), startInclusive, endExclusive))
                .mapToDouble(item -> defaultNumber(valueExtractor.apply(item)))
                .sum();
    }

    private long countUsersByActivity(List<User> users, LocalDate startInclusive, LocalDate endExclusive) {
        return users.stream()
                .map(this::userActivityDate)
                .filter(date -> withinRange(date, startInclusive, endExclusive))
                .count();
    }

    private <T> Map<LocalDate, Long> countSeries(List<T> items,
                                                 Function<T, Instant> extractor,
                                                 LocalDate startInclusive,
                                                 LocalDate endInclusive) {
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (T item : items) {
            LocalDate date = toDate(extractor.apply(item));
            if (date == null || date.isBefore(startInclusive) || date.isAfter(endInclusive)) {
                continue;
            }
            counts.put(date, counts.getOrDefault(date, 0L) + 1L);
        }
        return counts;
    }

    private <T> Map<LocalDate, Double> sumSeries(List<T> items,
                                                 Function<T, Instant> dateExtractor,
                                                 Function<T, Double> valueExtractor,
                                                 LocalDate startInclusive,
                                                 LocalDate endInclusive) {
        Map<LocalDate, Double> totals = new LinkedHashMap<>();
        for (T item : items) {
            LocalDate date = toDate(dateExtractor.apply(item));
            if (date == null || date.isBefore(startInclusive) || date.isAfter(endInclusive)) {
                continue;
            }
            totals.put(date, totals.getOrDefault(date, 0.0) + defaultNumber(valueExtractor.apply(item)));
        }
        return totals;
    }

    private <T> List<AdminAnalyticsDTOs.BreakdownItem> countByLabel(List<T> items,
                                                                    Function<T, String> labelExtractor,
                                                                    String helper) {
        return items.stream()
                .collect(Collectors.groupingBy(labelExtractor, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> new AdminAnalyticsDTOs.BreakdownItem(entry.getKey(), entry.getValue(), helper))
                .toList();
    }

    private AdminAnalyticsDTOs.AiStatus toAiStatus(Map<String, Object> payload) {
        return new AdminAnalyticsDTOs.AiStatus(
                asString(payload.get("engine")),
                asString(payload.get("version")),
                asString(payload.get("mode")),
                asString(payload.get("inferenceMode")),
                asBoolean(payload.get("pythonBridgeReachable")),
                asBoolean(payload.get("pythonJobsEnabled")),
                asBoolean(payload.get("pythonFreelancersEnabled")),
                asBoolean(payload.get("pythonFraudEnabled")),
                asBoolean(payload.get("pythonChatEnabled")),
                asDouble(payload.get("blendJobs")),
                asDouble(payload.get("blendFreelancers")),
                asDouble(payload.get("blendFraud")),
                asDouble(payload.get("blendChat"))
        );
    }

    private boolean hasRole(User user, String expectedRole) {
        if (user == null || user.getRoles() == null) {
            return false;
        }
        return user.getRoles().stream()
                .filter(Objects::nonNull)
                .map(role -> role.startsWith("ROLE_") ? role.substring(5) : role)
                .map(role -> role.toUpperCase(Locale.ROOT))
                .anyMatch(expectedRole.toUpperCase(Locale.ROOT)::equals);
    }

    private boolean isSuccessfulInbound(Transaction tx) {
        return tx.getDirection() == Transaction.Direction.IN && tx.getStatus() == Transaction.Status.SUCCESS;
    }

    private boolean isOpenDispute(Dispute dispute) {
        return dispute.getStatus() == Dispute.Status.OPEN || dispute.getStatus() == Dispute.Status.UNDER_REVIEW;
    }

    private LocalDate userActivityDate(User user) {
        Instant activity = user.getLastSeenAt() != null ? user.getLastSeenAt() : user.getCreatedAt();
        return toDate(activity);
    }

    private LocalDate toDate(Instant instant) {
        if (instant == null) {
            return null;
        }
        return instant.atZone(ZoneOffset.UTC).toLocalDate();
    }

    private boolean withinRange(LocalDate date, LocalDate startInclusive, LocalDate endExclusive) {
        return date != null && !date.isBefore(startInclusive) && date.isBefore(endExclusive);
    }

    private double defaultNumber(Double value) {
        return value == null ? 0 : value;
    }

    private double safeDivide(double numerator, double denominator) {
        if (denominator <= 0) {
            return 0;
        }
        return numerator / denominator;
    }

    private String compareCounts(long current, long previous, int days) {
        if (current == 0 && previous == 0) {
            return "Flat vs previous " + days + "d";
        }
        if (previous == 0) {
            return "New activity vs previous " + days + "d";
        }
        double delta = ((double) current - previous) / previous;
        return formatSignedPercent(delta) + " vs previous " + days + "d";
    }

    private String compareAmounts(double current, double previous, int days) {
        if (current == 0 && previous == 0) {
            return "Flat vs previous " + days + "d";
        }
        if (previous == 0) {
            return "New revenue vs previous " + days + "d";
        }
        double delta = (current - previous) / previous;
        return formatSignedPercent(delta) + " vs previous " + days + "d";
    }

    private String compareDeltaPercent(long larger, long smaller) {
        if (larger == 0 && smaller == 0) {
            return "0%";
        }
        if (smaller == 0) {
            return "100%+";
        }
        return formatPercent((larger - smaller) / (double) smaller);
    }

    private String compareDeltaPercent(double larger, double smaller) {
        if (larger == 0 && smaller == 0) {
            return "0%";
        }
        if (smaller == 0) {
            return "100%+";
        }
        return formatPercent((larger - smaller) / smaller);
    }

    private String formatSignedPercent(double ratio) {
        NumberFormat format = NumberFormat.getPercentInstance(Locale.US);
        format.setMaximumFractionDigits(1);
        String rendered = format.format(Math.abs(ratio));
        return (ratio >= 0 ? "+" : "-") + rendered;
    }

    private String formatPercent(double value) {
        NumberFormat format = NumberFormat.getPercentInstance(Locale.US);
        format.setMaximumFractionDigits(1);
        return format.format(value);
    }

    private String formatDecimal(double value) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.US);
        format.setMaximumFractionDigits(2);
        format.setMinimumFractionDigits(value > 0 && value < 10 ? 1 : 0);
        return format.format(value);
    }

    private String formatLong(long value) {
        return NumberFormat.getIntegerInstance(Locale.US).format(value);
    }

    private String formatCurrency(double value) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.US);
        format.setMaximumFractionDigits(value >= 1000 ? 0 : 2);
        return format.format(value);
    }

    private String normalizeCategory(String value) {
        String normalized = emptyFallback(value, "Uncategorized").trim();
        if (normalized.isBlank()) {
            return "Uncategorized";
        }
        return titleCase(normalized);
    }

    private String titleCase(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replace('_', ' ')
                .replace('-', ' ')
                .trim()
                .replaceAll("\\s+", " ")
                .transform(normalized -> {
                    String[] parts = normalized.split(" ");
                    List<String> transformed = new ArrayList<>();
                    for (String part : parts) {
                        if (part.isBlank()) {
                            continue;
                        }
                        transformed.add(Character.toUpperCase(part.charAt(0)) + part.substring(1));
                    }
                    return String.join(" ", transformed);
                });
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private boolean asBoolean(Object value) {
        return value instanceof Boolean bool && bool;
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value == null) {
            return 0;
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0;
        }
    }

    private String emptyFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private void appendRow(StringBuilder csv, String... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(escapeCsv(values[i]));
        }
        csv.append('\n');
    }

    private String escapeCsv(String value) {
        String sanitized = value == null ? "" : value;
        if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n")) {
            return "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }

    private record AnalyticsComputation(
            int days,
            LocalDate today,
            LocalDate currentStartDate,
            LocalDate currentEndExclusive,
            LocalDate previousStartDate,
            LocalDate previousEndExclusive,
            List<User> users,
            List<Job> jobs,
            List<Proposal> proposals,
            List<Contract> contracts,
            List<Transaction> transactions,
            List<Dispute> disputes,
            List<Freelancer> freelancers,
            List<AuditLog> auditLogs,
            AdminAnalyticsDTOs.AiStatus aiStatus
    ) {
    }
}
