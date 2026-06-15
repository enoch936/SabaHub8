package com.sabahub.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "social_follows")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialFollow {

    @Id
    private String id;

    private String followerId;
    private String followingId;

    @CreatedDate
    private Instant createdAt;
}
