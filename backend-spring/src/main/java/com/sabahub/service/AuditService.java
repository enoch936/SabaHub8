package com.sabahub.service;

import com.sabahub.domain.AuditLog;
import com.sabahub.domain.User;
import com.sabahub.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserService currentUserService;
    private final HttpServletRequest request;

    public AuditService(AuditLogRepository auditLogRepository,
                        CurrentUserService currentUserService,
                        HttpServletRequest request) {
        this.auditLogRepository = auditLogRepository;
        this.currentUserService = currentUserService;
        this.request = request;
    }

    public void log(String action, String entityType, String entityId, Map<String, Object> metadata) {
        User me;
        try {
            me = currentUserService.requireUser();
        } catch (Exception e) {
            me = null;
        }

        AuditLog audit = new AuditLog();
        audit.setActorUserId(me == null ? null : me.getId());
        audit.setAction(action);
        audit.setEntityType(entityType);
        audit.setEntityId(entityId);
        audit.setIp(extractClientIp());
        audit.setUserAgent(request.getHeader("User-Agent"));
        audit.setMetadata(metadata);
        auditLogRepository.save(audit);
    }
    
    public void logAction(String userId, String action, String entityId) {
        log(action, null, entityId, Map.of("userId", userId));
    }

    private String extractClientIp() {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
