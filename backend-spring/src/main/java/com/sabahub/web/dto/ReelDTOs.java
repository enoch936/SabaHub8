package com.sabahub.web.dto;

import java.util.List;

public class ReelDTOs {

    public record ReelCreateRequest(
            String title,
            String description,
            String videoUrl,
            String thumbnailUrl,
            String audioId,
            List<String> tags
    ) {}

    public record ReelResponse(
            String id,
            String title,
            String description,
            String videoUrl,
            String thumbnailUrl,
            String authorId,
            String authorName,
            String authorProfilePicture,
            Integer viewCount,
            Integer likeCount,
            Integer commentCount,
            Integer saveCount,
            List<String> tags,
            String createdAt
    ) {}

    public record ReelCommentRequest(
            String body
    ) {}

    public record ReelCommentResponse(
            String id,
            String reelId,
            String authorId,
            String authorName,
            String body,
            String createdAt
    ) {}
}
