package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.service.AdminAIAssistantService;
import com.sabahub.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AdminAIAssistantController {

    private final AdminAIAssistantService adminAIAssistantService;
    private final CurrentUserService currentUserService;

    @PostMapping("/command")
    public ResponseEntity<Map<String, Object>> executeCommand(@RequestBody Map<String, String> request) {
        requireAdmin();
        String command = request.get("command");
        if (command == null || command.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Command is required");
        }
        return ResponseEntity.ok(adminAIAssistantService.processCommand(command));
    }

    private void requireAdmin() {
        User me;
        try {
            me = currentUserService.requireUser();
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN")
                || currentUserService.hasRole(me, "SUPPORT_ADMIN");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }
}
