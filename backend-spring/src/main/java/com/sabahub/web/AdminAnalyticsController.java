package com.sabahub.web;

import com.sabahub.domain.Job;
import com.sabahub.domain.Transaction;
import com.sabahub.domain.User;
import com.sabahub.repository.DisputeRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.AdminAnalyticsReportingService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.web.dto.admin.AdminAnalyticsDTOs;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@Validated
public class AdminAnalyticsController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final TransactionRepository transactionRepository;
    private final DisputeRepository disputeRepository;
    private final CurrentUserService currentUserService;
    private final AdminAnalyticsReportingService adminAnalyticsReportingService;

    public AdminAnalyticsController(UserRepository userRepository,
                                    JobRepository jobRepository,
                                    TransactionRepository transactionRepository,
                                    DisputeRepository disputeRepository,
                                    CurrentUserService currentUserService,
                                    AdminAnalyticsReportingService adminAnalyticsReportingService) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.transactionRepository = transactionRepository;
        this.disputeRepository = disputeRepository;
        this.currentUserService = currentUserService;
        this.adminAnalyticsReportingService = adminAnalyticsReportingService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        requireAdmin();

        long users = userRepository.count();
        long jobs = jobRepository.count();
        double revenue = transactionRepository.findAll().stream()
                .filter(tx -> tx.getDirection() == Transaction.Direction.IN && tx.getStatus() == Transaction.Status.SUCCESS)
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();
        long disputesOpen = disputeRepository.findAll().stream()
                .filter(d -> d.getStatus() == com.sabahub.domain.Dispute.Status.OPEN || d.getStatus() == com.sabahub.domain.Dispute.Status.UNDER_REVIEW)
                .count();

        return ResponseEntity.ok(Map.of(
                "users", users,
                "jobs", jobs,
                "revenue", revenue,
                "disputesOpen", disputesOpen
        ));
    }

    /**
     * Returns last 30 days of daily counts for users, jobs, revenue
     */
    @GetMapping("/daily")
    public ResponseEntity<Map<String, Object>> daily() {
        requireAdmin();

        Instant now = Instant.now();
        Instant start30 = now.minus(30, ChronoUnit.DAYS);

        List<User> allUsers = userRepository.findByCreatedAtAfter(start30);
        List<Job> allJobs = jobRepository.findByCreatedAtAfter(start30);
        List<Transaction> allTxns = transactionRepository.findByCreatedAtAfter(start30);

        // Bucket by day string (YYYY-MM-DD)
        Map<String, Integer> usersPerDay = new HashMap<>();
        Map<String, Integer> jobsPerDay = new HashMap<>();
        Map<String, Double> revenuePerDay = new HashMap<>();

        for (User u : allUsers) {
            if (u.getCreatedAt() != null) {
                String day = u.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
                usersPerDay.put(day, usersPerDay.getOrDefault(day, 0) + 1);
            }
        }

        for (Job j : allJobs) {
            if (j.getCreatedAt() != null) {
                String day = j.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
                jobsPerDay.put(day, jobsPerDay.getOrDefault(day, 0) + 1);
            }
        }

        for (Transaction tx : allTxns) {
            if (tx.getCreatedAt() != null && tx.getStatus() == Transaction.Status.SUCCESS && tx.getDirection() == Transaction.Direction.IN) {
                String day = tx.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
                double amt = tx.getAmount() != null ? tx.getAmount() : 0.0;
                revenuePerDay.put(day, revenuePerDay.getOrDefault(day, 0.0) + amt);
            }
        }

        // Build list of date series
        List<String> dates = new ArrayList<>();
        List<Integer> userCounts = new ArrayList<>();
        List<Integer> jobCounts = new ArrayList<>();
        List<Double> revenueAmounts = new ArrayList<>();

        for (int i = 29; i >= 0; i--) {
            Instant dayInstant = now.minus(i, ChronoUnit.DAYS);
            String day = dayInstant.atZone(ZoneOffset.UTC).toLocalDate().toString();
            dates.add(day);
            userCounts.add(usersPerDay.getOrDefault(day, 0));
            jobCounts.add(jobsPerDay.getOrDefault(day, 0));
            revenueAmounts.add(revenuePerDay.getOrDefault(day, 0.0));
        }

        return ResponseEntity.ok(Map.of(
                "dates", dates,
                "users", userCounts,
                "jobs", jobCounts,
                "revenue", revenueAmounts
        ));
    }

    @GetMapping("/workspace")
    public ResponseEntity<AdminAnalyticsDTOs.WorkspaceResponse> workspace(
            @RequestParam(defaultValue = "30") @Min(7) @Max(365) int days) {
        requireAdmin();
        return ResponseEntity.ok(adminAnalyticsReportingService.getWorkspace(days));
    }

    @PostMapping("/reports/executive")
    public ResponseEntity<AdminAnalyticsDTOs.ExecutiveReportResponse> executiveReport(
            @RequestParam(defaultValue = "30") @Min(7) @Max(365) int days) {
        requireAdmin();
        return ResponseEntity.ok(adminAnalyticsReportingService.generateExecutiveReport(days));
    }

    @GetMapping("/export/json")
    public ResponseEntity<AdminAnalyticsDTOs.ExportBundle> exportJson(
            @RequestParam(defaultValue = "30") @Min(7) @Max(365) int days) {
        requireAdmin();
        return ResponseEntity.ok(adminAnalyticsReportingService.exportBundle(days));
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(defaultValue = "30") @Min(7) @Max(365) int days) {
        requireAdmin();
        String filename = "admin-analytics-" + Instant.now().truncatedTo(ChronoUnit.SECONDS).toString().replace(":", "-") + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(adminAnalyticsReportingService.exportCsv(days));
    }

    @GetMapping("/ai-usage/logs")
    public ResponseEntity<List<AdminAnalyticsDTOs.AIInferenceLog>> aiUsageLogs(
            @RequestParam(defaultValue = "50") @Min(1) @Max(500) int count) {
        requireAdmin();
        return ResponseEntity.ok(adminAnalyticsReportingService.getAIUsageLogs(count));
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
}
