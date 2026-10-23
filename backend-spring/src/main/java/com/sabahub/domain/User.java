package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    @Indexed(unique = true, sparse = true)
    private String username;

    private String fullName;

    private String passwordHash;

    private Set<String> roles;

    private boolean suspended;

    private boolean documentsVerified;

    private UserProfile profile;

    private IdentityReview identityReview;

    private AccessProfile accessProfile;

    private SecurityProfile securityProfile;

    private ReputationProfile reputationProfile;

    private VerificationProfile verificationProfile;

    private List<WarningRecord> warningRecords;

    @CreatedDate
    private Instant createdAt;

    private Instant lastSeenAt;

    public User(String email, String fullName, String passwordHash, Set<String> roles) {
        this.email = email;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.roles = roles;
    }

    public User(String email, String username, String fullName, String passwordHash, Set<String> roles) {
        this.email = email;
        this.username = username;
        this.fullName = fullName;
        this.passwordHash = passwordHash;
        this.roles = roles;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReputationProfile {
        private Integer globalScore; // 0-1000
        private Integer creatorInfluenceScore;
        private Integer professionalCredibilityScore;
        private Integer communityTrustScore;
        private Integer engagementQualityScore;
        private Long followerCount;
        private Long followingCount;
        private Double averageRating;
        private Integer verifiedAchievementsCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerificationProfile {
        private boolean verifiedTalent;
        private boolean verifiedRecruiter;
        private boolean verifiedOrganization;
        private boolean verifiedCreator;
        private String badgeLevel; // SILVER, GOLD, PLATINUM
        private Instant verifiedAt;
        private String verificationMethod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdentityReview {
        private String status;
        private Boolean emailVerified;
        private Boolean phoneVerified;
        private Boolean documentVerified;
        private String reviewNote;
        private String kycMethod;
        private String verifiedBy;
        private Instant verifiedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccessProfile {
        private String accessLevel;
        private String accessScope;
        private Set<String> permissions;
        private String privilegeNote;
        private Instant elevatedUntil;
        private String roleVersion;
        private Instant bootstrappedAt;
        private Boolean isBootstrappedAdmin;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SecurityProfile {
        private Boolean mfaRequired;
        private Boolean mfaEnabled;
        private Boolean oauthEnabled;
        private Boolean ssoEnabled;
        private Boolean adaptiveAuthEnabled;
        private Boolean forcePasswordReset;
        private Boolean banned;
        private String riskLevel;
        private Integer riskScore;
        private String riskReason;
        private Integer failedLoginAttempts;
        private Instant passwordUpdatedAt;
        private Instant lastCredentialResetAt;
        private String credentialResetChannel;
        private Instant lastWarningAt;
        private List<String> blacklistedIps;
        private List<String> blacklistedDevices;
        private Boolean bootstrapInitialization;
        private Instant bootstrappedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WarningRecord {
        private String id;
        private String severity;
        private String reason;
        private String note;
        private String status;
        private String issuedBy;
        private Instant issuedAt;
        private Instant resolvedAt;
        private String resolutionNote;
    }
}
