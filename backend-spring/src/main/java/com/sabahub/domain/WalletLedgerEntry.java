package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "wallet_ledger")
public class WalletLedgerEntry {

    public enum Type {
        CREDIT,
        DEBIT
    }

    public enum Reason {
        CHAPA_TOPUP,
        LOCAL_TOPUP,
        ESCROW_FUND,
        ESCROW_RELEASE,
        REFUND,
        FEE,
        WITHDRAW
    }

    @Id
    private String id;

    @Indexed
    private String userId;

    private Type type;
    private Reason reason;

    private Double amount;
    private String currency;

    private String referenceId;
    private Double balanceAfter;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public Reason getReason() { return reason; }
    public void setReason(Reason reason) { this.reason = reason; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public Double getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(Double balanceAfter) { this.balanceAfter = balanceAfter; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
