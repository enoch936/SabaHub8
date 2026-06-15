package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "social_comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialComment {

    @Id
    private String id;

    private String postId;
    private String authorId;
    private String authorName;
    private String authorProfilePicture;
    private String content;

    @CreatedDate
    private Instant createdAt;
}
