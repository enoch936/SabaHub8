package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "freelancer_project_posts")
public class FreelancerProjectPost {

    public enum Status {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }

    @Id
    private String id;

    @Indexed
    private String freelancerId;

    private String title;
    private String description;
    private String category;
    private List<String> skills;
    private Double budgetMin;
    private Double budgetMax;
    private String currency;
    private Integer deliveryDays;
    private String thumbnailUrl;
    private List<String> sampleImageUrls;
    private List<String> sampleVideoUrls;
    private List<String> sampleDocumentUrls;
    private Status status;
    private Boolean flagged;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFreelancerId() { return freelancerId; }
    public void setFreelancerId(String freelancerId) { this.freelancerId = freelancerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public Double getBudgetMin() { return budgetMin; }
    public void setBudgetMin(Double budgetMin) { this.budgetMin = budgetMin; }

    public Double getBudgetMax() { return budgetMax; }
    public void setBudgetMax(Double budgetMax) { this.budgetMax = budgetMax; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Integer getDeliveryDays() { return deliveryDays; }
    public void setDeliveryDays(Integer deliveryDays) { this.deliveryDays = deliveryDays; }

    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }

    public List<String> getSampleImageUrls() { return sampleImageUrls; }
    public void setSampleImageUrls(List<String> sampleImageUrls) { this.sampleImageUrls = sampleImageUrls; }

    public List<String> getSampleVideoUrls() { return sampleVideoUrls; }
    public void setSampleVideoUrls(List<String> sampleVideoUrls) { this.sampleVideoUrls = sampleVideoUrls; }

    public List<String> getSampleDocumentUrls() { return sampleDocumentUrls; }
    public void setSampleDocumentUrls(List<String> sampleDocumentUrls) { this.sampleDocumentUrls = sampleDocumentUrls; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Boolean getFlagged() { return flagged; }
    public void setFlagged(Boolean flagged) { this.flagged = flagged; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
