package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "contracts")
public class Contract {

    public enum Status {
        ACTIVE,
        DELIVERED,
        COMPLETED,
        DISPUTED,
        CANCELLED
    }

    @Id
    private String id;

    @Indexed
    private String jobId;

    @Indexed
    private String employerId;

    @Indexed
    private String freelancerId;

    private Status status = Status.ACTIVE;

    private Double escrowTotalHeld = 0.0;
    private String currency = "ETB";

    private String deliveryNote;
    private String deliveryAssetId;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getEmployerId() { return employerId; }
    public void setEmployerId(String employerId) { this.employerId = employerId; }

    public String getFreelancerId() { return freelancerId; }
    public void setFreelancerId(String freelancerId) { this.freelancerId = freelancerId; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Double getEscrowTotalHeld() { return escrowTotalHeld; }
    public void setEscrowTotalHeld(Double escrowTotalHeld) { this.escrowTotalHeld = escrowTotalHeld; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getDeliveryNote() { return deliveryNote; }
    public void setDeliveryNote(String deliveryNote) { this.deliveryNote = deliveryNote; }

    public String getDeliveryAssetId() { return deliveryAssetId; }
    public void setDeliveryAssetId(String deliveryAssetId) { this.deliveryAssetId = deliveryAssetId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
