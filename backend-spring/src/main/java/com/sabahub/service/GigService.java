package com.sabahub.service;

import com.sabahub.domain.Gig;
import com.sabahub.domain.User;
import com.sabahub.repository.GigRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class GigService {

    private final GigRepository gigRepository;
    private final CurrentUserService currentUserService;
    private final FreelancerProfileCompletionService profileCompletionService;

    public GigService(GigRepository gigRepository,
                      CurrentUserService currentUserService,
                      FreelancerProfileCompletionService profileCompletionService) {
        this.gigRepository = gigRepository;
        this.currentUserService = currentUserService;
        this.profileCompletionService = profileCompletionService;
    }

    public List<Gig> listMyGigs() {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);
        return gigRepository.findByFreelancerIdOrderByUpdatedAtDesc(freelancer.getId());
    }

    public Gig createGig(Gig input) {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);
        profileCompletionService.requireCompleteProfileForPublishing(freelancer);

        Gig gig = new Gig();
        gig.setFreelancerId(freelancer.getId());
        gig.setTitle(input.getTitle());
        gig.setDescription(input.getDescription());
        gig.setSkills(input.getSkills());
        gig.setPrice(input.getPrice());
        gig.setCurrency((input.getCurrency() == null || input.getCurrency().isBlank()) ? "USD" : input.getCurrency());
        gig.setDeliveryDays(input.getDeliveryDays());
        gig.setThumbnailUrl(input.getThumbnailUrl());
        gig.setSampleImageUrls(input.getSampleImageUrls());
        gig.setSampleVideoUrls(input.getSampleVideoUrls());
        gig.setSampleDocumentUrls(input.getSampleDocumentUrls());
        Gig.Status status = resolveRequestedStatus(input);
        if (status == Gig.Status.PUBLISHED) {
            profileCompletionService.requireCompleteProfileForPublishing(freelancer);
            validatePublishedMediaRequirements(gig);
        }
        gig.setStatus(status);
        gig.setActive(status == Gig.Status.PUBLISHED);
        gig.setFlagged(Boolean.FALSE);
        gig.setCreatedAt(Instant.now());
        gig.setUpdatedAt(Instant.now());

        return gigRepository.save(gig);
    }

    public Gig updateGig(String gigId, Gig input) {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);

        Gig existing = gigRepository.findById(gigId)
                .orElseThrow(() -> new IllegalArgumentException("Gig not found"));

        if (!freelancer.getId().equals(existing.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (input.getTitle() != null) existing.setTitle(input.getTitle());
        if (input.getDescription() != null) existing.setDescription(input.getDescription());
        if (input.getSkills() != null) existing.setSkills(input.getSkills());
        if (input.getPrice() != null) existing.setPrice(input.getPrice());
        if (input.getCurrency() != null) existing.setCurrency(input.getCurrency());
        if (input.getDeliveryDays() != null) existing.setDeliveryDays(input.getDeliveryDays());
        if (input.getThumbnailUrl() != null) existing.setThumbnailUrl(input.getThumbnailUrl());
        if (input.getSampleImageUrls() != null) existing.setSampleImageUrls(input.getSampleImageUrls());
        if (input.getSampleVideoUrls() != null) existing.setSampleVideoUrls(input.getSampleVideoUrls());
        if (input.getSampleDocumentUrls() != null) existing.setSampleDocumentUrls(input.getSampleDocumentUrls());
        if (input.getStatus() != null || input.getActive() != null) {
            Gig.Status status = existing.getStatus() == null
                    ? (Boolean.TRUE.equals(existing.getActive()) ? Gig.Status.PUBLISHED : Gig.Status.DRAFT)
                    : existing.getStatus();

            if (input.getStatus() != null) {
                status = normalizeStatus(input.getStatus());
            } else if (input.getActive() != null) {
                status = Boolean.TRUE.equals(input.getActive()) ? Gig.Status.PUBLISHED : Gig.Status.ARCHIVED;
            }

            if (status == Gig.Status.PUBLISHED) {
                profileCompletionService.requireCompleteProfileForPublishing(freelancer);
                validatePublishedMediaRequirements(existing);
            }
            existing.setStatus(status);
            existing.setActive(status == Gig.Status.PUBLISHED);
        }
        existing.setUpdatedAt(Instant.now());

        return gigRepository.save(existing);
    }

    public void deleteGig(String gigId) {
        User freelancer = currentUserService.requireUser();
        currentUserService.requireFreelancerMode(freelancer);

        Gig existing = gigRepository.findById(gigId)
                .orElseThrow(() -> new IllegalArgumentException("Gig not found"));

        if (!freelancer.getId().equals(existing.getFreelancerId())) {
            throw new IllegalStateException("Forbidden");
        }

        gigRepository.delete(existing);
    }

    private Gig.Status resolveRequestedStatus(Gig input) {
        if (input.getStatus() != null) {
            return normalizeStatus(input.getStatus());
        }
        if (input.getActive() != null) {
            return Boolean.TRUE.equals(input.getActive()) ? Gig.Status.PUBLISHED : Gig.Status.DRAFT;
        }
        return Gig.Status.PUBLISHED;
    }

    private void validatePublishedMediaRequirements(Gig gig) {
        if (!hasText(gig.getThumbnailUrl())) {
            throw new IllegalArgumentException("Gig thumbnail is required before publishing");
        }
        if (!hasAnyMedia(gig.getSampleImageUrls(), gig.getSampleVideoUrls(), gig.getSampleDocumentUrls())) {
            throw new IllegalArgumentException("Add at least one image, video, or file before publishing this gig");
        }
    }

    private Gig.Status normalizeStatus(Gig.Status status) {
        if (status == null) {
            throw new IllegalArgumentException("Invalid status. Use DRAFT, PUBLISHED, or ARCHIVED");
        }
        if (status != Gig.Status.DRAFT && status != Gig.Status.PUBLISHED && status != Gig.Status.ARCHIVED) {
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
