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

    private List<WarningRecord> warningRecords;

    @CreatedDate
    private Instant createdAt;

    private Instant lastSeenAt;

    public User() {
    }

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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public boolean isSuspended() { return suspended; }
    public void setSuspended(boolean suspended) { this.suspended = suspended; }

    public boolean isDocumentsVerified() { return documentsVerified; }
    public void setDocumentsVerified(boolean documentsVerified) { this.documentsVerified = documentsVerified; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public UserProfile getProfile() { return profile; }
    public void setProfile(UserProfile profile) { this.profile = profile; }

    public IdentityReview getIdentityReview() { return identityReview; }
    public void setIdentityReview(IdentityReview identityReview) { this.identityReview = identityReview; }

    public AccessProfile getAccessProfile() { return accessProfile; }
    public void setAccessProfile(AccessProfile accessProfile) { this.accessProfile = accessProfile; }

    public SecurityProfile getSecurityProfile() { return securityProfile; }
    public void setSecurityProfile(SecurityProfile securityProfile) { this.securityProfile = securityProfile; }

    public List<WarningRecord> getWarningRecords() { return warningRecords; }
    public void setWarningRecords(List<WarningRecord> warningRecords) { this.warningRecords = warningRecords; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

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
        private String riskReason;
        private Integer failedLoginAttempts;
        private Instant passwordUpdatedAt;
        private Instant lastCredentialResetAt;
        private String credentialResetChannel;
        private Instant lastWarningAt;
        private List<String> blacklistedIps;
        private List<String> blacklistedDevices;
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
