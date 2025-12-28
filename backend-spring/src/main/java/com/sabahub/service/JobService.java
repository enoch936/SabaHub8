package com.sabahub.service;

import com.sabahub.domain.Job;
import com.sabahub.domain.User;
import com.sabahub.repository.JobRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public JobService(JobRepository jobRepository, CurrentUserService currentUserService,
                           AuditService auditService) {
        this.jobRepository = jobRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    public Job createJob(Job job) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        job.setId(null);
        job.setEmployerId(me.getId());
        if (job.getStatus() == null) {
            job.setStatus(Job.Status.OPEN);
        }
        if (job.getCurrency() == null || job.getCurrency().isBlank()) {
            job.setCurrency("ETB");
        }
        Job saved = jobRepository.save(job);
        
        // Audit log: job created
        auditService.log("JOB_CREATE", "JOB", saved.getId(), java.util.Map.of(
            "title", job.getTitle(),
            "budget_min", job.getBudgetMin() != null ? job.getBudgetMin() : 0,
            "budget_max", job.getBudgetMax() != null ? job.getBudgetMax() : 0
        ));
        
        return saved;
    }

    public List<Job> listJobs() {
        return jobRepository.findAll();
    }

    public Job getJob(String id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));
    }

    public List<Job> listMyEmployerJobs() {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");
        return jobRepository.findByEmployerId(me.getId());
    }
}
