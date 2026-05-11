package com.sabahub.domain;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "jobs")
@org.springframework.data.mongodb.core.index.CompoundIndexes({
    @org.springframework.data.mongodb.core.index.CompoundIndex(name = "status_enterprise_idx", def = "{status:1, isEnterpriseOnly:1}"),
    @org.springframework.data.mongodb.core.index.CompoundIndex(name = "deliverable_status_idx", def = "{deliverableType:1, status:1}"),
    @org.springframework.data.mongodb.core.index.CompoundIndex(name = "engagement_status_idx", def = "{engagementType:1, status:1}"),
    @org.springframework.data.mongodb.core.index.CompoundIndex(name = "pricing_status_idx", def = "{pricingModel:1, status:1}")
})
public class Job {

    public enum Status {
        DRAFT,
        OPEN,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        CLOSED
    }

    public enum EngagementType {
        PROJECT_BASED,
        CONTRACT,
        LONG_TERM_PARTNERSHIP,
        RETAINER
    }

    public enum DeliverableType {
        IMAGE_DESIGN,
        VIDEO_PRODUCTION,
        AUDIO_PRODUCTION,
        DOCUMENT_DEVELOPMENT,
        MIXED
    }

    public enum PricingModel {
        FIXED_PRICE,
        HOURLY,
        RETAINER,
        VOLUME_BASED
    }

    @Id
    private String id;

    @Indexed
    private String employerId;

    @Indexed
    private Status status = Status.DRAFT;

    @Indexed
    private Boolean isEnterpriseOnly; // Filters marketplace vs enterprise

    private String title;
    private String description;
    private String overviewText;

    // Engagement & Scope
    @Indexed
    private EngagementType engagementType;

    @Indexed
    private DeliverableType deliverableType;
    private List<String> deliverableScopes; // E.g., ["Image Production", "Video Production"]
    private String workLocation; // Remote, Global, On-site, Hybrid

    // Budget & Pricing
    private Double budgetMin;
    private Double budgetMax;
    private String currency;
    @Indexed
    private PricingModel pricingModel;
    private Map<String, Double> rateBreakdown; // Flexible pricing structure

    // SLA & Quality Requirements
    private Integer slaDeliveryDays; // Standard turnaround time
    private Integer maxConcurrentProjects = 1;
    private Integer includedRevisionRounds;
    private List<String> qualityStandards; // E.g., "WCAG 2.1 AA", "Brand Compliance"
    private List<String> requiredFormats; // PNG, SVG, MP4, etc.

    // Requirements & Qualifications
    private Integer minYearsExperience;
    private List<String> requiredSkills;
    private List<String> requiredTools; // Adobe Suite, DaVinci Resolve, etc.
    private List<String> requiredQualifications;
    private List<String> preferredExperience;
    private Boolean requiresPortfolio;
    private Boolean requiresReferences;
    private Integer minReferenceCount;

    // Compliance & Security
    private Boolean requiresNDA;
    private Boolean requiresBGCheck;
    private Boolean requiresInsurance;
    private List<String> complianceRequirements; // GDPR, CCPA, HIPAA, etc.
    private List<String> dataClassifications; // Public, Confidential, Top Secret

    // Vendor Evaluation
    private Boolean pilotProjectRequired;
    private String pilotProjectScope;
    private Integer pilotEstimatedHours;

    // Long-term Opportunity
    private Boolean preferredVendorOpportunity;
    private Integer minimumMonthlyCommitment; // Hours or projects
    private Integer contractTermMonths; // 12, 24, etc.
    private Boolean rateStabilityGuarantee;

    // Additional Metadata
    private String categoryId;

    @Indexed
    private List<String> skills;

    @Indexed
    private List<String> industry; // SaaS, Healthcare, Finance, etc.
    private List<String> teamSize; // Suitable for: Solo, Team, Studio, Agency
    private String companyName; // For enterprise posting

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
    
