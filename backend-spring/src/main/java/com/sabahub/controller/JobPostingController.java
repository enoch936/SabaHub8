package com.sabahub.controller;

import com.sabahub.domain.Job;
import com.sabahub.service.JobPostingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enterprise Job Posting Controller
 * REST endpoints for managing professional job postings
 * Handles job creation, publishing, searching, and workflow
 */
@Slf4j
@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class JobPostingController {

    @Autowired
    private JobPostingService jobPostingService;

    // ========== Job Creation & Management ==========

    /**
     * POST /api/jobs
     * Create a new job posting (draft)
     * Only employers can create jobs
     */
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> createJob(@RequestBody Job job) {
        try {
            log.info("Creating new job posting: {}", job.getTitle());
            
            // Validate required fields
            if (job.getTitle() == null || job.getTitle().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Job title is required"));
            }
            if (job.getDescription() == null || job.getDescription().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Job description is required"));
            }
            if (job.getEngagementType() == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Engagement type is required"));
            }
            if (job.getDeliverableType() == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Deliverable type is required"));
            }

            Job created = jobPostingService.createJob(job);
            log.info("Job created successfully: {}", created.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating job", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to create job: " + e.getMessage()));
        }
    }

    /**
     * GET /api/jobs/{id}
     * Get job details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getJob(@PathVariable String id) {
        try {
            Job job = jobPostingService.getJobById(id);
            return ResponseEntity.ok(job);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Job not found"));
        }
    }

    /**
     * PATCH /api/jobs/{id}
     * Update job posting
     * Only job owner (employer) can update
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updateJob(@PathVariable String id, @RequestBody Job jobUpdate) {
        try {
            log.info("Updating job: {}", id);
            Job updated = jobPostingService.updateJob(id, jobUpdate);
            return ResponseEntity.ok(updated);
        } catch (IllegalAccessError e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("You can only update your own jobs"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating job", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update job: " + e.getMessage()));
        }
    }

    /**
     * POST /api/jobs/{id}/publish
     * Publish job from DRAFT to OPEN status
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> publishJob(@PathVariable String id) {
        try {
            log.info("Publishing job: {}", id);
            Job published = jobPostingService.publishJob(id);
            return ResponseEntity.ok(published);
        } catch (IllegalAccessError e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("You can only publish your own jobs"));
        } catch (Exception e) {
            log.error("Error publishing job", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to publish job: " + e.getMessage()));
        }
    }

    /**
     * POST /api/jobs/{id}/close
     * Close a job posting
     */
    @PostMapping("/{id}/close")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> closeJob(@PathVariable String id, 
                                      @RequestParam(required = false) String reason) {
        try {
            log.info("Closing job: {}", id);
            Job closed = jobPostingService.closeJob(id, reason);
            return ResponseEntity.ok(closed);
        } catch (IllegalAccessError e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(createErrorResponse("You can only close your own jobs"));
        } catch (Exception e) {
            log.error("Error closing job", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to close job: " + e.getMessage()));
        }
    }

    // ========== Job Discovery & Browsing ==========

    /**
     * GET /api/jobs/browse/open
     * Get all open job postings (paginated)
     */
    @GetMapping("/browse/open")
    public ResponseEntity<?> getOpenJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Job> jobs = jobPostingService.getOpenJobsByCategory(null, page, size);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            log.error("Error fetching open jobs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch jobs"));
        }
    }

    /**
     * GET /api/jobs/browse/by-type
     * Get jobs by engagement type
     */
    @GetMapping("/browse/by-type")
    public ResponseEntity<?> getJobsByEngagementType(
            @RequestParam Job.EngagementType engagementType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Job> jobs = jobPostingService.getJobsByEngagementType(engagementType, page, size);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            log.error("Error fetching jobs by engagement type", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch jobs"));
        }
    }

    /**
     * GET /api/jobs/browse/by-deliverable
     * Get jobs by deliverable type (Video, Design, Audio, etc.)
     */
    @GetMapping("/browse/by-deliverable")
    public ResponseEntity<?> getJobsByDeliverableType(
            @RequestParam Job.DeliverableType deliverableType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<Job> jobs = jobPostingService.getJobsByDeliverableType(deliverableType, page, size);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            log.error("Error fetching jobs by deliverable type", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch jobs"));
        }
    }

    /**
     * GET /api/jobs/trending
     * Get trending jobs (most recent, high budget)
     */
    @GetMapping("/trending")
    public ResponseEntity<?> getTrendingJobs(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<Job> trendingJobs = jobPostingService.getTrendingJobs(limit);
            return ResponseEntity.ok(trendingJobs);
        } catch (Exception e) {
            log.error("Error fetching trending jobs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch trending jobs"));
        }
    }

    // ========== Advanced Search & Filtering ==========

    /**
     * POST /api/jobs/search
     * Advanced search with multiple filters
     */
    @PostMapping("/search")
    public ResponseEntity<?> searchJobs(
            @RequestBody JobSearchRequest searchRequest,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Executing job search with filters");
            
            JobPostingService.JobSearchCriteria criteria = new JobPostingService.JobSearchCriteria();
            criteria.setDeliverableType(searchRequest.getDeliverableType());
            criteria.setEngagementType(searchRequest.getEngagementType());
            criteria.setRequiredSkills(searchRequest.getRequiredSkills());
            criteria.setBudgetMin(searchRequest.getBudgetMin());
            criteria.setBudgetMax(searchRequest.getBudgetMax());
            criteria.setIndustry(searchRequest.getIndustry());
            criteria.setMinYearsExperience(searchRequest.getMinYearsExperience());
            criteria.setPricingModel(searchRequest.getPricingModel());
            criteria.setTeamSize(searchRequest.getTeamSize());

            Page<Job> results = jobPostingService.searchJobs(criteria, page, size);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error searching jobs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to search jobs: " + e.getMessage()));
        }
    }

    // ========== Employer Dashboard ==========

    /**
     * GET /api/jobs/employer/my-jobs
     * Get logged-in employer's jobs
     */
    @GetMapping("/employer/my-jobs")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getMyJobs(
            @RequestParam(required = false) Integer limit) {
        try {
            List<Job> jobs = jobPostingService.getEmployerJobs(limit);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            log.error("Error fetching employer jobs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch your jobs"));
        }
    }

    /**
     * GET /api/jobs/employer/stats
     * Get job statistics for employer dashboard
     */
    @GetMapping("/employer/stats")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getJobStats() {
        try {
            Map<String, Object> stats = jobPostingService.getEmployerJobStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching job stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch statistics"));
        }
    }

    // ========== Helper Methods ==========

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        error.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return error;
    }

    // ========== DTOs ==========

    /**
     * Job search request DTO
     */
    public static class JobSearchRequest {
        private Job.DeliverableType deliverableType;
        private Job.EngagementType engagementType;
        private List<String> requiredSkills;
        private Double budgetMin;
        private Double budgetMax;
        private List<String> industry;
        private Integer minYearsExperience;
        private Job.PricingModel pricingModel;
        private List<String> teamSize;

        // Getters and setters
        public Job.DeliverableType getDeliverableType() { return deliverableType; }
        public void setDeliverableType(Job.DeliverableType deliverableType) { this.deliverableType = deliverableType; }

        public Job.EngagementType getEngagementType() { return engagementType; }
        public void setEngagementType(Job.EngagementType engagementType) { this.engagementType = engagementType; }

        public List<String> getRequiredSkills() { return requiredSkills; }
        public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills; }

        public Double getBudgetMin() { return budgetMin; }
        public void setBudgetMin(Double budgetMin) { this.budgetMin = budgetMin; }

        public Double getBudgetMax() { return budgetMax; }
        public void setBudgetMax(Double budgetMax) { this.budgetMax = budgetMax; }

        public List<String> getIndustry() { return industry; }
        public void setIndustry(List<String> industry) { this.industry = industry; }

        public Integer getMinYearsExperience() { return minYearsExperience; }
        public void setMinYearsExperience(Integer minYearsExperience) { this.minYearsExperience = minYearsExperience; }

        public Job.PricingModel getPricingModel() { return pricingModel; }
        public void setPricingModel(Job.PricingModel pricingModel) { this.pricingModel = pricingModel; }

        public List<String> getTeamSize() { return teamSize; }
        public void setTeamSize(List<String> teamSize) { this.teamSize = teamSize; }
    }
}
