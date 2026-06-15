package com.sabahub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabahub.domain.*;
import com.sabahub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocialService {

    private final SocialPostRepository postRepository;
    private final SocialLikeRepository likeRepository;
    private final SocialCommentRepository commentRepository;
    private final SocialFollowRepository followRepository;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final FreelancerRepository freelancerRepository;
    private final PythonAiBridgeService aiBridgeService;
    private final ObjectMapper objectMapper;

    // --- Posts ---

    public SocialPost createPost(String content, List<String> mediaAssetIds, List<String> tags, String category, String type) {
        User currentUser = currentUserService.requireUser();
        log.info("Creating social {} for user: {}", type, currentUser.getId());
        
        SocialPost.PostType postType = SocialPost.PostType.FEED;
        if ("STORY".equalsIgnoreCase(type)) {
            postType = SocialPost.PostType.STORY;
        }

        SocialPost post = SocialPost.builder()
                .authorId(currentUser.getId())
                .authorName(currentUser.getFullName())
                .authorProfilePicture(currentUser.getProfile() != null ? currentUser.getProfile().getProfilePictureUrl() : null)
                .content(content)
                .mediaAssetIds(mediaAssetIds)
                .tags(tags)
                .category(category)
                .type(postType)
                .createdAt(Instant.now())
                .build();

        return postRepository.save(post);
    }

    public Page<SocialPostResponse> getFeed(Pageable pageable) {
        String currentUserId = currentUserService.getCurrentUserId();
        log.info("Fetching social feed for user: {}", currentUserId);
        List<String> followingIds = followRepository.findAllByFollowerId(currentUserId)
                .stream()
                .map(SocialFollow::getFollowingId)
                .collect(Collectors.toList());
        
        // Include own posts in feed
        followingIds.add(currentUserId);

        // Ensure we sort by createdAt desc if not specified
        Pageable sortedPageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdAt").descending());
        }

        Page<SocialPost> feed = postRepository.findFeedPostsByAuthorIdIn(SocialPost.PostType.FEED, followingIds, sortedPageable);
        
        // Fallback to global feed if personal feed is empty
        if (feed.isEmpty()) {
            return getGlobalFeed(sortedPageable);
        }

        return feed.map(post -> toResponse(post, currentUserId));
    }

    public Page<SocialPostResponse> getGlobalFeed(Pageable pageable) {
        String currentUserId = currentUserService.getCurrentUserId();
        Pageable sortedPageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("createdAt").descending());
        }
        
        Page<SocialPost> posts = postRepository.findGlobalFeedPosts(SocialPost.PostType.FEED, sortedPageable);
        
        // Seed data if still empty and it's the first page
        if (posts.isEmpty() && pageable.getPageNumber() == 0) {
            seedData();
            posts = postRepository.findGlobalFeedPosts(SocialPost.PostType.FEED, sortedPageable);
        }
        
        return posts.map(post -> toResponse(post, currentUserId));
    }

    private SocialPostResponse toResponse(SocialPost post, String currentUserId) {
        boolean isLiked = currentUserId != null && likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        boolean isSaved = currentUserId != null && saveRepository.existsByPostIdAndUserId(post.getId(), currentUserId);

        return SocialPostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .authorName(post.getAuthorName())
                .authorProfilePicture(post.getAuthorProfilePicture())
                .content(post.getContent())
                .mediaAssetIds(post.getMediaAssetIds())
                .type(post.getType() != null ? post.getType().name() : "FEED")
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .saveCount(post.getSaveCount())
                .shareCount(post.getShareCount())
                .tags(post.getTags())
                .category(post.getCategory())
                .createdAt(post.getCreatedAt())
                .isLiked(isLiked)
                .isSaved(isSaved)
                .build();
    }

    public List<User> getActiveStoryUsers() {
        // 1. Users with social STORIES in last 24h
        Instant last24h = Instant.now().minus(java.time.Duration.ofHours(24));
        List<SocialPost> recentStories = postRepository.findAllByTypeOrderByCreatedAtDesc(SocialPost.PostType.STORY, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(last24h))
                .collect(Collectors.toList());

        Set<String> userIds = recentStories.stream()
                .map(SocialPost::getAuthorId)
                .collect(Collectors.toSet());

        if (userIds.isEmpty()) {
            log.info("No active stories found, triggering seed...");
            seedData();
            // Try to find users again after seed
            recentStories = postRepository.findAllByTypeOrderByCreatedAtDesc(SocialPost.PostType.STORY, Pageable.unpaged())
                    .getContent()
                    .stream()
                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(last24h))
                    .collect(Collectors.toList());
            recentStories.forEach(p -> userIds.add(p.getAuthorId()));
        }

        return userRepository.findAllById(userIds);
    }

    public List<SocialPost> getUserStories(String userId) {
        // Only Social Stories (Removed Portfolio logic per user request)
        Instant last24h = Instant.now().minus(java.time.Duration.ofHours(24));
        return postRepository.findAllByTypeAndAuthorIdOrderByCreatedAtDesc(SocialPost.PostType.STORY, userId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(last24h))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    public Page<SocialPostResponse> getUserPosts(String userId, Pageable pageable) {
        String currentUserId = currentUserService.getCurrentUserId();
        return postRepository.findFeedPostsByAuthorId(SocialPost.PostType.FEED, userId, pageable)
                .map(post -> toResponse(post, currentUserId));
    }

    public Page<SocialPostResponse> getLikedPosts(String userId, Pageable pageable) {
        String currentUserId = currentUserService.getCurrentUserId();
        List<String> postIds = likeRepository.findAllByUserId(userId)
                .stream()
                .map(SocialLike::getPostId)
                .collect(Collectors.toList());
        
        return postRepository.findAllByIdIn(postIds, pageable)
                .map(post -> toResponse(post, currentUserId));
    }

    public Page<SocialPostResponse> getSavedPosts(String userId, Pageable pageable) {
        String currentUserId = currentUserService.getCurrentUserId();
        List<String> postIds = saveRepository.findAllByUserId(userId)
                .stream()
                .map(SocialSave::getPostId)
                .collect(Collectors.toList());
        
        return postRepository.findAllByIdIn(postIds, pageable)
                .map(post -> toResponse(post, currentUserId));
    }

    public List<Map<String, String>> getMediaGallery(String userId) {
        return postRepository.findAllByTypeAndAuthorIdOrderByCreatedAtDesc(SocialPost.PostType.FEED, userId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(p -> p.getMediaAssetIds() != null && !p.getMediaAssetIds().isEmpty())
                .flatMap(p -> p.getMediaAssetIds().stream().map(url -> Map.of("url", url, "postId", p.getId())))
                .collect(Collectors.toList());
    }

    // --- Following ---

    public long getFollowerCount(String userId) {
        return followRepository.countByFollowingId(userId);
    }

    public long getFollowingCount(String userId) {
        return followRepository.countByFollowerId(userId);
    }

    public long getTotalLikesByAuthor(String userId) {
        List<String> postIds = postRepository.findAllByAuthorId(userId, Pageable.unpaged())
                .stream()
                .map(SocialPost::getId)
                .collect(Collectors.toList());
        return likeRepository.countByPostIdIn(postIds);
    }

    public boolean isFollowing(String followerId, String followingId) {
        return followRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    public void follow(String userId) {
        String currentUserId = currentUserService.getCurrentUserId();
        if (currentUserId.equals(userId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        if (!followRepository.existsByFollowerIdAndFollowingId(currentUserId, userId)) {
            followRepository.save(SocialFollow.builder()
                    .followerId(currentUserId)
                    .followingId(userId)
                    .createdAt(Instant.now())
                    .build());
        }
    }

    public void unfollow(String userId) {
        String currentUserId = currentUserService.getCurrentUserId();
        followRepository.findByFollowerIdAndFollowingId(currentUserId, userId)
                .ifPresent(followRepository::delete);
    }

    // --- Likes ---

    public void likePost(String postId) {
        String currentUserId = currentUserService.getCurrentUserId();
        if (!likeRepository.existsByPostIdAndUserId(postId, currentUserId)) {
            likeRepository.save(SocialLike.builder()
                    .postId(postId)
                    .userId(currentUserId)
                    .createdAt(Instant.now())
                    .build());
            
            updatePostCounts(postId);
        }
    }

    public void unlikePost(String postId) {
        String currentUserId = currentUserService.getCurrentUserId();
        likeRepository.findByPostIdAndUserId(postId, currentUserId)
                .ifPresent(like -> {
                    likeRepository.delete(like);
                    updatePostCounts(postId);
                });
    }

    // --- Saves ---

    public void savePost(String postId) {
        String currentUserId = currentUserService.getCurrentUserId();
        if (!saveRepository.existsByPostIdAndUserId(postId, currentUserId)) {
            saveRepository.save(SocialSave.builder()
                    .postId(postId)
                    .userId(currentUserId)
                    .createdAt(Instant.now())
                    .build());
            updatePostCounts(postId);
        }
    }

    public void unsavePost(String postId) {
        String currentUserId = currentUserService.getCurrentUserId();
        saveRepository.findByPostIdAndUserId(postId, currentUserId)
                .ifPresent(save -> {
                    saveRepository.delete(save);
                    updatePostCounts(postId);
                });
    }

    // --- Comments ---

    public SocialComment addComment(String postId, String content) {
        User user = currentUserService.requireUser();
        SocialComment comment = commentRepository.save(SocialComment.builder()
                .postId(postId)
                .authorId(user.getId())
                .authorName(user.getFullName())
                .authorProfilePicture(user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null)
                .content(content)
                .createdAt(Instant.now())
                .build());
        
        updatePostCounts(postId);
        return comment;
    }

    public Page<SocialComment> getComments(String postId, Pageable pageable) {
        return commentRepository.findAllByPostIdOrderByCreatedAtAsc(postId, pageable);
    }

    public void seedData() {
        // Check both separately
        boolean hasFeed = postRepository.findGlobalFeedPosts(SocialPost.PostType.FEED, PageRequest.of(0, 1)).getTotalElements() > 0;
        boolean hasStories = postRepository.findAllByType(SocialPost.PostType.STORY, PageRequest.of(0, 1)).getTotalElements() > 0;

        if (hasFeed && hasStories) {
            return;
        }

        log.info("Seeding social items (Feed missing: {}, Stories missing: {})...", !hasFeed, !hasStories);
        // Prefer an existing user, but fallback to system user
        User author = userRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        
        if (author == null) {
            log.info("No authors found for seeding.");
            return;
        }

        List<SocialPost> seedItems = new ArrayList<>();
        
        if (!hasFeed) {
            seedItems.add(SocialPost.builder()
                .authorId(author.getId())
                .authorName(author.getFullName())
                .authorProfilePicture("https://api.dicebear.com/7.x/bottts/svg?seed=sabahub")
                .content("Excited to launch the new SabaHub AI ecosystem! Connecting the world's best talent with strategic opportunities. 🚀 #SabaHub #Launch #AI")
                .type(SocialPost.PostType.FEED)
                .category("Announcement")
                .tags(Arrays.asList("SabaHub", "AI", "Launch"))
                .createdAt(Instant.now().minus(java.time.Duration.ofHours(2)))
                .build());
            
            seedItems.add(SocialPost.builder()
                .authorId(author.getId())
                .authorName(author.getFullName())
                .authorProfilePicture("https://api.dicebear.com/7.x/bottts/svg?seed=sabahub")
                .content("Just completed a major brand overhaul for a Silicon Valley startup. The future of motion design is interactive! Check out our new components.")
                .type(SocialPost.PostType.FEED)
                .category("Design")
                .tags(Arrays.asList("MotionDesign", "Portfolio", "Branding"))
                .createdAt(Instant.now().minus(java.time.Duration.ofHours(5)))
                .build());
        }

        if (!hasStories) {
            seedItems.add(SocialPost.builder()
                .authorId(author.getId())
                .authorName(author.getFullName())
                .authorProfilePicture("https://api.dicebear.com/7.x/bottts/svg?seed=sabahub")
                .content("Morning routine: Coffee, code, and community. What are you all working on today? Drop a comment below! 👇")
                .type(SocialPost.PostType.STORY)
                .category("Daily")
                .createdAt(Instant.now().minus(java.time.Duration.ofMinutes(45)))
                .build());
        }

        if (!seedItems.isEmpty()) {
            postRepository.saveAll(seedItems);
            log.info("Successfully seeded {} social items.", seedItems.size());
        }
    }

    private void updatePostCounts(String postId) {
        postRepository.findById(postId).ifPresent(post -> {
            post.setLikeCount((int) likeRepository.countByPostId(postId));
            post.setCommentCount((int) commentRepository.countByPostId(postId));
            postRepository.save(post);
        });
    }
}
