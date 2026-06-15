package com.sabahub.web.dto;

import com.sabahub.domain.UserProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicProfileResponse {
    private String userId;
    private String username;
    private String fullName;
    private String profilePictureUrl;
    private String bio;
    private String location;
    private boolean isFollowing;
    private boolean hasActiveStories;
    private ProfileStats stats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfileStats {
        private long followerCount;
        private long followingCount;
        private long totalLikes;
    }
}
