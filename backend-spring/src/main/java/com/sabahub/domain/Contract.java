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
        DRAFT,
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

    @Builder.Default
    private Status status = Status.PENDING;

    @Builder.Default
    private Double escrowTotalHeld = 0.0;
    @Builder.Default
    private Double escrowRequiredAmount = 0.0;
    @Builder.Default
    private Double paidAmount = 0.0;
    private Double totalAmount;
    @Builder.Default
    private String currency = "USD";
    private String paymentModel;
    private String escrowProtectionLevel;
    private Integer disputeWindowDays;
    private Integer autoReleaseDays;
    @Builder.Default
    private Boolean requiresEscrow = Boolean.TRUE;
    @Builder.Default
    private Boolean adminReviewRequired = Boolean.TRUE;
    private String disputeId;
    @Builder.Default
    private Integer agreementVersion = 1;
    private LocalDateTime escrowLockedAt;
    private LocalDateTime agreementEstablishedAt;
    private LocalDateTime lastAgreementUpdatedAt;

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

    private EscrowRefundRequest refundRequest;

    @Builder.Default
    private Boolean available = Boolean.TRUE;

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
        private String acceptanceCriteria;
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
        private Integer sequence;
        private String title;
        private String description;
        private Double amount;
        private String status;  // PENDING, IN_ESCROW, RELEASED, DISPUTED
        private LocalDateTime dueDate;
        private LocalDateTime submittedAt;
        private LocalDateTime releaseDate;
        private String deliverables;
        private String submissionNote;
        private Double percentageComplete;
        private String feedbackFromEmployer;
        private Boolean approvedByEmployer;
        private LocalDateTime approvedAt;
        private Boolean escrowLocked;
        private LocalDateTime escrowLockedAt;
        private String escrowReferenceId;
        private String paymentReferenceId;
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EscrowRefundRequest {
        private String id;

        @Builder.Default
        private String status = "PENDING";

        private Double amount;
        private String currency;
        private String note;
        private String requestedByUserId;
        private String requestedByRole;
        private LocalDateTime requestedAt;

        @Builder.Default
        private EscrowRefundApproval employerApproval = EscrowRefundApproval.builder()
                .partyRole("EMPLOYER")
                .status("PENDING")
                .build();

        @Builder.Default
        private EscrowRefundApproval freelancerApproval = EscrowRefundApproval.builder()
                .partyRole("FREELANCER")
                .status("PENDING")
                .build();

        private String resolvedByUserId;
        private String resolutionType;
        private String resolutionNote;
        private LocalDateTime resolvedAt;
        private LocalDateTime executedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EscrowRefundApproval {
        private String partyRole;

        @Builder.Default
        private String status = "PENDING";

        private String actedByUserId;
        private String note;
        private LocalDateTime actedAt;
    }
}
