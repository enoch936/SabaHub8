package com.sabahub.service;

import com.sabahub.domain.*;
import com.sabahub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReelService {

    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final ReelCommentRepository reelCommentRepository;
    private final ReelSaveRepository reelSaveRepository;
    private final ReelViewRepository reelViewRepository;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PythonAiBridgeService aiBridgeService;

    public List<Reel> getFeed(int limit) {
        String currentUserId = currentUserService.getCurrentUserId();
        log.info("Fetching reel feed for user: {}", currentUserId);

        Pageable pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        List<Reel> reels = reelRepository.findByStatusOrderByCreatedAtDesc(Reel.Status.PUBLISHED, pageable).getContent();

        if (reels.isEmpty()) {
            seedData();
            reels = reelRepository.findByStatusOrderByCreatedAtDesc(Reel.Status.PUBLISHED, pageable).getContent();
        }

        return reels;
    }

    public Optional<Reel> getReel(String id) {
        return reelRepository.findById(id);
    }

    public Reel createReel(String title, String description, String videoUrl, String thumbnailUrl,
                           String audioId, List<String> tags) {
        var user = currentUserService.requireUser();
        log.info("Creating reel for user: {}", user.getId());

        Reel reel = Reel.builder()
                .title(title)
                .description(description)
                .videoUrl(videoUrl)
                .thumbnailUrl(thumbnailUrl)
                .audioId(audioId)
                .tags(tags)
                .authorId(user.getId())
                .authorName(user.getFullName())
                .authorProfilePicture(user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null)
                .status(Reel.Status.PUBLISHED)
                .viewCount(0)
                .likeCount(0)
                .commentCount(0)
                .saveCount(0)
                .shareCount(0)
                .createdAt(Instant.now())
                .build();

        return reelRepository.save(reel);
    }

    public void shareReel(String reelId) {
        String currentUserId = currentUserService.getCurrentUserId();
        reelRepository.findById(reelId).ifPresent(reel -> {
            reel.setShareCount(reel.getShareCount() + 1);
            reelRepository.save(reel);
            notificationService.createNotification(reel.getAuthorId(), "SHARE",
                    Map.of("userId", currentUserId, "reelId", reelId, "type", "share"));
        });
    }

    @Transactional
    public void likeReel(String reelId) {
        var user = currentUserService.requireUser();
        if (reelLikeRepository.findByReelIdAndUserId(reelId, user.getId()).isEmpty()) {
            reelLikeRepository.save(ReelLike.builder()
                    .reelId(reelId)
                    .userId(user.getId())
                    .createdAt(Instant.now())
                    .build());
            reelRepository.findById(reelId).ifPresent(reel ->
                notificationService.createNotification(reel.getAuthorId(), "LIKE",
                        Map.of("userId", user.getId(), "reelId", reelId, "type", "like"))
            );
            updateReelCounts(reelId);
        }
    }

    @Transactional
    public void unlikeReel(String reelId) {
        var user = currentUserService.requireUser();
        reelLikeRepository.findByReelIdAndUserId(reelId, user.getId())
                .ifPresent(like -> {
                    reelLikeRepository.delete(like);
                    updateReelCounts(reelId);
                });
    }

    public long getLikeCount(String reelId) {
        return reelLikeRepository.countByReelId(reelId);
    }

    @Transactional
    public ReelComment addComment(String reelId, String body) {
        var user = currentUserService.requireUser();
        ReelComment comment = ReelComment.builder()
                .reelId(reelId)
                .body(body)
                .authorId(user.getId())
                .authorName(user.getFullName())
                .authorProfilePicture(user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null)
                .createdAt(Instant.now())
                .build();
        ReelComment saved = reelCommentRepository.save(comment);
        reelRepository.findById(reelId).ifPresent(reel ->
            notificationService.createNotification(reel.getAuthorId(), "COMMENT",
                    Map.of("userId", user.getId(), "reelId", reelId, "commentId", saved.getId(), "type", "comment"))
        );
        updateReelCounts(reelId);
        return saved;
    }

    public Page<ReelComment> getComments(String reelId, Pageable pageable) {
        return reelCommentRepository.findByReelIdOrderByCreatedAtDesc(reelId, pageable);
    }

    @Transactional
    public void saveReel(String reelId) {
        var user = currentUserService.requireUser();
        if (reelSaveRepository.findByReelIdAndUserId(reelId, user.getId()).isEmpty()) {
            reelSaveRepository.save(ReelSave.builder()
                    .reelId(reelId)
                    .userId(user.getId())
                    .createdAt(Instant.now())
                    .build());
            reelRepository.findById(reelId).ifPresent(reel ->
                notificationService.createNotification(reel.getAuthorId(), "SAVE",
                        Map.of("userId", user.getId(), "reelId", reelId, "type", "save"))
            );
            updateReelCounts(reelId);
        }
    }

    @Transactional
    public void unsaveReel(String reelId) {
        var user = currentUserService.requireUser();
        reelSaveRepository.findByReelIdAndUserId(reelId, user.getId())
                .ifPresent(save -> {
                    reelSaveRepository.delete(save);
                    updateReelCounts(reelId);
                });
    }

    @Transactional
    public void trackView(String reelId) {
        var user = currentUserService.requireUser();
        ReelView view = ReelView.builder()
                .reelId(reelId)
                .userId(user.getId())
                .createdAt(Instant.now())
                .build();
        reelViewRepository.save(view);
        updateReelCounts(reelId);
    }

    public List<Reel> getUserReels(String authorId, int limit) {
        return reelRepository.findByAuthorIdOrderByCreatedAtDesc(authorId, PageRequest.of(0, limit)).getContent();
    }

    public void seedData() {
        boolean hasReels = reelRepository.findByStatusOrderByCreatedAtDesc(Reel.Status.PUBLISHED, PageRequest.of(0, 1)).getTotalElements() > 0;
        if (hasReels) {
            return;
        }

        log.info("Seeding reel data...");
        User author = userRepository.findAll().stream().findFirst().orElse(null);
        if (author == null) {
            log.info("No authors found for seeding reels.");
            return;
        }

        List<Reel> seedReels = new ArrayList<>();
        seedReels.add(Reel.builder()
                .title("Morning Coding Session")
                .description("Building the next-gen AI features for SabaHub")
                .videoUrl("https://www.w3schools.com/html/mov_bbb.mp4")
                .thumbnailUrl("https://api.dicebear.com/7.x/bottts/svg?seed=sabahub")
                .authorId(author.getId())
                .authorName(author.getFullName())
                .status(Reel.Status.PUBLISHED)
                .viewCount(0).likeCount(0).commentCount(0).saveCount(0).shareCount(0)
                .createdAt(Instant.now().minus(java.time.Duration.ofHours(1)))
                .build());

        seedReels.add(Reel.builder()
                .title("UI/UX Design Tips")
                .description("Quick tips for better user interfaces")
                .videoUrl("https://www.w3schools.com/html/mov_bbb.mp4")
                .thumbnailUrl("https://api.dicebear.com/7.x/bottts/svg?seed=sabahub")
                .authorId(author.getId())
                .authorName(author.getFullName())
                .status(Reel.Status.PUBLISHED)
                .viewCount(0).likeCount(0).commentCount(0).saveCount(0).shareCount(0)
                .createdAt(Instant.now().minus(java.time.Duration.ofHours(3)))
                .build());

        reelRepository.saveAll(seedReels);
        log.info("Seeded {} reels.", seedReels.size());
    }

    private void updateReelCounts(String reelId) {
        reelRepository.findById(reelId).ifPresent(reel -> {
            reel.setLikeCount((int) reelLikeRepository.countByReelId(reelId));
            reel.setCommentCount((int) reelCommentRepository.countByReelId(reelId));
            reel.setSaveCount((int) reelSaveRepository.countByReelId(reelId));
            reel.setViewCount((int) reelViewRepository.countByReelId(reelId));
            reelRepository.save(reel);
        });
    }
}
