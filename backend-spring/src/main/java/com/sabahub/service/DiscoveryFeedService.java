package com.sabahub.service;

import com.sabahub.domain.*;
import com.sabahub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscoveryFeedService {

    private final CurrentUserService currentUserService;
    private final PythonAiBridgeService aiBridgeService;
    private final ContentRepository contentRepository;
    private final JobRepository jobRepository;
    private final FreelancerRepository freelancerRepository;
    private final SocialPostRepository socialPostRepository;

    public Map<String, Object> getFeed(String category, int limit, int offset) {
        log.info("Fetching discovery feed for category: {}, limit: {}, offset: {}", category, limit, offset);
        
        List<Map<String, Object>> items = new ArrayList<>();
        int page = offset / limit;
        Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());

        if (category == null || "All".equalsIgnoreCase(category)) {
            // Aggregate a mix for "All"
            int subLimit = Math.max(1, limit / 4);
            items.addAll(fetchJobs(subLimit));
            items.addAll(fetchTalents(subLimit));
            items.addAll(fetchPosts(subLimit));
            items.addAll(fetchBlogs(subLimit));
        } else if ("Job".equalsIgnoreCase(category)) {
            items.addAll(fetchJobs(limit));
        } else if ("Talent".equalsIgnoreCase(category)) {
            items.addAll(fetchTalents(limit));
        } else if ("Post".equalsIgnoreCase(category)) {
            items.addAll(fetchPosts(limit));
        } else if ("Announcement".equalsIgnoreCase(category)) {
            items.addAll(fetchAnnouncements(limit));
        } else {
            // Default to blogs or specific content type if category matches
            items.addAll(fetchBlogs(limit));
        }

        // Shuffle if "All" to make it look dynamic, otherwise keep sorted
        if (category == null || "All".equalsIgnoreCase(category)) {
            Collections.shuffle(items);
        }

        Map<String, Object> feed = new LinkedHashMap<>();
        feed.put("items", items);
        feed.put("category", category != null ? category : "All");
        feed.put("offset", offset);
        feed.put("limit", limit);

        aiBridgeService.rerankDiscovery(feed).ifPresent(ranked -> {
            if (ranked.containsKey("items")) {
                feed.put("items", ranked.get("items"));
            }
        });

        return feed;
    }

    private List<Map<String, Object>> fetchJobs(int limit) {
        return jobRepository.findByStatus(Job.Status.OPEN, PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .getContent().stream()
                .map(job -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", job.getId());
                    item.put("type", "Job");
                    item.put("title", job.getTitle());
                    item.put("description", job.getDescription());
                    item.put("budget", job.getBudgetMax());
                    item.put("hourlyRate", job.getPricingModel() == Job.PricingModel.HOURLY ? job.getBudgetMax() : null);
                    item.put("companyName", job.getCompanyName());
                    item.put("skills", job.getSkills());
                    item.put("createdAt", job.getCreatedAt());
                    return item;
                }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> fetchTalents(int limit) {
        return freelancerRepository.findAll(PageRequest.of(0, limit, Sort.by("talentRatingScore").descending()))
                .getContent().stream()
                .map(f -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", f.getId());
                    item.put("type", "Talent");
                    item.put("name", f.getProfessionalTitle() != null ? f.getProfessionalTitle() : "Verified Professional");
                    item.put("professionalTitle", f.getProfessionalTitle());
                    item.put("description", f.getBio());
                    item.put("profilePicture", f.getProfilePicture());
                    item.put("hourlyRate", f.getHourlyRate());
                    item.put("skills", f.getSkills() != null ? f.getSkills().stream().map(Freelancer.Skill::getName).collect(Collectors.toList()) : null);
                    item.put("isVerified", "VERIFIED".equalsIgnoreCase(f.getVerificationStatus()));
                    return item;
                }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> fetchPosts(int limit) {
        return socialPostRepository.findGlobalFeedPosts(SocialPost.PostType.FEED, PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .getContent().stream()
                .map(post -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", post.getId());
                    item.put("type", "Post");
                    item.put("title", post.getAuthorName() + "'s Moment");
                    item.put("description", post.getContent());
                    item.put("thumbnailUrl", post.getMediaAssetIds() != null && !post.getMediaAssetIds().isEmpty() ? post.getMediaAssetIds().get(0) : null);
                    item.put("authorName", post.getAuthorName());
                    item.put("createdAt", post.getCreatedAt());
                    return item;
                }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> fetchBlogs(int limit) {
        return contentRepository.findByTypeAndStatus(ContentItem.Type.BLOG, ContentItem.Status.PUBLISHED)
                .stream().limit(limit)
                .map(content -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", content.getId());
                    item.put("type", "Announcement"); // Mapping Blog to Announcement for UI
                    item.put("title", content.getTitle());
                    item.put("description", content.getBody());
                    item.put("createdAt", content.getCreatedAt());
                    return item;
                }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> fetchAnnouncements(int limit) {
        return contentRepository.findByTypeAndStatus(ContentItem.Type.ANNOUNCEMENT, ContentItem.Status.PUBLISHED)
                .stream().limit(limit)
                .map(content -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", content.getId());
                    item.put("type", "Announcement");
                    item.put("title", content.getTitle());
                    item.put("description", content.getBody());
                    item.put("createdAt", content.getCreatedAt());
                    return item;
                }).collect(Collectors.toList());
    }
}
