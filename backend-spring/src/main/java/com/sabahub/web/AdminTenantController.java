package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.service.AdminTenantManagementService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.web.dto.admin.AdminTenantDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/tenants")
@RequiredArgsConstructor
public class AdminTenantController {

    private final AdminTenantManagementService adminTenantManagementService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<AdminTenantDTOs.TenantListResponse> list() {
        requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.listTenants());
    }

    @GetMapping("/workspace")
    public ResponseEntity<AdminTenantDTOs.TenantWorkspaceResponse> workspace() {
        requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.workspace());
    }

    @PostMapping
    public ResponseEntity<AdminTenantDTOs.TenantSummary> create(@RequestBody AdminTenantDTOs.CreateTenantRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.status(HttpStatus.CREATED).body(adminTenantManagementService.createTenant(request, actor));
    }

    @PatchMapping("/{tenantId}")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> patch(@PathVariable String tenantId,
                                                               @RequestBody AdminTenantDTOs.UpdateTenantRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.updateTenant(tenantId, request, actor));
    }

    @PostMapping("/{tenantId}/migrate")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> migrate(@PathVariable String tenantId,
                                                                 @RequestBody AdminTenantDTOs.TenantMigrationRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.migrateTenant(tenantId, request, actor));
    }

    @DeleteMapping("/{tenantId}")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> delete(@PathVariable String tenantId) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.deleteTenant(tenantId, actor));
    }

    @PostMapping("/{tenantId}/environment")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> provisionEnvironment(@PathVariable String tenantId,
                                                                              @RequestBody AdminTenantDTOs.ProvisionEnvironmentRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.provisionEnvironment(tenantId, request, actor));
    }

    @PostMapping("/{tenantId}/limits")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> configureLimits(@PathVariable String tenantId,
                                                                         @RequestBody AdminTenantDTOs.ResourceLimitRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.configureResourceLimits(tenantId, request, actor));
    }

    @PostMapping("/{tenantId}/permissions")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> updatePermissions(@PathVariable String tenantId,
                                                                           @RequestBody AdminTenantDTOs.PermissionProfileRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.updatePermissionProfile(tenantId, request, actor));
    }

    @PostMapping("/{tenantId}/isolation")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> updateIsolation(@PathVariable String tenantId,
                                                                         @RequestBody AdminTenantDTOs.TenantIsolationRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.updateIsolationProfile(tenantId, request, actor));
    }

    @PostMapping("/{tenantId}/lifecycle")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> changeLifecycle(@PathVariable String tenantId,
                                                                         @RequestBody AdminTenantDTOs.TenantLifecycleRequest request) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.changeLifecycle(tenantId, request, actor));
    }

    @PostMapping("/{tenantId}/usage-refresh")
    public ResponseEntity<AdminTenantDTOs.TenantSummary> refreshUsage(@PathVariable String tenantId) {
        User actor = requireAdmin();
        return ResponseEntity.ok(adminTenantManagementService.refreshUsage(tenantId, actor));
    }

    private User requireAdmin() {
        User me;
        try {
            me = currentUserService.requireUser();
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        return me;
    }
}
