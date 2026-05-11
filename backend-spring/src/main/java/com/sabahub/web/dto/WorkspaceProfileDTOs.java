package com.sabahub.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public final class WorkspaceProfileDTOs {

    private WorkspaceProfileDTOs() {
    }

    public record WorkspaceProfileSummary(
            String kind,
            String id,
            String userId,
            String displayName,
            String headline,
            String about,
            String avatarUrl,
            String coverImage,
            String location,
            String timezone,
            String website,
            String industry,
            Integer employeeCount,
            String availability,
            Double hourlyRate,
            String currency,
            LocalDateTime memberSince,
            List<String> badges,
            List<String> skills,
            List<String> categories,
            List<String> languages,
            ProfileTrustSignals trust,
            ProfileStats stats,
            List<ProfilePortfolioItem> portfolio,
            List<ProfileReview> reviews,
            List<PublishedProject> publishedProjects,
            List<PublishedGig> publishedGigs,
            List<PublishedStory> publishedStories
    ) {}

    public record ProfileTrustSignals(
            boolean emailVerified,
            boolean phoneVerified,
            boolean identityVerified,
            boolean businessVerified,
            boolean paymentVerified,
            boolean documentsVerified,
            boolean kycVerified,
            String kycStatus
    ) {}

    public record ProfileStats(
            Integer completedContracts,
            Integer activeContracts,
            Integer totalJobsPosted,
            Integer totalHires,
            Double rating,
            Integer reviewCount,
            Double totalSpent,
            Double totalEarnings,
            Integer successRate,
            Integer jobSuccessScore
    ) {}

    public record ProfilePortfolioItem(
            String id,
            String title,
            String description,
            List<String> images,
            String projectUrl,
            List<String> technologies,
            String testimonial,
            LocalDateTime completedAt
    ) {}

    public record ProfileReview(
            String id,
            String contractId,
            String reviewerId,
            String reviewerName,
            String reviewerAvatar,
            Integer rating,
            String comment,
            String sentiment,
            boolean verified,
            LocalDateTime createdAt,
            List<String> tags
    ) {}

    public record PublishedProject(
            String id,
            String title,
            String description,
            String category,
            List<String> skills,
            Double budgetMin,
            Double budgetMax,
            String currency,
            Integer deliveryDays,
            String thumbnailUrl,
            List<String> sampleImageUrls,
            List<String> sampleVideoUrls,
            List<String> sampleDocumentUrls,
            LocalDateTime publishedAt
    ) {}

    public record PublishedGig(
            String id,
            String title,
            String description,
            List<String> skills,
            Double price,
            String currency,
            Integer deliveryDays,
            String thumbnailUrl,
            List<String> sampleImageUrls,
            List<String> sampleVideoUrls,
            List<String> sampleDocumentUrls,
            LocalDateTime publishedAt
    ) {}

    public record PublishedStory(
            String id,
            String title,
            String description,
            String category,
            List<String> technologies,
            List<String> imageUrls,
            String projectUrl,
            LocalDateTime publishedAt
    ) {}

    public record EmployerWorkspaceProfile(
            String id,
            String userId,
            String companyName,
            String companyWebsite,
            String companyLogo,
            String industry,
            Integer employeeCount,
            String description,
            String address,
            String city,
            String country,
            String taxId,
            String registrationNumber,
            String paymentType,
            String paymentAccountId,
            String paymentCurrency,
            LocalDateTime memberSince,
            List<String> badges,
            ProfileTrustSignals trust,
            ProfileStats stats,
            List<ProfileReview> reviews
    ) {}

    public record EmployerProfileUpdateRequest(
            String companyName,
            String companyWebsite,
            String companyLogo,
            String industry,
            Integer employeeCount,
            String description,
            String address,
            String city,
            String country,
            String taxId,
            String registrationNumber,
            String paymentType,
            String paymentAccountId,
            String paymentCurrency
    ) {}
}
