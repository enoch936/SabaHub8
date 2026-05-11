package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.web.dto.stream.StreamingDTOs;

import java.util.List;

public interface StreamService {

    List<StreamingDTOs.StreamSummary> listVisibleStreams(User viewer);

    StreamingDTOs.StreamDetail getStream(User viewer, String streamId);

    StreamingDTOs.StreamDetail createStream(User owner, StreamingDTOs.StreamCreateRequest request);

    StreamingDTOs.StreamDetail updateStream(User actor, String streamId, StreamingDTOs.StreamUpdateRequest request);

    StreamingDTOs.StreamDetail startStream(User actor, String streamId, StreamingDTOs.StreamStartRequest request);

    StreamingDTOs.StreamDetail stopStream(User actor, String streamId);

    StreamingDTOs.StreamDetail terminateStream(User actor, String streamId, String reason);

    StreamingDTOs.StreamIngestInfo getIngestInfo(User actor, String streamId);

    StreamingDTOs.StreamDetail markIngestStarted(String streamId, String streamKey, String sourceIp);

    StreamingDTOs.StreamDetail markIngestStopped(String streamId, String streamKey, String sourceIp);

    StreamingDTOs.JoinResponse joinStream(User viewer, String streamId, StreamingDTOs.StreamJoinRequest request);

    void leaveStream(User viewer, String streamId);

    void muteViewer(User actor, String streamId, StreamingDTOs.ModerationCommand request);

    void kickViewer(User actor, String streamId, StreamingDTOs.ModerationCommand request);

    StreamingDTOs.AdminOverview getAdminOverview();

    boolean isStreamOwner(String email, String streamId);

    boolean canView(String email, String streamId);
}
