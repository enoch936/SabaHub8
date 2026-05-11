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
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "disputes")
public class Dispute {

    public enum Status {
        OPEN,
        UNDER_REVIEW,
        EVIDENCE_REQUIRED,
        SETTLEMENT_PENDING,
        RESOLVED,
        CLOSED
    }

    public enum OpenedByRole {
        EMPLOYER,
        FREELANCER
    }

    public enum MessageTarget {
        EMPLOYER,
        FREELANCER,
        BOTH
    }

    public enum RestrictionAction {
        NONE,
        BLOCK,
        UNBLOCK,
        BAN
    }

    @Id
    private String id;

    @Indexed
    private String contractId;

    private String contractTitle;
    private String employerId;
    private String employerName;
    private String freelancerId;
    private String freelancerName;

    private String openedByUserId;
    private OpenedByRole openedByRole;

    @Builder.Default
    private Status status = Status.OPEN;

    private String reason;
    private String details;

    @Builder.Default
    private List<String> adminNotes = new ArrayList<>();

    @Builder.Default
    private List<String> evidenceAssetIds = new ArrayList<>();

    @Builder.Default
    private List<AdminMessage> adminMessages = new ArrayList<>();

    @Builder.Default
    private ParticipantControls participantControls = ParticipantControls.builder().build();

    private Settlement settlement;
    private Double heldAmount;
    private Double paidAmount;
    private String currency;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminMessage {
        private String id;
        private MessageTarget target;
        private String content;
        private String sentByUserId;
        private String sentByName;
        private Instant sentAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipantControls {
        @Builder.Default
        private RestrictionAction employerAction = RestrictionAction.NONE;

        @Builder.Default
        private RestrictionAction freelancerAction = RestrictionAction.NONE;

        private Instant updatedAt;
        private String updatedByUserId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Settlement {
        private Double employerPercent;
        private Double freelancerPercent;
        private Double adminPercent;
        private Double employerAmount;
        private Double freelancerAmount;
        private Double adminAmount;
        private String reserveRecipientUserId;
        private String currency;
        private String note;
        private Instant decidedAt;
        private String decidedByUserId;
        private String decidedByName;
    }
}
