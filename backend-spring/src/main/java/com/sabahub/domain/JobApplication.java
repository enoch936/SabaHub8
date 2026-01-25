package com.sabahub.domain;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * JobApplication - Represents vendor application for a job posting
 */
@Document(collection = "job_applications")
@Getter
@Setter
public class JobApplication {

    @Id
    private String id;

    // Foreign Keys
    @Indexed
    private String jobId;
    
    @Indexed
    private String vendorId;
    
    @Indexed
    private String employerId;

    // Application Status
    public enum Status {
        SUBMITTED,           // Initial submission
        UNDER_REVIEW,        // Employer reviewing
        INTERVIEW_SCHEDULED, // Interview scheduled
        PILOT_ASSIGNED,      // Pilot project assigned
        PILOT_COMPLETED,     // Pilot work submitted
        APPROVED,            // Vendor approved
        REJECTED,            // Application rejected
        WITHDRAWN            // Vendor withdrew
    }

    @Indexed
    private Status status = Status.SUBMITTED;

    // Application Content
    private String coverLetter;
    private String portfolioUrl;
    private String linkedinUrl;
    private String websiteUrl;

    // Qualification Evidence
    private List<Reference> references;
    private List<PortfolioItem> portfolioItems;
    private String certifications;
    private String relevantExperience;

    // Pricing Proposal
    private BigDecimal proposedRate;
    private String rateType; // FIXED_PRICE, HOURLY, RETAINER, CUSTOM
    private String paymentTerms;
    private String deliveryTimeline;

    // Pilot Project (if required)
    private PilotProjectInfo pilotInfo;

    // Evaluation Results
    private EvaluationResult evaluation;

    // Application Workflow
    private LocalDateTime appliedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String rejectionReason;
    private String approvalNotes;

    // Onboarding Progress
    private OnboardingChecklist onboarding;

    // Ratings & Feedback (after engagement)
    private Double vendorRating;
    private String vendorFeedback;
    private Double employerRating;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Nested Classes

    @Getter
    @Setter
    public static class Reference {
        private String name;
        private String company;
        private String position;
        private String email;
        private String phone;
        private String relationship; // Client, Manager, Colleague
        private String verificationStatus; // PENDING, VERIFIED, FAILED
        private String feedbackSummary;
    }

    @Getter
    @Setter
    public static class PortfolioItem {
        private String title;
        private String description;
        private String url;
        private String thumbnailUrl;
        private String category; // VIDEO, IMAGE, AUDIO, DOCUMENT
        private List<String> tools;
        private Integer viewCount;
        private Double rating;
    }

    @Getter
    @Setter
    public static class PilotProjectInfo {
        private String pilotJobId;
        private String status; // NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED
        private LocalDateTime startDate;
        private LocalDateTime completionDate;
        private String deliverableUrl;
        private Integer revisionCount;
        private Integer hoursSpent;
        private Double pilotScore; // 0-100
        private String pilotFeedback;
        private Boolean pilotApproved;
    }

    @Getter
    @Setter
    public static class EvaluationResult {
        private Double portfolioScore;
        private Double experienceScore;
        private Double referenceScore;
        private Double communicationScore;
        private Double reliabilityScore;
        private Double overallScore;
        private List<String> strengthsIdentified;
        private List<String> concernsRaised;
        private String evaluatorName;
        private LocalDateTime evaluatedAt;
    }

    @Getter
    @Setter
    public static class OnboardingChecklist {
        private Boolean ndaSigned;
        private LocalDateTime ndaSignedDate;
        private Boolean backgroundCheckCompleted;
        private LocalDateTime bgCheckDate;
        private String bgCheckResult; // CLEAR, NEEDS_REVIEW, FAILED
        private Boolean contractSigned;
        private LocalDateTime contractSignedDate;
        private Boolean paymentInfoVerified;
        private LocalDateTime paymentVerifiedDate;
        private Boolean orientationCompleted;
        private LocalDateTime orientationDate;
        private Boolean toolsAccessGranted;
        private LocalDateTime toolsAccessDate;
        private Boolean firstProjectAssigned;
        private String firstProjectId;
        private Boolean allTasksCompleted;
        private LocalDateTime completedAt;
    }

    // Constructors
    public JobApplication() {
    }

    public JobApplication(String jobId, String vendorId, String employerId) {
        this.jobId = jobId;
        this.vendorId = vendorId;
        this.employerId = employerId;
        this.status = Status.SUBMITTED;
        this.appliedAt = LocalDateTime.now();
    }
}
