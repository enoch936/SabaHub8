package com.sabahub.service;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
public class ChatPresenceEventListener {

    private final ChatPresenceService chatPresenceService;

    public ChatPresenceEventListener(ChatPresenceService chatPresenceService) {
        this.chatPresenceService = chatPresenceService;
    }

    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal == null || accessor.getSessionId() == null) {
            return;
        }

        chatPresenceService.markConnectedByPrincipal(principal.getName(), accessor.getSessionId());
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        if (principal == null || accessor.getSessionId() == null) {
            return;
        }

        chatPresenceService.markDisconnectedByPrincipal(principal.getName(), accessor.getSessionId());
    }
}
