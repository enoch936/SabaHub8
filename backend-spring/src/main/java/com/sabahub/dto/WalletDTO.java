package com.sabahub.dto;

import java.util.Map;

public class WalletDTO {
    private String userId;
    private Double amount;
    private String currency;
    private String paymentMethod;
    private Map<String, String> bankDetails;

    // Constructors
    public WalletDTO() {}

    public WalletDTO(String userId, Double amount) {
        this.userId = userId;
        this.amount = amount;
    }

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Map<String, String> getBankDetails() { return bankDetails; }
    public void setBankDetails(Map<String, String> bankDetails) { this.bankDetails = bankDetails; }
}
