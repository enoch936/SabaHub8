package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "content")
public class ContentItem {

    public enum Type {
        FAQ,
        PAGE,
        BLOG,
        CATEGORY,
        ANNOUNCEMENT
    }

    public enum Status {
        DRAFT,
        PUBLISHED
    }

    @Id
    private String id;

    private Type type;

    @Indexed(unique = false)
    private String slug;

    private String title;

    private String body;

    private Status status = Status.DRAFT;

    private List<String> mediaAssetIds;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public List<String> getMediaAssetIds() { return mediaAssetIds; }
    public void setMediaAssetIds(List<String> mediaAssetIds) { this.mediaAssetIds = mediaAssetIds; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
