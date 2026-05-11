package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "identity_policy_configs")
public class IdentityPolicyConfig {

    @Id
    private String id;

    private PasswordPolicy passwordPolicy;

    private AuthenticationPolicy authenticationPolicy;

    private GovernancePolicy governancePolicy;

    @LastModifiedDate
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PasswordPolicy {
        private Integer minLength;
        private Boolean requireUppercase;
        private Boolean requireLowercase;
        private Boolean requireNumber;
        private Boolean requireSymbol;
        private Integer expiryDays;
        private Integer passwordReuseLimit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthenticationPolicy {
        private Boolean mfaRequiredForAdmins;
        private Boolean oauthEnabled;
        private Boolean ssoEnabled;
        private Boolean adaptiveAuthEnabled;
        private Boolean zeroTrustEnabled;
        private Boolean abacEnabled;
        private Integer rateLimitPerMinute;
        private Integer maxFailedLoginAttempts;
        private Integer sessionTimeoutMinutes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GovernancePolicy {
        private Boolean leastPrivilegeEnforced;
        private Boolean auditTrailEnabled;
        private Boolean anomalyAlertsEnabled;
        private Boolean automatedProvisioningEnabled;
    }
}
