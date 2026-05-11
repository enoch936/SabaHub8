package com.sabahub.service;

import com.sabahub.domain.User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AIModelOpsService {
    private final CurrentUserService currentUserService;
    private final PythonAiBridgeService pythonAiBridgeService;

    public AIModelOpsService(CurrentUserService currentUserService,
                             PythonAiBridgeService pythonAiBridgeService) {
        this.currentUserService = currentUserService;
        this.pythonAiBridgeService = pythonAiBridgeService;
    }

    public Map<String, Object> trainModel(boolean activate) {
        User admin = requireAdmin();
        Map<String, Object> response = pythonAiBridgeService.triggerTraining(activate)
                .orElseGet(() -> fallback("Python AI training endpoint unavailable"));
        response.putIfAbsent("requestedBy", admin.getEmail());
        response.putIfAbsent("requestedAt", Instant.now().toString());
        return response;
    }

    public Map<String, Object> listModelVersions() {
        requireAdmin();
        return pythonAiBridgeService.listModelVersions()
                .orElseGet(() -> fallback("Python AI model registry endpoint unavailable"));
    }

    public Map<String, Object> activateModelVersion(String version) {
        User admin = requireAdmin();
        Map<String, Object> response = pythonAiBridgeService.activateModelVersion(version)
                .orElseGet(() -> fallback("Python AI activate endpoint unavailable"));
        response.putIfAbsent("requestedBy", admin.getEmail());
        return response;
    }

    public Map<String, Object> rollbackModelVersion(int steps) {
        User admin = requireAdmin();
        Map<String, Object> response = pythonAiBridgeService.rollbackModelVersion(steps)
                .orElseGet(() -> fallback("Python AI rollback endpoint unavailable"));
        response.putIfAbsent("requestedBy", admin.getEmail());
        return response;
    }

    public Map<String, Object> reloadModels() {
        requireAdmin();
        return pythonAiBridgeService.reloadModels()
                .orElseGet(() -> fallback("Python AI reload endpoint unavailable"));
    }

    public Map<String, Object> trainModelByScheduler(boolean activate, String trigger) {
        Map<String, Object> response = pythonAiBridgeService.triggerTraining(activate)
                .orElseGet(() -> fallback("Python AI training endpoint unavailable"));
        response.putIfAbsent("trigger", trigger);
        response.putIfAbsent("requestedAt", Instant.now().toString());
        return response;
    }

    private User requireAdmin() {
        User user = currentUserService.requireUser();
        boolean allowed = currentUserService.hasRole(user, "ADMIN")
                || currentUserService.hasRole(user, "SUPER_ADMIN");
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }
        return user;
    }

    private Map<String, Object> fallback(String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ok", false);
        map.put("message", message);
        return map;
    }
}
