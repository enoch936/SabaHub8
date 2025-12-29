package com.sabahub.web;

import com.sabahub.domain.Job;
import com.sabahub.domain.Transaction;
import com.sabahub.domain.User;
import com.sabahub.repository.DisputeRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.TransactionRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
public class AdminAnalyticsController {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final TransactionRepository transactionRepository;
    private final DisputeRepository disputeRepository;
    private final CurrentUserService currentUserService;

    public AdminAnalyticsController(UserRepository userRepository,
                                    JobRepository jobRepository,
                                    TransactionRepository transactionRepository,
                                    DisputeRepository disputeRepository,
                                    CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.transactionRepository = transactionRepository;
        this.disputeRepository = disputeRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");

        long users = userRepository.count();
        long jobs = jobRepository.count();
        double revenue = transactionRepository.findAll().stream()
                .filter(tx -> tx.getDirection() == Transaction.Direction.IN && tx.getStatus() == Transaction.Status.SUCCESS)
                .mapToDouble(tx -> tx.getAmount() != null ? tx.getAmount() : 0.0)
                .sum();
        long disputesOpen = disputeRepository.findAll().stream()
                .filter(d -> d.getStatus() == com.sabahub.domain.Dispute.Status.OPEN || d.getStatus() == com.sabahub.domain.Dispute.Status.INVESTIGATING)
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
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");

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
}
