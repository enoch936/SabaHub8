package com.sabahub.web;

import com.sabahub.domain.Job;
import com.sabahub.service.JobService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // Public
    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> listJobs() {
        return ResponseEntity.ok(jobService.listJobs());
    }

    // Public
    @GetMapping("/jobs/{id}")
    public ResponseEntity<Job> getJob(@PathVariable String id) {
        return ResponseEntity.ok(jobService.getJob(id));
    }

    // Employer
    @PostMapping("/employer/jobs")
    public ResponseEntity<Job> createJob(@Valid @RequestBody Job job) {
        return ResponseEntity.ok(jobService.createJob(job));
    }

    // Employer
    @GetMapping("/employer/jobs")
    public ResponseEntity<List<Job>> listEmployerJobs() {
        return ResponseEntity.ok(jobService.listMyEmployerJobs());
    }
}
