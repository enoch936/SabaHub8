package com.sabahub.service;

import com.sabahub.domain.Freelancer;
import com.sabahub.domain.FreelancerProjectPost;
import com.sabahub.domain.Gig;
import com.sabahub.domain.User;
import com.sabahub.repository.FreelancerProjectPostRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.GigRepository;
import com.sabahub.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MarketplaceSearchService {

    private final CurrentUserService currentUserService;
    private final FreelancerRepository freelancerRepository;
    private final GigRepository gigRepository;
    private final FreelancerProjectPostRepository projectPostRepository;
    private final UserRepository userRepository;
    private final FreelancerProfileCompletionService profileCompletionService;

    public MarketplaceSearchService(CurrentUserService currentUserService,
                                    FreelancerRepository freelancerRepository,
                                    GigRepository gigRepository,
                                    FreelancerProjectPostRepository projectPostRepository,
                                    UserRepository userRepository,
                                    FreelancerProfileCompletionService profileCompletionService) {
        this.currentUserService = currentUserService;
        this.freelancerRepository = freelancerRepository;
        this.gigRepository = gigRepository;
        this.projectPostRepository = projectPostRepository;
        this.userRepository = userRepository;
        this.profileCompletionService = profileCompletionService;
    }

    public Map<String, Object> searchMarketplace(String query,
                                                 int limit,
                                                 String skill,
                                                 String category,
                                                 Double minBudget,
                                                 Double maxBudget,
                                                 Double minPrice,
                                                 Double maxPrice,
                                                 String mediaFilter) {
        User requester = currentUserService.requireUser();
        boolean hasWorkspaceRole = currentUserService.hasRole(requester, "EMPLOYER")
                || currentUserService.hasRole(requester, "FREELANCER");
        if (!hasWorkspaceRole) {
            throw new IllegalStateException("Only workspace users can access marketplace search.");
        }

        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedSkill = skill == null ? "" : skill.trim().toLowerCase(Locale.ROOT);
        String normalizedCategory = category == null ? "" : category.trim().toLowerCase(Locale.ROOT);
        String normalizedMediaFilter = mediaFilter == null ? "ALL" : mediaFilter.trim().toUpperCase(Locale.ROOT);
        int safeLimit = Math.min(Math.max(limit, 1), 50);

        List<Freelancer> completeFreelancers = freelancerRepository.findAll().stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()))
                .filter(profileCompletionService::isProfileComplete)
                .toList();

        Set<String> freelancerUserIds = completeFreelancers.stream()
                .map(Freelancer::getUserId)
                .filter(this::hasText)
                .collect(Collectors.toSet());

        Map<String, User> usersByReference = new LinkedHashMap<>();
        for (Freelancer freelancer : completeFreelancers) {
            String userReference = normalizeReference(freelancer.getUserId());
            if (userReference == null || usersByReference.containsKey(userReference)) {
                continue;
            }

            User owner = resolveUserByReference(freelancer.getUserId());
            if (owner != null) {
                usersByReference.put(userReference, owner);
            }
        }

        List<Map<String, Object>> talents = completeFreelancers.stream()
                .filter(f -> matchesFreelancer(normalizedQuery, f, usersByReference.get(normalizeReference(f.getUserId()))))
                .limit(safeLimit)
                .map(f -> {
                    User owner = usersByReference.get(normalizeReference(f.getUserId()));
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("freelancerId", f.getId());
                    item.put("userId", f.getUserId());
                    item.put("name", owner != null ? owner.getFullName() : null);
                    item.put("professionalTitle", f.getProfessionalTitle());
                    item.put("rating", f.getRating());
                    item.put("profilePicture", f.getProfilePicture());
                    item.put("coverImage", f.getCoverImage());
                    item.put("portfolioThumbnailUrl", firstPortfolioImage(f));
                    item.put("portfolioImageUrls", portfolioImageUrls(f));
                    item.put("skills", f.getSkills() != null
                            ? f.getSkills().stream().map(Freelancer.Skill::getName).toList()
                            : List.of());
                    return item;
                })
                .toList();

        Map<String, Freelancer> freelancerByReference = new LinkedHashMap<>();
        for (Freelancer freelancer : completeFreelancers) {
            addFreelancerReference(freelancerByReference, freelancer.getId(), freelancer);
            addFreelancerReference(freelancerByReference, freelancer.getUserId(), freelancer);
        }

        List<Map<String, Object>> gigs = gigRepository.findVisibleByStatusOrderByUpdatedAtDesc(Gig.Status.PUBLISHED).stream()
            .filter(g -> g.getStatus() == Gig.Status.PUBLISHED)
                .filter(g -> resolveFreelancerByReference(freelancerByReference, g.getFreelancerId()) != null)
            .filter(g -> matchesGig(normalizedQuery, normalizedSkill, g))
            .filter(g -> matchesGigFilters(g, minPrice, maxPrice, normalizedMediaFilter))
                .limit(safeLimit)
                .map(g -> {
                    Freelancer ownerFreelancer = resolveFreelancerByReference(freelancerByReference, g.getFreelancerId());
                    User ownerUser = ownerFreelancer != null ? usersByReference.get(normalizeReference(ownerFreelancer.getUserId())) : null;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("gigId", g.getId());
                    item.put("title", g.getTitle());
                    item.put("description", g.getDescription());
                    item.put("skills", g.getSkills() != null ? g.getSkills() : List.of());
                    item.put("price", g.getPrice());
                    item.put("currency", g.getCurrency());
                    item.put("deliveryDays", g.getDeliveryDays());
                    item.put("thumbnailUrl", g.getThumbnailUrl());
                    item.put("sampleImageUrls", g.getSampleImageUrls() != null ? g.getSampleImageUrls() : List.of());
                    item.put("sampleVideoUrls", g.getSampleVideoUrls() != null ? g.getSampleVideoUrls() : List.of());
                    item.put("sampleDocumentUrls", g.getSampleDocumentUrls() != null ? g.getSampleDocumentUrls() : List.of());
                    item.put("freelancerId", ownerFreelancer != null ? ownerFreelancer.getId() : null);
                    item.put("freelancerUserId", ownerFreelancer != null ? ownerFreelancer.getUserId() : null);
                    item.put("freelancerName", ownerUser != null ? ownerUser.getFullName() : null);
                    item.put("status", g.getStatus() != null ? g.getStatus().name() : null);
                    return item;
                })
                .toList();

        List<Map<String, Object>> projectPosts = projectPostRepository.findVisibleByStatusOrderByUpdatedAtDesc(FreelancerProjectPost.Status.PUBLISHED).stream()
                .filter(post -> post.getStatus() == FreelancerProjectPost.Status.PUBLISHED)
                .filter(post -> resolveFreelancerByReference(freelancerByReference, post.getFreelancerId()) != null)
                .filter(post -> matchesProjectPost(normalizedQuery, normalizedSkill, normalizedCategory, post))
                .filter(post -> matchesProjectPostFilters(post, minBudget, maxBudget, normalizedMediaFilter))
                .limit(safeLimit)
                .map(post -> {
                    Freelancer ownerFreelancer = resolveFreelancerByReference(freelancerByReference, post.getFreelancerId());
                    User ownerUser = ownerFreelancer != null ? usersByReference.get(normalizeReference(ownerFreelancer.getUserId())) : null;
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("projectPostId", post.getId());
                    item.put("title", post.getTitle());
                    item.put("description", post.getDescription());
                    item.put("category", post.getCategory());
                    item.put("skills", post.getSkills() != null ? post.getSkills() : List.of());
                    item.put("budgetMin", post.getBudgetMin());
                    item.put("budgetMax", post.getBudgetMax());
                    item.put("currency", post.getCurrency());
                    item.put("deliveryDays", post.getDeliveryDays());
                    item.put("thumbnailUrl", post.getThumbnailUrl());
                    item.put("sampleImageUrls", post.getSampleImageUrls() != null ? post.getSampleImageUrls() : List.of());
                    item.put("sampleVideoUrls", post.getSampleVideoUrls() != null ? post.getSampleVideoUrls() : List.of());
                    item.put("sampleDocumentUrls", post.getSampleDocumentUrls() != null ? post.getSampleDocumentUrls() : List.of());
                    item.put("freelancerId", ownerFreelancer != null ? ownerFreelancer.getId() : null);
                    item.put("freelancerUserId", ownerFreelancer != null ? ownerFreelancer.getUserId() : null);
                    item.put("freelancerName", ownerUser != null ? ownerUser.getFullName() : null);
                    item.put("status", post.getStatus() != null ? post.getStatus().name() : null);
                    return item;
                })
                .toList();

        List<Map<String, Object>> stories = new ArrayList<>();
        for (Freelancer freelancer : completeFreelancers) {
            if (freelancer.getPortfolio() == null || freelancer.getPortfolio().isEmpty()) {
                continue;
            }

            User ownerUser = usersByReference.get(normalizeReference(freelancer.getUserId()));
            for (Freelancer.PortfolioItem portfolioItem : freelancer.getPortfolio()) {
                if (portfolioItem == null) {
                    continue;
                }
                if (!matchesPortfolioStory(normalizedQuery, normalizedSkill, normalizedCategory, portfolioItem)) {
                    continue;
                }
                if (!matchesPortfolioStoryFilters(portfolioItem, normalizedMediaFilter)) {
                    continue;
                }

                List<String> storyImages = portfolioItem.getImages() == null
                        ? List.of()
                        : portfolioItem.getImages().stream().filter(this::hasText).toList();
                String storyId = firstNonBlank(
                        portfolioItem.getId(),
                        "story-" + normalizeReference(freelancer.getId()) + "-" + Math.abs(Objects.hash(
                                firstNonBlank(portfolioItem.getTitle(), ""),
                                firstNonBlank(portfolioItem.getProjectUrl(), ""),
                                firstNonBlank(portfolioItem.getDescription(), "")
                        ))
                );

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("storyId", storyId);
                item.put("status", "PUBLISHED");
                item.put("title", firstNonBlank(portfolioItem.getTitle(), "Portfolio Story"));
                item.put("description", portfolioItem.getDescription());
                item.put("category", portfolioItem.getCategory());
                item.put("technologies", portfolioItem.getTechnologies() == null ? List.of() : portfolioItem.getTechnologies());
                item.put("imageUrls", storyImages);
                item.put("projectUrl", portfolioItem.getProjectUrl());
                item.put("completedAt", portfolioItem.getCompletedAt());
                item.put("freelancerId", freelancer.getId());
                item.put("freelancerUserId", freelancer.getUserId());
                item.put("freelancerName", ownerUser != null ? ownerUser.getFullName() : null);
                item.put("profilePicture", freelancer.getProfilePicture());
                stories.add(item);

                if (stories.size() >= safeLimit) {
                    break;
                }
            }
            if (stories.size() >= safeLimit) {
                break;
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("query", query == null ? "" : query);
        response.put("talents", talents);
        response.put("projectPosts", projectPosts);
        response.put("gigs", gigs);
        response.put("stories", stories);
        response.put("counts", Map.of(
                "talents", talents.size(),
                "projectPosts", projectPosts.size(),
                "gigs", gigs.size(),
                "stories", stories.size()
        ));
        return response;
    }

    private boolean matchesFreelancer(String query, Freelancer freelancer, User user) {
        if (!hasText(query)) {
            return true;
        }
        String skills = freelancer.getSkills() == null
                ? ""
                : freelancer.getSkills().stream()
                        .map(Freelancer.Skill::getName)
                        .filter(this::hasText)
                        .collect(Collectors.joining(" "));
        String categories = freelancer.getCategories() == null ? "" : String.join(" ", freelancer.getCategories());
        String searchable = String.join(" ",
                nullSafe(user != null ? user.getFullName() : null),
                nullSafe(freelancer.getProfessionalTitle()),
                nullSafe(freelancer.getBio()),
                skills,
                categories
        ).toLowerCase(Locale.ROOT);
        return searchable.contains(query);
    }

    private boolean matchesGig(String query, String skill, Gig gig) {
        if (!hasText(query)) {
            return matchesSkill(skill, gig.getSkills());
        }
        String skills = gig.getSkills() == null ? "" : String.join(" ", gig.getSkills());
        String searchable = String.join(" ",
                nullSafe(gig.getTitle()),
                nullSafe(gig.getDescription()),
                skills
        ).toLowerCase(Locale.ROOT);
        return searchable.contains(query) && matchesSkill(skill, gig.getSkills());
    }

    private boolean matchesProjectPost(String query, String skill, String category, FreelancerProjectPost post) {
        if (!hasText(query)) {
            return matchesSkill(skill, post.getSkills()) && matchesCategory(category, post.getCategory());
        }
        String skills = post.getSkills() == null ? "" : String.join(" ", post.getSkills());
        String searchable = String.join(" ",
                nullSafe(post.getTitle()),
                nullSafe(post.getDescription()),
                nullSafe(post.getCategory()),
                skills
        ).toLowerCase(Locale.ROOT);
        return searchable.contains(query)
                && matchesSkill(skill, post.getSkills())
                && matchesCategory(category, post.getCategory());
    }

    private boolean matchesPortfolioStory(String query,
                                          String skill,
                                          String category,
                                          Freelancer.PortfolioItem portfolioItem) {
        if (!hasText(query)) {
            return matchesSkill(skill, portfolioItem.getTechnologies())
                    && matchesCategory(category, portfolioItem.getCategory())
                    && isPublishedStory(portfolioItem);
        }

        String technologies = portfolioItem.getTechnologies() == null ? "" : String.join(" ", portfolioItem.getTechnologies());
        String searchable = String.join(" ",
                nullSafe(portfolioItem.getTitle()),
                nullSafe(portfolioItem.getDescription()),
                nullSafe(portfolioItem.getCategory()),
                nullSafe(portfolioItem.getTestimonial()),
                technologies
        ).toLowerCase(Locale.ROOT);

        return searchable.contains(query)
                && matchesSkill(skill, portfolioItem.getTechnologies())
                && matchesCategory(category, portfolioItem.getCategory())
                && isPublishedStory(portfolioItem);
    }

    private boolean matchesSkill(String skill, List<String> skills) {
        if (!hasText(skill)) {
            return true;
        }
        if (skills == null || skills.isEmpty()) {
            return false;
        }
        return skills.stream()
                .filter(this::hasText)
                .map(entry -> entry.toLowerCase(Locale.ROOT))
                .anyMatch(entry -> entry.contains(skill));
    }

    private boolean matchesCategory(String category, String sourceCategory) {
        if (!hasText(category)) {
            return true;
        }
        if (!hasText(sourceCategory)) {
            return false;
        }
        return sourceCategory.toLowerCase(Locale.ROOT).contains(category);
    }

    private boolean matchesGigFilters(Gig gig, Double minPrice, Double maxPrice, String mediaFilter) {
        if (minPrice != null) {
            if (gig.getPrice() == null || gig.getPrice() < minPrice) {
                return false;
            }
        }
        if (maxPrice != null) {
            if (gig.getPrice() == null || gig.getPrice() > maxPrice) {
                return false;
            }
        }
        return hasRequestedMedia(mediaFilter, gig.getSampleImageUrls(), gig.getSampleVideoUrls(), gig.getSampleDocumentUrls());
    }

    private boolean matchesProjectPostFilters(FreelancerProjectPost post,
                                              Double minBudget,
                                              Double maxBudget,
                                              String mediaFilter) {
        if (minBudget != null) {
            Double upperBound = post.getBudgetMax() != null ? post.getBudgetMax() : post.getBudgetMin();
            if (upperBound == null || upperBound < minBudget) {
                return false;
            }
        }
        if (maxBudget != null) {
            Double lowerBound = post.getBudgetMin() != null ? post.getBudgetMin() : post.getBudgetMax();
            if (lowerBound == null || lowerBound > maxBudget) {
                return false;
            }
        }
        return hasRequestedMedia(mediaFilter, post.getSampleImageUrls(), post.getSampleVideoUrls(), post.getSampleDocumentUrls());
    }

    private boolean matchesPortfolioStoryFilters(Freelancer.PortfolioItem portfolioItem, String mediaFilter) {
        List<String> images = portfolioItem.getImages() == null
                ? List.of()
                : portfolioItem.getImages().stream().filter(this::hasText).toList();
        List<String> documents = hasText(portfolioItem.getProjectUrl()) ? List.of(portfolioItem.getProjectUrl()) : List.of();
        return hasRequestedMedia(mediaFilter, images, List.of(), documents);
    }

    private boolean hasRequestedMedia(String mediaFilter,
                                      List<String> imageUrls,
                                      List<String> videoUrls,
                                      List<String> documentUrls) {
        String resolved = hasText(mediaFilter) ? mediaFilter : "ALL";
        if ("ALL".equals(resolved)) {
            return true;
        }

        int imageCount = imageUrls == null ? 0 : imageUrls.size();
        int videoCount = videoUrls == null ? 0 : videoUrls.size();
        int documentCount = documentUrls == null ? 0 : documentUrls.size();

        return switch (resolved) {
            case "VISUAL" -> imageCount > 0 || videoCount > 0;
            case "VIDEO" -> videoCount > 0;
            case "DOCUMENT" -> documentCount > 0;
            default -> true;
        };
    }

    private String nullSafe(String input) {
        return input == null ? "" : input;
    }

    private void addFreelancerReference(Map<String, Freelancer> map, String reference, Freelancer freelancer) {
        String normalized = normalizeReference(reference);
        if (normalized != null) {
            map.putIfAbsent(normalized, freelancer);
        }
    }

    private Freelancer resolveFreelancerByReference(Map<String, Freelancer> map, String reference) {
        String normalized = normalizeReference(reference);
        return normalized == null ? null : map.get(normalized);
    }

    private User resolveUserByReference(String reference) {
        if (!hasText(reference)) {
            return null;
        }
        return userRepository.findById(reference)
                .or(() -> userRepository.findByEmailIgnoreCase(reference))
                .orElse(null);
    }

    private String normalizeReference(String value) {
        if (!hasText(value)) {
            return null;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isPublishedStory(Freelancer.PortfolioItem portfolioItem) {
        if (portfolioItem == null) {
            return false;
        }
        return hasText(portfolioItem.getTitle())
                || hasText(portfolioItem.getDescription())
                || hasText(portfolioItem.getProjectUrl())
                || (portfolioItem.getImages() != null && portfolioItem.getImages().stream().anyMatch(this::hasText));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private String firstPortfolioImage(Freelancer freelancer) {
        return portfolioImageUrls(freelancer).stream().findFirst().orElse(null);
    }

    private List<String> portfolioImageUrls(Freelancer freelancer) {
        if (freelancer.getPortfolio() == null) {
            return List.of();
        }

        return freelancer.getPortfolio().stream()
                .filter(item -> item.getImages() != null)
                .flatMap(item -> item.getImages().stream())
                .filter(this::hasText)
                .limit(6)
                .toList();
    }

    private boolean hasText(String input) {
        return input != null && !input.isBlank();
    }
}
