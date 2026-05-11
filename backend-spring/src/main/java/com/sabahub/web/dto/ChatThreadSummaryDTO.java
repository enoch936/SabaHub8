package com.sabahub.web.dto;

import java.time.Instant;
import java.util.List;

public record ChatThreadSummaryDTO(
        String id,
        List<String> participantIds,
        String threadType,
        String groupName,
        String channelDescription,
        String ownerUserId,
        boolean memberMessagingEnabled,
        Instant lastMessageAt,
        String lastMessage,
        String lastMessageSenderId,
        long unreadCount,
        String pinnedMessageId,
        boolean pinned,
        boolean muted,
        boolean archived
) {
}
