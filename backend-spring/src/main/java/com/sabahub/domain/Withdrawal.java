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
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "withdrawals")
public class Withdrawal {
    
    public enum Status {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
    
    @Id
    private String id;
    
    @Indexed
    private String freelancerId;

    @Indexed
    private String userId;
    
    // Amount
    private BigDecimal amount;
    private Double amountDecimal;
    private String currency;
    private BigDecimal fee;
    private BigDecimal netAmount;
    
    // Payment Details
    private String paymentMethod; // BANK_TRANSFER, PAYPAL, STRIPE, MOBILE_MONEY
    private String accountDetails;
    private String accountHolderName;
    private String bankName;
    private String accountNumber;
    private String swiftCode;
    private String routingNumber;
    private Map<String, String> bankDetails;
    private String encryptedPayoutDetails;
    private String payoutDestinationLast4;
    
    // Status
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
    private Status statusEnum;
    private String failureReason;
    
    // Transaction
    private String transactionId;
    private String referenceNumber;
    private String settlementReference;
    private String settledLedgerEntryId;
    
    // Timing
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private LocalDateTime completedAt;
    private LocalDateTime expectedArrivalDate;
    private LocalDateTime ledgerSettledAt;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String notes;
}
