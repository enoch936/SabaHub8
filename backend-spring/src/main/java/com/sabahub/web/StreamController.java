package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.config.StreamMediaProperties;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.StreamService;
import com.sabahub.web.dto.stream.StreamingDTOs;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/streams")
public class StreamController {

    private final StreamService streamService;
    private final CurrentUserService currentUserService;
    private final StreamMediaProperties mediaProperties;

    public StreamController(StreamService streamService,
                            CurrentUserService currentUserService,
                            StreamMediaProperties mediaProperties) {
        this.streamService = streamService;
        this.currentUserService = currentUserService;
        this.mediaProperties = mediaProperties;
    }

    @GetMapping
    @PreAuthorize("@streamingAccessService.canBrowseStreams(authentication)")
    public ResponseEntity<List<StreamingDTOs.StreamSummary>> listStreams() {
        User viewer = currentUserService.requireUser();
        return ResponseEntity.ok(streamService.listVisibleStreams(viewer));
    }

    @GetMapping("/{streamId}")
    @PreAuthorize("@streamingAccessService.canViewStream(authentication, #streamId)")
    public ResponseEntity<StreamingDTOs.StreamDetail> getStream(@PathVariable String streamId) {
        User viewer = currentUserService.requireUser();
        return ResponseEntity.ok(streamService.getStream(viewer, streamId));
    }

    @PostMapping
    @PreAuthorize("@streamingAccessService.canCreateStream(authentication)")
    public ResponseEntity<StreamingDTOs.StreamDetail> createStream(@RequestBody(required = false) StreamingDTOs.StreamCreateRequest request) {
        User owner = currentUserService.requireUser();
        StreamingDTOs.StreamCreateRequest normalized = request != null
                ? request
                : new StreamingDTOs.StreamCreateRequest(
                        "Untitled stream",
                        "",
                        StreamingDTOs.StreamVisibility.PUBLIC,
                        false,
                        true,
                        true,
                        StreamingDTOs.StreamMode.ONE_TO_MANY,
                        StreamingDTOs.MediaKind.AUDIO_VIDEO,
                        5000,
                        List.of()
                );
        return ResponseEntity.ok(streamService.createStream(owner, normalized));
    }

    @PatchMapping("/{streamId}")
    @PreAuthorize("@streamingAccessService.canManageStream(authentication, #streamId)")
    public ResponseEntity<StreamingDTOs.StreamDetail> updateStream(@PathVariable String streamId,
                                                                   @RequestBody StreamingDTOs.StreamUpdateRequest request) {
        User actor = currentUserService.requireUser();
        return ResponseEntity.ok(streamService.updateStream(actor, streamId, request));
    }

    @PostMapping("/{streamId}/start")
    @PreAuthorize("@streamingAccessService.canManageStream(authentication, #streamId)")
    public ResponseEntity<StreamingDTOs.StreamDetail> startStream(@PathVariable String streamId,
                                                                  @RequestBody(required = false) StreamingDTOs.StreamStartRequest request) {
        User actor = currentUserService.requireUser();
        return ResponseEntity.ok(streamService.startStream(actor, streamId, request));
    }

    @GetMapping("/{streamId}/ingest")
    @PreAuthorize("@streamingAccessService.canManageStream(authentication, #streamId)")
    public ResponseEntity<StreamingDTOs.StreamIngestInfo> getIngestInfo(@PathVariable String streamId) {
        User actor = currentUserService.requireUser();
        return ResponseEntity.ok(streamService.getIngestInfo(actor, streamId));
    }

    @PostMapping("/{streamId}/stop")
    @PreAuthorize("@streamingAccessService.canManageStream(authentication, #streamId)")
    public ResponseEntity<StreamingDTOs.StreamDetail> stopStream(@PathVariable String streamId) {
        User actor = currentUserService.requireUser();
        return ResponseEntity.ok(streamService.stopStream(actor, streamId));
    }

    @PostMapping("/ingest/{streamId}/started")
    public ResponseEntity<StreamingDTOs.StreamDetail> ingestStarted(@PathVariable String streamId,
                                                                    @RequestBody StreamingDTOs.StreamIngestEventRequest request,
                                                                    @RequestHeader(value = "X-Stream-Ingest-Secret", required = false) String callbackSecret,
                                                                    HttpServletRequest servletRequest) {
        if (!isCallbackAuthorized(callbackSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String sourceIp = resolveSourceIp(servletRequest);
        return ResponseEntity.ok(streamService.markIngestStarted(streamId, request.streamKey(), sourceIp));
    }

    @PostMapping("/ingest/{streamId}/stopped")
    public ResponseEntity<StreamingDTOs.StreamDetail> ingestStopped(@PathVariable String streamId,
                                                                    @RequestBody StreamingDTOs.StreamIngestEventRequest request,
                                                                    @RequestHeader(value = "X-Stream-Ingest-Secret", required = false) String callbackSecret,
                                                                    HttpServletRequest servletRequest) {
        if (!isCallbackAuthorized(callbackSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String sourceIp = resolveSourceIp(servletRequest);
        return ResponseEntity.ok(streamService.markIngestStopped(streamId, request.streamKey(), sourceIp));
    }

    @PostMapping("/{streamId}/join")
    @PreAuthorize("@streamingAccessService.canViewStream(authentication, #streamId)")
    public ResponseEntity<StreamingDTOs.JoinResponse> joinStream(@PathVariable String streamId,
                                                                 @RequestBody(required = false) StreamingDTOs.StreamJoinRequest request) {
        User viewer = currentUserService.requireUser();
        StreamingDTOs.StreamJoinRequest normalized = request != null ? request : new StreamingDTOs.StreamJoinRequest("WEBRTC");
        return ResponseEntity.ok(streamService.joinStream(viewer, streamId, normalized));
    }

    @PostMapping("/{streamId}/leave")
    @PreAuthorize("@streamingAccessService.canViewStream(authentication, #streamId)")
    public ResponseEntity<?> leaveStream(@PathVariable String streamId) {
        User viewer = currentUserService.requireUser();
        streamService.leaveStream(viewer, streamId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{streamId}/moderation/mute")
    @PreAuthorize("@streamingAccessService.canManageStream(authentication, #streamId)")
    public ResponseEntity<?> muteViewer(@PathVariable String streamId,
                                        @RequestBody StreamingDTOs.ModerationCommand request) {
        User actor = currentUserService.requireUser();
        streamService.muteViewer(actor, streamId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{streamId}/moderation/kick")
    @PreAuthorize("@streamingAccessService.canManageStream(authentication, #streamId)")
    public ResponseEntity<?> kickViewer(@PathVariable String streamId,
                                        @RequestBody StreamingDTOs.ModerationCommand request) {
        User actor = currentUserService.requireUser();
        streamService.kickViewer(actor, streamId, request);
        return ResponseEntity.ok().build();
    }

    private boolean isCallbackAuthorized(String callbackSecret) {
        String configured = mediaProperties.getIngestCallbackSecret();
        if (configured == null || configured.isBlank()) {
            return true;
        }
        return configured.equals(callbackSecret);
    }

    private String resolveSourceIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
