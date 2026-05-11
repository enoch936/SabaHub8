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
    private List<String> requiredTools;
    private List<String> industry;
    private List<String> teamSize;
    private Integer maxConcurrentProjects;
    private String workLocation;
    private String engagementType;
    private String deliverableType;
    private String pricingModel;
    private Integer minYearsExperience;

    // Media / Attachments
    private List<String> sampleDocumentUrls;
    private List<String> sampleImageUrls;
    private List<String> sampleVideoUrls;
    private List<String> sampleAudioUrls;

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

    public List<String> getRequiredTools() { return requiredTools; }
    public void setRequiredTools(List<String> requiredTools) { this.requiredTools = requiredTools; }

    public List<String> getIndustry() { return industry; }
    public void setIndustry(List<String> industry) { this.industry = industry; }

    public List<String> getTeamSize() { return teamSize; }
    public void setTeamSize(List<String> teamSize) { this.teamSize = teamSize; }

    public Integer getMaxConcurrentProjects() { return maxConcurrentProjects; }
    public void setMaxConcurrentProjects(Integer maxConcurrentProjects) { this.maxConcurrentProjects = maxConcurrentProjects; }

    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }

    public String getEngagementType() { return engagementType; }
    public void setEngagementType(String engagementType) { this.engagementType = engagementType; }

    public String getDeliverableType() { return deliverableType; }
    public void setDeliverableType(String deliverableType) { this.deliverableType = deliverableType; }

    public String getPricingModel() { return pricingModel; }
    public void setPricingModel(String pricingModel) { this.pricingModel = pricingModel; }

    public Integer getMinYearsExperience() { return minYearsExperience; }
    public void setMinYearsExperience(Integer minYearsExperience) { this.minYearsExperience = minYearsExperience; }

    public List<String> getSampleDocumentUrls() { return sampleDocumentUrls; }
    public void setSampleDocumentUrls(List<String> sampleDocumentUrls) { this.sampleDocumentUrls = sampleDocumentUrls; }

    public List<String> getSampleImageUrls() { return sampleImageUrls; }
    public void setSampleImageUrls(List<String> sampleImageUrls) { this.sampleImageUrls = sampleImageUrls; }

    public List<String> getSampleVideoUrls() { return sampleVideoUrls; }
    public void setSampleVideoUrls(List<String> sampleVideoUrls) { this.sampleVideoUrls = sampleVideoUrls; }

    public List<String> getSampleAudioUrls() { return sampleAudioUrls; }
    public void setSampleAudioUrls(List<String> sampleAudioUrls) { this.sampleAudioUrls = sampleAudioUrls; }
}
