package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "reel_views")
public class ReelView {

    @Id
    private String id;

    private String reelId;
    private String userId;
    private Long watchDurationMs;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReelId() { return reelId; }
    public void setReelId(String reelId) { this.reelId = reelId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Long getWatchDurationMs() { return watchDurationMs; }
    public void setWatchDurationMs(Long watchDurationMs) { this.watchDurationMs = watchDurationMs; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
