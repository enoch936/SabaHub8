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
@Document(collection = "reel_audios")
public class ReelAudio {

    @Id
    private String id;

    private String title;
    private String artist;
    private String audioUrl;
    private String authorId;
    private Long durationMs;
    private Integer usageCount = 0;

    @CreatedDate
    private Instant createdAt;
}
