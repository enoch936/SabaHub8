package com.sabahub.web;

import com.sabahub.domain.Job;
import com.sabahub.repository.JobRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/jobs")
public class AdminJobController {

    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;

    public AdminJobController(JobRepository jobRepository, CurrentUserService currentUserService) {
        this.jobRepository = jobRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Job>> list(@RequestParam(name = "status", required = false) String status) {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
        List<Job> all = jobRepository.findAll();
        if (status == null || status.isBlank()) return ResponseEntity.ok(all);
        Job.Status st;
        try {
            st = Job.Status.valueOf(status);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
        List<Job> filtered = all.stream().filter(j -> j.getStatus() == st).collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Job> patch(@PathVariable String id, @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
        var job = jobRepository.findById(id).orElseThrow();
        Object statusObj = body.get("status");
        if (statusObj instanceof String s) {
            try {
                job.setStatus(Job.Status.valueOf(s));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().build();
            }
        }
        jobRepository.save(job);
        return ResponseEntity.ok(job);
    }
}
