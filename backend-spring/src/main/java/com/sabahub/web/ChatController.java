package com.sabahub.web;

import com.sabahub.domain.ChatMessage;
import com.sabahub.service.ChatService;
import com.sabahub.web.dto.ChatThreadSummaryDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/threads")
    public ResponseEntity<List<ChatThreadSummaryDTO>> listThreads() {
        try {
            return ResponseEntity.ok(chatService.listMyThreads());
        } catch (IllegalStateException e) {
            // Return empty list for unauthenticated users (development mode)
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @PostMapping("/threads")
    public ResponseEntity<ChatThreadSummaryDTO> createThread(@RequestBody Map<String, Object> body) {
        Object ids = body.get("participantIds");
        if (ids != null && !(ids instanceof List<?>)) {
            throw new IllegalArgumentException("participantIds must be a list");
        }
        List<String> participantIds = ids instanceof List<?> list
                ? list.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .toList()
                : List.of();
        String threadType = body.get("threadType") instanceof String value ? value : null;
        String groupName = body.get("groupName") instanceof String value ? value : null;
        String channelDescription = body.get("channelDescription") instanceof String value ? value : null;
        Boolean memberMessagingEnabled = null;
        Object memberMessagingEnabledRaw = body.get("memberMessagingEnabled");
        if (memberMessagingEnabledRaw instanceof Boolean value) {
            memberMessagingEnabled = value;
        } else {
            Object allowMemberMessagesRaw = body.get("allowMemberMessages");
            if (allowMemberMessagesRaw instanceof Boolean value) {
                memberMessagingEnabled = value;
            }
        }
        return ResponseEntity.ok(chatService.createThread(
                participantIds,
                threadType,
                groupName,
                channelDescription,
                memberMessagingEnabled
        ));
    }

    @GetMapping("/threads/{id}/messages")
    public ResponseEntity<List<ChatMessage>> listMessages(@PathVariable String id) {
        try {
            return ResponseEntity.ok(chatService.listMessages(id));
        } catch (IllegalStateException e) {
            // Return empty list for unauthenticated users (development mode)
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @PostMapping("/threads/{id}/read")
    public ResponseEntity<ChatThreadSummaryDTO> markThreadRead(@PathVariable String id) {
        return ResponseEntity.ok(chatService.markThreadRead(id));
    }

    @PatchMapping("/threads/{id}")
    public ResponseEntity<ChatThreadSummaryDTO> updateThread(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String groupName = body.get("groupName") instanceof String value ? value : null;
        String channelDescription = body.get("channelDescription") instanceof String value ? value : null;
        Boolean memberMessagingEnabled = body.get("memberMessagingEnabled") instanceof Boolean value ? value : null;
        return ResponseEntity.ok(chatService.updateThread(id, groupName, channelDescription, memberMessagingEnabled));
    }

    @PostMapping("/threads/{id}/participants")
    public ResponseEntity<ChatThreadSummaryDTO> addParticipants(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Object ids = body.get("participantIds");
        if (ids != null && !(ids instanceof List<?>)) {
            throw new IllegalArgumentException("participantIds must be a list");
        }
        List<String> participantIds = ids instanceof List<?> list
                ? list.stream().filter(String.class::isInstance).map(String.class::cast).toList()
                : List.of();
        return ResponseEntity.ok(chatService.addParticipants(id, participantIds));
    }

    @DeleteMapping("/threads/{id}/participants/{participantId}")
    public ResponseEntity<ChatThreadSummaryDTO> removeParticipant(@PathVariable String id, @PathVariable String participantId) {
        return ResponseEntity.ok(chatService.removeParticipant(id, participantId));
    }

    @PatchMapping("/threads/{id}/preferences")
    public ResponseEntity<ChatThreadSummaryDTO> updateThreadPreferences(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Boolean pinned = body.get("pinned") instanceof Boolean value ? value : null;
        Boolean muted = body.get("muted") instanceof Boolean value ? value : null;
        Boolean archived = body.get("archived") instanceof Boolean value ? value : null;
        return ResponseEntity.ok(chatService.updateThreadPreferences(id, pinned, muted, archived));
    }

    @PostMapping("/threads/{id}/pin/{messageId}")
    public ResponseEntity<ChatThreadSummaryDTO> pinMessage(@PathVariable String id, @PathVariable String messageId) {
        return ResponseEntity.ok(chatService.pinMessage(id, messageId));
    }

    @DeleteMapping("/threads/{id}/pin")
    public ResponseEntity<ChatThreadSummaryDTO> clearPinnedMessage(@PathVariable String id) {
        return ResponseEntity.ok(chatService.clearPinnedMessage(id));
    }

    @PostMapping("/threads/{id}/messages")
    public ResponseEntity<ChatMessage> sendMessage(@PathVariable String id, @RequestBody ChatMessage message) {
        ChatMessage saved = chatService.sendMessage(id, message);
        messagingTemplate.convertAndSend("/topic/threads/" + saved.getThreadId() + "/message.new", saved);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/threads/{id}/messages/{messageId}")
    public ResponseEntity<ChatMessage> updateMessage(@PathVariable String id, @PathVariable String messageId, @RequestBody ChatMessage message) {
        ChatMessage saved = chatService.updateMessage(id, messageId, message);
        messagingTemplate.convertAndSend("/topic/threads/" + saved.getThreadId() + "/message.new", saved);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/threads/{id}/messages/{messageId}")
    public ResponseEntity<ChatMessage> deleteMessage(@PathVariable String id, @PathVariable String messageId, @RequestParam(name = "forEveryone", defaultValue = "true") boolean forEveryone) {
        ChatMessage saved = chatService.deleteMessage(id, messageId, forEveryone);
        messagingTemplate.convertAndSend("/topic/threads/" + saved.getThreadId() + "/message.new", saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/threads/{id}/messages/{messageId}/forward")
    public ResponseEntity<ChatMessage> forwardMessage(@PathVariable String id, @PathVariable String messageId) {
        ChatMessage saved = chatService.forwardMessage(id, messageId);
        messagingTemplate.convertAndSend("/topic/threads/" + saved.getThreadId() + "/message.new", saved);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/threads/{id}/messages/{messageId}/reactions")
    public ResponseEntity<ChatMessage> toggleReaction(@PathVariable String id, @PathVariable String messageId, @RequestBody Map<String, Object> body) {
        String emoji = body.get("emoji") instanceof String value ? value : null;
        ChatMessage saved = chatService.toggleReaction(id, messageId, emoji);
        messagingTemplate.convertAndSend("/topic/threads/" + saved.getThreadId() + "/message.new", saved);
        return ResponseEntity.ok(saved);
    }
}
