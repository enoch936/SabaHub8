package com.sabahub.web.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class EmployerDTOs {

// ==================== Request DTOs ====================

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class EmployerRegistrationDTO {
    private String email;
    private String companyName;
    private String companyWebsite;
    private String industry;
    private Integer employeeCount;
    private String description;
    private String address;
    private String city;
    private String country;
    private String taxId;
    private String registrationNumber;
    private String documentType;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class CompanyProfileDTO {
    private String companyName;
    private String companyWebsite;
    private String companyLogo;
    private String industry;
    private Integer employeeCount;
    private String description;
    private String address;
    private String city;
    private String country;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class PaymentMethodDTO {
    private String type;  // STRIPE, PAYPAL, WISE
    private String accountId;
    private String currency;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ProjectCreationDTO {
    private String title;
    private String description;
    private String category;
    private List<String> skills;
    private List<String> attachments;
    private String projectType;  // FIXED_PRICE or HOURLY
    private String scope;  // SMALL, MEDIUM, LARGE
    private Double budgetMin;
    private Double budgetMax;
    private String currency;
    private String paymentType;  // LUMPSUM or MILESTONE
    private String duration;
    private String experienceLevel;
    private Boolean isPrivate;
    private Boolean showBudget;
    private List<MilestoneDTO> milestones;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class MilestoneDTO {
    private String title;
    private String description;
    private Double amount;
    private LocalDateTime dueDate;
    private String deliverables;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ProjectUpdateDTO {
    private String title;
    private String description;
    private List<String> skills;
    private Double budgetMax;
    private String status;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ProjectFilterDTO {
    private String status;
    private String category;
    private String sortBy;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class HireDTO {
    private String projectId;
    private String freelancerId;
    private String proposalId;
    private Double totalAmount;
    private String paymentSchedule;  // UPFRONT, MILESTONE, UPON_COMPLETION
    private String contractType;  // ONE_TIME, ONGOING
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String ipRights;  // WHO_OWNS_IP
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class RatingDTO {
    private Double score;  // 1-5 stars
    private String feedback;
    private List<String> tags;
}

// ==================== Response DTOs ====================

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class EmployerAnalyticsDTO {
    private Integer totalProjectsPosted;
    private Integer activeProjects;
    private Integer completedProjects;
    private Double totalSpent;
    private Double averageRating;
    private Integer totalHired;
    private Double repeatHireRate;
    private List<String> topSkillsRequested;
    private Map<String, Double> spendByCategory;
    private List<ActivityDataPointDTO> activityOverTime;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ActivityDataPointDTO {
    private LocalDateTime date;
    private Integer count;
    private Double amount;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ProjectDetailResponseDTO {
    private String id;
    private String title;
    private String description;
    private String status;
    private Integer proposalsCount;
    private Integer shortlistedCount;
    private Double averageBid;
    private Double budget;
    private String currency;
    private List<String> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ContractResponseDTO {
    private String id;
    private String projectId;
    private String freelancerId;
    private String freelancerName;
    private String status;
    private Double totalAmount;
    private String currency;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private List<MilestoneResponseDTO> milestones;
    private Double escrowHeld;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class MilestoneResponseDTO {
    private String id;
    private String title;
    private Double amount;
    private String status;
    private LocalDateTime dueDate;
    private Double percentageComplete;
    private Boolean approvedByEmployer;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public static class ProposalResponseDTO {
    private String id;
    private String freelancerId;
    private String freelancerName;
    private Double bidAmount;
    private String bidCurrency;
    private Integer deliveryDays;
    private String status;
    private String coverLetter;
    private Double freelancerRating;
    private Integer freelancerReviews;
    private LocalDateTime submittedAt;
}

} // End of EmployerDTOs class
