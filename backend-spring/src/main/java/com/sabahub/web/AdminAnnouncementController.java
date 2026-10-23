package com.sabahub.web;

import com.sabahub.domain.ContentItem;
import com.sabahub.repository.ContentRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/announcements")
public class AdminAnnouncementController {

    private final CurrentUserService currentUserService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ContentRepository contentRepository;

    public AdminAnnouncementController(CurrentUserService currentUserService,
                                       SimpMessagingTemplate messagingTemplate,
                                       ContentRepository contentRepository) {
        this.currentUserService = currentUserService;
        this.messagingTemplate = messagingTemplate;
        this.contentRepository = contentRepository;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list() {
        currentUserService.requireUser();
        List<ContentItem> announcements = contentRepository.findByType(ContentItem.Type.ANNOUNCEMENT);
        List<Map<String, Object>> result = announcements.stream()
                .sorted(Comparator.comparing(ContentItem::getCreatedAt).reversed())
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "title", a.getTitle() != null ? a.getTitle() : "",
                        "message", a.getBody() != null ? a.getBody() : "",
                        "sentBy", "Admin",
                        "sentAt", a.getCreatedAt() != null ? a.getCreatedAt().toString() : Instant.now().toString(),
                        "recipients", "All Users",
                        "status", "DELIVERED"
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> broadcast(@RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        String message = String.valueOf(body.getOrDefault("message", ""));
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message_required"));
        }

        ContentItem item = new ContentItem();
        item.setType(ContentItem.Type.ANNOUNCEMENT);
        item.setTitle(body.containsKey("title") ? String.valueOf(body.get("title")) : "System Announcement");
        item.setBody(message);
        item.setStatus(ContentItem.Status.PUBLISHED);
        contentRepository.save(item);

        var payload = Map.of(
                "type", "ANNOUNCEMENT",
                "id", item.getId(),
                "message", message,
                "at", item.getCreatedAt() != null ? item.getCreatedAt().toString() : Instant.now().toString(),
                "by", me.getEmail()
        );
        messagingTemplate.convertAndSend("/topic/announcements", payload);
        return ResponseEntity.ok(Map.of("ok", true, "id", item.getId()));
    }
}
