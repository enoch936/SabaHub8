package com.sabahub.dto;

import java.util.List;

public class JobDTO {
    private String title;
    private String description;
    private Double budgetMin;
    private Double budgetMax;
    private String currency;
    private String categoryId;
    private List<String> skills;

    // Constructors
    public JobDTO() {}

    public JobDTO(String title, String description, Double budgetMin, Double budgetMax) {
        this.title = title;
        this.description = description;
        this.budgetMin = budgetMin;
        this.budgetMax = budgetMax;
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getBudgetMin() { return budgetMin; }
    public void setBudgetMin(Double budgetMin) { this.budgetMin = budgetMin; }

    public Double getBudgetMax() { return budgetMax; }
    public void setBudgetMax(Double budgetMax) { this.budgetMax = budgetMax; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
}
