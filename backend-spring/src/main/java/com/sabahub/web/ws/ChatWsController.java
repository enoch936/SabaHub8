package com.sabahub.web.ws;

import com.sabahub.domain.ChatMessage;
import com.sabahub.service.ChatService;
import com.sabahub.web.dto.ChatTypingEventDTO;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ChatWsController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWsController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Client sends to: /app/threads/{threadId}/message.send
     * Server broadcasts to: /topic/threads/{threadId}/message.new
     */
    @MessageMapping("/threads/{threadId}/message.send")
    public void sendMessage(@DestinationVariable String threadId, @Payload ChatMessage message) {
        ChatMessage saved = chatService.sendMessage(threadId, message);
        messagingTemplate.convertAndSend("/topic/threads/" + threadId + "/message.new", saved);
    }

    @MessageMapping("/threads/{threadId}/typing")
    public void typing(@DestinationVariable String threadId, @Payload Map<String, Object> body) {
        boolean typing = body.get("typing") instanceof Boolean value && value;
        ChatTypingEventDTO event = chatService.buildTypingEvent(threadId, typing);
        messagingTemplate.convertAndSend("/topic/threads/" + threadId + "/typing", event);
    }
}
