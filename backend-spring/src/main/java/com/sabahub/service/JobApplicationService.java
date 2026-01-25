package com.sabahub.service;

import com.sabahub.domain.Job;
import com.sabahub.domain.JobApplication;
import com.sabahub.repository.JobApplicationRepository;
import com.sabahub.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * JobApplicationService - Handles vendor applications, evaluation, and onboarding
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    // ==================== APPLICATION SUBMISSION ====================

    /**
     * Submit vendor application for job
     */
    @Transactional
    public JobApplication submitApplication(String jobId, String vendorId, String employerId, 
                                           JobApplicationRequest request) {
        log.info("Vendor {} submitting application for job {}", vendorId, jobId);

        // Check if already applied
        Optional<JobApplication> existing = jobApplicationRepository.findByJobIdAndVendorId(jobId, vendorId);
        if (existing.isPresent()) {
            throw new RuntimeException("Vendor has already applied for this job");
        }

        // Check job exists
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new RuntimeException("Job not found"));

        // Create application
        JobApplication application = new JobApplication(jobId, vendorId, employerId);
        application.setCoverLetter(request.getCoverLetter());
        application.setPortfolioUrl(request.getPortfolioUrl());
        application.setLinkedinUrl(request.getLinkedinUrl());
        application.setWebsiteUrl(request.getWebsiteUrl());
        application.setReferences(request.getReferences());
        application.setPortfolioItems(request.getPortfolioItems());
        application.setCertifications(request.getCertifications());
        application.setRelevantExperience(request.getRelevantExperience());
        application.setProposedRate(request.getProposedRate());
        application.setRateType(request.getRateType());
        application.setPaymentTerms(request.getPaymentTerms());
        application.setDeliveryTimeline(request.getDeliveryTimeline());
        application.setStatus(JobApplication.Status.SUBMITTED);

        JobApplication saved = jobApplicationRepository.save(application);

        // Send notifications
        notificationService.notifyVendor(vendorId, 
            "Application Submitted", 
            "Your application for '" + job.getTitle() + "' has been submitted successfully");

        notificationService.notifyEmployer(employerId,
            "New Application",
            "New vendor application received for '" + job.getTitle() + "'");

        // Audit
        auditService.log("JOB_APPLICATION_SUBMITTED", "JobApplication", jobId, 
            java.util.Map.of("vendorId", vendorId, "jobId", jobId));

        return saved;
    }

    // ==================== APPLICATION REVIEW ====================

    /**
     * Get applications for job (employer)
     */
    public Page<JobApplication> getJobApplications(String jobId, Pageable pageable) {
        log.info("Fetching applications for job {}", jobId);
        return jobApplicationRepository.findByJobId(jobId, pageable);
    }

    /**
     * Get applications by status (employer)
     */
    public Page<JobApplication> getApplicationsByStatus(String jobId, JobApplication.Status status, Pageable pageable) {
        return jobApplicationRepository.findByJobIdAndStatus(jobId, status, pageable);
    }

    /**
     * Mark application as under review
     */
    @Transactional
    public JobApplication markUnderReview(String applicationId, String reviewedBy) {
        log.info("Marking application {} as under review", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(JobApplication.Status.UNDER_REVIEW);
        application.setReviewedBy(reviewedBy);
        application.setReviewedAt(LocalDateTime.now());

        JobApplication saved = jobApplicationRepository.save(application);

        notificationService.notifyVendor(application.getVendorId(),
            "Application Under Review",
            "Your application is being reviewed by the employer");

        auditService.log("APPLICATION_MARKED_UNDER_REVIEW", "JobApplication", applicationId, 
            java.util.Map.of("reviewedBy", reviewedBy));
        return saved;
    }

    /**
     * Submit evaluation results
     */
    @Transactional
    public JobApplication submitEvaluation(String applicationId, JobApplication.EvaluationResult evaluation) {
        log.info("Submitting evaluation for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        evaluation.setEvaluatedAt(LocalDateTime.now());
        application.setEvaluation(evaluation);

        // Calculate overall score if not set
        if (evaluation.getOverallScore() == null) {
            Double overallScore = (
                (evaluation.getPortfolioScore() != null ? evaluation.getPortfolioScore() : 0) * 0.3 +
                (evaluation.getExperienceScore() != null ? evaluation.getExperienceScore() : 0) * 0.25 +
                (evaluation.getReferenceScore() != null ? evaluation.getReferenceScore() : 0) * 0.25 +
                (evaluation.getCommunicationScore() != null ? evaluation.getCommunicationScore() : 0) * 0.1 +
                (evaluation.getReliabilityScore() != null ? evaluation.getReliabilityScore() : 0) * 0.1
            );
            evaluation.setOverallScore(overallScore);
        }

        JobApplication saved = jobApplicationRepository.save(application);
        auditService.log("EVALUATION_SUBMITTED", "JobApplication", applicationId, 
            java.util.Map.of("evaluatorName", evaluation.getEvaluatorName()));
        return saved;
    }

    /**
     * Approve application
     */
    @Transactional
    public JobApplication approveApplication(String applicationId, String approvalNotes) {
        log.info("Approving application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(JobApplication.Status.APPROVED);
        application.setApprovalNotes(approvalNotes);

        JobApplication saved = jobApplicationRepository.save(application);

        // Initialize onboarding
        JobApplication.OnboardingChecklist onboarding = new JobApplication.OnboardingChecklist();
        saved.setOnboarding(onboarding);
        saved = jobApplicationRepository.save(saved);

        notificationService.notifyVendor(application.getVendorId(),
            "Application Approved",
            "Congratulations! Your application has been approved. Onboarding will begin shortly.");

        auditService.log("APPLICATION_APPROVED", "JobApplication", applicationId, 
            java.util.Map.of("vendorId", application.getVendorId()));
        return saved;
    }

    /**
     * Reject application
     */
    @Transactional
    public JobApplication rejectApplication(String applicationId, String rejectionReason) {
        log.info("Rejecting application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(JobApplication.Status.REJECTED);
        application.setRejectionReason(rejectionReason);

        JobApplication saved = jobApplicationRepository.save(application);

        notificationService.notifyVendor(application.getVendorId(),
            "Application Status Update",
            "Your application was not selected at this time. Feedback: " + rejectionReason);

        auditService.log("APPLICATION_REJECTED", "JobApplication", applicationId, 
            java.util.Map.of("rejectionReason", rejectionReason));
        return saved;
    }

    // ==================== PILOT PROJECT ====================

    /**
     * Assign pilot project
     */
    @Transactional
    public JobApplication assignPilotProject(String applicationId, String pilotJobId, Integer estimatedHours) {
        log.info("Assigning pilot project {} to application {}", pilotJobId, applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getPilotInfo() == null) {
            application.setPilotInfo(new JobApplication.PilotProjectInfo());
        }

        JobApplication.PilotProjectInfo pilotInfo = application.getPilotInfo();
        pilotInfo.setPilotJobId(pilotJobId);
        pilotInfo.setStatus("NOT_STARTED");
        pilotInfo.setStartDate(null);

        application.setStatus(JobApplication.Status.PILOT_ASSIGNED);
        JobApplication saved = jobApplicationRepository.save(application);

        notificationService.notifyVendor(application.getVendorId(),
            "Pilot Project Assigned",
            "A pilot project has been assigned to evaluate your work. Please begin within 48 hours.");

        auditService.log("PILOT_PROJECT_ASSIGNED", "JobApplication", applicationId, 
            java.util.Map.of("pilotJobId", pilotJobId));
        return saved;
    }

    /**
     * Submit pilot project completion
     */
    @Transactional
    public JobApplication submitPilotCompletion(String applicationId, String deliverableUrl, Integer hoursSpent) {
        log.info("Submitting pilot project for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getPilotInfo() == null) {
            throw new RuntimeException("No pilot project assigned");
        }

        JobApplication.PilotProjectInfo pilotInfo = application.getPilotInfo();
        pilotInfo.setStatus("COMPLETED");
        pilotInfo.setCompletionDate(LocalDateTime.now());
        pilotInfo.setDeliverableUrl(deliverableUrl);
        pilotInfo.setHoursSpent(hoursSpent);

        application.setStatus(JobApplication.Status.PILOT_COMPLETED);
        JobApplication saved = jobApplicationRepository.save(application);

        notificationService.notifyEmployer(application.getEmployerId(),
            "Pilot Project Submitted",
            "Vendor has submitted the pilot project. Please review.");

        auditService.log("PILOT_PROJECT_SUBMITTED", "JobApplication", applicationId, 
            java.util.Map.of("vendorId", application.getVendorId()));
        return saved;
    }

    /**
     * Score pilot project
     */
    @Transactional
    public JobApplication scorePilotProject(String applicationId, Double score, String feedback, Boolean approved) {
        log.info("Scoring pilot project for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getPilotInfo() == null) {
            throw new RuntimeException("No pilot project assigned");
        }

        JobApplication.PilotProjectInfo pilotInfo = application.getPilotInfo();
        pilotInfo.setPilotScore(score);
        pilotInfo.setPilotFeedback(feedback);
        pilotInfo.setPilotApproved(approved);

        if (approved) {
            application.setStatus(JobApplication.Status.APPROVED);
            notificationService.notifyVendor(application.getVendorId(),
                "Pilot Approved",
                "Excellent! Your pilot project was approved. Onboarding is starting now.");
        } else {
            application.setStatus(JobApplication.Status.REJECTED);
            notificationService.notifyVendor(application.getVendorId(),
                "Pilot Not Approved",
                "Your pilot project needs improvement. Feedback: " + feedback);
        }

        JobApplication saved = jobApplicationRepository.save(application);
        auditService.log("PILOT_PROJECT_SCORED", "JobApplication", applicationId, 
            java.util.Map.of("score", score.toString(), "approved", approved.toString()));
        return saved;
    }

    // ==================== ONBOARDING ====================

    /**
     * Get onboarding progress
     */
    public JobApplication.OnboardingChecklist getOnboardingProgress(String applicationId) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        return application.getOnboarding();
    }

    /**
     * Update onboarding step - NDA signed
     */
    @Transactional
    public JobApplication updateNDASigned(String applicationId) {
        log.info("Marking NDA as signed for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            application.setOnboarding(new JobApplication.OnboardingChecklist());
        }

        application.getOnboarding().setNdaSigned(true);
        application.getOnboarding().setNdaSignedDate(LocalDateTime.now());

        JobApplication saved = jobApplicationRepository.save(application);
        notificationService.notifyEmployer(application.getEmployerId(),
            "Vendor NDA Signed", "NDA signed by " + application.getVendorId());

        return saved;
    }

    /**
     * Update onboarding step - Background check
     */
    @Transactional
    public JobApplication updateBackgroundCheck(String applicationId, String result) {
        log.info("Updating background check for application {} - Result: {}", applicationId, result);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            application.setOnboarding(new JobApplication.OnboardingChecklist());
        }

        application.getOnboarding().setBackgroundCheckCompleted(true);
        application.getOnboarding().setBgCheckDate(LocalDateTime.now());
        application.getOnboarding().setBgCheckResult(result);

        if ("CLEAR".equals(result)) {
            notificationService.notifyVendor(application.getVendorId(),
                "Background Check Cleared", "Your background check has been cleared.");
        } else {
            notificationService.notifyVendor(application.getVendorId(),
                "Background Check - Action Needed", "Your background check requires review.");
        }

        return jobApplicationRepository.save(application);
    }

    /**
     * Update onboarding step - Contract signed
     */
    @Transactional
    public JobApplication updateContractSigned(String applicationId) {
        log.info("Marking contract as signed for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            application.setOnboarding(new JobApplication.OnboardingChecklist());
        }

        application.getOnboarding().setContractSigned(true);
        application.getOnboarding().setContractSignedDate(LocalDateTime.now());

        return jobApplicationRepository.save(application);
    }

    /**
     * Update onboarding step - Payment info verified
     */
    @Transactional
    public JobApplication updatePaymentVerified(String applicationId) {
        log.info("Marking payment info as verified for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            application.setOnboarding(new JobApplication.OnboardingChecklist());
        }

        application.getOnboarding().setPaymentInfoVerified(true);
        application.getOnboarding().setPaymentVerifiedDate(LocalDateTime.now());

        return jobApplicationRepository.save(application);
    }

    /**
     * Update onboarding step - Orientation completed
     */
    @Transactional
    public JobApplication updateOrientationCompleted(String applicationId) {
        log.info("Marking orientation as completed for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            application.setOnboarding(new JobApplication.OnboardingChecklist());
        }

        application.getOnboarding().setOrientationCompleted(true);
        application.getOnboarding().setOrientationDate(LocalDateTime.now());

        return jobApplicationRepository.save(application);
    }

    /**
     * Update onboarding step - Tools access granted
     */
    @Transactional
    public JobApplication updateToolsAccessGranted(String applicationId) {
        log.info("Marking tools access as granted for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            application.setOnboarding(new JobApplication.OnboardingChecklist());
        }

        application.getOnboarding().setToolsAccessGranted(true);
        application.getOnboarding().setToolsAccessDate(LocalDateTime.now());

        return jobApplicationRepository.save(application);
    }

    /**
     * Mark all onboarding tasks complete
     */
    @Transactional
    public JobApplication completeOnboarding(String applicationId) {
        log.info("Completing all onboarding tasks for application {}", applicationId);

        JobApplication application = jobApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getOnboarding() == null) {
            throw new RuntimeException("Onboarding not initialized");
        }

        application.getOnboarding().setAllTasksCompleted(true);
        application.getOnboarding().setCompletedAt(LocalDateTime.now());

        JobApplication saved = jobApplicationRepository.save(application);

        notificationService.notifyVendor(application.getVendorId(),
            "Onboarding Complete",
            "You are now fully onboarded and ready to start projects!");

        auditService.log("ONBOARDING_COMPLETED", "JobApplication", applicationId, 
            java.util.Map.of("vendorId", application.getVendorId()));
        return saved;
    }

    // ==================== VENDOR DASHBOARD ====================

    /**
     * Get vendor's applications
     */
    public Page<JobApplication> getVendorApplications(String vendorId, Pageable pageable) {
        return jobApplicationRepository.findByVendorId(vendorId, pageable);
    }

    /**
     * Get vendor's applications by status
     */
    public List<JobApplication> getVendorApplicationsByStatus(String vendorId, JobApplication.Status status) {
        return jobApplicationRepository.findByVendorIdAndStatusOrderByAppliedAtDesc(vendorId, status);
    }

    // ==================== EMPLOYER DASHBOARD ====================

    /**
     * Get employer's pending applications (under review)
     */
    public List<JobApplication> getEmployerPendingApplications(String employerId) {
        return jobApplicationRepository.findByEmployerIdAndStatusOrderByAppliedAtAsc(
            employerId, JobApplication.Status.UNDER_REVIEW);
    }

    /**
     * Get statistics for employer
     */
    public ApplicationStatistics getEmployerStatistics(String employerId) {
        List<JobApplication> all = jobApplicationRepository.findByEmployerIdOrderByAppliedAtDesc(employerId);

        ApplicationStatistics stats = new ApplicationStatistics();
        stats.setTotalApplications((long) all.size());
        stats.setSubmittedCount(all.stream().filter(a -> a.getStatus() == JobApplication.Status.SUBMITTED).count());
        stats.setUnderReviewCount(all.stream().filter(a -> a.getStatus() == JobApplication.Status.UNDER_REVIEW).count());
        stats.setPilotAssignedCount(all.stream().filter(a -> a.getStatus() == JobApplication.Status.PILOT_ASSIGNED).count());
        stats.setApprovedCount(all.stream().filter(a -> a.getStatus() == JobApplication.Status.APPROVED).count());
        stats.setRejectedCount(all.stream().filter(a -> a.getStatus() == JobApplication.Status.REJECTED).count());

        return stats;
    }

    // DTO
    @lombok.Getter
    @lombok.Setter
    public static class ApplicationStatistics {
        private Long totalApplications;
        private Long submittedCount;
        private Long underReviewCount;
        private Long pilotAssignedCount;
        private Long approvedCount;
        private Long rejectedCount;
    }

    @lombok.Getter
    @lombok.Setter
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class JobApplicationRequest {
        private String employerId;
        private String coverLetter;
        private String portfolioUrl;
        private String linkedinUrl;
        private String websiteUrl;
        private List<JobApplication.Reference> references;
        private List<JobApplication.PortfolioItem> portfolioItems;
        private String certifications;
        private String relevantExperience;
        private java.math.BigDecimal proposedRate;
        private String rateType;
        private String paymentTerms;
        private String deliveryTimeline;
    }
}
