package com.sabahub.service;

import com.sabahub.domain.FreelancerProjectPost;
import com.sabahub.domain.User;
import com.sabahub.repository.FreelancerProjectPostRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class FreelancerProjectPostService {

    private final FreelancerProjectPostRepository repository;
    private final CurrentUserService currentUserService;
    private final FreelancerProfileCompletionService profileCompletionService;

    public FreelancerProjectPostService(FreelancerProjectPostRepository repository,
                                        CurrentUserService currentUserService,
                                        FreelancerProfileCompletionService profileCompletionService) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.profileCompletionService = profileCompletionService;
    }

    public List<FreelancerProjectPost> listMyProjectPosts() {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);
        return repository.findByFreelancerIdOrderByUpdatedAtDesc(freelancer.getId());
    }

    public FreelancerProjectPost createProjectPost(FreelancerProjectPost input) {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);
        profileCompletionService.requireCompleteProfileForPublishing(freelancer);

        FreelancerProjectPost post = new FreelancerProjectPost();
        post.setFreelancerId(freelancer.getId());
        post.setTitle(input.getTitle());
        post.setDescription(input.getDescription());
        post.setCategory(input.getCategory());
        post.setSkills(input.getSkills());
        post.setBudgetMin(input.getBudgetMin());
        post.setBudgetMax(input.getBudgetMax());
        post.setCurrency((input.getCurrency() == null || input.getCurrency().isBlank()) ? "USD" : input.getCurrency());
        post.setDeliveryDays(input.getDeliveryDays());
        post.setThumbnailUrl(input.getThumbnailUrl());
        post.setSampleImageUrls(input.getSampleImageUrls());
        post.setSampleVideoUrls(input.getSampleVideoUrls());
        post.setSampleDocumentUrls(input.getSampleDocumentUrls());
        FreelancerProjectPost.Status status = resolveRequestedStatus(input);
        if (status == FreelancerProjectPost.Status.PUBLISHED) {
            profileCompletionService.requireCompleteProfileForPublishing(freelancer);
            validatePublishedMediaRequirements(post);
        }
        post.setStatus(status);
        post.setFlagged(Boolean.FALSE);
        post.setCreatedAt(Instant.now());
        post.setUpdatedAt(Instant.now());
        return repository.save(post);
    }

    public FreelancerProjectPost updateProjectPost(String postId, FreelancerProjectPost input) {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);

        FreelancerProjectPost existing = repository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Project post not found"));

        if (!freelancer.getId().equals(existing.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (input.getTitle() != null) existing.setTitle(input.getTitle());
        if (input.getDescription() != null) existing.setDescription(input.getDescription());
        if (input.getCategory() != null) existing.setCategory(input.getCategory());
        if (input.getSkills() != null) existing.setSkills(input.getSkills());
        if (input.getBudgetMin() != null) existing.setBudgetMin(input.getBudgetMin());
        if (input.getBudgetMax() != null) existing.setBudgetMax(input.getBudgetMax());
        if (input.getCurrency() != null) existing.setCurrency(input.getCurrency());
        if (input.getDeliveryDays() != null) existing.setDeliveryDays(input.getDeliveryDays());
        if (input.getThumbnailUrl() != null) existing.setThumbnailUrl(input.getThumbnailUrl());
        if (input.getSampleImageUrls() != null) existing.setSampleImageUrls(input.getSampleImageUrls());
        if (input.getSampleVideoUrls() != null) existing.setSampleVideoUrls(input.getSampleVideoUrls());
        if (input.getSampleDocumentUrls() != null) existing.setSampleDocumentUrls(input.getSampleDocumentUrls());
        if (input.getStatus() != null) {
            FreelancerProjectPost.Status normalized = normalizeStatus(input.getStatus());
            if (normalized == FreelancerProjectPost.Status.PUBLISHED) {
                profileCompletionService.requireCompleteProfileForPublishing(freelancer);
                validatePublishedMediaRequirements(existing);
            }
            existing.setStatus(normalized);
        }

        existing.setUpdatedAt(Instant.now());
        return repository.save(existing);
    }

    public void deleteProjectPost(String postId) {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);

        FreelancerProjectPost existing = repository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Project post not found"));

        if (!freelancer.getId().equals(existing.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }

        repository.delete(existing);
    }

    private FreelancerProjectPost.Status resolveRequestedStatus(FreelancerProjectPost input) {
        if (input.getStatus() == null) {
            return FreelancerProjectPost.Status.PUBLISHED;
        }
        return normalizeStatus(input.getStatus());
    }

    private void validatePublishedMediaRequirements(FreelancerProjectPost post) {
        if (!hasText(post.getThumbnailUrl())) {
            throw new IllegalArgumentException("Project post thumbnail is required before publishing");
        }
        if (!hasAnyMedia(post.getSampleImageUrls(), post.getSampleVideoUrls(), post.getSampleDocumentUrls())) {
            throw new IllegalArgumentException("Add at least one image, video, or file before publishing this project post");
        }
    }

    private FreelancerProjectPost.Status normalizeStatus(FreelancerProjectPost.Status status) {
        if (status == null) {
            throw new IllegalArgumentException("Invalid status. Use DRAFT, PUBLISHED, or ARCHIVED");
        }
        if (status != FreelancerProjectPost.Status.DRAFT
                && status != FreelancerProjectPost.Status.PUBLISHED
                && status != FreelancerProjectPost.Status.ARCHIVED) {
            throw new IllegalArgumentException("Invalid status. Use DRAFT, PUBLISHED, or ARCHIVED");
        }
        return status;
    }

    private boolean hasAnyMedia(List<String> imageUrls, List<String> videoUrls, List<String> documentUrls) {
        return hasItems(imageUrls) || hasItems(videoUrls) || hasItems(documentUrls);
    }

    private boolean hasItems(List<String> values) {
        return values != null && values.stream().anyMatch(this::hasText);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
