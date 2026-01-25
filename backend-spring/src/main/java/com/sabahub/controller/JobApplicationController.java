package com.sabahub.controller;

import com.sabahub.domain.JobApplication;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.JobApplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * JobApplicationController - Handles vendor applications and workflow
 */
@RestController
@RequestMapping("/api/job-applications")
@RequiredArgsConstructor
@Slf4j
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;
    private final CurrentUserService currentUserService;

    // ==================== APPLICATION SUBMISSION ====================

    /**
     * POST /api/job-applications/apply
     * Vendor submits application for job
     */
    @PostMapping("/apply")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> submitApplication(
            @RequestParam String jobId,
            @RequestBody JobApplicationService.JobApplicationRequest request) {
        try {
            String vendorId = currentUserService.getCurrentUserId();
            String employerId = request.getEmployerId(); // Get from request

            JobApplication application = jobApplicationService.submitApplication(
                jobId, vendorId, employerId, request);

            return ResponseEntity.status(HttpStatus.CREATED).body(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to submit application: " + e.getMessage());
        }
    }

    // ==================== APPLICATION REVIEW ====================

    /**
     * GET /api/job-applications/job/{jobId}
     * Get all applications for a job (employer)
     */
    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getJobApplications(
            @PathVariable String jobId,
            Pageable pageable) {
        try {
            Page<JobApplication> applications = jobApplicationService.getJobApplications(jobId, pageable);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch applications: " + e.getMessage());
        }
    }

    /**
     * GET /api/job-applications/job/{jobId}/status/{status}
     * Get applications by status (employer)
     */
    @GetMapping("/job/{jobId}/status/{status}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getApplicationsByStatus(
            @PathVariable String jobId,
            @PathVariable JobApplication.Status status,
            Pageable pageable) {
        try {
            Page<JobApplication> applications = jobApplicationService.getApplicationsByStatus(
                jobId, status, pageable);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch applications: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/under-review
     * Mark application as under review
     */
    @PatchMapping("/{applicationId}/under-review")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> markUnderReview(
            @PathVariable String applicationId) {
        try {
            String reviewedBy = currentUserService.getCurrentUserId();
            JobApplication application = jobApplicationService.markUnderReview(applicationId, reviewedBy);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to update application: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/evaluate
     * Submit evaluation results
     */
    @PatchMapping("/{applicationId}/evaluate")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> submitEvaluation(
            @PathVariable String applicationId,
            @RequestBody JobApplication.EvaluationResult evaluation) {
        try {
            JobApplication application = jobApplicationService.submitEvaluation(applicationId, evaluation);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to submit evaluation: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/approve
     * Approve application
     */
    @PatchMapping("/{applicationId}/approve")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> approveApplication(
            @PathVariable String applicationId,
            @RequestParam(required = false) String approvalNotes) {
        try {
            JobApplication application = jobApplicationService.approveApplication(applicationId, approvalNotes);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to approve application: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/reject
     * Reject application
     */
    @PatchMapping("/{applicationId}/reject")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> rejectApplication(
            @PathVariable String applicationId,
            @RequestParam String rejectionReason) {
        try {
            JobApplication application = jobApplicationService.rejectApplication(applicationId, rejectionReason);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to reject application: " + e.getMessage());
        }
    }

    // ==================== PILOT PROJECT ====================

    /**
     * POST /api/job-applications/{applicationId}/assign-pilot
     * Assign pilot project
     */
    @PostMapping("/{applicationId}/assign-pilot")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> assignPilotProject(
            @PathVariable String applicationId,
            @RequestParam String pilotJobId,
            @RequestParam(required = false) Integer estimatedHours) {
        try {
            JobApplication application = jobApplicationService.assignPilotProject(
                applicationId, pilotJobId, estimatedHours);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to assign pilot: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/submit-pilot
     * Submit pilot project completion
     */
    @PatchMapping("/{applicationId}/submit-pilot")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> submitPilotCompletion(
            @PathVariable String applicationId,
            @RequestParam String deliverableUrl,
            @RequestParam(required = false) Integer hoursSpent) {
        try {
            JobApplication application = jobApplicationService.submitPilotCompletion(
                applicationId, deliverableUrl, hoursSpent);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to submit pilot: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/score-pilot
     * Score pilot project
     */
    @PatchMapping("/{applicationId}/score-pilot")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> scorePilotProject(
            @PathVariable String applicationId,
            @RequestParam Double score,
            @RequestParam String feedback,
            @RequestParam Boolean approved) {
        try {
            JobApplication application = jobApplicationService.scorePilotProject(
                applicationId, score, feedback, approved);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to score pilot: " + e.getMessage());
        }
    }

    // ==================== ONBOARDING ====================

    /**
     * GET /api/job-applications/{applicationId}/onboarding
     * Get onboarding progress
     */
    @GetMapping("/{applicationId}/onboarding")
    public ResponseEntity<?> getOnboardingProgress(
            @PathVariable String applicationId) {
        try {
            JobApplication.OnboardingChecklist progress = 
                jobApplicationService.getOnboardingProgress(applicationId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Application not found: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/nda-signed
     * Mark NDA as signed
     */
    @PatchMapping("/{applicationId}/onboarding/nda-signed")
    @PreAuthorize("hasAnyRole('VENDOR', 'EMPLOYER')")
    public ResponseEntity<?> updateNDASigned(
            @PathVariable String applicationId) {
        try {
            JobApplication application = jobApplicationService.updateNDASigned(applicationId);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to update NDA: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/bg-check
     * Update background check
     */
    @PatchMapping("/{applicationId}/onboarding/bg-check")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updateBackgroundCheck(
            @PathVariable String applicationId,
            @RequestParam String result) { // CLEAR, NEEDS_REVIEW, FAILED
        try {
            JobApplication application = jobApplicationService.updateBackgroundCheck(applicationId, result);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to update background check: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/contract-signed
     * Mark contract as signed
     */
    @PatchMapping("/{applicationId}/onboarding/contract-signed")
    @PreAuthorize("hasAnyRole('VENDOR', 'EMPLOYER')")
    public ResponseEntity<?> updateContractSigned(
            @PathVariable String applicationId) {
        try {
            JobApplication application = jobApplicationService.updateContractSigned(applicationId);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to update contract: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/payment-verified
     * Mark payment info as verified
     */
    @PatchMapping("/{applicationId}/onboarding/payment-verified")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updatePaymentVerified(
            @PathVariable String applicationId) {
        try {
            JobApplication application = jobApplicationService.updatePaymentVerified(applicationId);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to verify payment: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/orientation-completed
     * Mark orientation as completed
     */
    @PatchMapping("/{applicationId}/onboarding/orientation-completed")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> updateOrientationCompleted(
            @PathVariable String applicationId) {
        try {
            JobApplication application = jobApplicationService.updateOrientationCompleted(applicationId);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to update orientation: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/tools-access
     * Mark tools access as granted
     */
    @PatchMapping("/{applicationId}/onboarding/tools-access")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updateToolsAccessGranted(
            @PathVariable String applicationId) {
        try {
            JobApplication application = jobApplicationService.updateToolsAccessGranted(applicationId);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to grant tools access: " + e.getMessage());
        }
    }

    /**
     * PATCH /api/job-applications/{applicationId}/onboarding/complete
     * Mark all onboarding as complete
     */
    @PatchMapping("/{applicationId}/onboarding/complete")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> completeOnboarding(
            @PathVariable String applicationId) {
        try {
            JobApplication application = jobApplicationService.completeOnboarding(applicationId);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Failed to complete onboarding: " + e.getMessage());
        }
    }

    // ==================== VENDOR DASHBOARD ====================

    /**
     * GET /api/job-applications/vendor/my-applications
     * Get vendor's applications
     */
    @GetMapping("/vendor/my-applications")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> getVendorApplications(
            Pageable pageable) {
        try {
            String vendorId = currentUserService.getCurrentUserId();
            Page<JobApplication> applications = jobApplicationService.getVendorApplications(vendorId, pageable);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch applications: " + e.getMessage());
        }
    }

    /**
     * GET /api/job-applications/vendor/applications-by-status
     * Get vendor's applications by status
     */
    @GetMapping("/vendor/applications-by-status")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<?> getVendorApplicationsByStatus(
            @RequestParam JobApplication.Status status) {
        try {
            String vendorId = currentUserService.getCurrentUserId();
            List<JobApplication> applications = jobApplicationService.getVendorApplicationsByStatus(vendorId, status);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch applications: " + e.getMessage());
        }
    }

    // ==================== EMPLOYER DASHBOARD ====================

    /**
     * GET /api/job-applications/employer/pending
     * Get employer's pending applications
     */
    @GetMapping("/employer/pending")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getEmployerPendingApplications() {
        try {
            String employerId = currentUserService.getCurrentUserId();
            List<JobApplication> applications = jobApplicationService.getEmployerPendingApplications(employerId);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch pending applications: " + e.getMessage());
        }
    }

    /**
     * GET /api/job-applications/employer/stats
     * Get application statistics
     */
    @GetMapping("/employer/stats")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getEmployerStatistics() {
        try {
            String employerId = currentUserService.getCurrentUserId();
            JobApplicationService.ApplicationStatistics stats = 
                jobApplicationService.getEmployerStatistics(employerId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to fetch statistics: " + e.getMessage());
        }
    }
}
