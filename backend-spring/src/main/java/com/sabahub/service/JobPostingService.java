package com.sabahub.service;

import com.sabahub.domain.Job;
import com.sabahub.domain.User;
import com.sabahub.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing enterprise job postings and vendor matching
 * Handles job creation, filtering, search, and workflow management
 */
@Service
public class JobPostingService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private NotificationService notificationService;

    // ========== Job Creation & Management ==========

    /**
     * Create a new enterprise job posting
     * Only employers can create jobs
     */
    @Transactional
    public Job createJob(Job job) {
        User employer = currentUserService.requireUser();
        
        if (!employer.getRoles().contains("EMPLOYER")) {
            throw new IllegalStateException("Only employers can create jobs");
        }

        job.setEmployerId(employer.getId());
        job.setStatus(Job.Status.DRAFT);
        job.setCreatedAt(Instant.now());
        job.setUpdatedAt(Instant.now());
        job.setIsEnterpriseOnly(true);

        Job saved = jobRepository.save(job);
        
        auditService.log("JOB_CREATED", "JOB", saved.getId(), Map.of(
                "title", job.getTitle(),
                "engagementType", job.getEngagementType(),
                "deliverableType", job.getDeliverableType()
        ));

        return saved;
    }

    /**
     * Publish a job (move from DRAFT to OPEN)
     */
    @Transactional
    public Job publishJob(String jobId) {
        Job job = getJobById(jobId);
        
        User employer = currentUserService.requireUser();
        if (!job.getEmployerId().equals(employer.getId())) {
            throw new IllegalAccessError("Only job owner can publish");
        }

        job.setStatus(Job.Status.OPEN);
        job.setUpdatedAt(Instant.now());
        
        Job updated = jobRepository.save(job);
        
        auditService.log("JOB_PUBLISHED", "JOB", jobId, Map.of(
                "title", job.getTitle(),
                "deliverableType", job.getDeliverableType()
        ));

        notificationService.notifyJobPublished(job.getEmployerId(), jobId);

        return updated;
    }

    /**
     * Update existing job posting
     */
    @Transactional
    public Job updateJob(String jobId, Job jobUpdate) {
        Job job = getJobById(jobId);
        
        User employer = currentUserService.requireUser();
        if (!job.getEmployerId().equals(employer.getId())) {
            throw new IllegalAccessError("Only job owner can update");
        }

        // Only allow updates if job is still in DRAFT or OPEN status
        if (job.getStatus() == Job.Status.IN_PROGRESS || 
            job.getStatus() == Job.Status.COMPLETED) {
            throw new IllegalStateException("Cannot update job in " + job.getStatus() + " status");
        }

        if (jobUpdate.getTitle() != null) job.setTitle(jobUpdate.getTitle());
        if (jobUpdate.getDescription() != null) job.setDescription(jobUpdate.getDescription());
        if (jobUpdate.getOverviewText() != null) job.setOverviewText(jobUpdate.getOverviewText());
        if (jobUpdate.getEngagementType() != null) job.setEngagementType(jobUpdate.getEngagementType());
        if (jobUpdate.getDeliverableType() != null) job.setDeliverableType(jobUpdate.getDeliverableType());
        if (jobUpdate.getDeliverableScopes() != null) job.setDeliverableScopes(jobUpdate.getDeliverableScopes());
        if (jobUpdate.getWorkLocation() != null) job.setWorkLocation(jobUpdate.getWorkLocation());
        if (jobUpdate.getBudgetMin() != null) job.setBudgetMin(jobUpdate.getBudgetMin());
        if (jobUpdate.getBudgetMax() != null) job.setBudgetMax(jobUpdate.getBudgetMax());
        if (jobUpdate.getCurrency() != null) job.setCurrency(jobUpdate.getCurrency());
        if (jobUpdate.getPricingModel() != null) job.setPricingModel(jobUpdate.getPricingModel());
        if (jobUpdate.getSlaDeliveryDays() != null) job.setSlaDeliveryDays(jobUpdate.getSlaDeliveryDays());
        if (jobUpdate.getRequiredSkills() != null) job.setRequiredSkills(jobUpdate.getRequiredSkills());
        if (jobUpdate.getClosingDate() != null) job.setClosingDate(jobUpdate.getClosingDate());

        job.setUpdatedAt(Instant.now());
        
        Job updated = jobRepository.save(job);
        
        auditService.log("JOB_UPDATED", "JOB", jobId, Map.of(
                "previousStatus", job.getStatus(),
                "newStatus", jobUpdate.getStatus()
        ));

        return updated;
    }

    /**
     * Close a job posting
     */
    @Transactional
    public Job closeJob(String jobId, String reason) {
        Job job = getJobById(jobId);
        
        User employer = currentUserService.requireUser();
        if (!job.getEmployerId().equals(employer.getId())) {
            throw new IllegalAccessError("Only job owner can close");
        }

        job.setStatus(Job.Status.CLOSED);
        job.setUpdatedAt(Instant.now());
        
        Job updated = jobRepository.save(job);
        
        auditService.log("JOB_CLOSED", "JOB", jobId, Map.of(
                "reason", reason,
                "closingTime", Instant.now()
        ));

        return updated;
    }

    // ========== Job Retrieval ==========

    /**
     * Get job by ID (public read)
     */
    public Job getJobById(String jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));
    }

    /**
     * Get all open jobs for a category
     */
    public Page<Job> getOpenJobsByCategory(String categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return jobRepository.findByCategoryIdAndStatusAndIsEnterpriseOnly(
                categoryId, Job.Status.OPEN, true, pageable);
    }

    /**
     * Get jobs by engagement type (Contract, Project, etc.)
     */
    public Page<Job> getJobsByEngagementType(Job.EngagementType engagementType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return jobRepository.findByEngagementTypeAndStatusAndIsEnterpriseOnly(
                engagementType, Job.Status.OPEN, true, pageable);
    }

    /**
     * Get jobs by deliverable type (Video, Design, Audio, etc.)
     */
    public Page<Job> getJobsByDeliverableType(Job.DeliverableType deliverableType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return jobRepository.findByDeliverableTypeAndStatusAndIsEnterpriseOnly(
                deliverableType, Job.Status.OPEN, true, pageable);
    }

    /**
     * Get employer's own jobs
     */
    public List<Job> getEmployerJobs(Integer limit) {
        User employer = currentUserService.requireUser();
        if (limit != null) {
            return jobRepository.findByEmployerIdOrderByCreatedAtDesc(employer.getId())
                    .stream()
                    .limit(limit)
                    .collect(Collectors.toList());
        }
        return jobRepository.findByEmployerIdOrderByCreatedAtDesc(employer.getId());
    }

    // ========== Advanced Search & Filtering ==========

    /**
     * Search jobs with multiple filters
     */
    public Page<Job> searchJobs(JobSearchCriteria criteria, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        List<Job> results = jobRepository.findAll().stream()
                .filter(job -> job.getStatus() == Job.Status.OPEN)
                .filter(job -> Boolean.TRUE.equals(job.getIsEnterpriseOnly()))
                .filter(job -> filterByCriteria(job, criteria))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), results.size());
        
        return new org.springframework.data.domain.PageImpl<>(
                results.subList(start, end),
                pageable,
                results.size()
        );
    }

    /**
     * Filter job by search criteria
     */
    private boolean filterByCriteria(Job job, JobSearchCriteria criteria) {
        // Filter by deliverable type
        if (criteria.getDeliverableType() != null && 
            !job.getDeliverableType().equals(criteria.getDeliverableType())) {
            return false;
        }

        // Filter by engagement type
        if (criteria.getEngagementType() != null && 
            !job.getEngagementType().equals(criteria.getEngagementType())) {
            return false;
        }

        // Filter by skills (match at least one)
        if (criteria.getRequiredSkills() != null && !criteria.getRequiredSkills().isEmpty()) {
            if (job.getRequiredSkills() == null || job.getRequiredSkills().isEmpty()) {
                return false;
            }
            boolean hasMatchingSkill = job.getRequiredSkills().stream()
                    .anyMatch(skill -> criteria.getRequiredSkills().contains(skill));
            if (!hasMatchingSkill) return false;
        }

        // Filter by budget range
        if (criteria.getBudgetMin() != null && job.getBudgetMax() != null) {
            if (job.getBudgetMax() < criteria.getBudgetMin()) {
                return false;
            }
        }
        if (criteria.getBudgetMax() != null && job.getBudgetMin() != null) {
            if (job.getBudgetMin() > criteria.getBudgetMax()) {
                return false;
            }
        }

        // Filter by industry
        if (criteria.getIndustry() != null && !criteria.getIndustry().isEmpty()) {
            if (job.getIndustry() == null || 
                job.getIndustry().stream().noneMatch(ind -> criteria.getIndustry().contains(ind))) {
                return false;
            }
        }

        // Filter by experience requirement
        if (criteria.getMinYearsExperience() != null && job.getMinYearsExperience() != null) {
            if (criteria.getMinYearsExperience() < job.getMinYearsExperience()) {
                return false;
            }
        }

        // Filter by pricing model
        if (criteria.getPricingModel() != null && 
            !job.getPricingModel().equals(criteria.getPricingModel())) {
            return false;
        }

        // Filter by team size capability
        if (criteria.getTeamSize() != null && !criteria.getTeamSize().isEmpty()) {
            if (job.getTeamSize() == null || 
                job.getTeamSize().stream().noneMatch(size -> criteria.getTeamSize().contains(size))) {
                return false;
            }
        }

        return true;
    }

    // ========== Statistics & Analytics ==========

    /**
     * Get job statistics for employer dashboard
     */
    public Map<String, Object> getEmployerJobStats() {
        User employer = currentUserService.requireUser();
        List<Job> employerJobs = jobRepository.findByEmployerId(employer.getId());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalJobs", employerJobs.size());
        stats.put("openJobs", employerJobs.stream().filter(j -> j.getStatus() == Job.Status.OPEN).count());
        stats.put("inProgressJobs", employerJobs.stream().filter(j -> j.getStatus() == Job.Status.IN_PROGRESS).count());
        stats.put("completedJobs", employerJobs.stream().filter(j -> j.getStatus() == Job.Status.COMPLETED).count());
        stats.put("closedJobs", employerJobs.stream().filter(j -> j.getStatus() == Job.Status.CLOSED).count());

        return stats;
    }

    /**
     * Get trending jobs (most recent, highest budget)
     */
    public List<Job> getTrendingJobs(int limit) {
        return jobRepository.findByStatusAndIsEnterpriseOnly(Job.Status.OPEN, true)
                .stream()
                .sorted(Comparator.comparing(Job::getCreatedAt).reversed()
                        .thenComparing(j -> j.getBudgetMax() != null ? j.getBudgetMax() : 0, Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ========== Helper Classes ==========

    /**
     * Search criteria for advanced job filtering
     */
    public static class JobSearchCriteria {
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
