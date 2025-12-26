package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "assets")
public class Asset {
    @Id
    private String id;

    @Indexed
    private String title;

    private String url; // Cloudinary URL

    private String publicId; // Cloudinary public_id

    @CreatedDate
    private Instant createdAt;

    public Asset() {}

    public Asset(String title, String url, String publicId) {
        this.title = title;
        this.url = url;
        this.publicId = publicId;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
