package com.sabahub.web;

import com.sabahub.domain.ChatMessage;
import com.sabahub.domain.ChatThread;
import com.sabahub.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/threads")
    public ResponseEntity<List<ChatThread>> listThreads() {
        try {
            return ResponseEntity.ok(chatService.listMyThreads());
        } catch (IllegalStateException e) {
            // Return empty list for unauthenticated users (development mode)
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @PostMapping("/threads")
    public ResponseEntity<ChatThread> createThread(@RequestBody Map<String, Object> body) {
        Object ids = body.get("participantIds");
        if (!(ids instanceof List<?> list)) {
            throw new IllegalArgumentException("participantIds must be a list");
        }
        @SuppressWarnings("unchecked")
        List<String> participantIds = (List<String>) list;
        return ResponseEntity.ok(chatService.createThread(participantIds));
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

    @PostMapping("/threads/{id}/messages")
    public ResponseEntity<ChatMessage> sendMessage(@PathVariable String id, @RequestBody ChatMessage message) {
        return ResponseEntity.ok(chatService.sendMessage(id, message));
    }
}
