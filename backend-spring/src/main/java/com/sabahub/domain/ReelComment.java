package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reel_comments")
public class ReelComment {

    @Id
    private String id;

    private String reelId;
    private String authorId;
    private String authorName;
    private String authorProfilePicture;
    private String body;

    @CreatedDate
    private Instant createdAt;
}
