package com.sabahub.web.dto.stream;

import java.util.List;
import java.util.Map;

public final class StreamingDTOs {

    private StreamingDTOs() {
    }

    public enum StreamVisibility {
        PUBLIC,
        PRIVATE,
        UNLISTED
    }

    public enum StreamStatus {
        DRAFT,
        LIVE,
        ENDED,
        TERMINATED
    }

    public enum StreamMode {
        ONE_TO_ONE,
        ONE_TO_MANY
    }

    public enum MediaKind {
        AUDIO,
        VIDEO,
        AUDIO_VIDEO
    }

    public enum SignalType {
        OFFER,
        ANSWER,
        ICE,
        CONTROL
    }

    public enum PresenceEventType {
        JOINED,
        LEFT
    }

    public record StreamCreateRequest(
            String title,
            String description,
            StreamVisibility visibility,
            Boolean recordingEnabled,
            Boolean lowLatencyEnabled,
            Boolean playbackEnabled,
            StreamMode mode,
            MediaKind mediaKind,
            Integer maxParticipants,
            List<String> tags
    ) {
    }

    public record StreamUpdateRequest(
            String title,
            String description,
            StreamVisibility visibility,
            Boolean recordingEnabled,
            Boolean lowLatencyEnabled,
            Boolean playbackEnabled,
            StreamMode mode,
            MediaKind mediaKind,
            Integer maxParticipants,
            List<String> tags
    ) {
    }

    public record StreamStartRequest(
            Boolean recordingEnabled,
            Boolean lowLatencyEnabled,
            Boolean playbackEnabled,
            Integer targetLatencySeconds
    ) {
    }

    public record StreamIngestInfo(
            String streamId,
            String rtmpIngestBaseUrl,
            String streamKey,
            String publishUrl,
            String expectedLiveHlsUrl
    ) {
    }

    public record StreamIngestEventRequest(
            String streamKey
    ) {
    }

    public record StreamJoinRequest(
            String preferredProtocol
    ) {
    }

    public record ModerationCommand(
            String targetUserId,
            String reason
    ) {
    }

    public record AdminTerminateRequest(
            String reason
    ) {
    }

    public record StreamSummary(
            String id,
            String ownerUserId,
            String ownerDisplayName,
            String title,
            String description,
            StreamMode mode,
            MediaKind mediaKind,
            StreamVisibility visibility,
            StreamStatus status,
            boolean recordingEnabled,
            boolean lowLatencyEnabled,
            boolean playbackEnabled,
            int maxParticipants,
            int viewerCount,
            List<String> tags,
            String primaryRegion,
            Long startedAt,
            Long endedAt
    ) {
    }

    public record StreamPermissions(
            boolean canWatch,
            boolean canChat,
            boolean canManage,
            boolean canAdminister
    ) {
    }

    public record StreamDetail(
            String id,
            String ownerUserId,
            String ownerDisplayName,
            String title,
            String description,
            StreamMode mode,
            MediaKind mediaKind,
            StreamVisibility visibility,
            StreamStatus status,
            boolean recordingEnabled,
            boolean lowLatencyEnabled,
            boolean playbackEnabled,
            int maxParticipants,
            int viewerCount,
            List<String> tags,
            String liveHlsUrl,
            String playbackHlsUrl,
            String webrtcRoomId,
            String primaryRegion,
            Long createdAt,
            Long startedAt,
            Long endedAt,
            StreamPermissions permissions
    ) {
    }

    public record JoinResponse(
            String streamId,
            String preferredProtocol,
            String signalingTopic,
            String signalingSendPath,
            String chatTopic,
            String chatSendPath,
            String presenceTopic,
            String presenceJoinPath,
            String presenceLeavePath,
            String liveHlsUrl,
            String playbackHlsUrl,
            String edgeRegion,
            List<Map<String, Object>> turnServers,
            Map<String, Object> janusBootstrap
    ) {
    }

    public record PresenceEvent(
            String streamId,
            PresenceEventType event,
            String userId,
            String displayName,
            int viewerCount,
            long occurredAt
    ) {
    }

    public record StreamChatMessageCommand(
            String body
    ) {
    }

    public record StreamChatMessage(
            String streamId,
            String senderUserId,
            String senderDisplayName,
            String body,
            long occurredAt
    ) {
    }

    public record SignalEnvelope(
            String streamId,
            SignalType signalType,
            String senderUserId,
            String targetPeerId,
            Map<String, Object> payload,
            long occurredAt
    ) {
    }

    public record AdminOverview(
            int liveStreamCount,
            int activeCallCount,
            int activeBroadcastCount,
            int totalViewerCount,
            List<StreamSummary> liveStreams,
            List<Map<String, Object>> healthCards
    ) {
    }
}
