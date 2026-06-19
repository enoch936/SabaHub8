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
@Document(collection = "reels")
public class Reel {

    public enum Status {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }

    @Id
    private String id;

    private String title;
    private String description;
    private String videoUrl;
    private String thumbnailUrl;
    private String authorId;
    private String authorName;
    private String authorProfilePicture;
    private List<String> tags;
    private String audioId;
    private Status status = Status.PUBLISHED;
    private Integer viewCount = 0;
    private Integer likeCount = 0;
    private Integer commentCount = 0;
    private Integer saveCount = 0;
    private Integer shareCount = 0;

    @CreatedDate
    private Instant createdAt;
}
