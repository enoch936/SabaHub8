package com.sabahub.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class SocialDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePostRequest {
        private String content;
        private List<String> mediaAssetIds;
        private List<String> tags;
        private String category;
        private String type; // FEED or STORY
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentRequest {
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FollowRequest {
        private String userId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SocialPostResponse {
        private String id;
        private String authorId;
        private String authorName;
        private String authorProfilePicture;
        private String content;
        private List<String> mediaAssetIds;
        private String type;
        private int likeCount;
        private int commentCount;
        private int saveCount;
        private int shareCount;
        private List<String> tags;
        private String category;
        private java.time.Instant createdAt;
        private boolean isLiked;
        private boolean isSaved;
    }
}
