package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "wallet_ledger")
@CompoundIndex(name = "uniq_wallet_reference_per_user", def = "{ 'userId': 1, 'referenceId': 1 }", unique = true, sparse = true)
public class WalletLedgerEntry {

    public enum Type {
        CREDIT,
        DEBIT
    }

    public enum Reason {
        STRIPE_TOPUP,
        CHAPA_TOPUP,
        LOCAL_TOPUP,
        ADMIN_COMMIT,
        ADMIN_ROLLBACK,
        INTERNAL_TRANSFER_IN,
        INTERNAL_TRANSFER_OUT,
        ESCROW_FUND,
        ESCROW_RELEASE,
        DISPUTE_SETTLEMENT_EMPLOYER,
        DISPUTE_SETTLEMENT_FREELANCER,
        DISPUTE_SETTLEMENT_ADMIN,
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
