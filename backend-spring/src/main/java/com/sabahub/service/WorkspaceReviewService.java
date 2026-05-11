package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkspaceReviewService {

    private final CurrentUserService currentUserService;
    private final EmployerWorkspaceService employerWorkspaceService;
    private final ContractRepository contractRepository;
    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;

    public List<Employer.EmployerReview> listReviews() {
        User user = currentUserService.requireUser();
        String activeRole = resolveWorkspaceRole(user);

        if ("EMPLOYER".equals(activeRole)) {
            return employerWorkspaceService.listReviews();
        }

        return listFreelancerReviews(user);
    }

    public Employer.EmployerReview addReview(EmployerWorkspaceService.ReviewCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Review payload is required");
        }

        User user = currentUserService.requireUser();
        String activeRole = resolveWorkspaceRole(user);
        ReviewEligibility eligibility = validateReviewEligibility(user, activeRole, request);
        EmployerWorkspaceService.ReviewCreateRequest normalizedRequest = new EmployerWorkspaceService.ReviewCreateRequest(
                eligibility.contractId(),
                eligibility.targetId(),
                request.rating(),
                request.comment(),
                request.tags()
        );

        if ("EMPLOYER".equals(activeRole)) {
            return employerWorkspaceService.addReview(normalizedRequest);
        }

        return addFreelancerReview(user, normalizedRequest);
    }

    private List<Employer.EmployerReview> listFreelancerReviews(User user) {
        Set<String> targetIds = resolveFreelancerTargetIds(user);
        String reviewerKey = normalizeKey(user.getId());

        return streamAllReviews()
                .filter(Objects::nonNull)
                .filter(review -> targetIds.contains(normalizeKey(review.getTargetId()))
                        || (reviewerKey != null && reviewerKey.equals(normalizeKey(review.getReviewerId()))))
                .sorted(Comparator.comparing(
                        Employer.EmployerReview::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }

    private Employer.EmployerReview addFreelancerReview(User user, EmployerWorkspaceService.ReviewCreateRequest request) {
        if (request.rating() < 1 || request.rating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        String comment = normalizeOptional(request.comment());
        if (comment == null) {
            throw new IllegalArgumentException("Review comment is required");
        }

        String targetId = normalizeOptional(request.targetId());
        if (targetId == null) {
            throw new IllegalArgumentException("Target employer is required.");
        }

        Employer employer = employerRepository.findByUserId(targetId)
                .or(() -> employerRepository.findById(targetId))
                .orElseThrow(() -> new IllegalArgumentException("Employer not found for this review target."));

        List<Employer.EmployerReview> reviews = employer.getReviews();
        if (reviews == null) {
            reviews = new ArrayList<>();
            employer.setReviews(reviews);
        }

        Employer.EmployerReview review = Employer.EmployerReview.builder()
                .id("REV-" + UUID.randomUUID())
                .contractId(request.contractId().trim())
                .reviewerId(user.getId())
                .reviewerName(resolveReviewerName(user, "Freelancer"))
                .targetId(targetId)
                .rating(request.rating())
                .comment(comment)
                .sentiment(classifySentiment(request.rating()))
                .verified(Boolean.TRUE)
                .createdAt(LocalDateTime.now())
                .tags(sanitizeTags(request.tags()))
                .build();

        reviews.add(0, review);
        Employer saved = employerRepository.save(employer);

        return saved.getReviews() == null || saved.getReviews().isEmpty()
                ? review
                : saved.getReviews().get(0);
    }

    private ReviewEligibility validateReviewEligibility(
            User user,
            String activeRole,
            EmployerWorkspaceService.ReviewCreateRequest request
    ) {
        String contractId = normalizeOptional(request.contractId());
        if (contractId == null) {
            throw new IllegalArgumentException("Contract is required for reviews.");
        }

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found for this review."));

        if (contract.getStatus() != Contract.Status.COMPLETED) {
            throw new IllegalStateException("Reviews are only available for completed contracts.");
        }

        String requestedTargetId = normalizeOptional(request.targetId());
        if (requestedTargetId == null) {
            throw new IllegalArgumentException("Review target is required.");
        }

        Set<String> reviewerIdentityKeys = resolveUserIdentityKeys(user);
        String resolvedTargetId;

        if ("EMPLOYER".equals(activeRole)) {
            requireContractMembership(
                    reviewerIdentityKeys,
                    contract.getEmployerId(),
                    "Only the contract employer can submit this review."
            );

            resolvedTargetId = normalizeOptional(contract.getFreelancerId());
            if (resolvedTargetId == null) {
                throw new IllegalStateException("Contract freelancer is missing.");
            }

            requireValidTarget(
                    requestedTargetId,
                    resolveFreelancerIdentityKeys(resolvedTargetId),
                    "Review target must be the contract freelancer."
            );
        } else {
            requireContractMembership(
                    reviewerIdentityKeys,
                    contract.getFreelancerId(),
                    "Only the contract freelancer can submit this review."
            );

            resolvedTargetId = normalizeOptional(contract.getEmployerId());
            if (resolvedTargetId == null) {
                throw new IllegalStateException("Contract employer is missing.");
            }

            requireValidTarget(
                    requestedTargetId,
                    resolveEmployerIdentityKeys(resolvedTargetId),
                    "Review target must be the contract employer."
            );
        }

        ensureNoDuplicateReview(user.getId(), contractId);
        return new ReviewEligibility(contractId, resolvedTargetId);
    }

    private Set<String> resolveFreelancerTargetIds(User user) {
        LinkedHashSet<String> targetIds = new LinkedHashSet<>();
        addIfPresent(targetIds, user.getId());
        addIfPresent(targetIds, user.getEmail());

        Freelancer freelancer = freelancerRepository.findByUserId(user.getId())
                .or(() -> freelancerRepository.findByUserId(user.getEmail()))
                .orElse(null);

        if (freelancer != null) {
            addIfPresent(targetIds, freelancer.getId());
            addIfPresent(targetIds, freelancer.getUserId());
        }

        return targetIds;
    }

    private Set<String> resolveUserIdentityKeys(User user) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addIfPresent(keys, user.getId());
        addIfPresent(keys, user.getEmail());

        String userId = normalizeOptional(user.getId());
        if (userId != null) {
            employerRepository.findByUserId(userId).ifPresent(employer -> {
                addIfPresent(keys, employer.getId());
                addIfPresent(keys, employer.getUserId());
            });
            freelancerRepository.findByUserId(userId).ifPresent(freelancer -> {
                addIfPresent(keys, freelancer.getId());
                addIfPresent(keys, freelancer.getUserId());
            });
        }

        String email = normalizeOptional(user.getEmail());
        if (email != null) {
            employerRepository.findByUserId(email).ifPresent(employer -> {
                addIfPresent(keys, employer.getId());
                addIfPresent(keys, employer.getUserId());
            });
            freelancerRepository.findByUserId(email).ifPresent(freelancer -> {
                addIfPresent(keys, freelancer.getId());
                addIfPresent(keys, freelancer.getUserId());
            });
        }

        return keys;
    }

    private Set<String> resolveEmployerIdentityKeys(String employerRef) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addIfPresent(keys, employerRef);

        employerRepository.findById(employerRef).ifPresent(employer -> {
            addIfPresent(keys, employer.getId());
            addIfPresent(keys, employer.getUserId());
        });

        employerRepository.findByUserId(employerRef).ifPresent(employer -> {
            addIfPresent(keys, employer.getId());
            addIfPresent(keys, employer.getUserId());
        });

        return keys;
    }

    private Set<String> resolveFreelancerIdentityKeys(String freelancerRef) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addIfPresent(keys, freelancerRef);

        freelancerRepository.findById(freelancerRef).ifPresent(freelancer -> {
            addIfPresent(keys, freelancer.getId());
            addIfPresent(keys, freelancer.getUserId());
        });

        freelancerRepository.findByUserId(freelancerRef).ifPresent(freelancer -> {
            addIfPresent(keys, freelancer.getId());
            addIfPresent(keys, freelancer.getUserId());
        });

        return keys;
    }

    private void requireContractMembership(Set<String> reviewerIdentityKeys, String contractPartyId, String message) {
        String contractPartyKey = normalizeKey(contractPartyId);
        if (contractPartyKey == null || !reviewerIdentityKeys.contains(contractPartyKey)) {
            throw new IllegalStateException(message);
        }
    }

    private void requireValidTarget(String requestedTargetId, Set<String> allowedTargets, String message) {
        String requestedTargetKey = normalizeKey(requestedTargetId);
        if (requestedTargetKey == null || !allowedTargets.contains(requestedTargetKey)) {
            throw new IllegalArgumentException(message);
        }
    }

    private void ensureNoDuplicateReview(String reviewerId, String contractId) {
        String reviewerKey = normalizeKey(reviewerId);
        String contractKey = normalizeKey(contractId);
        if (reviewerKey == null || contractKey == null) {
            return;
        }

        boolean alreadyReviewed = streamAllReviews()
                .anyMatch(review -> reviewerKey.equals(normalizeKey(review.getReviewerId()))
                        && contractKey.equals(normalizeKey(review.getContractId())));

        if (alreadyReviewed) {
            throw new IllegalStateException("You have already submitted a review for this contract.");
        }
    }

    private Stream<Employer.EmployerReview> streamAllReviews() {
        return employerRepository.findAll().stream()
                .filter(Objects::nonNull)
                .flatMap(employer -> {
                    List<Employer.EmployerReview> reviews = employer.getReviews();
                    return reviews == null ? Stream.<Employer.EmployerReview>empty() : reviews.stream();
                })
                .filter(Objects::nonNull);
    }

    private void addIfPresent(Set<String> values, String value) {
        String normalized = normalizeKey(value);
        if (normalized != null) {
            values.add(normalized);
        }
    }

    private String resolveWorkspaceRole(User user) {
        String activeRole = currentUserService.getActiveWorkspaceRole();
        if ("EMPLOYER".equals(activeRole) || "FREELANCER".equals(activeRole)) {
            return activeRole;
        }

        if (currentUserService.hasRole(user, "EMPLOYER")) {
            return "EMPLOYER";
        }
        if (currentUserService.hasRole(user, "FREELANCER")) {
            return "FREELANCER";
        }

        throw new IllegalStateException("Only workspace users can access reviews.");
    }

    private String resolveReviewerName(User user, String fallback) {
        String fullName = normalizeOptional(user.getFullName());
        if (fullName != null) {
            return fullName;
        }
        String username = normalizeOptional(user.getUsername());
        if (username != null) {
            return username;
        }
        return fallback;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeKey(String value) {
        String normalized = normalizeOptional(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private List<String> sanitizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }

        return tags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(tag -> !tag.isBlank())
                .toList();
    }

    private String classifySentiment(int rating) {
        if (rating >= 4) {
            return "POSITIVE";
        }
        if (rating == 3) {
            return "NEUTRAL";
        }
        return "NEGATIVE";
    }

    private record ReviewEligibility(String contractId, String targetId) {}
}
