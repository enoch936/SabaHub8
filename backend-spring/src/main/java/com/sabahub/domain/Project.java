package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "projects")
public class Project {
    private String id;
    private String employerId;
    private String title;
    private String description;
    private String category;
    private List<String> skills;
    private List<String> attachments;
    
    // Project Type & Budget
    private ProjectType projectType;  // FIXED_PRICE or HOURLY
    private Budget budget;
    
    // Timeline
    private String duration;
    private String experienceLevel;
    
    // Status
    private String status;  // OPEN, IN_PROGRESS, COMPLETED, CLOSED
    
    // Proposals
    private ProposalInfo proposalInfo;
    
    // Milestones (for fixed price)
    private List<Milestone> milestones;
    
    // Selected Freelancer
    private String selectedFreelancerId;
    private LocalDateTime hiredAt;
    
    // Invitations
    private List<String> invitedFreelancers;
    
    // Ratings
    private Rating rating;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    private LocalDateTime completedAt;
    
    // Visibility & Settings
    private Boolean isPrivate;
    private Boolean showBudget;
    private Integer viewCount;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectType {
        private String type;  // FIXED_PRICE or HOURLY
        private String scope;  // SMALL, MEDIUM, LARGE
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Budget {
        private Double minAmount;
        private Double maxAmount;
        private String currency;
        private String paymentType;  // LUMPSUM or MILESTONE
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProposalInfo {
        private Integer totalProposals;
        private Integer shortlistedProposals;
        private Integer proposalsView;
        private Double averageBid;
        private Integer hirableProposals;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Milestone {
        private String id;
        private String title;
        private String description;
        private Double amount;
        private String currency;
        private LocalDateTime dueDate;
        private String status;  // PENDING, RELEASED, DISPUTED
        private String deliverables;
        private LocalDateTime releaseDate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Rating {
        private Double score;
        private String feedback;
        private List<String> tags;
        private LocalDateTime ratedAt;
        private String freelancerId;
    }
}
