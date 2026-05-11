package com.sabahub.web.dto;

public record ChatTypingEventDTO(
        String threadId,
        String userId,
        String displayName,
        boolean typing
) {
}
