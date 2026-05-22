package com.sabahub.service;

import com.sabahub.dto.ActivityEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveActivityService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcasts a live activity event to all subscribers.
     * @param event The event to broadcast.
     */
    public void broadcast(ActivityEvent event) {
        if (event.getId() == null) {
            event.setId(UUID.randomUUID().toString());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(Instant.now());
        }
        
        log.info("Broadcasting activity event: {} - {}", event.getType(), event.getMessage());
        messagingTemplate.convertAndSend("/topic/live-activities", event);
    }

    /**
     * Helper method to quickly broadcast a simple activity.
     */
    public void broadcast(String type, String message, String userId, String username, String avatarUrl, String badge, Map<String, Object> metadata) {
        ActivityEvent event = ActivityEvent.builder()
                .type(type)
                .message(message)
                .userId(userId)
                .username(username)
                .avatarUrl(avatarUrl)
                .badge(badge)
                .metadata(metadata)
                .build();
        broadcast(event);
    }
}
