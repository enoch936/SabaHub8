package com.sabahub.web.ws;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ReelsWsController {

    private final SimpMessagingTemplate messagingTemplate;

    public ReelsWsController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/reels.like")
    public void handleLike(@Payload Map<String, Object> payload) {
        String reelId = (String) payload.get("reelId");
        String userId = (String) payload.get("userId");
        messagingTemplate.convertAndSend("/topic/reels/" + reelId + "/likes", payload);
    }

    @MessageMapping("/reels.comment")
    public void handleComment(@Payload Map<String, Object> payload) {
        String reelId = (String) payload.get("reelId");
        messagingTemplate.convertAndSend("/topic/reels/" + reelId + "/comments", payload);
    }
}
