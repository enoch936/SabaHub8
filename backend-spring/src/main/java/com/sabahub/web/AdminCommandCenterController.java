package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.service.AdminCommandCenterService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.web.dto.admin.AdminCommandCenterDTOs;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/command-center")
public class AdminCommandCenterController {

    private final AdminCommandCenterService adminCommandCenterService;
    private final CurrentUserService currentUserService;

    public AdminCommandCenterController(AdminCommandCenterService adminCommandCenterService,
                                        CurrentUserService currentUserService) {
        this.adminCommandCenterService = adminCommandCenterService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminCommandCenterDTOs.OverviewResponse> overview() {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.getOverview());
    }

    @GetMapping("/domains")
    public ResponseEntity<List<AdminCommandCenterDTOs.ResponsibilityDomain>> domains() {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.listDomains());
    }

    @GetMapping("/domains/{domainId}")
    public ResponseEntity<AdminCommandCenterDTOs.DomainResponse> domain(@PathVariable String domainId) {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.getDomain(domainId));
    }

    @GetMapping("/core/platform-control")
    public ResponseEntity<AdminCommandCenterDTOs.PlatformControlResponse> platformControl() {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.getPlatformControl());
    }

    @GetMapping("/core/security-governance")
    public ResponseEntity<AdminCommandCenterDTOs.SecurityGovernanceResponse> securityGovernance() {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.getSecurityGovernance());
    }

    @GetMapping("/sections/{parentKey}/{sectionKey}")
    public ResponseEntity<AdminCommandCenterDTOs.SectionInsightResponse> sectionInsight(
            @PathVariable String parentKey,
            @PathVariable String sectionKey) {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.getSectionInsight(parentKey, sectionKey));
    }

    @GetMapping("/feature-flags")
    public ResponseEntity<List<AdminCommandCenterDTOs.FeatureFlag>> featureFlags() {
        requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.listFeatureFlags());
    }

    @PatchMapping("/feature-flags/{key}")
    public ResponseEntity<AdminCommandCenterDTOs.FeatureFlag> updateFeatureFlag(
            @PathVariable String key,
            @RequestBody(required = false) AdminCommandCenterDTOs.FeatureFlagUpdateRequest request) {
        User admin = requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.updateFeatureFlag(key, request, admin));
    }

    @PostMapping("/domains/{domainId}/operations/{operationId}")
    public ResponseEntity<AdminCommandCenterDTOs.RunbookOperation> executeOperation(
            @PathVariable String domainId,
            @PathVariable String operationId,
            @RequestBody(required = false) AdminCommandCenterDTOs.ExecuteOperationRequest request) {
        User admin = requireAdmin();
        return ResponseEntity.ok(adminCommandCenterService.executeOperation(domainId, operationId, request, admin));
    }

    private User requireAdmin() {
        User me;
        try {
            me = currentUserService.requireUser();
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required", ex);
        }
        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN")
                || currentUserService.hasRole(me, "SUPPORT_ADMIN")
                || currentUserService.hasRole(me, "FINANCE_ADMIN");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }
        return me;
    }
}
