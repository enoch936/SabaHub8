package com.sabahub.web.ws;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.StreamService;
import com.sabahub.web.dto.stream.StreamingDTOs;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;

@Controller
public class StreamWsController {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final StreamService streamService;

    public StreamWsController(SimpMessagingTemplate messagingTemplate,
                              UserRepository userRepository,
                              StreamService streamService) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.streamService = streamService;
    }

    @MessageMapping("/streams/{streamId}/chat.send")
    public void sendChat(@DestinationVariable String streamId,
                         @Payload StreamingDTOs.StreamChatMessageCommand command,
                         Principal principal) {
        User user = requireUser(principal, streamId);
        StreamingDTOs.StreamChatMessage event = new StreamingDTOs.StreamChatMessage(
                streamId,
                user.getId(),
                user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail(),
                command.body(),
                Instant.now().toEpochMilli()
        );
        messagingTemplate.convertAndSend("/topic/streams/" + streamId + "/chat", event);
    }

    @MessageMapping("/streams/{streamId}/presence.join")
    public void joinPresence(@DestinationVariable String streamId, Principal principal) {
        User user = requireUser(principal, streamId);
        streamService.joinStream(user, streamId, new StreamingDTOs.StreamJoinRequest("WEBRTC"));
        StreamingDTOs.StreamDetail detail = streamService.getStream(user, streamId);
        StreamingDTOs.PresenceEvent event = new StreamingDTOs.PresenceEvent(
                streamId,
                StreamingDTOs.PresenceEventType.JOINED,
                user.getId(),
                user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail(),
                detail.viewerCount(),
                Instant.now().toEpochMilli()
        );
        messagingTemplate.convertAndSend("/topic/streams/" + streamId + "/presence", event);
    }

    @MessageMapping("/streams/{streamId}/presence.leave")
    public void leavePresence(@DestinationVariable String streamId, Principal principal) {
        User user = requireUser(principal, streamId);
        streamService.leaveStream(user, streamId);
        StreamingDTOs.StreamDetail detail = streamService.getStream(user, streamId);
        StreamingDTOs.PresenceEvent event = new StreamingDTOs.PresenceEvent(
                streamId,
                StreamingDTOs.PresenceEventType.LEFT,
                user.getId(),
                user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail(),
                detail.viewerCount(),
                Instant.now().toEpochMilli()
        );
        messagingTemplate.convertAndSend("/topic/streams/" + streamId + "/presence", event);
    }

    @MessageMapping("/streams/{streamId}/signal.publish")
    public void publishSignal(@DestinationVariable String streamId,
                              @Payload Map<String, Object> payload,
                              Principal principal) {
        User user = requireUser(principal, streamId);
        String signalTypeValue = String.valueOf(payload.getOrDefault("signalType", "CONTROL"));
        StreamingDTOs.SignalType signalType;
        try {
            signalType = StreamingDTOs.SignalType.valueOf(signalTypeValue.toUpperCase());
        } catch (IllegalArgumentException ignored) {
            signalType = StreamingDTOs.SignalType.CONTROL;
        }
        String targetPeerId = String.valueOf(payload.getOrDefault("targetPeerId", ""));
        @SuppressWarnings("unchecked")
        Map<String, Object> signalPayload = payload.get("payload") instanceof Map<?, ?> map
                ? (Map<String, Object>) map
                : Map.of();
        StreamingDTOs.SignalEnvelope envelope = new StreamingDTOs.SignalEnvelope(
                streamId,
                signalType,
                user.getId(),
                targetPeerId,
                signalPayload,
                Instant.now().toEpochMilli()
        );
        messagingTemplate.convertAndSend("/topic/streams/" + streamId + "/signal", envelope);
    }

    private User requireUser(Principal principal, String streamId) {
        String email = principal != null ? principal.getName() : null;
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        if (user == null || !streamService.canView(email, streamId)) {
            throw new IllegalStateException("Unauthorized stream access");
        }
        return user;
    }
}
