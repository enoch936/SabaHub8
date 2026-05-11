package com.sabahub.web;

import com.sabahub.domain.AuditLog;
import com.sabahub.service.CurrentUserService;
import com.sabahub.repository.AuditLogRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserService currentUserService;

    public AdminAuditLogController(AuditLogRepository auditLogRepository,
                                   CurrentUserService currentUserService) {
        this.auditLogRepository = auditLogRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> list(
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "actorUserId", required = false) String actorUserId,
            @RequestParam(name = "entityType", required = false) String entityType,
            @RequestParam(name = "limit", defaultValue = "200") int limit) {
        requireAuditAdmin();

        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedActor = actorUserId == null ? "" : actorUserId.trim();
        String normalizedEntity = entityType == null ? "" : entityType.trim().toLowerCase(Locale.ROOT);
        int cappedLimit = Math.max(1, Math.min(limit, 1000));

        List<AuditLog> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(log -> normalizedActor.isBlank() || normalizedActor.equals(log.getActorUserId()))
                .filter(log -> normalizedEntity.isBlank() || containsIgnoreCase(log.getEntityType(), normalizedEntity))
                .filter(log -> normalizedQuery.isBlank() || matchesQuery(log, normalizedQuery))
                .limit(cappedLimit)
                .toList();

        return ResponseEntity.ok(logs);
    }

    private boolean matchesQuery(AuditLog log, String query) {
        return containsIgnoreCase(log.getAction(), query)
                || containsIgnoreCase(log.getEntityType(), query)
                || containsIgnoreCase(log.getEntityId(), query)
                || containsIgnoreCase(log.getActorUserId(), query)
                || containsIgnoreCase(log.getIp(), query)
                || (log.getMetadata() != null && log.getMetadata().toString().toLowerCase(Locale.ROOT).contains(query));
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private void requireAuditAdmin() {
        var me = currentUserService.requireUser();
        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN");
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }
    }
}
