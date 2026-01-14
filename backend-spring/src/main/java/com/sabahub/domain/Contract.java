package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "contracts")
public class Contract {

    public enum Status {
        PENDING,
        ACTIVE,
        IN_PROGRESS,
        DELIVERED,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    @Id
    private String id;

    @Indexed
    private String projectId;

    @Indexed
    private String jobId;

    @Indexed
    private String employerId;

    @Indexed
    private String freelancerId;

    private String title;
    private String description;
    private ContractTerms terms;

    private Status status = Status.PENDING;

    private Double escrowTotalHeld = 0.0;
    private Double totalAmount;
    private String currency = "USD";

    private List<PaymentMilestone> paymentMilestones;

    private String workType;  // FIXED_PRICE or HOURLY
    private String contractType;  // ONE_TIME or ONGOING

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;

    private List<Deliverable> deliverables;
    private List<String> attachments;

    private String deliveryNote;
    private String deliveryAssetId;

    private ContractSignatures signatures;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // Inner classes
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractTerms {
        private String scope;
        private String deliverables;
        private Integer revisionsAllowed;
        private String paymentSchedule;
        private String communicationChannel;
        private String workingHours;
        private String confidentiality;
        private String ipRights;
        private String terminationClause;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentMilestone {
        private String id;
        private String title;
        private Double amount;
        private String status;  // PENDING, IN_ESCROW, RELEASED, DISPUTED
        private LocalDateTime dueDate;
        private LocalDateTime releaseDate;
        private String deliverables;
        private Double percentageComplete;
        private String feedbackFromEmployer;
        private Boolean approvedByEmployer;
        private LocalDateTime approvedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Deliverable {
        private String id;
        private String title;
        private String description;
        private String fileUrl;
        private String status;  // PENDING, SUBMITTED, APPROVED, REVISION_REQUESTED
        private LocalDateTime submittedAt;
        private LocalDateTime approvedAt;
        private String employerFeedback;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ContractSignatures {
        private Boolean employerSigned;
        private LocalDateTime employerSignedAt;
        private Boolean freelancerSigned;
        private LocalDateTime freelancerSignedAt;
        private String contractHash;
    }
}
