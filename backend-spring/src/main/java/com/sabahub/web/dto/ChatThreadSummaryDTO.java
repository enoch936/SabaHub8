package com.sabahub.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

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
        boolean archived,
        Map<String, Instant> lastReadAtByUser
) {
}
