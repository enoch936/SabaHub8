package com.sabahub.service;

import com.sabahub.config.StreamMediaProperties;
import com.sabahub.domain.User;
import com.sabahub.web.dto.stream.StreamingDTOs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class InMemoryStreamService implements StreamService {

    private static final int STREAM_KEY_LENGTH = 32;

    private final ConcurrentMap<String, ManagedStream> streams = new ConcurrentHashMap<>();
    private final StreamMediaProperties mediaProperties;

    public InMemoryStreamService() {
        this(new StreamMediaProperties());
    }

    @Autowired
    public InMemoryStreamService(StreamMediaProperties mediaProperties) {
        this.mediaProperties = mediaProperties;
    }

    @Override
    public List<StreamingDTOs.StreamSummary> listVisibleStreams(User viewer) {
        return streams.values().stream()
                .filter(stream -> canView(resolveEmail(viewer), stream.id))
                .sorted(Comparator.comparingLong((ManagedStream stream) -> stream.createdAt).reversed())
                .map(this::toSummary)
                .toList();
    }

    @Override
    public StreamingDTOs.StreamDetail getStream(User viewer, String streamId) {
        ManagedStream stream = requireStream(streamId);
        if (!canView(resolveEmail(viewer), streamId)) {
            throw new IllegalArgumentException("You do not have access to this stream");
        }
        return toDetail(stream, viewer);
    }

    @Override
    public StreamingDTOs.StreamDetail createStream(User owner, StreamingDTOs.StreamCreateRequest request) {
        String streamId = "stream_" + UUID.randomUUID().toString().replace("-", "");
        ManagedStream stream = new ManagedStream();
        stream.id = streamId;
        stream.ownerUserId = owner.getId();
        stream.ownerEmail = owner.getEmail();
        stream.ownerDisplayName = owner.getFullName() != null && !owner.getFullName().isBlank()
                ? owner.getFullName()
                : owner.getEmail();
        stream.title = normalize(request.title(), "Untitled stream");
        stream.description = normalize(request.description(), "");
        stream.mode = request.mode() != null ? request.mode() : StreamingDTOs.StreamMode.ONE_TO_MANY;
        stream.mediaKind = request.mediaKind() != null ? request.mediaKind() : StreamingDTOs.MediaKind.AUDIO_VIDEO;
        stream.visibility = request.visibility() != null ? request.visibility() : StreamingDTOs.StreamVisibility.PUBLIC;
        stream.status = StreamingDTOs.StreamStatus.DRAFT;
        stream.recordingEnabled = Boolean.TRUE.equals(request.recordingEnabled());
        stream.lowLatencyEnabled = request.lowLatencyEnabled() == null || request.lowLatencyEnabled();
        stream.playbackEnabled = request.playbackEnabled() == null || request.playbackEnabled();
        stream.maxParticipants = request.maxParticipants() != null && request.maxParticipants() > 0
                ? request.maxParticipants()
                : (stream.mode == StreamingDTOs.StreamMode.ONE_TO_ONE ? 2 : 5000);
        stream.tags = request.tags() != null ? new ArrayList<>(request.tags()) : new ArrayList<>();
        stream.createdAt = Instant.now().toEpochMilli();
        stream.primaryRegion = "global-primary";
        stream.webrtcRoomId = "janus-room-" + streamId;
        stream.ingestStreamKey = UUID.randomUUID().toString().replace("-", "").substring(0, STREAM_KEY_LENGTH);
        stream.liveHlsUrl = buildLiveHlsUrl(streamId);
        stream.playbackHlsUrl = null;
        streams.put(streamId, stream);
        return toDetail(stream, owner);
    }

    @Override
    public StreamingDTOs.StreamDetail updateStream(User actor, String streamId, StreamingDTOs.StreamUpdateRequest request) {
        ManagedStream stream = requireOwnedStream(actor, streamId);
        if (request.title() != null) {
            stream.title = normalize(request.title(), stream.title);
        }
        if (request.description() != null) {
            stream.description = normalize(request.description(), stream.description);
        }
        if (request.mode() != null) {
            stream.mode = request.mode();
        }
        if (request.mediaKind() != null) {
            stream.mediaKind = request.mediaKind();
        }
        if (request.visibility() != null) {
            stream.visibility = request.visibility();
        }
        if (request.recordingEnabled() != null) {
            stream.recordingEnabled = request.recordingEnabled();
        }
        if (request.lowLatencyEnabled() != null) {
            stream.lowLatencyEnabled = request.lowLatencyEnabled();
        }
        if (request.playbackEnabled() != null) {
            stream.playbackEnabled = request.playbackEnabled();
        }
        if (request.maxParticipants() != null && request.maxParticipants() > 0) {
            stream.maxParticipants = request.maxParticipants();
        }
        if (request.tags() != null) {
            stream.tags = new ArrayList<>(request.tags());
        }
        return toDetail(stream, actor);
    }

    @Override
    public StreamingDTOs.StreamDetail startStream(User actor, String streamId, StreamingDTOs.StreamStartRequest request) {
        ManagedStream stream = requireOwnedStream(actor, streamId);
        if (stream.status == StreamingDTOs.StreamStatus.TERMINATED) {
            throw new IllegalArgumentException("Stream has been terminated by admin");
        }
        if (request != null) {
            if (request.recordingEnabled() != null) {
                stream.recordingEnabled = request.recordingEnabled();
            }
            if (request.lowLatencyEnabled() != null) {
                stream.lowLatencyEnabled = request.lowLatencyEnabled();
            }
            if (request.playbackEnabled() != null) {
                stream.playbackEnabled = request.playbackEnabled();
            }
        }
        stream.status = StreamingDTOs.StreamStatus.LIVE;
        stream.startedAt = stream.startedAt == null ? Instant.now().toEpochMilli() : stream.startedAt;
        stream.endedAt = null;
        return toDetail(stream, actor);
    }

    @Override
    public StreamingDTOs.StreamDetail stopStream(User actor, String streamId) {
        ManagedStream stream = requireOwnedStream(actor, streamId);
        stream.status = StreamingDTOs.StreamStatus.ENDED;
        stream.endedAt = Instant.now().toEpochMilli();
        stream.ingestActive = false;
        return toDetail(stream, actor);
    }

    @Override
    public StreamingDTOs.StreamDetail terminateStream(User actor, String streamId, String reason) {
        ManagedStream stream = requireStream(streamId);
        stream.status = StreamingDTOs.StreamStatus.TERMINATED;
        stream.endedAt = Instant.now().toEpochMilli();
        stream.ingestActive = false;
        if (reason != null && !reason.isBlank()) {
            stream.description = stream.description + "\n\n[ADMIN ACTION] " + reason.trim();
        }
        return toDetail(stream, actor);
    }

    @Override
    public StreamingDTOs.StreamIngestInfo getIngestInfo(User actor, String streamId) {
        ManagedStream stream = requireOwnedStream(actor, streamId);
        return toIngestInfo(stream);
    }

    @Override
    public StreamingDTOs.StreamDetail markIngestStarted(String streamId, String streamKey, String sourceIp) {
        ManagedStream stream = requireStream(streamId);
        validateIngestKey(stream, streamKey);
        if (stream.status == StreamingDTOs.StreamStatus.TERMINATED) {
            throw new IllegalArgumentException("Stream has been terminated by admin");
        }
        stream.ingestActive = true;
        stream.ingestSourceIp = sourceIp;
        stream.ingestLastSeenAt = Instant.now().toEpochMilli();
        stream.status = StreamingDTOs.StreamStatus.LIVE;
        stream.startedAt = stream.startedAt == null ? stream.ingestLastSeenAt : stream.startedAt;
        stream.endedAt = null;
        return toDetail(stream, null);
    }

    @Override
    public StreamingDTOs.StreamDetail markIngestStopped(String streamId, String streamKey, String sourceIp) {
        ManagedStream stream = requireStream(streamId);
        validateIngestKey(stream, streamKey);
        stream.ingestActive = false;
        stream.ingestSourceIp = sourceIp;
        stream.ingestLastSeenAt = Instant.now().toEpochMilli();
        if (stream.status != StreamingDTOs.StreamStatus.TERMINATED) {
            stream.status = StreamingDTOs.StreamStatus.ENDED;
            stream.endedAt = stream.ingestLastSeenAt;
        }
        return toDetail(stream, null);
    }

    @Override
    public StreamingDTOs.JoinResponse joinStream(User viewer, String streamId, StreamingDTOs.StreamJoinRequest request) {
        ManagedStream stream = requireStream(streamId);
        if (!canView(resolveEmail(viewer), streamId)) {
            throw new IllegalArgumentException("You do not have access to this stream");
        }

        boolean owner = resolveUserId(viewer).equals(stream.ownerUserId);
        if (!owner && stream.maxParticipants > 0 && stream.viewerUserIds.size() >= stream.maxParticipants) {
            throw new IllegalArgumentException("Stream room is at capacity");
        }

        if (viewer != null && viewer.getId() != null) {
            stream.viewerUserIds.add(viewer.getId());
        }

        String preferredProtocol = request != null && request.preferredProtocol() != null && !request.preferredProtocol().isBlank()
                ? request.preferredProtocol().trim().toUpperCase()
                : "WEBRTC";

        Map<String, Object> janusBootstrap = new LinkedHashMap<>();
        janusBootstrap.put("roomId", stream.webrtcRoomId);
        janusBootstrap.put("mode", stream.mode.name());
        janusBootstrap.put("mediaKind", stream.mediaKind.name());
        janusBootstrap.put("publisherAllowed", owner);
        janusBootstrap.put("targetLatencySeconds", stream.lowLatencyEnabled ? 2 : 5);
        janusBootstrap.put("maxParticipants", stream.maxParticipants);

        return new StreamingDTOs.JoinResponse(
                stream.id,
                preferredProtocol,
                "/topic/streams/" + stream.id + "/signal",
                "/app/streams/" + stream.id + "/signal.publish",
                "/topic/streams/" + stream.id + "/chat",
                "/app/streams/" + stream.id + "/chat.send",
                "/topic/streams/" + stream.id + "/presence",
                "/app/streams/" + stream.id + "/presence.join",
                "/app/streams/" + stream.id + "/presence.leave",
                stream.liveHlsUrl,
                stream.playbackHlsUrl,
                stream.primaryRegion,
                List.of(
                        Map.of("urls", List.of("turn:turn.sabahub.example:3478?transport=udp"), "username", "stream-user", "credential", "turn-secret")
                ),
                janusBootstrap
        );
    }

    @Override
    public void leaveStream(User viewer, String streamId) {
        ManagedStream stream = requireStream(streamId);
        if (viewer != null && viewer.getId() != null) {
            stream.viewerUserIds.remove(viewer.getId());
        }
    }

    @Override
    public void muteViewer(User actor, String streamId, StreamingDTOs.ModerationCommand request) {
        ManagedStream stream = requireManageableStream(actor, streamId);
        if (request == null || request.targetUserId() == null || request.targetUserId().isBlank()) {
            throw new IllegalArgumentException("targetUserId is required");
        }
        stream.mutedUserIds.add(request.targetUserId());
    }

    @Override
    public void kickViewer(User actor, String streamId, StreamingDTOs.ModerationCommand request) {
        ManagedStream stream = requireManageableStream(actor, streamId);
        if (request == null || request.targetUserId() == null || request.targetUserId().isBlank()) {
            throw new IllegalArgumentException("targetUserId is required");
        }
        stream.viewerUserIds.remove(request.targetUserId());
        stream.kickedUserIds.add(request.targetUserId());
    }

    @Override
    public StreamingDTOs.AdminOverview getAdminOverview() {
        List<StreamingDTOs.StreamSummary> liveStreams = streams.values().stream()
                .filter(stream -> stream.status == StreamingDTOs.StreamStatus.LIVE)
                .sorted(Comparator.comparingLong((ManagedStream stream) -> stream.startedAt == null ? 0L : stream.startedAt).reversed())
                .map(this::toSummary)
                .toList();
        int totalViewers = liveStreams.stream().mapToInt(StreamingDTOs.StreamSummary::viewerCount).sum();
        return new StreamingDTOs.AdminOverview(
                liveStreams.size(),
                (int) liveStreams.stream().filter(stream -> stream.mode() == StreamingDTOs.StreamMode.ONE_TO_ONE).count(),
                (int) liveStreams.stream().filter(stream -> stream.mode() == StreamingDTOs.StreamMode.ONE_TO_MANY).count(),
                totalViewers,
                liveStreams,
                List.of(
                        Map.of("label", "Redis hot presence", "status", "READY", "detail", "Use Redis sets and counters for viewer fan-out, join throttling, and moderation state"),
                        Map.of("label", "Kafka analytics feed", "status", "READY", "detail", "Publish stream lifecycle, QoS, watch-time, and moderation events asynchronously"),
                        Map.of("label", "Janus media plane", "status", "READY", "detail", "Cluster Janus VideoRoom nodes behind regional allocators for audio, video, one-to-one, and broadcast flows"),
                        Map.of("label", "HLS + CDN edge", "status", "READY", "detail", "Offload large passive audiences to HLS manifests and segments at the CDN edge")
                )
        );
    }

    @Override
    public boolean isStreamOwner(String email, String streamId) {
        ManagedStream stream = streams.get(streamId);
        return stream != null && stream.ownerEmail != null && stream.ownerEmail.equalsIgnoreCase(email);
    }

    @Override
    public boolean canView(String email, String streamId) {
        ManagedStream stream = streams.get(streamId);
        if (stream == null) {
            return false;
        }
        if (stream.visibility == StreamingDTOs.StreamVisibility.PUBLIC || stream.visibility == StreamingDTOs.StreamVisibility.UNLISTED) {
            return true;
        }
        return stream.ownerEmail != null && stream.ownerEmail.equalsIgnoreCase(email);
    }

    private ManagedStream requireOwnedStream(User actor, String streamId) {
        ManagedStream stream = requireStream(streamId);
        if (!isStreamOwner(resolveEmail(actor), streamId)) {
            throw new IllegalArgumentException("You can manage only your own stream");
        }
        return stream;
    }

    private ManagedStream requireManageableStream(User actor, String streamId) {
        if (hasAdminRole(actor)) {
            return requireStream(streamId);
        }
        return requireOwnedStream(actor, streamId);
    }

    private ManagedStream requireStream(String streamId) {
        ManagedStream stream = streams.get(streamId);
        if (stream == null) {
            throw new IllegalArgumentException("Stream not found");
        }
        return stream;
    }

    private void validateIngestKey(ManagedStream stream, String streamKey) {
        if (streamKey == null || streamKey.isBlank()) {
            throw new IllegalArgumentException("streamKey is required");
        }
        if (!stream.ingestStreamKey.equals(streamKey.trim())) {
            throw new IllegalArgumentException("Invalid stream key");
        }
    }

    private StreamingDTOs.StreamIngestInfo toIngestInfo(ManagedStream stream) {
        String base = normalizeRtmpBaseUrl(mediaProperties.getRtmpIngestBaseUrl());
        String publishUrl = base + "/" + stream.id + "?key=" + stream.ingestStreamKey;
        return new StreamingDTOs.StreamIngestInfo(
                stream.id,
                base,
                stream.ingestStreamKey,
                publishUrl,
                stream.liveHlsUrl
        );
    }

    private String buildLiveHlsUrl(String streamId) {
        String base = normalizeHttpBaseUrl(mediaProperties.getHlsPublicBaseUrl());
        return base + "/" + streamId + "/index.m3u8";
    }

    private String normalizeHttpBaseUrl(String value) {
        String candidate = normalize(value, "http://localhost:8081/hls");
        while (candidate.endsWith("/")) {
            candidate = candidate.substring(0, candidate.length() - 1);
        }
        return candidate;
    }

    private String normalizeRtmpBaseUrl(String value) {
        String candidate = normalize(value, "rtmp://localhost:1935/live");
        while (candidate.endsWith("/")) {
            candidate = candidate.substring(0, candidate.length() - 1);
        }
        return candidate;
    }

    private StreamingDTOs.StreamSummary toSummary(ManagedStream stream) {
        return new StreamingDTOs.StreamSummary(
                stream.id,
                stream.ownerUserId,
                stream.ownerDisplayName,
                stream.title,
                stream.description,
                stream.mode,
                stream.mediaKind,
                stream.visibility,
                stream.status,
                stream.recordingEnabled,
                stream.lowLatencyEnabled,
                stream.playbackEnabled,
                stream.maxParticipants,
                stream.viewerUserIds.size(),
                List.copyOf(stream.tags),
                stream.primaryRegion,
                stream.startedAt,
                stream.endedAt
        );
    }

    private StreamingDTOs.StreamDetail toDetail(ManagedStream stream, User actor) {
        String email = resolveEmail(actor);
        boolean admin = hasAdminRole(actor);
        boolean owner = email != null && isStreamOwner(email, stream.id);
        boolean canWatch = canView(email, stream.id);
        return new StreamingDTOs.StreamDetail(
                stream.id,
                stream.ownerUserId,
                stream.ownerDisplayName,
                stream.title,
                stream.description,
                stream.mode,
                stream.mediaKind,
                stream.visibility,
                stream.status,
                stream.recordingEnabled,
                stream.lowLatencyEnabled,
                stream.playbackEnabled,
                stream.maxParticipants,
                stream.viewerUserIds.size(),
                List.copyOf(stream.tags),
                stream.liveHlsUrl,
                stream.playbackHlsUrl,
                stream.webrtcRoomId,
                stream.primaryRegion,
                stream.createdAt,
                stream.startedAt,
                stream.endedAt,
                new StreamingDTOs.StreamPermissions(canWatch, canWatch, owner, admin)
        );
    }

    private boolean hasAdminRole(User actor) {
        if (actor == null || actor.getRoles() == null) {
            return false;
        }
        return actor.getRoles().stream().anyMatch(role -> {
            String normalized = role == null ? "" : role.trim().toUpperCase();
            return normalized.contains("ADMIN");
        });
    }

    private String resolveEmail(User actor) {
        return actor != null ? actor.getEmail() : null;
    }

    private String resolveUserId(User actor) {
        return actor != null && actor.getId() != null ? actor.getId() : "anonymous";
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private static final class ManagedStream {
        private String id;
        private String ownerUserId;
        private String ownerEmail;
        private String ownerDisplayName;
        private String title;
        private String description;
        private StreamingDTOs.StreamMode mode;
        private StreamingDTOs.MediaKind mediaKind;
        private StreamingDTOs.StreamVisibility visibility;
        private StreamingDTOs.StreamStatus status;
        private boolean recordingEnabled;
        private boolean lowLatencyEnabled;
        private boolean playbackEnabled;
        private int maxParticipants;
        private String liveHlsUrl;
        private String playbackHlsUrl;
        private String webrtcRoomId;
        private String primaryRegion;
        private String ingestStreamKey;
        private boolean ingestActive;
        private String ingestSourceIp;
        private Long ingestLastSeenAt;
        private long createdAt;
        private Long startedAt;
        private Long endedAt;
        private List<String> tags = new ArrayList<>();
        private final Set<String> viewerUserIds = ConcurrentHashMap.newKeySet();
        private final Set<String> mutedUserIds = ConcurrentHashMap.newKeySet();
        private final Set<String> kickedUserIds = ConcurrentHashMap.newKeySet();
    }
}
