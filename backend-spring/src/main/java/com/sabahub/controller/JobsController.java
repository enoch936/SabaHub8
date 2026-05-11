package com.sabahub.controller;

import com.sabahub.domain.Job;
import com.sabahub.domain.User;
import com.sabahub.dto.JobDTO;
import com.sabahub.repository.JobRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Locale;

@RestController
@RequestMapping("/api/v2/jobs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class JobsController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private CurrentUserService currentUserService;

    /**
     * Get count of jobs by status
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getJobCounts() {
        try {
            Map<String, Object> counts = new HashMap<>();
            counts.put("total", jobRepository.count());
            counts.put("open", jobRepository.countByStatus(Job.Status.OPEN));
            counts.put("in_progress", jobRepository.countByStatus(Job.Status.IN_PROGRESS));
            counts.put("completed", jobRepository.countByStatus(Job.Status.COMPLETED));
            counts.put("cancelled", jobRepository.countByStatus(Job.Status.CANCELLED));
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch job counts: " + e.getMessage()));
        }
    }

    /**
     * Get all jobs with pagination and filters
     */
    @GetMapping
    public ResponseEntity<?> getAllJobs(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "categoryId", required = false) String categoryId) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Job> jobs;

            if (status != null && !status.isEmpty()) {
                try {
                    Job.Status statusEnum = Job.Status.valueOf(status.toUpperCase());
                    if (categoryId != null && !categoryId.isEmpty()) {
                        jobs = jobRepository.findByStatusAndCategoryId(statusEnum, categoryId, pageable);
                    } else {
                        jobs = jobRepository.findByStatus(statusEnum, pageable);
                    }
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid status: " + status));
                }
            } else if (categoryId != null && !categoryId.isEmpty()) {
                jobs = jobRepository.findByCategoryId(categoryId, pageable);
            } else {
                jobs = jobRepository.findAll(pageable);
            }

            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch jobs: " + e.getMessage()));
        }
    }

    /**
     * Advanced search & filtering for enterprise-grade jobs
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchJobs(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "deliverableType", required = false) String deliverableType,
            @RequestParam(name = "engagementType", required = false) String engagementType,
            @RequestParam(name = "pricingModel", required = false) String pricingModel,
            @RequestParam(name = "industry", required = false) String industry,
            @RequestParam(name = "skills", required = false) String skills,
            @RequestParam(name = "enterpriseOnly", required = false) Boolean enterpriseOnly
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            List<Criteria> criteria = new ArrayList<>();

            if (q != null && !q.isBlank()) {
                Criteria text = new Criteria().orOperator(
                        Criteria.where("title").regex(q, "i"),
                        Criteria.where("description").regex(q, "i"),
                        Criteria.where("overviewText").regex(q, "i")
                );
                criteria.add(text);
            }

            if (status != null && !status.isBlank()) {
                try {
                    Job.Status st = Job.Status.valueOf(status.toUpperCase());
                    criteria.add(Criteria.where("status").is(st));
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
                }
            }

            if (deliverableType != null && !deliverableType.isBlank()) {
                try {
                    Job.DeliverableType dt = Job.DeliverableType.valueOf(deliverableType.toUpperCase());
                    criteria.add(Criteria.where("deliverableType").is(dt));
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid deliverableType: " + deliverableType));
                }
            }

            if (engagementType != null && !engagementType.isBlank()) {
                try {
                    Job.EngagementType et = Job.EngagementType.valueOf(engagementType.toUpperCase());
                    criteria.add(Criteria.where("engagementType").is(et));
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid engagementType: " + engagementType));
                }
            }

            if (pricingModel != null && !pricingModel.isBlank()) {
                try {
                    Job.PricingModel pm = Job.PricingModel.valueOf(pricingModel.toUpperCase());
                    criteria.add(Criteria.where("pricingModel").is(pm));
                } catch (IllegalArgumentException ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid pricingModel: " + pricingModel));
                }
            }

            if (industry != null && !industry.isBlank()) {
                List<String> industries = Arrays.stream(industry.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList();
                if (!industries.isEmpty()) {
                    criteria.add(Criteria.where("industry").in(industries));
                }
            }

            if (skills != null && !skills.isBlank()) {
                List<String> skillList = Arrays.stream(skills.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList();
                if (!skillList.isEmpty()) {
                    criteria.add(Criteria.where("skills").in(skillList));
                }
            }

            if (enterpriseOnly != null) {
                criteria.add(Criteria.where("isEnterpriseOnly").is(enterpriseOnly));
            }

            Query query = new Query();
            if (!criteria.isEmpty()) {
                query.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
            }

            long total = mongoTemplate.count(query, Job.class);
            query.with(pageable);
            List<Job> items = mongoTemplate.find(query, Job.class);

            Page<Job> result = new PageImpl<>(items, pageable, total);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to search jobs: " + e.getMessage()));
        }
    }

    /**
     * Get a single job by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getJobById(@PathVariable("id") String id) {
        try {
            Optional<Job> job = jobRepository.findById(id);
            if (job.isPresent()) {
                return ResponseEntity.ok(job.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch job: " + e.getMessage()));
        }
    }

    /**
     * Get jobs posted by the current employer
     */
    @GetMapping("/employer/my-jobs")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getEmployerJobs(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User employer = currentUserService.requireUser();
            currentUserService.requireEmployerMode(employer);
            Pageable pageable = PageRequest.of(page, size);
            Page<Job> jobs = jobRepository.findByEmployerId(employer.getId(), pageable);
            return ResponseEntity.ok(jobs);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch employer jobs: " + e.getMessage()));
        }
    }

    /**
     * Create a new job (Employer only)
     */
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> createJob(
            @RequestBody JobDTO jobDTO,
            Authentication authentication) {
        try {
            User employer = currentUserService.requireUser();
            currentUserService.requireEmployerMode(employer);

            if (jobDTO.getTitle() == null || jobDTO.getTitle().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "title is required"));
            }
            if (jobDTO.getDescription() == null || jobDTO.getDescription().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "description is required"));
            }
            if (jobDTO.getCategoryId() == null || jobDTO.getCategoryId().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "categoryId is required"));
            }
            if (jobDTO.getSkills() == null || jobDTO.getSkills().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "skills are required"));
            }

            Job.EngagementType engagementType = parseEngagementType(jobDTO.getEngagementType());
            if (engagementType == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "engagementType is required"));
            }

            Job.DeliverableType deliverableType = parseDeliverableType(jobDTO.getDeliverableType());
            if (deliverableType == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "deliverableType is required"));
            }

            Job.PricingModel pricingModel = parsePricingModel(jobDTO.getPricingModel());
            if (pricingModel == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "pricingModel is required"));
            }

            Job job = new Job();
            job.setEmployerId(employer.getId());
            job.setTitle(jobDTO.getTitle());
            job.setDescription(jobDTO.getDescription());
            job.setBudgetMin(jobDTO.getBudgetMin());
            job.setBudgetMax(jobDTO.getBudgetMax());
            job.setCurrency(jobDTO.getCurrency() != null ? jobDTO.getCurrency() : "USD");
            job.setCategoryId(jobDTO.getCategoryId());
            job.setSkills(jobDTO.getSkills());
            job.setRequiredSkills(jobDTO.getSkills());
            job.setRequiredTools(jobDTO.getRequiredTools());
            job.setIndustry(jobDTO.getIndustry());
            job.setTeamSize(jobDTO.getTeamSize());
            job.setMaxConcurrentProjects(normalizeHiringCapacity(jobDTO.getMaxConcurrentProjects()));
            job.setWorkLocation(jobDTO.getWorkLocation());
            job.setMinYearsExperience(jobDTO.getMinYearsExperience());
            job.setEngagementType(engagementType);
            job.setDeliverableType(deliverableType);
            job.setPricingModel(pricingModel);

            // Media attachments
            job.setSampleImageUrls(jobDTO.getSampleImageUrls());
            job.setSampleVideoUrls(jobDTO.getSampleVideoUrls());
            job.setSampleDocumentUrls(jobDTO.getSampleDocumentUrls());
            job.setSampleAudioUrls(jobDTO.getSampleAudioUrls());

            job.setStatus(Job.Status.OPEN);
            job.setIsEnterpriseOnly(false);

            Job savedJob = jobRepository.save(job);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedJob);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create job: " + e.getMessage()));
        }
    }

    /**
     * Update a job
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updateJob(
            @PathVariable("id") String id,
            @RequestBody JobDTO jobDTO,
            Authentication authentication) {
        try {
            User employer = currentUserService.requireUser();
            currentUserService.requireEmployerMode(employer);
            Optional<Job> existingJob = jobRepository.findById(id);
            if (!existingJob.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Job job = existingJob.get();
            // Verify ownership
            if (!job.getEmployerId().equals(employer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to update this job"));
            }

            if (jobDTO.getTitle() != null) job.setTitle(jobDTO.getTitle());
            if (jobDTO.getDescription() != null) job.setDescription(jobDTO.getDescription());
            if (jobDTO.getBudgetMin() != null) job.setBudgetMin(jobDTO.getBudgetMin());
            if (jobDTO.getBudgetMax() != null) job.setBudgetMax(jobDTO.getBudgetMax());
            if (jobDTO.getCurrency() != null) job.setCurrency(jobDTO.getCurrency());
            if (jobDTO.getCategoryId() != null) job.setCategoryId(jobDTO.getCategoryId());
            if (jobDTO.getSkills() != null) {
                job.setSkills(jobDTO.getSkills());
                job.setRequiredSkills(jobDTO.getSkills());
            }
            if (jobDTO.getRequiredTools() != null) job.setRequiredTools(jobDTO.getRequiredTools());
            if (jobDTO.getIndustry() != null) job.setIndustry(jobDTO.getIndustry());
            if (jobDTO.getTeamSize() != null) job.setTeamSize(jobDTO.getTeamSize());
            if (jobDTO.getMaxConcurrentProjects() != null) {
                job.setMaxConcurrentProjects(normalizeHiringCapacity(jobDTO.getMaxConcurrentProjects()));
            }
            if (jobDTO.getWorkLocation() != null) job.setWorkLocation(jobDTO.getWorkLocation());
            if (jobDTO.getMinYearsExperience() != null) job.setMinYearsExperience(jobDTO.getMinYearsExperience());

            // Media attachments
            if (jobDTO.getSampleImageUrls() != null) job.setSampleImageUrls(jobDTO.getSampleImageUrls());
            if (jobDTO.getSampleVideoUrls() != null) job.setSampleVideoUrls(jobDTO.getSampleVideoUrls());
            if (jobDTO.getSampleDocumentUrls() != null) job.setSampleDocumentUrls(jobDTO.getSampleDocumentUrls());
            if (jobDTO.getSampleAudioUrls() != null) job.setSampleAudioUrls(jobDTO.getSampleAudioUrls());

            Job.EngagementType engagementType = parseEngagementType(jobDTO.getEngagementType());
            if (jobDTO.getEngagementType() != null && engagementType == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid engagementType: " + jobDTO.getEngagementType()));
            }
            if (engagementType != null) job.setEngagementType(engagementType);

            Job.DeliverableType deliverableType = parseDeliverableType(jobDTO.getDeliverableType());
            if (jobDTO.getDeliverableType() != null && deliverableType == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid deliverableType: " + jobDTO.getDeliverableType()));
            }
            if (deliverableType != null) job.setDeliverableType(deliverableType);

            Job.PricingModel pricingModel = parsePricingModel(jobDTO.getPricingModel());
            if (jobDTO.getPricingModel() != null && pricingModel == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid pricingModel: " + jobDTO.getPricingModel()));
            }
            if (pricingModel != null) job.setPricingModel(pricingModel);

            Job updatedJob = jobRepository.save(job);
            return ResponseEntity.ok(updatedJob);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update job: " + e.getMessage()));
        }
    }

    /**
     * Close a job (mark as completed)
     */
    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> closeJob(
            @PathVariable("id") String id,
            Authentication authentication) {
        try {
            User employer = currentUserService.requireUser();
            currentUserService.requireEmployerMode(employer);
            Optional<Job> existingJob = jobRepository.findById(id);
            if (!existingJob.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Job job = existingJob.get();
            // Verify ownership
            if (!job.getEmployerId().equals(employer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to close this job"));
            }

            job.setStatus(Job.Status.COMPLETED);
            Job updatedJob = jobRepository.save(job);
            return ResponseEntity.ok(updatedJob);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to close job: " + e.getMessage()));
        }
    }

    /**
     * Cancel a job
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> cancelJob(
            @PathVariable("id") String id,
            Authentication authentication) {
        try {
            User employer = currentUserService.requireUser();
            currentUserService.requireEmployerMode(employer);
            Optional<Job> existingJob = jobRepository.findById(id);
            if (!existingJob.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Job job = existingJob.get();
            // Verify ownership
            if (!job.getEmployerId().equals(employer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to cancel this job"));
            }

            job.setStatus(Job.Status.CANCELLED);
            Job updatedJob = jobRepository.save(job);
            return ResponseEntity.ok(updatedJob);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to cancel job: " + e.getMessage()));
        }
    }

    /**
     * Delete a job
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> deleteJob(
            @PathVariable("id") String id,
            Authentication authentication) {
        try {
            User employer = currentUserService.requireUser();
            currentUserService.requireEmployerMode(employer);
            Optional<Job> existingJob = jobRepository.findById(id);
            if (!existingJob.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Job job = existingJob.get();
            // Verify ownership
            if (!job.getEmployerId().equals(employer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You don't have permission to delete this job"));
            }

            jobRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete job: " + e.getMessage()));
        }
    }

    private Job.EngagementType parseEngagementType(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Job.EngagementType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Job.DeliverableType parseDeliverableType(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Job.DeliverableType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Job.PricingModel parsePricingModel(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Job.PricingModel.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Integer normalizeHiringCapacity(Integer value) {
        if (value == null) {
            return 1;
        }
        return Math.max(1, value);
    }
}
