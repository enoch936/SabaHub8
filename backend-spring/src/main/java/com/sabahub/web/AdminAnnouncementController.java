package com.sabahub.web;

import com.sabahub.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/announcements")
public class AdminAnnouncementController {

    private final CurrentUserService currentUserService;
    private final SimpMessagingTemplate messagingTemplate;

    public AdminAnnouncementController(CurrentUserService currentUserService, SimpMessagingTemplate messagingTemplate) {
        this.currentUserService = currentUserService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> broadcast(@RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
        String message = String.valueOf(body.getOrDefault("message", ""));
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message_required"));
        }
        var payload = Map.of(
                "type", "ANNOUNCEMENT",
                "message", message,
                "at", Instant.now().toString(),
                "by", me.getEmail()
        );
        // Broadcast to a global topic
        messagingTemplate.convertAndSend("/topic/announcements", payload);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
