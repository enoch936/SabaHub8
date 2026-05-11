package com.sabahub.service;

import com.sabahub.domain.AuditLog;
import com.sabahub.domain.Employer;
import com.sabahub.domain.User;
import com.sabahub.domain.UserRole;
import com.sabahub.repository.AuditLogRepository;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProjectRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.admin.AdminTenantDTOs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminTenantManagementService {

    private final EmployerRepository employerRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final JobRepository jobRepository;
    private final ContractRepository contractRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AdminTenantDTOs.TenantListResponse listTenants() {
        List<AdminTenantDTOs.TenantSummary> tenants = loadTenantSummaries();
        return new AdminTenantDTOs.TenantListResponse(Instant.now(), tenants);
    }

    public AdminTenantDTOs.TenantWorkspaceResponse workspace() {
        List<AdminTenantDTOs.TenantSummary> tenants;
        try {
            tenants = loadTenantSummaries();
        } catch (Exception ex) {
            log.warn("Failed to load tenant summaries for workspace. Returning empty workspace.", ex);
            tenants = List.of();
        }

        List<AuditLog> auditLogs;
        try {
            auditLogs = auditLogRepository.findAll().stream()
                    .filter(this::isTenantAudit)
                    .sorted(Comparator.comparing(AuditLog::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                    .toList();
        } catch (Exception ex) {
            log.warn("Failed to load tenant audit logs for workspace. Continuing without audit trail.", ex);
            auditLogs = List.of();
        }

        long active = tenants.stream().filter(AdminTenantDTOs.TenantSummary::active).count();
        long suspended = tenants.stream().filter(tenant -> !tenant.active()).count();
        long pastDue = tenants.stream().filter(tenant -> "PAST_DUE".equals(tenantBillingStatus(tenant))).count();
        long trial = tenants.stream().filter(tenant -> "TRIAL".equals(tenantBillingStatus(tenant))).count();
        long anomalies = tenants.stream().filter(tenant -> !"NORMAL".equals(tenantAnomalyStatus(tenant))).count();

        return new AdminTenantDTOs.TenantWorkspaceResponse(
                Instant.now(),
                List.of(
                        new AdminTenantDTOs.MetricCard("total-tenants", "Total Tenants", String.valueOf(tenants.size()), "info"),
                        new AdminTenantDTOs.MetricCard("active-tenants", "Active", String.valueOf(active), active > 0 ? "success" : "warning"),
                        new AdminTenantDTOs.MetricCard("suspended-tenants", "Suspended", String.valueOf(suspended), suspended > 0 ? "warning" : "success"),
                        new AdminTenantDTOs.MetricCard("past-due", "Past Due Billing", String.valueOf(pastDue), pastDue > 0 ? "critical" : "success"),
                        new AdminTenantDTOs.MetricCard("trial-tenants", "Trial Tenants", String.valueOf(trial), trial > 0 ? "info" : "neutral"),
                        new AdminTenantDTOs.MetricCard("usage-anomalies", "Usage Anomalies", String.valueOf(anomalies), anomalies > 0 ? "warning" : "success")
                ),
                List.of(
                        new AdminTenantDTOs.DistributionItem("Active", active, "success"),
                        new AdminTenantDTOs.DistributionItem("Suspended", suspended, "warning"),
                    new AdminTenantDTOs.DistributionItem("Archived", tenants.stream().filter(tenant -> "ARCHIVED".equals(tenantSuspensionStatus(tenant))).count(), "neutral"),
                    new AdminTenantDTOs.DistributionItem("Provisioned", tenants.stream().filter(tenant -> "PROVISIONED".equals(tenantEnvironmentStatus(tenant))).count(), "info")
                ),
                List.of(
                    new AdminTenantDTOs.DistributionItem("Active Billing", tenants.stream().filter(tenant -> "ACTIVE".equals(tenantBillingStatus(tenant))).count(), "success"),
                        new AdminTenantDTOs.DistributionItem("Trial", trial, "info"),
                        new AdminTenantDTOs.DistributionItem("Past Due", pastDue, "critical"),
                    new AdminTenantDTOs.DistributionItem("Paused", tenants.stream().filter(tenant -> "PAUSED".equals(tenantBillingStatus(tenant))).count(), "warning")
                ),
                tenants.stream()
                    .sorted(Comparator.comparing(this::tenantApiRequests).reversed())
                        .limit(8)
                        .map(tenant -> new AdminTenantDTOs.UsageSnapshot(
                                tenant.id(),
                                tenant.companyName(),
                        tenantCpuUsed(tenant),
                        tenantMemoryUsed(tenant),
                        tenantStorageUsed(tenant),
                        tenantApiRequests(tenant),
                        tenantBandwidthUsed(tenant)
                        ))
                        .toList(),
                buildAlerts(tenants),
                auditLogs.stream()
                        .limit(40)
                        .map(log -> new AdminTenantDTOs.AuditEntry(
                                log.getId(),
                                log.getAction(),
                                log.getEntityType(),
                                log.getEntityId(),
                                log.getActorUserId(),
                                log.getCreatedAt()
                        ))
                        .toList(),
                tenants
        );
    }

    public AdminTenantDTOs.TenantSummary createTenant(AdminTenantDTOs.CreateTenantRequest request, User actor) {
        String ownerEmail = requireNonBlank(request.ownerEmail(), "Owner email is required").toLowerCase();
        String ownerFullName = requireNonBlank(request.ownerFullName(), "Owner full name is required");
        String ownerPassword = requireNonBlank(request.ownerPassword(), "Owner password is required");
        String companyName = requireNonBlank(request.companyName(), "Company name is required");

        if (ownerPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (userRepository.existsByEmail(ownerEmail)) {
            throw new IllegalArgumentException("Email already exists");
        }

        String ownerUsername = normalizeOptionalString(request.ownerUsername());
        if (ownerUsername != null && userRepository.existsByUsername(ownerUsername)) {
            throw new IllegalArgumentException("Username already exists");
        }

        User owner = new User(ownerEmail, ownerUsername, ownerFullName, passwordEncoder.encode(ownerPassword), Set.of(UserRole.EMPLOYER.toSpringRole()));
        owner.setCreatedAt(Instant.now());
        owner.setSuspended(false);
        owner.setDocumentsVerified(false);
        User savedOwner = userRepository.save(owner);

        try {
            Employer employer = Employer.builder()
                    .userId(savedOwner.getId())
                    .companyProfile(Employer.CompanyProfile.builder()
                            .companyName(companyName)
                            .companyWebsite(normalizeOptionalString(request.companyWebsite()))
                            .industry(normalizeOptionalString(request.industry()))
                            .employeeCount(request.employeeCount())
                            .country(normalizeOptionalString(request.country()))
                            .build())
                    .kycVerification(Employer.KYCVerification.builder()
                            .status("PENDING")
                            .build())
                    .stats(defaultStats())
                    .verificationStatus(Employer.VerificationStatus.builder()
                            .email(ownerEmail)
                            .emailVerified(false)
                            .phoneVerified(false)
                            .businessVerified(false)
                            .paymentVerified(false)
                            .build())
                    .resourceQuota(Employer.ResourceQuota.builder()
                            .maxActiveProjects(defaultInt(request.maxActiveProjects(), 10))
                            .maxTeamMembers(defaultInt(request.maxTeamMembers(), 25))
                            .storageLimitGb(defaultInt(request.storageLimitGb(), 100))
                            .apiRateLimitPerMinute(defaultInt(request.apiRateLimitPerMinute(), 120))
                            .build())
                    .billingProfile(Employer.BillingProfile.builder()
                            .plan(normalizeUpperOrDefault(request.plan(), normalizeUpperOrDefault(request.tier(), "STARTER")))
                            .status("ACTIVE")
                            .model(normalizeUpperOrDefault(request.billingModel(), "SUBSCRIPTION"))
                            .billingEmail(firstNonBlank(normalizeOptionalString(request.billingEmail()), ownerEmail))
                            .currency(normalizeUpperOrDefault(request.billingCurrency(), "USD"))
                            .provider(normalizeUpperOrDefault(request.billingProvider(), "MANUAL"))
                            .accountId(normalizeOptionalString(request.billingAccountId()))
                            .renewalDate(LocalDateTime.now().plusMonths(1))
                            .build())
                    .migrationStatus(Employer.MigrationStatus.builder()
                            .status("IDLE")
                            .build())
                    .tenantEnvironment(defaultEnvironment(companyName, normalizeUpperOrDefault(request.tier(), "STARTER"), null))
                    .resourceLimits(defaultResourceLimits(normalizeUpperOrDefault(request.tier(), "STARTER")))
                    .permissionProfile(defaultPermissionProfile())
                    .isolationProfile(defaultIsolationProfile())
                    .suspensionRecord(activeSuspensionRecord())
                    .usageProfile(Employer.UsageProfile.builder()
                            .cpuCoresUsed(0.8)
                            .memoryGbUsed(2.0)
                            .storageGbUsed(5.0)
                            .apiRequestsCurrentPeriod(250L)
                            .bandwidthMbpsUsed(8.0)
                            .anomalyStatus("NORMAL")
                            .anomalyScore(0.0)
                            .lastCollectedAt(LocalDateTime.now())
                            .build())
                    .isActive(true)
                    .tier(normalizeUpperOrDefault(request.tier(), "STARTER"))
                    .badges(List.of())
                    .build();

            if (normalizeOptionalString(request.billingProvider()) != null || normalizeOptionalString(request.billingAccountId()) != null) {
                employer.setPaymentMethod(Employer.PaymentMethod.builder()
                        .type(normalizeUpperOrDefault(request.billingProvider(), "MANUAL"))
                        .accountId(normalizeOptionalString(request.billingAccountId()))
                        .currency(normalizeUpperOrDefault(request.billingCurrency(), "USD"))
                        .isDefault(true)
                        .addedAt(LocalDateTime.now())
                        .build());
            }

            Employer savedEmployer = employerRepository.save(employer);
            auditService.log("ADMIN_TENANT_CREATED", "TENANT", savedEmployer.getId(), tenantMetadata(actor, savedOwner, companyName, Map.of("tier", savedEmployer.getTier())));
            return toSummary(savedEmployer, savedOwner);
        } catch (RuntimeException ex) {
            userRepository.delete(savedOwner);
            throw ex;
        }
    }

    public AdminTenantDTOs.TenantSummary updateTenant(String tenantId, AdminTenantDTOs.UpdateTenantRequest request, User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        Employer.CompanyProfile companyProfile = ensureCompanyProfile(employer);
        Employer.VerificationStatus verificationStatus = ensureVerificationStatus(employer, owner);
        Employer.KYCVerification kycVerification = ensureKycVerification(employer);
        Employer.ResourceQuota resourceQuota = ensureResourceQuota(employer);
        Employer.BillingProfile billingProfile = ensureBillingProfile(employer, owner);
        Employer.EmployerStats stats = ensureStats(employer);
        Employer.TenantEnvironment tenantEnvironment = ensureEnvironment(employer);
        Employer.SuspensionRecord suspensionRecord = ensureSuspensionRecord(employer);

        if (request.ownerEmail() != null) {
            String ownerEmail = requireNonBlank(request.ownerEmail(), "Owner email is required").toLowerCase();
            if (!ownerEmail.equalsIgnoreCase(owner.getEmail()) && userRepository.existsByEmail(ownerEmail)) {
                throw new IllegalArgumentException("Email already exists");
            }
            owner.setEmail(ownerEmail);
            verificationStatus.setEmail(ownerEmail);
            if (billingProfile.getBillingEmail() == null || billingProfile.getBillingEmail().isBlank()) {
                billingProfile.setBillingEmail(ownerEmail);
            }
        }
        if (request.ownerFullName() != null) {
            owner.setFullName(requireNonBlank(request.ownerFullName(), "Owner full name is required"));
        }
        if (request.ownerUsername() != null) {
            String username = normalizeOptionalString(request.ownerUsername());
            if (username != null && !username.equalsIgnoreCase(owner.getUsername()) && userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username already exists");
            }
            owner.setUsername(username);
        }

        if (request.companyName() != null) {
            companyProfile.setCompanyName(requireNonBlank(request.companyName(), "Company name is required"));
        }
        if (request.companyWebsite() != null) {
            companyProfile.setCompanyWebsite(normalizeOptionalString(request.companyWebsite()));
        }
        if (request.industry() != null) {
            companyProfile.setIndustry(normalizeOptionalString(request.industry()));
        }
        if (request.country() != null) {
            companyProfile.setCountry(normalizeOptionalString(request.country()));
        }
        if (request.employeeCount() != null) {
            companyProfile.setEmployeeCount(request.employeeCount());
        }
        if (request.tier() != null) {
            employer.setTier(normalizeUpperOrDefault(request.tier(), employer.getTier()));
            tenantEnvironment.setDeploymentMode("ENTERPRISE".equals(employer.getTier()) ? "DEDICATED" : tenantEnvironment.getDeploymentMode());
            if (billingProfile.getPlan() == null || billingProfile.getPlan().isBlank()) {
                billingProfile.setPlan(employer.getTier());
            }
        }
        if (request.active() != null) {
            employer.setIsActive(request.active());
            owner.setSuspended(!request.active());
            suspensionRecord.setStatus(request.active() ? "ACTIVE" : "SUSPENDED");
            if (request.active()) {
                suspensionRecord.setResumedAt(LocalDateTime.now());
                tenantEnvironment.setStatus("PROVISIONED");
            } else {
                suspensionRecord.setSuspendedAt(LocalDateTime.now());
                tenantEnvironment.setStatus("SUSPENDED");
            }
        }
        if (request.businessVerified() != null) {
            verificationStatus.setBusinessVerified(request.businessVerified());
            owner.setDocumentsVerified(request.businessVerified());
        }
        if (request.paymentVerified() != null) {
            verificationStatus.setPaymentVerified(request.paymentVerified());
        }
        if (request.kycStatus() != null) {
            String status = normalizeUpperOrDefault(request.kycStatus(), "PENDING");
            kycVerification.setStatus(status);
            if ("VERIFIED".equals(status)) {
                kycVerification.setVerifiedAt(LocalDateTime.now());
            }
        }
        if (request.verificationNote() != null) {
            kycVerification.setVerificationNotes(normalizeOptionalString(request.verificationNote()));
        }

        if (request.plan() != null) {
            billingProfile.setPlan(normalizeUpperOrDefault(request.plan(), billingProfile.getPlan()));
        }
        if (request.billingStatus() != null) {
            billingProfile.setStatus(normalizeUpperOrDefault(request.billingStatus(), billingProfile.getStatus()));
        }
        if (request.billingModel() != null) {
            billingProfile.setModel(normalizeUpperOrDefault(request.billingModel(), billingProfile.getModel()));
        }
        if (request.billingEmail() != null) {
            billingProfile.setBillingEmail(normalizeOptionalString(request.billingEmail()));
        }
        if (request.billingCurrency() != null) {
            billingProfile.setCurrency(normalizeUpperOrDefault(request.billingCurrency(), billingProfile.getCurrency()));
        }
        if (request.billingProvider() != null) {
            billingProfile.setProvider(normalizeUpperOrDefault(request.billingProvider(), billingProfile.getProvider()));
        }
        if (request.billingAccountId() != null) {
            billingProfile.setAccountId(normalizeOptionalString(request.billingAccountId()));
        }
        if (request.renewalDate() != null) {
            billingProfile.setRenewalDate(request.renewalDate());
        }

        if (request.maxActiveProjects() != null) {
            resourceQuota.setMaxActiveProjects(request.maxActiveProjects());
        }
        if (request.maxTeamMembers() != null) {
            resourceQuota.setMaxTeamMembers(request.maxTeamMembers());
        }
        if (request.storageLimitGb() != null) {
            resourceQuota.setStorageLimitGb(request.storageLimitGb());
        }
        if (request.apiRateLimitPerMinute() != null) {
            resourceQuota.setApiRateLimitPerMinute(request.apiRateLimitPerMinute());
        }

        if (request.billingProvider() != null || request.billingAccountId() != null || request.billingCurrency() != null) {
            Employer.PaymentMethod paymentMethod = employer.getPaymentMethod() != null ? employer.getPaymentMethod() : new Employer.PaymentMethod();
            paymentMethod.setType(normalizeUpperOrDefault(request.billingProvider(), paymentMethod.getType() != null ? paymentMethod.getType() : billingProfile.getProvider()));
            paymentMethod.setAccountId(normalizeOptionalString(request.billingAccountId()) != null ? normalizeOptionalString(request.billingAccountId()) : paymentMethod.getAccountId());
            paymentMethod.setCurrency(normalizeUpperOrDefault(request.billingCurrency(), paymentMethod.getCurrency() != null ? paymentMethod.getCurrency() : billingProfile.getCurrency()));
            paymentMethod.setIsDefault(true);
            if (paymentMethod.getAddedAt() == null) {
                paymentMethod.setAddedAt(LocalDateTime.now());
            }
            employer.setPaymentMethod(paymentMethod);
        }

        if (stats.getTotalSpent() == null) {
            stats.setTotalSpent(0.0);
        }

        userRepository.save(owner);
        Employer savedEmployer = employerRepository.save(employer);
        refreshUsageInternal(savedEmployer);
        savedEmployer = employerRepository.save(savedEmployer);

        auditService.log("ADMIN_TENANT_UPDATED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(companyProfile.getCompanyName(), "Tenant"),
                Map.of("active", Boolean.TRUE.equals(savedEmployer.getIsActive()))
        ));

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary deleteTenant(String tenantId, User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        employerRepository.delete(employer);
        userRepository.delete(owner);

        auditService.log("ADMIN_TENANT_DELETED", "TENANT", tenantId, tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("ownerEmail", owner.getEmail())
        ));

        return toSummary(employer, owner);
    }

    public AdminTenantDTOs.TenantSummary provisionEnvironment(String tenantId,
                                                              AdminTenantDTOs.ProvisionEnvironmentRequest request,
                                                              User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        Employer.TenantEnvironment environment = ensureEnvironment(employer);
        Employer.IsolationProfile isolationProfile = ensureIsolationProfile(employer);

        if (request.deploymentMode() != null) {
            environment.setDeploymentMode(normalizeUpperOrDefault(request.deploymentMode(), environment.getDeploymentMode()));
        }
        if (request.namespace() != null) {
            environment.setNamespace(normalizeOptionalString(request.namespace()));
        }
        if (request.cluster() != null) {
            environment.setCluster(normalizeOptionalString(request.cluster()));
        }
        if (request.region() != null) {
            environment.setRegion(normalizeOptionalString(request.region()));
        }
        if (request.infrastructureProvider() != null) {
            environment.setInfrastructureProvider(normalizeUpperOrDefault(request.infrastructureProvider(), environment.getInfrastructureProvider()));
        }
        if (request.computeProfile() != null) {
            environment.setComputeProfile(normalizeUpperOrDefault(request.computeProfile(), environment.getComputeProfile()));
        }
        if (request.storageProfile() != null) {
            environment.setStorageProfile(normalizeUpperOrDefault(request.storageProfile(), environment.getStorageProfile()));
        }
        if (request.networkSegment() != null) {
            environment.setNetworkSegment(normalizeOptionalString(request.networkSegment()));
        }
        if (request.environmentTemplate() != null) {
            environment.setEnvironmentTemplate(normalizeUpperOrDefault(request.environmentTemplate(), environment.getEnvironmentTemplate()));
        }
        if (request.autoScalingEnabled() != null) {
            environment.setAutoScalingEnabled(request.autoScalingEnabled());
        }
        if (request.selfServiceOnboardingEnabled() != null) {
            environment.setSelfServiceOnboardingEnabled(request.selfServiceOnboardingEnabled());
        }

        environment.setStatus(Boolean.TRUE.equals(employer.getIsActive()) ? "PROVISIONED" : "SUSPENDED");
        environment.setProvisionedAt(LocalDateTime.now());
        isolationProfile.setNetworkPolicy(firstNonBlank(environment.getNetworkSegment(), isolationProfile.getNetworkPolicy(), "SEGMENTED"));

        Employer savedEmployer = employerRepository.save(employer);
        auditService.log("TENANT_ENVIRONMENT_PROVISIONED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("region", defaultString(environment.getRegion(), "primary-cluster-us"))
        ));

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary configureResourceLimits(String tenantId,
                                                                 AdminTenantDTOs.ResourceLimitRequest request,
                                                                 User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        Employer.ResourceLimits resourceLimits = ensureResourceLimits(employer);
        if (request.softCpuCores() != null) {
            resourceLimits.setSoftCpuCores(request.softCpuCores());
        }
        if (request.hardCpuCores() != null) {
            resourceLimits.setHardCpuCores(request.hardCpuCores());
        }
        if (request.softMemoryGb() != null) {
            resourceLimits.setSoftMemoryGb(request.softMemoryGb());
        }
        if (request.hardMemoryGb() != null) {
            resourceLimits.setHardMemoryGb(request.hardMemoryGb());
        }
        if (request.softStorageGb() != null) {
            resourceLimits.setSoftStorageGb(request.softStorageGb());
        }
        if (request.hardStorageGb() != null) {
            resourceLimits.setHardStorageGb(request.hardStorageGb());
        }
        if (request.softBandwidthMbps() != null) {
            resourceLimits.setSoftBandwidthMbps(request.softBandwidthMbps());
        }
        if (request.hardBandwidthMbps() != null) {
            resourceLimits.setHardBandwidthMbps(request.hardBandwidthMbps());
        }
        if (request.throttlingEnabled() != null) {
            resourceLimits.setThrottlingEnabled(request.throttlingEnabled());
        }
        if (request.autoScaleEnabled() != null) {
            resourceLimits.setAutoScaleEnabled(request.autoScaleEnabled());
            ensureEnvironment(employer).setAutoScalingEnabled(request.autoScaleEnabled());
        }

        refreshUsageInternal(employer);
        Employer savedEmployer = employerRepository.save(employer);
        auditService.log("TENANT_RESOURCE_LIMITS_UPDATED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("hardCpuCores", savedEmployer.getResourceLimits().getHardCpuCores())
        ));

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary updatePermissionProfile(String tenantId,
                                                                 AdminTenantDTOs.PermissionProfileRequest request,
                                                                 User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        Employer.PermissionProfile permissionProfile = ensurePermissionProfile(employer);
        if (request.accessModel() != null) {
            permissionProfile.setAccessModel(normalizeUpperOrDefault(request.accessModel(), permissionProfile.getAccessModel()));
        }
        if (request.adminRoles() != null) {
            permissionProfile.setAdminRoles(normalizeStringList(request.adminRoles()));
        }
        if (request.permissions() != null) {
            permissionProfile.setPermissions(normalizeStringList(request.permissions()));
        }
        if (request.isolationEnforced() != null) {
            permissionProfile.setIsolationEnforced(request.isolationEnforced());
        }

        Employer savedEmployer = employerRepository.save(employer);
        auditService.log("TENANT_PERMISSION_PROFILE_UPDATED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("accessModel", defaultString(permissionProfile.getAccessModel(), "RBAC"))
        ));

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary updateIsolationProfile(String tenantId,
                                                                AdminTenantDTOs.TenantIsolationRequest request,
                                                                User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        Employer.IsolationProfile isolationProfile = ensureIsolationProfile(employer);
        if (request.databaseIsolationMode() != null) {
            isolationProfile.setDatabaseIsolationMode(normalizeUpperOrDefault(request.databaseIsolationMode(), isolationProfile.getDatabaseIsolationMode()));
        }
        if (request.networkPolicy() != null) {
            isolationProfile.setNetworkPolicy(normalizeUpperOrDefault(request.networkPolicy(), isolationProfile.getNetworkPolicy()));
        }
        if (request.encryptionAtRest() != null) {
            isolationProfile.setEncryptionAtRest(request.encryptionAtRest());
        }
        if (request.encryptionInTransit() != null) {
            isolationProfile.setEncryptionInTransit(request.encryptionInTransit());
        }
        if (request.crossTenantViolationCount() != null) {
            isolationProfile.setCrossTenantViolationCount(request.crossTenantViolationCount());
        }
        if (request.securityPolicy() != null) {
            isolationProfile.setSecurityPolicy(normalizeUpperOrDefault(request.securityPolicy(), isolationProfile.getSecurityPolicy()));
        }

        Employer savedEmployer = employerRepository.save(employer);
        auditService.log("TENANT_ISOLATION_PROFILE_UPDATED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("databaseIsolationMode", defaultString(isolationProfile.getDatabaseIsolationMode(), "SCHEMA"))
        ));

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary changeLifecycle(String tenantId,
                                                         AdminTenantDTOs.TenantLifecycleRequest request,
                                                         User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        String action = normalizeUpperOrDefault(request.action(), "SUSPEND");
        Employer.TenantEnvironment environment = ensureEnvironment(employer);
        Employer.SuspensionRecord suspensionRecord = ensureSuspensionRecord(employer);

        switch (action) {
            case "SUSPEND" -> {
                employer.setIsActive(false);
                owner.setSuspended(true);
                environment.setStatus("SUSPENDED");
                suspensionRecord.setStatus("SUSPENDED");
                suspensionRecord.setReason(requireNonBlank(request.reason(), "Suspension reason is required"));
                suspensionRecord.setNote(normalizeOptionalString(request.note()));
                suspensionRecord.setSuspendedAt(LocalDateTime.now());
            }
            case "REACTIVATE" -> {
                employer.setIsActive(true);
                owner.setSuspended(false);
                environment.setStatus("PROVISIONED");
                suspensionRecord.setStatus("ACTIVE");
                suspensionRecord.setReason(requireNonBlank(request.reason(), "Reactivation reason is required"));
                suspensionRecord.setNote(normalizeOptionalString(request.note()));
                suspensionRecord.setResumedAt(LocalDateTime.now());
            }
            case "ARCHIVE" -> {
                employer.setIsActive(false);
                owner.setSuspended(true);
                environment.setStatus("ARCHIVED");
                suspensionRecord.setStatus("ARCHIVED");
                suspensionRecord.setReason(requireNonBlank(request.reason(), "Archive reason is required"));
                suspensionRecord.setNote(normalizeOptionalString(request.note()));
                suspensionRecord.setSuspendedAt(LocalDateTime.now());
            }
            default -> throw new IllegalArgumentException("Unsupported tenant lifecycle action");
        }

        userRepository.save(owner);
        Employer savedEmployer = employerRepository.save(employer);
        auditService.log("TENANT_LIFECYCLE_CHANGED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("action", action)
        ));

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary migrateTenant(String tenantId, AdminTenantDTOs.TenantMigrationRequest request, User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        Employer.MigrationStatus migrationStatus = ensureMigrationStatus(employer);
        Employer.TenantEnvironment environment = ensureEnvironment(employer);
        migrationStatus.setStatus("COMPLETED");
        migrationStatus.setTargetRegion(requireNonBlank(request.targetRegion(), "Target region is required"));
        migrationStatus.setNote(normalizeOptionalString(request.note()));
        migrationStatus.setRequestedAt(LocalDateTime.now());
        migrationStatus.setCompletedAt(LocalDateTime.now());
        environment.setRegion(migrationStatus.getTargetRegion());

        Employer savedEmployer = employerRepository.save(employer);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actorUserId", actor.getId());
        metadata.put("ownerUserId", owner.getId());
        metadata.put("targetRegion", migrationStatus.getTargetRegion());
        metadata.put("note", migrationStatus.getNote());
        auditService.log("ADMIN_TENANT_MIGRATED", "TENANT", savedEmployer.getId(), metadata);

        return toSummary(savedEmployer, owner);
    }

    public AdminTenantDTOs.TenantSummary refreshUsage(String tenantId, User actor) {
        Employer employer = employerRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));
        User owner = resolveOwner(employer);

        refreshUsageInternal(employer);
        Employer savedEmployer = employerRepository.save(employer);
        auditService.log("TENANT_USAGE_REFRESHED", "TENANT", savedEmployer.getId(), tenantMetadata(
                actor,
                owner,
                firstNonBlank(employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : null, "Tenant"),
                Map.of("anomalyStatus", savedEmployer.getUsageProfile().getAnomalyStatus())
        ));

        return toSummary(savedEmployer, owner);
    }

    private List<AdminTenantDTOs.TenantSummary> loadTenantSummaries() {
        List<Employer> employers = employerRepository.findAll();
        Map<String, User> usersById = userRepository.findAllById(
                        employers.stream()
                                .map(Employer::getUserId)
                                .filter(Objects::nonNull)
                                .toList()
                ).stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left));

        return employers.stream()
                .sorted(Comparator.comparing(this::sortKey))
                .map(employer -> toSummary(employer, usersById.get(employer.getUserId())))
                .toList();
    }

    private List<AdminTenantDTOs.TenantAlert> buildAlerts(List<AdminTenantDTOs.TenantSummary> tenants) {
        return tenants.stream()
                .flatMap(tenant -> {
                    List<AdminTenantDTOs.TenantAlert> alerts = new ArrayList<>();
                    if ("PAST_DUE".equals(tenantBillingStatus(tenant))) {
                        alerts.add(new AdminTenantDTOs.TenantAlert(
                                "billing-" + tenant.id(),
                                "Billing account is past due",
                                tenant.companyName() + " requires billing intervention before service degradation.",
                                "critical",
                                tenant.id(),
                                "Review billing configuration"
                        ));
                    }
                    if (!"NORMAL".equals(tenantAnomalyStatus(tenant))) {
                        alerts.add(new AdminTenantDTOs.TenantAlert(
                                "usage-" + tenant.id(),
                                "Usage anomaly detected",
                                tenant.companyName() + " crossed monitored usage thresholds.",
                                "warning",
                                tenant.id(),
                                "Refresh usage and review limits"
                        ));
                    }
                    if (tenantIsolationViolations(tenant) > 0) {
                        alerts.add(new AdminTenantDTOs.TenantAlert(
                                "isolation-" + tenant.id(),
                                "Cross-tenant isolation alerts",
                                tenant.companyName() + " has recorded cross-tenant policy violations.",
                                "critical",
                                tenant.id(),
                                "Inspect isolation controls"
                        ));
                    }
                    if (!tenant.active()) {
                        alerts.add(new AdminTenantDTOs.TenantAlert(
                                "lifecycle-" + tenant.id(),
                                "Tenant environment not active",
                                tenant.companyName() + " is currently " + tenantSuspensionStatus(tenant).toLowerCase() + ".",
                                "info",
                                tenant.id(),
                                "Review lifecycle state"
                        ));
                    }
                    return alerts.stream();
                })
                .limit(20)
                .toList();
    }

    private String tenantBillingStatus(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.billing() == null || tenant.billing().status() == null) {
            return "UNKNOWN";
        }
        return tenant.billing().status();
    }

    private String tenantAnomalyStatus(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.usage() == null || tenant.usage().anomalyStatus() == null) {
            return "NORMAL";
        }
        return tenant.usage().anomalyStatus();
    }

    private String tenantSuspensionStatus(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.suspension() == null || tenant.suspension().status() == null) {
            return "ACTIVE";
        }
        return tenant.suspension().status();
    }

    private String tenantEnvironmentStatus(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.environment() == null || tenant.environment().status() == null) {
            return "UNKNOWN";
        }
        return tenant.environment().status();
    }

    private int tenantIsolationViolations(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.isolationProfile() == null) {
            return 0;
        }
        return tenant.isolationProfile().crossTenantViolationCount();
    }

    private long tenantApiRequests(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.usage() == null) {
            return 0L;
        }
        return tenant.usage().apiRequestsCurrentPeriod();
    }

    private double tenantCpuUsed(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.usage() == null) {
            return 0.0;
        }
        return tenant.usage().cpuCoresUsed();
    }

    private double tenantMemoryUsed(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.usage() == null) {
            return 0.0;
        }
        return tenant.usage().memoryGbUsed();
    }

    private double tenantStorageUsed(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.usage() == null) {
            return 0.0;
        }
        return tenant.usage().storageGbUsed();
    }

    private double tenantBandwidthUsed(AdminTenantDTOs.TenantSummary tenant) {
        if (tenant == null || tenant.usage() == null) {
            return 0.0;
        }
        return tenant.usage().bandwidthMbpsUsed();
    }

    private boolean isTenantAudit(AuditLog auditLog) {
        if (auditLog == null) {
            return false;
        }
        String entityType = defaultString(auditLog.getEntityType(), "");
        String action = defaultString(auditLog.getAction(), "");
        return "TENANT".equals(entityType) || action.startsWith("ADMIN_TENANT_") || action.startsWith("TENANT_");
    }

    private AdminTenantDTOs.TenantSummary toSummary(Employer employer, User owner) {
        Employer.CompanyProfile companyProfile = ensureCompanyProfile(employer);
        Employer.VerificationStatus verificationStatus = ensureVerificationStatus(employer, owner);
        Employer.KYCVerification kycVerification = ensureKycVerification(employer);
        Employer.ResourceQuota resourceQuota = ensureResourceQuota(employer);
        Employer.BillingProfile billingProfile = ensureBillingProfile(employer, owner);
        Employer.MigrationStatus migrationStatus = ensureMigrationStatus(employer);
        Employer.EmployerStats stats = ensureStats(employer);
        Employer.TenantEnvironment environment = ensureEnvironment(employer);
        Employer.ResourceLimits resourceLimits = ensureResourceLimits(employer);
        Employer.PermissionProfile permissionProfile = ensurePermissionProfile(employer);
        Employer.IsolationProfile isolationProfile = ensureIsolationProfile(employer);
        Employer.SuspensionRecord suspensionRecord = ensureSuspensionRecord(employer);
        Employer.UsageProfile usageProfile = calculateUsage(employer);

        long totalProjects = defaultLong(projectRepository.countByEmployerId(employer.getId()));
        long openProjects = defaultLong(projectRepository.countOpenProjectsByEmployer(employer.getId()));
        long totalJobs = jobRepository.countByEmployerId(employer.getId());
        long activeContracts = defaultLong(contractRepository.countActiveContractsByEmployer(employer.getId()));

        boolean ownerSuspended = owner != null && owner.isSuspended();
        boolean active = Boolean.TRUE.equals(employer.getIsActive()) && !ownerSuspended && !"ARCHIVED".equals(suspensionRecord.getStatus());

        return new AdminTenantDTOs.TenantSummary(
                employer.getId(),
                owner != null ? owner.getId() : employer.getUserId(),
                owner != null ? owner.getFullName() : "Unassigned owner",
                owner != null ? owner.getEmail() : verificationStatus.getEmail(),
                owner != null ? owner.getUsername() : null,
                firstNonBlank(companyProfile.getCompanyName(), owner != null ? owner.getFullName() : null, "Untitled tenant"),
                companyProfile.getCompanyWebsite(),
                companyProfile.getIndustry(),
                companyProfile.getCountry(),
                companyProfile.getEmployeeCount(),
                normalizeUpperOrDefault(employer.getTier(), "STARTER"),
                active,
                ownerSuspended,
                Boolean.TRUE.equals(verificationStatus.getBusinessVerified()),
                Boolean.TRUE.equals(verificationStatus.getPaymentVerified()),
                normalizeUpperOrDefault(kycVerification.getStatus(), "PENDING"),
                totalProjects,
                openProjects,
                totalJobs,
                activeContracts,
                stats.getTotalSpent() != null ? stats.getTotalSpent() : 0.0,
                new AdminTenantDTOs.TenantQuota(
                        resourceQuota.getMaxActiveProjects(),
                        resourceQuota.getMaxTeamMembers(),
                        resourceQuota.getStorageLimitGb(),
                        resourceQuota.getApiRateLimitPerMinute()
                ),
                new AdminTenantDTOs.TenantBilling(
                        normalizeUpperOrDefault(billingProfile.getPlan(), normalizeUpperOrDefault(employer.getTier(), "STARTER")),
                        normalizeUpperOrDefault(billingProfile.getStatus(), "ACTIVE"),
                        normalizeUpperOrDefault(billingProfile.getModel(), "SUBSCRIPTION"),
                        firstNonBlank(billingProfile.getBillingEmail(), verificationStatus.getEmail()),
                        normalizeUpperOrDefault(billingProfile.getCurrency(), "USD"),
                        normalizeUpperOrDefault(billingProfile.getProvider(), employer.getPaymentMethod() != null ? employer.getPaymentMethod().getType() : "MANUAL"),
                        firstNonBlank(billingProfile.getAccountId(), employer.getPaymentMethod() != null ? employer.getPaymentMethod().getAccountId() : null),
                        billingProfile.getRenewalDate()
                ),
                new AdminTenantDTOs.TenantMigration(
                        normalizeUpperOrDefault(migrationStatus.getStatus(), "IDLE"),
                        migrationStatus.getTargetRegion(),
                        migrationStatus.getNote(),
                        migrationStatus.getRequestedAt(),
                        migrationStatus.getCompletedAt()
                ),
                new AdminTenantDTOs.TenantEnvironment(
                        normalizeUpperOrDefault(environment.getDeploymentMode(), "SHARED"),
                        environment.getNamespace(),
                        environment.getCluster(),
                        environment.getRegion(),
                        normalizeUpperOrDefault(environment.getInfrastructureProvider(), "KUBERNETES"),
                        normalizeUpperOrDefault(environment.getComputeProfile(), "GENERAL"),
                        normalizeUpperOrDefault(environment.getStorageProfile(), "STANDARD"),
                        environment.getNetworkSegment(),
                        normalizeUpperOrDefault(environment.getEnvironmentTemplate(), "STANDARD_V1"),
                        normalizeUpperOrDefault(environment.getStatus(), active ? "PROVISIONED" : "SUSPENDED"),
                        Boolean.TRUE.equals(environment.getAutoScalingEnabled()),
                        Boolean.TRUE.equals(environment.getSelfServiceOnboardingEnabled()),
                        environment.getProvisionedAt()
                ),
                new AdminTenantDTOs.TenantUsage(
                        defaultDouble(usageProfile.getCpuCoresUsed()),
                        defaultDouble(usageProfile.getMemoryGbUsed()),
                        defaultDouble(usageProfile.getStorageGbUsed()),
                        defaultLong(usageProfile.getApiRequestsCurrentPeriod()),
                        defaultDouble(usageProfile.getBandwidthMbpsUsed()),
                        normalizeUpperOrDefault(usageProfile.getAnomalyStatus(), "NORMAL"),
                        defaultDouble(usageProfile.getAnomalyScore()),
                        usageProfile.getLastCollectedAt()
                ),
                new AdminTenantDTOs.TenantResourceLimits(
                        defaultDouble(resourceLimits.getSoftCpuCores()),
                        defaultDouble(resourceLimits.getHardCpuCores()),
                        defaultDouble(resourceLimits.getSoftMemoryGb()),
                        defaultDouble(resourceLimits.getHardMemoryGb()),
                        defaultDouble(resourceLimits.getSoftStorageGb()),
                        defaultDouble(resourceLimits.getHardStorageGb()),
                        defaultDouble(resourceLimits.getSoftBandwidthMbps()),
                        defaultDouble(resourceLimits.getHardBandwidthMbps()),
                        Boolean.TRUE.equals(resourceLimits.getThrottlingEnabled()),
                        Boolean.TRUE.equals(resourceLimits.getAutoScaleEnabled())
                ),
                new AdminTenantDTOs.TenantPermissionProfile(
                        normalizeUpperOrDefault(permissionProfile.getAccessModel(), "RBAC"),
                        safeList(permissionProfile.getAdminRoles()),
                        safeList(permissionProfile.getPermissions()),
                        Boolean.TRUE.equals(permissionProfile.getIsolationEnforced())
                ),
                new AdminTenantDTOs.TenantIsolationProfile(
                        normalizeUpperOrDefault(isolationProfile.getDatabaseIsolationMode(), "SCHEMA"),
                        normalizeUpperOrDefault(isolationProfile.getNetworkPolicy(), "SEGMENTED"),
                        Boolean.TRUE.equals(isolationProfile.getEncryptionAtRest()),
                        Boolean.TRUE.equals(isolationProfile.getEncryptionInTransit()),
                        defaultInt(isolationProfile.getCrossTenantViolationCount(), 0),
                        normalizeUpperOrDefault(isolationProfile.getSecurityPolicy(), "STANDARD_SAAS_BASELINE")
                ),
                new AdminTenantDTOs.TenantSuspension(
                        normalizeUpperOrDefault(suspensionRecord.getStatus(), active ? "ACTIVE" : "SUSPENDED"),
                        suspensionRecord.getReason(),
                        suspensionRecord.getNote(),
                        suspensionRecord.getSuspendedAt(),
                        suspensionRecord.getResumedAt()
                ),
                owner != null ? owner.getCreatedAt() : null,
                employer.getUpdatedAt()
        );
    }

    private void refreshUsageInternal(Employer employer) {
        employer.setUsageProfile(calculateUsage(employer));
    }

    private Employer.UsageProfile calculateUsage(Employer employer) {
        Employer.UsageProfile usageProfile = ensureUsageProfile(employer);
        Employer.ResourceQuota resourceQuota = ensureResourceQuota(employer);
        Employer.ResourceLimits resourceLimits = ensureResourceLimits(employer);

        long totalProjects = defaultLong(projectRepository.countByEmployerId(employer.getId()));
        long openProjects = defaultLong(projectRepository.countOpenProjectsByEmployer(employer.getId()));
        long totalJobs = jobRepository.countByEmployerId(employer.getId());
        long activeContracts = defaultLong(contractRepository.countActiveContractsByEmployer(employer.getId()));

        double cpuUsed = defaultDouble(usageProfile.getCpuCoresUsed(), round(max(0.8, openProjects * 0.8 + activeContracts * 0.65), 1));
        double memoryUsed = defaultDouble(usageProfile.getMemoryGbUsed(), round(max(2.0, openProjects * 1.1 + activeContracts * 1.4), 1));
        double storageUsed = defaultDouble(usageProfile.getStorageGbUsed(), round(max(6.0, totalProjects * 2.4 + totalJobs * 0.7), 1));
        long apiRequests = defaultLong(usageProfile.getApiRequestsCurrentPeriod(), Math.max(250L, (openProjects + 1) * 320L + totalJobs * 48L + activeContracts * 90L));
        double bandwidthUsed = defaultDouble(usageProfile.getBandwidthMbpsUsed(), round(max(8.0, activeContracts * 4.8 + openProjects * 2.2), 1));

        double apiPressure = resourceQuota.getApiRateLimitPerMinute() != null && resourceQuota.getApiRateLimitPerMinute() > 0
                ? (double) apiRequests / (resourceQuota.getApiRateLimitPerMinute() * 100.0)
                : 0;
        double storagePressure = resourceQuota.getStorageLimitGb() != null && resourceQuota.getStorageLimitGb() > 0
                ? storageUsed / resourceQuota.getStorageLimitGb()
                : 0;
        double cpuPressure = resourceLimits.getHardCpuCores() != null && resourceLimits.getHardCpuCores() > 0
                ? cpuUsed / resourceLimits.getHardCpuCores()
                : 0;
        double memoryPressure = resourceLimits.getHardMemoryGb() != null && resourceLimits.getHardMemoryGb() > 0
                ? memoryUsed / resourceLimits.getHardMemoryGb()
                : 0;
        double bandwidthPressure = resourceLimits.getHardBandwidthMbps() != null && resourceLimits.getHardBandwidthMbps() > 0
                ? bandwidthUsed / resourceLimits.getHardBandwidthMbps()
                : 0;

        double anomalyScore = round(max(apiPressure, max(storagePressure, max(cpuPressure, max(memoryPressure, bandwidthPressure)))) * 100, 1);
        String anomalyStatus = anomalyScore >= 92 || "PAST_DUE".equals(ensureBillingProfile(employer, resolveOwnerOrNull(employer)).getStatus())
                ? "CRITICAL"
                : anomalyScore >= 75
                ? "WARNING"
                : "NORMAL";

        usageProfile.setCpuCoresUsed(cpuUsed);
        usageProfile.setMemoryGbUsed(memoryUsed);
        usageProfile.setStorageGbUsed(storageUsed);
        usageProfile.setApiRequestsCurrentPeriod(apiRequests);
        usageProfile.setBandwidthMbpsUsed(bandwidthUsed);
        usageProfile.setAnomalyScore(anomalyScore);
        usageProfile.setAnomalyStatus(anomalyStatus);
        usageProfile.setLastCollectedAt(LocalDateTime.now());
        employer.setUsageProfile(usageProfile);
        return usageProfile;
    }

    private User resolveOwner(Employer employer) {
        if (employer.getUserId() == null) {
            throw new IllegalArgumentException("Tenant owner is missing");
        }
        return userRepository.findById(employer.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant owner is missing"));
    }

    private User resolveOwnerOrNull(Employer employer) {
        if (employer.getUserId() == null) {
            return null;
        }
        return userRepository.findById(employer.getUserId()).orElse(null);
    }

    private Employer.CompanyProfile ensureCompanyProfile(Employer employer) {
        if (employer.getCompanyProfile() == null) {
            employer.setCompanyProfile(new Employer.CompanyProfile());
        }
        return employer.getCompanyProfile();
    }

    private Employer.VerificationStatus ensureVerificationStatus(Employer employer, User owner) {
        if (employer.getVerificationStatus() == null) {
            employer.setVerificationStatus(new Employer.VerificationStatus());
        }
        if ((employer.getVerificationStatus().getEmail() == null || employer.getVerificationStatus().getEmail().isBlank()) && owner != null) {
            employer.getVerificationStatus().setEmail(owner.getEmail());
        }
        return employer.getVerificationStatus();
    }

    private Employer.KYCVerification ensureKycVerification(Employer employer) {
        if (employer.getKycVerification() == null) {
            employer.setKycVerification(Employer.KYCVerification.builder().status("PENDING").build());
        }
        if (employer.getKycVerification().getStatus() == null || employer.getKycVerification().getStatus().isBlank()) {
            employer.getKycVerification().setStatus("PENDING");
        }
        return employer.getKycVerification();
    }

    private Employer.ResourceQuota ensureResourceQuota(Employer employer) {
        if (employer.getResourceQuota() == null) {
            employer.setResourceQuota(Employer.ResourceQuota.builder()
                    .maxActiveProjects(10)
                    .maxTeamMembers(25)
                    .storageLimitGb(100)
                    .apiRateLimitPerMinute(120)
                    .build());
        }
        return employer.getResourceQuota();
    }

    private Employer.BillingProfile ensureBillingProfile(Employer employer, User owner) {
        if (employer.getBillingProfile() == null) {
            employer.setBillingProfile(Employer.BillingProfile.builder()
                    .plan(normalizeUpperOrDefault(employer.getTier(), "STARTER"))
                    .status("ACTIVE")
                    .model("SUBSCRIPTION")
                    .billingEmail(owner != null ? owner.getEmail() : null)
                    .currency(employer.getPaymentMethod() != null && employer.getPaymentMethod().getCurrency() != null
                            ? employer.getPaymentMethod().getCurrency()
                            : "USD")
                    .provider(employer.getPaymentMethod() != null && employer.getPaymentMethod().getType() != null
                            ? employer.getPaymentMethod().getType()
                            : "MANUAL")
                    .accountId(employer.getPaymentMethod() != null ? employer.getPaymentMethod().getAccountId() : null)
                    .renewalDate(LocalDateTime.now().plusMonths(1))
                    .build());
        }
        if (employer.getBillingProfile().getModel() == null || employer.getBillingProfile().getModel().isBlank()) {
            employer.getBillingProfile().setModel("SUBSCRIPTION");
        }
        return employer.getBillingProfile();
    }

    private Employer.MigrationStatus ensureMigrationStatus(Employer employer) {
        if (employer.getMigrationStatus() == null) {
            employer.setMigrationStatus(Employer.MigrationStatus.builder().status("IDLE").build());
        }
        return employer.getMigrationStatus();
    }

    private Employer.TenantEnvironment ensureEnvironment(Employer employer) {
        if (employer.getTenantEnvironment() == null) {
            String companyName = employer.getCompanyProfile() != null ? employer.getCompanyProfile().getCompanyName() : "tenant";
            employer.setTenantEnvironment(defaultEnvironment(companyName, normalizeUpperOrDefault(employer.getTier(), "STARTER"), employer.getId()));
        }
        return employer.getTenantEnvironment();
    }

    private Employer.UsageProfile ensureUsageProfile(Employer employer) {
        if (employer.getUsageProfile() == null) {
            employer.setUsageProfile(Employer.UsageProfile.builder()
                    .cpuCoresUsed(0.8)
                    .memoryGbUsed(2.0)
                    .storageGbUsed(5.0)
                    .apiRequestsCurrentPeriod(250L)
                    .bandwidthMbpsUsed(8.0)
                    .anomalyStatus("NORMAL")
                    .anomalyScore(0.0)
                    .lastCollectedAt(LocalDateTime.now())
                    .build());
        }
        return employer.getUsageProfile();
    }

    private Employer.ResourceLimits ensureResourceLimits(Employer employer) {
        if (employer.getResourceLimits() == null) {
            employer.setResourceLimits(defaultResourceLimits(normalizeUpperOrDefault(employer.getTier(), "STARTER")));
        }
        return employer.getResourceLimits();
    }

    private Employer.PermissionProfile ensurePermissionProfile(Employer employer) {
        if (employer.getPermissionProfile() == null) {
            employer.setPermissionProfile(defaultPermissionProfile());
        }
        if (employer.getPermissionProfile().getAdminRoles() == null) {
            employer.getPermissionProfile().setAdminRoles(List.of("TENANT_ADMIN"));
        }
        if (employer.getPermissionProfile().getPermissions() == null) {
            employer.getPermissionProfile().setPermissions(List.of("tenant.users.read", "tenant.settings.manage", "tenant.billing.read"));
        }
        return employer.getPermissionProfile();
    }

    private Employer.IsolationProfile ensureIsolationProfile(Employer employer) {
        if (employer.getIsolationProfile() == null) {
            employer.setIsolationProfile(defaultIsolationProfile());
        }
        return employer.getIsolationProfile();
    }

    private Employer.SuspensionRecord ensureSuspensionRecord(Employer employer) {
        if (employer.getSuspensionRecord() == null) {
            employer.setSuspensionRecord(activeSuspensionRecord());
        }
        if (employer.getSuspensionRecord().getStatus() == null || employer.getSuspensionRecord().getStatus().isBlank()) {
            employer.getSuspensionRecord().setStatus(Boolean.TRUE.equals(employer.getIsActive()) ? "ACTIVE" : "SUSPENDED");
        }
        return employer.getSuspensionRecord();
    }

    private Employer.EmployerStats ensureStats(Employer employer) {
        if (employer.getStats() == null) {
            employer.setStats(defaultStats());
        }
        if (employer.getStats().getTotalSpent() == null) {
            employer.getStats().setTotalSpent(0.0);
        }
        return employer.getStats();
    }

    private Employer.EmployerStats defaultStats() {
        return Employer.EmployerStats.builder()
                .totalProjectsPosted(0)
                .activeProjects(0)
                .completedProjects(0)
                .totalSpent(0.0)
                .averagePaymentReleaseTime(0.0)
                .ratingScore(0.0)
                .ratingCount(0)
                .totalHired(0)
                .repeatHireRate(0)
                .build();
    }

    private Employer.TenantEnvironment defaultEnvironment(String companyName, String tier, String employerId) {
        String seed = firstNonBlank(companyName, employerId, "tenant").toLowerCase().replaceAll("[^a-z0-9]+", "-");
        String namespace = seed.replaceAll("^-+|-+$", "");
        if (namespace.isBlank()) {
            namespace = "tenant";
        }
        return Employer.TenantEnvironment.builder()
                .deploymentMode("ENTERPRISE".equals(tier) ? "DEDICATED" : "SHARED")
                .namespace(namespace)
                .cluster("shared-cluster-01")
                .region("primary-cluster-us")
                .infrastructureProvider("KUBERNETES")
                .computeProfile("ENTERPRISE".equals(tier) ? "HIGH_CPU" : "GENERAL")
                .storageProfile("STANDARD")
                .networkSegment("segment-" + namespace)
                .environmentTemplate("STANDARD_V1")
                .status("PROVISIONED")
                .autoScalingEnabled("ENTERPRISE".equals(tier))
                .selfServiceOnboardingEnabled(true)
                .provisionedAt(LocalDateTime.now())
                .build();
    }

    private Employer.ResourceLimits defaultResourceLimits(String tier) {
        if ("ENTERPRISE".equals(tier)) {
            return Employer.ResourceLimits.builder()
                    .softCpuCores(12.0)
                    .hardCpuCores(16.0)
                    .softMemoryGb(24.0)
                    .hardMemoryGb(32.0)
                    .softStorageGb(400.0)
                    .hardStorageGb(600.0)
                    .softBandwidthMbps(180.0)
                    .hardBandwidthMbps(240.0)
                    .throttlingEnabled(true)
                    .autoScaleEnabled(true)
                    .build();
        }
        if ("PROFESSIONAL".equals(tier)) {
            return Employer.ResourceLimits.builder()
                    .softCpuCores(6.0)
                    .hardCpuCores(8.0)
                    .softMemoryGb(12.0)
                    .hardMemoryGb(16.0)
                    .softStorageGb(180.0)
                    .hardStorageGb(240.0)
                    .softBandwidthMbps(80.0)
                    .hardBandwidthMbps(120.0)
                    .throttlingEnabled(true)
                    .autoScaleEnabled(false)
                    .build();
        }
        return Employer.ResourceLimits.builder()
                .softCpuCores(3.0)
                .hardCpuCores(4.0)
                .softMemoryGb(6.0)
                .hardMemoryGb(8.0)
                .softStorageGb(90.0)
                .hardStorageGb(120.0)
                .softBandwidthMbps(40.0)
                .hardBandwidthMbps(60.0)
                .throttlingEnabled(true)
                .autoScaleEnabled(false)
                .build();
    }

    private Employer.PermissionProfile defaultPermissionProfile() {
        return Employer.PermissionProfile.builder()
                .accessModel("RBAC")
                .adminRoles(List.of("TENANT_ADMIN"))
                .permissions(List.of("tenant.users.read", "tenant.users.write", "tenant.settings.manage", "tenant.billing.read"))
                .isolationEnforced(true)
                .build();
    }

    private Employer.IsolationProfile defaultIsolationProfile() {
        return Employer.IsolationProfile.builder()
                .databaseIsolationMode("SCHEMA")
                .networkPolicy("SEGMENTED")
                .encryptionAtRest(true)
                .encryptionInTransit(true)
                .crossTenantViolationCount(0)
                .securityPolicy("STANDARD_SAAS_BASELINE")
                .build();
    }

    private Employer.SuspensionRecord activeSuspensionRecord() {
        return Employer.SuspensionRecord.builder()
                .status("ACTIVE")
                .build();
    }

    private Map<String, Object> tenantMetadata(User actor, User owner, String companyName, Map<String, Object> extras) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("actorUserId", actor.getId());
        metadata.put("ownerUserId", owner.getId());
        metadata.put("companyName", companyName);
        metadata.putAll(extras);
        return metadata;
    }

    private String sortKey(Employer employer) {
        Employer.CompanyProfile companyProfile = employer.getCompanyProfile();
        String name = companyProfile != null ? companyProfile.getCompanyName() : null;
        return firstNonBlank(name, employer.getId(), "").toLowerCase();
    }

    private String requireNonBlank(String value, String message) {
        String normalized = normalizeOptionalString(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptionalString(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeUpperOrDefault(String value, String fallback) {
        String normalized = normalizeOptionalString(value);
        return normalized != null ? normalized.toUpperCase() : fallback;
    }

    private List<String> normalizeStringList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .map(this::normalizeOptionalString)
                .filter(Objects::nonNull)
                .map(String::toUpperCase)
                .distinct()
                .toList();
    }

    private int defaultInt(Integer value, int fallback) {
        return value != null ? value : fallback;
    }

    private long defaultLong(Long value) {
        return value != null ? value : 0L;
    }

    private long defaultLong(Long value, long fallback) {
        return value != null ? value : fallback;
    }

    private double defaultDouble(Double value) {
        return value != null ? value : 0.0;
    }

    private double defaultDouble(Double value, double fallback) {
        return value != null ? value : fallback;
    }

    private double max(double left, double right) {
        return Math.max(left, right);
    }

    private double round(double value, int places) {
        double factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<String> safeList(List<String> values) {
        return values == null ? List.of() : values.stream().filter(Objects::nonNull).toList();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
