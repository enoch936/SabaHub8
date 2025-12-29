package com.sabahub.domain;

import java.util.List;
import java.util.Map;

/**
 * Extended user profile for Upwork/Fiverr-style platforms
 * Embedded in User document
 */
public class UserProfile {
    private String bio;
    private String profilePictureUrl;
    private String location;
    private String timezone;
    private String phoneNumber;
    private String language;
    
    // Professional info
    private List<String> skills;
    private List<String> certifications;
    private String expertise;
    private Integer yearsOfExperience;
    
    // Portfolio
    private List<String> portfolioUrls;
    private Integer completedProjects;
    private Double averageRating;
    private Integer totalReviews;
    
    // Freelancer specific
    private String hourlyRate;
    private String availability; // FULL_TIME, PART_TIME, OCCASIONAL
    private List<String> preferredCategories;
    private Boolean openToOpportunities;
    
    // Payment & Banking
    private String paymentMethod; // STRIPE, PAYPAL, BANK_TRANSFER, CRYPTOCURRENCY
    private Map<String, String> bankDetails; // encrypted
    private String taxId;
    
    // Settings & Preferences
    private Boolean emailNotifications;
    private Boolean smsNotifications;
    private Boolean hideProfile;
    private Boolean showEarnings;
    private String preferredLanguage;
    
    // Verification
    private Boolean phoneVerified;
    private Boolean emailVerified;
    private Boolean identityVerified;
    private String identityVerificationMethod; // DOCUMENT, GOVERNMENT_ID, etc
    private Long identityVerifiedAt;
    
    // Stats
    private Long profileViewsCount;
    private Long proposalsSentCount;
    private Long contractsCompletedCount;
    private Double totalEarnings;
    private Long successRate;

    public UserProfile() {}

    // Getters and Setters
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<String> getCertifications() { return certifications; }
    public void setCertifications(List<String> certifications) { this.certifications = certifications; }

    public String getExpertise() { return expertise; }
    public void setExpertise(String expertise) { this.expertise = expertise; }

    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public List<String> getPortfolioUrls() { return portfolioUrls; }
    public void setPortfolioUrls(List<String> portfolioUrls) { this.portfolioUrls = portfolioUrls; }

    public Integer getCompletedProjects() { return completedProjects; }
    public void setCompletedProjects(Integer completedProjects) { this.completedProjects = completedProjects; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }

    public String getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(String hourlyRate) { this.hourlyRate = hourlyRate; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public List<String> getPreferredCategories() { return preferredCategories; }
    public void setPreferredCategories(List<String> preferredCategories) { this.preferredCategories = preferredCategories; }

    public Boolean getOpenToOpportunities() { return openToOpportunities; }
    public void setOpenToOpportunities(Boolean openToOpportunities) { this.openToOpportunities = openToOpportunities; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Map<String, String> getBankDetails() { return bankDetails; }
    public void setBankDetails(Map<String, String> bankDetails) { this.bankDetails = bankDetails; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }

    public Boolean getSmsNotifications() { return smsNotifications; }
    public void setSmsNotifications(Boolean smsNotifications) { this.smsNotifications = smsNotifications; }

    public Boolean getHideProfile() { return hideProfile; }
    public void setHideProfile(Boolean hideProfile) { this.hideProfile = hideProfile; }

    public Boolean getShowEarnings() { return showEarnings; }
    public void setShowEarnings(Boolean showEarnings) { this.showEarnings = showEarnings; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public Boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public Boolean getIdentityVerified() { return identityVerified; }
    public void setIdentityVerified(Boolean identityVerified) { this.identityVerified = identityVerified; }

    public String getIdentityVerificationMethod() { return identityVerificationMethod; }
    public void setIdentityVerificationMethod(String identityVerificationMethod) { this.identityVerificationMethod = identityVerificationMethod; }

    public Long getIdentityVerifiedAt() { return identityVerifiedAt; }
    public void setIdentityVerifiedAt(Long identityVerifiedAt) { this.identityVerifiedAt = identityVerifiedAt; }

    public Long getProfileViewsCount() { return profileViewsCount; }
    public void setProfileViewsCount(Long profileViewsCount) { this.profileViewsCount = profileViewsCount; }

    public Long getProposalsSentCount() { return proposalsSentCount; }
    public void setProposalsSentCount(Long proposalsSentCount) { this.proposalsSentCount = proposalsSentCount; }

    public Long getContractsCompletedCount() { return contractsCompletedCount; }
    public void setContractsCompletedCount(Long contractsCompletedCount) { this.contractsCompletedCount = contractsCompletedCount; }

    public Double getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(Double totalEarnings) { this.totalEarnings = totalEarnings; }

    public Long getSuccessRate() { return successRate; }
    public void setSuccessRate(Long successRate) { this.successRate = successRate; }
}
