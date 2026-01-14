package com.sabahub.domain;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "time_entries")
public class TimeEntry {
    
    @Id
    private String id;
    
    @Indexed
    private String contractId;
    
    @Indexed
    private String freelancerId;
    
    @Indexed
    private String employerId;
    
    private String projectId;
    
    // Time Tracking
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private BigDecimal hours;
    
    // Description
    private String description;
    private String taskName;
    private List<String> attachments;
    
    // Status
    private String status; // DRAFT, SUBMITTED, APPROVED, REJECTED, INVOICED
    private String rejectionReason;
    
    // Billing
    private BigDecimal hourlyRate;
    private BigDecimal totalAmount;
    private String currency;
    private Boolean billable;
    
    // Approval
    private LocalDateTime approvedAt;
    private String approvedBy;
    private LocalDateTime submittedAt;
    
    // Manual Entry
    private Boolean manualEntry;
    private String manualEntryReason;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
