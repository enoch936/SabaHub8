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
@Document(collection = "invoices")
public class Invoice {
    
    @Id
    private String id;
    
    private String invoiceNumber;
    
    @Indexed
    private String contractId;
    
    @Indexed
    private String freelancerId;
    
    @Indexed
    private String employerId;
    
    private String projectId;
    
    // Invoice Details
    private String title;
    private String description;
    private LocalDateTime issueDate;
    private LocalDateTime dueDate;
    
    // Line Items
    private List<LineItem> items;
    
    // Amounts
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal taxRate;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private String currency;
    
    // Payment
    private String status; // DRAFT, SENT, VIEWED, PAID, OVERDUE, CANCELLED
    private LocalDateTime paidAt;
    private String paymentMethod;
    private String transactionId;
    
    // Time Entries (for hourly contracts)
    private List<String> timeEntryIds;
    private BigDecimal totalHours;
    
    // Milestones (for fixed-price contracts)
    private String milestoneId;
    private String milestoneName;
    
    // Notes
    private String notes;
    private String termsAndConditions;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime sentAt;
    private LocalDateTime viewedAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LineItem {
        private String description;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
