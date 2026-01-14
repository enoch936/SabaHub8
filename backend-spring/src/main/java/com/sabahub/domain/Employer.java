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
@Document(collection = "employers")
public class Employer {
    private String id;
    private String userId;  // Reference to User
    
    // Company Information
    private CompanyProfile companyProfile;
    
    // KYC Verification
    private KYCVerification kycVerification;
    
    // Employer Statistics
    private EmployerStats stats;
    
    // Payment Information
    private PaymentMethod paymentMethod;
    
    // Verification Status
    private VerificationStatus verificationStatus;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Metadata
    private Boolean isActive;
    private String tier;  // STARTER, PROFESSIONAL, ENTERPRISE
    private List<String> badges;  // TOP_EMPLOYER, VERIFIED, etc.
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyProfile {
        private String companyName;
        private String companyWebsite;
        private String companyLogo;
        private String industry;
        private Integer employeeCount;
        private String description;
        private String address;
        private String city;
        private String country;
        private String taxId;
        private String registrationNumber;
        private LocalDateTime foundedYear;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class KYCVerification {
        private String status;  // PENDING, VERIFIED, REJECTED
        private String documentType;  // BUSINESS_LICENSE, TAX_ID, etc.
        private String documentUrl;
        private LocalDateTime verifiedAt;
        private String verificationNotes;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployerStats {
        private Integer totalProjectsPosted;
        private Integer activeProjects;
        private Integer completedProjects;
        private Double totalSpent;
        private Double averagePaymentReleaseTime;  // in hours
        private Double ratingScore;
        private Integer ratingCount;
        private Integer totalHired;
        private Integer repeatHireRate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentMethod {
        private String type;  // STRIPE, PAYPAL, WISE
        private String accountId;
        private String currency;
        private Boolean isDefault;
        private LocalDateTime addedAt;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerificationStatus {
        private String email;
        private Boolean emailVerified;
        private Boolean phoneVerified;
        private Boolean businessVerified;
        private Boolean paymentVerified;
    }
}
