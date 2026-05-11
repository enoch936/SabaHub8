package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.web.dto.stream.StreamingDTOs;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class InMemoryStreamServiceTest {

    private final InMemoryStreamService streamService = new InMemoryStreamService();

    @Test
    void ownerCanCreateStartAndStopStream() {
        User owner = buildUser("owner-1", "owner@sabahub.test", "ROLE_FREELANCER");
        StreamingDTOs.StreamDetail draft = streamService.createStream(
                owner,
                new StreamingDTOs.StreamCreateRequest(
                        "Launch AMA",
                        "Weekly launch stream",
                        StreamingDTOs.StreamVisibility.PUBLIC,
                        true,
                        true,
                        true,
                        StreamingDTOs.StreamMode.ONE_TO_MANY,
                        StreamingDTOs.MediaKind.AUDIO_VIDEO,
                        5000,
                        java.util.List.of("ama", "launch")
                )
        );

        assertThat(draft.status()).isEqualTo(StreamingDTOs.StreamStatus.DRAFT);
        assertThat(draft.permissions().canManage()).isTrue();

        StreamingDTOs.StreamDetail live = streamService.startStream(
                owner,
                draft.id(),
                new StreamingDTOs.StreamStartRequest(true, true, true, 2)
        );

        assertThat(live.status()).isEqualTo(StreamingDTOs.StreamStatus.LIVE);
        assertThat(streamService.isStreamOwner(owner.getEmail(), draft.id())).isTrue();

        User viewer = buildUser("viewer-1", "viewer@sabahub.test", "ROLE_FREELANCER");
        streamService.joinStream(viewer, draft.id(), new StreamingDTOs.StreamJoinRequest("WEBRTC"));
        StreamingDTOs.StreamDetail withViewer = streamService.getStream(owner, draft.id());
        assertThat(withViewer.viewerCount()).isEqualTo(1);

        StreamingDTOs.StreamDetail ended = streamService.stopStream(owner, draft.id());
        assertThat(ended.status()).isEqualTo(StreamingDTOs.StreamStatus.ENDED);
    }

    @Test
    void adminOverviewReflectsLiveStreams() {
        User owner = buildUser("owner-2", "streamer@sabahub.test", "ROLE_FREELANCER");
        StreamingDTOs.StreamDetail draft = streamService.createStream(
                owner,
                new StreamingDTOs.StreamCreateRequest(
                        "Platform Townhall",
                        "Admin monitored session",
                        StreamingDTOs.StreamVisibility.PUBLIC,
                        false,
                        true,
                        true,
                        StreamingDTOs.StreamMode.ONE_TO_MANY,
                        StreamingDTOs.MediaKind.AUDIO_VIDEO,
                        10000,
                        java.util.List.of("townhall")
                )
        );
        streamService.startStream(owner, draft.id(), new StreamingDTOs.StreamStartRequest(false, true, true, 2));

        StreamingDTOs.AdminOverview overview = streamService.getAdminOverview();

        assertThat(overview.liveStreamCount()).isEqualTo(1);
        assertThat(overview.liveStreams()).extracting(StreamingDTOs.StreamSummary::id).contains(draft.id());
    }

    private User buildUser(String id, String email, String role) {
        User user = new User(email, email.substring(0, email.indexOf('@')), "Test User", "hash", Set.of(role));
        user.setId(id);
        return user;
    }
}
