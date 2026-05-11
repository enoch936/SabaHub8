package com.sabahub.domain;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "freelancers")
public class Freelancer {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String userId;
    
    // Profile Information
    private String professionalTitle;
    private String bio;
    private String profilePicture;
    private String coverImage;
    private String location;
    private String timezone;
    private List<String> languages;
    
    // Skills & Expertise
    private List<Skill> skills;
    private List<String> categories;
    private String experienceLevel; // BEGINNER, INTERMEDIATE, EXPERT
    private Integer yearsOfExperience;
    
    // Portfolio
    private List<PortfolioItem> portfolio;
    
    // Certifications & Education
    private List<Certification> certifications;
    private List<Education> education;
    
    // Rates & Availability
    private BigDecimal hourlyRate;
    private String currency;
    private BigDecimal minimumProjectBudget;
    private String availability; // FULL_TIME, PART_TIME, CONTRACT, NOT_AVAILABLE
    private Integer hoursPerWeek;
    private LocalDateTime availableFrom;
    
    // Work Preferences
    private List<String> preferredProjectTypes; // FIXED_PRICE, HOURLY
    private List<String> preferredProjectSizes; // SMALL, MEDIUM, LARGE
    private Boolean remoteOnly;
    private List<String> preferredIndustries;
    
    // Stats & Performance
    private BigDecimal totalEarnings;
    private Integer completedProjects;
    private Integer activeProjects;
    private Integer totalProposals;
    private Integer acceptedProposals;
    private Double successRate;
    private Double rating;
    private Integer reviewCount;
    private Integer jobSuccessScore; // 0-100
    
    // Verification
    private String verificationStatus; // PENDING, VERIFIED, REJECTED
    private List<String> verificationDocuments;
    private LocalDateTime verifiedAt;
    private String verifiedBy;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private Boolean identityVerified;
    
    // Financial
    private String stripeConnectedAccountId;
    private BigDecimal currentBalance;
    private BigDecimal pendingBalance;
    private BigDecimal totalWithdrawn;
    private String paymentMethod; // BANK_TRANSFER, PAYPAL, STRIPE
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastActive;
    private Boolean isActive;
    
    // Nested Classes
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Skill {
        private String name;
        private String level; // BEGINNER, INTERMEDIATE, EXPERT
        private Integer yearsOfExperience;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PortfolioItem {
        private String id;
        private String title;
        private String description;
        private List<String> images;
        private String projectUrl;
        private String category;
        private List<String> technologies;
        private LocalDateTime completedAt;
        private String clientName;
        private String testimonial;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Certification {
        private String id;
        private String name;
        private String issuedBy;
        private String credentialId;
        private String credentialUrl;
        private LocalDateTime issuedDate;
        private LocalDateTime expiryDate;
        private Boolean neverExpires;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Education {
        private String id;
        private String institution;
        private String degree;
        private String fieldOfStudy;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String description;
        private Boolean currentlyEnrolled;
    }
}
