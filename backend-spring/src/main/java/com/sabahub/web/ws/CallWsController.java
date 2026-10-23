package com.sabahub.web.ws;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

@Controller
public class CallWsController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    public CallWsController(SimpMessagingTemplate messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    @MessageMapping("/calls/signal")
    public void handleSignal(@Payload Map<String, Object> payload, Principal principal) {
        String targetUserId = (String) payload.get("targetUserId");
        if (targetUserId == null) return;
        
        // Find target user to get their email (which is the principal name in WS)
        User targetUser = userRepository.findById(targetUserId).orElse(null);
        if (targetUser == null) return;
        
        // Enrich payload with sender info (use ID instead of email for frontend consistency)
        User sender = userRepository.findByEmail(principal.getName()).orElse(null);
        if (sender != null) {
            payload.put("fromUserId", sender.getId());
            payload.put("fromUserName", sender.getFullName());
        }
        
        messagingTemplate.convertAndSendToUser(targetUser.getEmail(), "/queue/calls", payload);
    }
}
