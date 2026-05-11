package com.sabahub.service;

import com.sabahub.domain.AuditLog;
import com.sabahub.domain.User;
import com.sabahub.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
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

        Map<String, Object> resolvedMetadata = new HashMap<>();
        if (metadata != null) {
            resolvedMetadata.putAll(metadata);
        }
        resolvedMetadata.putIfAbsent("location", resolveLocation());
        resolvedMetadata.putIfAbsent("timezone", normalizeOptional(request.getHeader("X-Timezone")));
        resolvedMetadata.putIfAbsent("device", detectDevice(request.getHeader("User-Agent")));

        AuditLog audit = new AuditLog();
        audit.setActorUserId(me == null ? null : me.getId());
        audit.setAction(action);
        audit.setEntityType(entityType);
        audit.setEntityId(entityId);
        audit.setIp(extractClientIp());
        audit.setUserAgent(request.getHeader("User-Agent"));
        audit.setMetadata(resolvedMetadata);
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

    private String resolveLocation() {
        String cloudFrontCity = request.getHeader("CloudFront-Viewer-City");
        String cloudFrontCountry = request.getHeader("CloudFront-Viewer-Country-Name");
        String cloudFrontLocation = joinLocation(cloudFrontCity, cloudFrontCountry);

        return normalizeOptional(firstNonBlank(
                request.getHeader("X-Session-Location"),
                request.getHeader("X-Location"),
                cloudFrontLocation,
                request.getHeader("X-Timezone"),
                request.getHeader("CF-IPCountry")
        ));
    }

    private String joinLocation(String city, String country) {
        String normalizedCity = normalizeOptional(city);
        String normalizedCountry = normalizeOptional(country);
        if (normalizedCity == null && normalizedCountry == null) {
            return null;
        }
        if (normalizedCity == null) {
            return normalizedCountry;
        }
        if (normalizedCountry == null) {
            return normalizedCity;
        }
        return normalizedCity + ", " + normalizedCountry;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            String normalized = normalizeOptional(value);
            if (normalized != null) {
                return normalized;
            }
        }
        return null;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized.replace("_", " ").replace("/", " / ");
    }

    private String detectDevice(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown device";
        }

        String ua = userAgent.toLowerCase();
        String platform;
        if (ua.contains("android")) {
            platform = "Android";
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            platform = "iOS";
        } else if (ua.contains("windows")) {
            platform = "Windows";
        } else if (ua.contains("mac os") || ua.contains("macintosh")) {
            platform = "macOS";
        } else if (ua.contains("linux")) {
            platform = "Linux";
        } else {
            platform = "Unknown OS";
        }

        String browser;
        if (ua.contains("edg/")) {
            browser = "Edge";
        } else if (ua.contains("chrome/")) {
            browser = "Chrome";
        } else if (ua.contains("safari/") && !ua.contains("chrome/")) {
            browser = "Safari";
        } else if (ua.contains("firefox/")) {
            browser = "Firefox";
        } else {
            browser = "Browser";
        }

        return platform + " · " + browser;
    }
}
