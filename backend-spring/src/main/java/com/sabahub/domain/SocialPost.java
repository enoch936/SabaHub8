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

    public enum PostType {
        FEED,
        STORY
    }

    @Id
    private String id;

    private PostType type;

    private String content;

    private List<String> mediaAssetIds;

    private List<String> tags;

    private String category;

    private String authorId;

    private String authorName;

    private String authorProfilePicture;

    private Integer likeCount = 0;

    private Integer commentCount = 0;

    private Integer saveCount = 0;

    private Integer shareCount = 0;

    @CreatedDate
    private Instant createdAt;
}