    private Instant closingDate;
    private String evaluationProcess; // Description of evaluation
    private List<String> applicationGuidelineUrls;
    private List<String> sampleDocumentUrls;
    private List<String> sampleImageUrls;
    private List<String> sampleVideoUrls;
    private List<String> sampleAudioUrls;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployerId() { return employerId; }
    public void setEmployerId(String employerId) { this.employerId = employerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOverviewText() { return overviewText; }
    public void setOverviewText(String overviewText) { this.overviewText = overviewText; }

    public EngagementType getEngagementType() { return engagementType; }
    public void setEngagementType(EngagementType engagementType) { this.engagementType = engagementType; }

    public DeliverableType getDeliverableType() { return deliverableType; }
    public void setDeliverableType(DeliverableType deliverableType) { this.deliverableType = deliverableType; }

    public List<String> getDeliverableScopes() { return deliverableScopes; }
    public void setDeliverableScopes(List<String> deliverableScopes) { this.deliverableScopes = deliverableScopes; }

    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }

    public Double getBudgetMin() { return budgetMin; }
    public void setBudgetMin(Double budgetMin) { this.budgetMin = budgetMin; }

    public Double getBudgetMax() { return budgetMax; }
    public void setBudgetMax(Double budgetMax) { this.budgetMax = budgetMax; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public PricingModel getPricingModel() { return pricingModel; }
    public void setPricingModel(PricingModel pricingModel) { this.pricingModel = pricingModel; }

    public Map<String, Double> getRateBreakdown() { return rateBreakdown; }
    public void setRateBreakdown(Map<String, Double> rateBreakdown) { this.rateBreakdown = rateBreakdown; }

    public Integer getSlaDeliveryDays() { return slaDeliveryDays; }
    public void setSlaDeliveryDays(Integer slaDeliveryDays) { this.slaDeliveryDays = slaDeliveryDays; }

    public Integer getMaxConcurrentProjects() { return maxConcurrentProjects; }
    public void setMaxConcurrentProjects(Integer maxConcurrentProjects) { this.maxConcurrentProjects = maxConcurrentProjects; }

    public Integer getIncludedRevisionRounds() { return includedRevisionRounds; }
    public void setIncludedRevisionRounds(Integer includedRevisionRounds) { this.includedRevisionRounds = includedRevisionRounds; }

    public List<String> getQualityStandards() { return qualityStandards; }
    public void setQualityStandards(List<String> qualityStandards) { this.qualityStandards = qualityStandards; }

    public List<String> getRequiredFormats() { return requiredFormats; }
    public void setRequiredFormats(List<String> requiredFormats) { this.requiredFormats = requiredFormats; }

    public Integer getMinYearsExperience() { return minYearsExperience; }
    public void setMinYearsExperience(Integer minYearsExperience) { this.minYearsExperience = minYearsExperience; }

    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills; }

    public List<String> getRequiredTools() { return requiredTools; }
    public void setRequiredTools(List<String> requiredTools) { this.requiredTools = requiredTools; }

    public List<String> getRequiredQualifications() { return requiredQualifications; }
    public void setRequiredQualifications(List<String> requiredQualifications) { this.requiredQualifications = requiredQualifications; }

    public List<String> getPreferredExperience() { return preferredExperience; }
    public void setPreferredExperience(List<String> preferredExperience) { this.preferredExperience = preferredExperience; }

    public Boolean getRequiresPortfolio() { return requiresPortfolio; }
    public void setRequiresPortfolio(Boolean requiresPortfolio) { this.requiresPortfolio = requiresPortfolio; }

    public Boolean getRequiresReferences() { return requiresReferences; }
    public void setRequiresReferences(Boolean requiresReferences) { this.requiresReferences = requiresReferences; }

    public Integer getMinReferenceCount() { return minReferenceCount; }
    public void setMinReferenceCount(Integer minReferenceCount) { this.minReferenceCount = minReferenceCount; }

    public Boolean getRequiresNDA() { return requiresNDA; }
    public void setRequiresNDA(Boolean requiresNDA) { this.requiresNDA = requiresNDA; }

    public Boolean getRequiresBGCheck() { return requiresBGCheck; }
    public void setRequiresBGCheck(Boolean requiresBGCheck) { this.requiresBGCheck = requiresBGCheck; }

