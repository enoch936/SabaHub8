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
import java.util.Map;

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

    // Tenant administration
    private ResourceQuota resourceQuota;
    private BillingProfile billingProfile;
    private MigrationStatus migrationStatus;
    private TenantEnvironment tenantEnvironment;
    private UsageProfile usageProfile;
    private ResourceLimits resourceLimits;
    private PermissionProfile permissionProfile;
    private IsolationProfile isolationProfile;
    private SuspensionRecord suspensionRecord;

    // Workspace data
    private List<TeamMember> teamMembers;
    private List<TeamActivity> teamActivities;
    private List<EmployerReview> reviews;
    
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResourceQuota {
        private Integer maxActiveProjects;
        private Integer maxTeamMembers;
        private Integer storageLimitGb;
        private Integer apiRateLimitPerMinute;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillingProfile {
        private String plan;
        private String status;
        private String model;
        private String billingEmail;
        private String currency;
        private String provider;
        private String accountId;
        private LocalDateTime renewalDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MigrationStatus {
        private String status;
        private String targetRegion;
        private String note;
        private LocalDateTime requestedAt;
        private LocalDateTime completedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TenantEnvironment {
        private String deploymentMode;
        private String namespace;
        private String cluster;
        private String region;
        private String infrastructureProvider;
        private String computeProfile;
        private String storageProfile;
        private String networkSegment;
        private String environmentTemplate;
        private String status;
        private Boolean autoScalingEnabled;
        private Boolean selfServiceOnboardingEnabled;
        private LocalDateTime provisionedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UsageProfile {
        private Double cpuCoresUsed;
        private Double memoryGbUsed;
        private Double storageGbUsed;
        private Long apiRequestsCurrentPeriod;
        private Double bandwidthMbpsUsed;
        private String anomalyStatus;
        private Double anomalyScore;
        private LocalDateTime lastCollectedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResourceLimits {
        private Double softCpuCores;
        private Double hardCpuCores;
        private Double softMemoryGb;
        private Double hardMemoryGb;
        private Double softStorageGb;
        private Double hardStorageGb;
        private Double softBandwidthMbps;
        private Double hardBandwidthMbps;
        private Boolean throttlingEnabled;
        private Boolean autoScaleEnabled;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PermissionProfile {
        private String accessModel;
        private List<String> adminRoles;
        private List<String> permissions;
        private Boolean isolationEnforced;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IsolationProfile {
        private String databaseIsolationMode;
        private String networkPolicy;
        private Boolean encryptionAtRest;
        private Boolean encryptionInTransit;
        private Integer crossTenantViolationCount;
        private String securityPolicy;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SuspensionRecord {
        private String status;
        private String reason;
        private String note;
        private LocalDateTime suspendedAt;
        private LocalDateTime resumedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamMember {
        private String userId;
        private String name;
        private String email;
        private String avatarUrl;
        private String teamRole;
        private LocalDateTime joinedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamActivity {
        private String id;
        private String action;
        private String memberName;
        private String detail;
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployerReview {
        private String id;
        private String contractId;
        private String reviewerId;
        private String reviewerName;
        private String reviewerAvatar;
        private String targetId;
        private Integer rating;
        private String comment;
        private String sentiment;
        private Boolean verified;
        private LocalDateTime createdAt;
        private List<String> tags;
        private Map<String, Object> metadata;
    }
}
