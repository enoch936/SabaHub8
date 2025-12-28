package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "disputes")
public class Dispute {

    public enum Status {
        OPEN,
        INVESTIGATING,
        RESOLVED,
        CLOSED
    }

    @Id
    private String id;

    @Indexed
    private String contractId;

    private String openedByUserId;

    private Status status = Status.OPEN;

    private String reason;

    private List<String> adminNotes;

    private List<String> evidenceAssetIds;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getOpenedByUserId() { return openedByUserId; }
    public void setOpenedByUserId(String openedByUserId) { this.openedByUserId = openedByUserId; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public List<String> getAdminNotes() { return adminNotes; }
    public void setAdminNotes(List<String> adminNotes) { this.adminNotes = adminNotes; }

    public List<String> getEvidenceAssetIds() { return evidenceAssetIds; }
    public void setEvidenceAssetIds(List<String> evidenceAssetIds) { this.evidenceAssetIds = evidenceAssetIds; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