    public Boolean getRequiresInsurance() { return requiresInsurance; }
    public void setRequiresInsurance(Boolean requiresInsurance) { this.requiresInsurance = requiresInsurance; }

    public List<String> getComplianceRequirements() { return complianceRequirements; }
    public void setComplianceRequirements(List<String> complianceRequirements) { this.complianceRequirements = complianceRequirements; }

    public List<String> getDataClassifications() { return dataClassifications; }
    public void setDataClassifications(List<String> dataClassifications) { this.dataClassifications = dataClassifications; }

    public Boolean getPilotProjectRequired() { return pilotProjectRequired; }
    public void setPilotProjectRequired(Boolean pilotProjectRequired) { this.pilotProjectRequired = pilotProjectRequired; }

    public String getPilotProjectScope() { return pilotProjectScope; }
    public void setPilotProjectScope(String pilotProjectScope) { this.pilotProjectScope = pilotProjectScope; }

    public Integer getPilotEstimatedHours() { return pilotEstimatedHours; }
    public void setPilotEstimatedHours(Integer pilotEstimatedHours) { this.pilotEstimatedHours = pilotEstimatedHours; }

    public Boolean getPreferredVendorOpportunity() { return preferredVendorOpportunity; }
    public void setPreferredVendorOpportunity(Boolean preferredVendorOpportunity) { this.preferredVendorOpportunity = preferredVendorOpportunity; }

    public Integer getMinimumMonthlyCommitment() { return minimumMonthlyCommitment; }
    public void setMinimumMonthlyCommitment(Integer minimumMonthlyCommitment) { this.minimumMonthlyCommitment = minimumMonthlyCommitment; }

    public Integer getContractTermMonths() { return contractTermMonths; }
    public void setContractTermMonths(Integer contractTermMonths) { this.contractTermMonths = contractTermMonths; }

    public Boolean getRateStabilityGuarantee() { return rateStabilityGuarantee; }
    public void setRateStabilityGuarantee(Boolean rateStabilityGuarantee) { this.rateStabilityGuarantee = rateStabilityGuarantee; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<String> getIndustry() { return industry; }
    public void setIndustry(List<String> industry) { this.industry = industry; }

    public List<String> getTeamSize() { return teamSize; }
    public void setTeamSize(List<String> teamSize) { this.teamSize = teamSize; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Boolean getIsEnterpriseOnly() { return isEnterpriseOnly; }
    public void setIsEnterpriseOnly(Boolean isEnterpriseOnly) { this.isEnterpriseOnly = isEnterpriseOnly; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Instant getClosingDate() { return closingDate; }
    public void setClosingDate(Instant closingDate) { this.closingDate = closingDate; }

    public String getEvaluationProcess() { return evaluationProcess; }
    public void setEvaluationProcess(String evaluationProcess) { this.evaluationProcess = evaluationProcess; }

    public List<String> getApplicationGuidelineUrls() { return applicationGuidelineUrls; }
    public void setApplicationGuidelineUrls(List<String> applicationGuidelineUrls) { this.applicationGuidelineUrls = applicationGuidelineUrls; }

    public List<String> getSampleDocumentUrls() { return sampleDocumentUrls; }
    public void setSampleDocumentUrls(List<String> sampleDocumentUrls) { this.sampleDocumentUrls = sampleDocumentUrls; }

    public List<String> getSampleImageUrls() { return sampleImageUrls; }
    public void setSampleImageUrls(List<String> sampleImageUrls) { this.sampleImageUrls = sampleImageUrls; }

    public List<String> getSampleVideoUrls() { return sampleVideoUrls; }
    public void setSampleVideoUrls(List<String> sampleVideoUrls) { this.sampleVideoUrls = sampleVideoUrls; }

    public List<String> getSampleAudioUrls() { return sampleAudioUrls; }
    public void setSampleAudioUrls(List<String> sampleAudioUrls) { this.sampleAudioUrls = sampleAudioUrls; }
}
