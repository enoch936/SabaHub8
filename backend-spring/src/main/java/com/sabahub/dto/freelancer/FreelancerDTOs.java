package com.sabahub.dto.freelancer;

import com.sabahub.domain.Freelancer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class FreelancerDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FreelancerProfileRequest {
        private String professionalTitle;
        private String bio;
        private String profilePicture;
        private String coverImage;
        private String location;
        private String timezone;
        private List<String> languages;
        private List<String> categories;
        private BigDecimal hourlyRate;
        private String currency;
        private BigDecimal minimumProjectBudget;
        private String availability;
        private Integer hoursPerWeek;
        private LocalDateTime availableFrom;
        private List<String> preferredProjectTypes;
        private List<String> preferredProjectSizes;
        private Boolean remoteOnly;
        private List<String> preferredIndustries;
        private List<Freelancer.Skill> skills;
        private List<Freelancer.Education> education;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectSearchRequest {
        private String keyword;
        private List<String> categories;
        private BigDecimal minBudget;
        private BigDecimal maxBudget;
        private List<String> requiredSkills;
        private String projectType;
        private String experienceLevel;
        private String sortBy;
        private int page;
        private int size;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposalRequest {
        private String projectId;
        private BigDecimal bidAmount;
        private String currency;
        private Integer deliveryTime;
        private String coverLetter;
        private List<String> attachments;
        private List<ProposedMilestone> proposedMilestones;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposedMilestone {
        private String title;
        private String description;
        private BigDecimal amount;
        private Integer deliveryDays;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceRequest {
        private String contractId;
        private String title;
        private String description;
        private LocalDateTime dueDate;
        private List<LineItem> lineItems;
        private List<String> timeEntryIds;
        private String milestoneId;
        private BigDecimal tax;
        private BigDecimal discount;
        private String notes;
        private String termsAndConditions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LineItem {
        private String description;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WithdrawalRequest {
        private BigDecimal amount;
        private String currency;
        private String paymentMethod;
        private String accountHolderName;
        private String bankName;
        private String accountNumber;
        private String swiftCode;
        private String routingNumber;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FreelancerAnalytics {
        private BigDecimal totalEarnings;
        private BigDecimal currentBalance;
        private BigDecimal pendingBalance;
        private Integer completedProjects;
        private Integer activeProjects;
        private Integer totalProposals;
        private Integer acceptedProposals;
        private Double successRate;
        private Double rating;
        private Integer reviewCount;
        private Double jobSuccessScore;
        private List<MonthlyEarning> monthlyEarnings;
        private List<ProjectStat> topProjects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyEarning {
        private String month;
        private BigDecimal amount;
        private Integer projectCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectStat {
        private String projectTitle;
        private BigDecimal earnings;
        private String status;
        private Double rating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeEntryRequest {
        private String contractId;
        private String taskName;
        private String description;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Boolean manualEntry;
        private String manualEntryReason;
        private List<String> attachments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneSubmissionRequest {
        private String contractId;
        private Integer milestoneIndex;
        private String description;
        private List<String> attachments;
    }
}
