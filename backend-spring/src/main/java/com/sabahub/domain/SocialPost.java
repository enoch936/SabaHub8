package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "social_posts")
public class SocialPost {
    @Id
    private String id;

    public enum PostType {
        FEED, STORY
    }

    private String authorId;
    private String authorName;
    private String authorProfilePicture;

    @Builder.Default
    private PostType type = PostType.FEED;

    private String content;
    private List<String> mediaAssetIds; // IDs from Asset collection

    private int likeCount;
    private int commentCount;
    private int saveCount;
    private int shareCount;
    private int viewCount;

    private List<String> tags;
    private String category; // e.g., "Design", "Development"

    @CreatedDate
    private Instant createdAt;
    private Instant updatedAt;
}
