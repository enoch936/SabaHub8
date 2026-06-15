package com.sabahub.service;

import com.sabahub.domain.*;
import com.sabahub.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ReelService {

    private final CurrentUserService currentUserService;
    private final ReelRepository reelRepository;
    private final ReelLikeRepository reelLikeRepository;
    private final ReelCommentRepository reelCommentRepository;
    private final ReelSaveRepository reelSaveRepository;
    private final ReelViewRepository reelViewRepository;

    public ReelService(CurrentUserService currentUserService,
                       ReelRepository reelRepository,
                       ReelLikeRepository reelLikeRepository,
                       ReelCommentRepository reelCommentRepository,
                       ReelSaveRepository reelSaveRepository,
                       ReelViewRepository reelViewRepository) {
        this.currentUserService = currentUserService;
        this.reelRepository = reelRepository;
        this.reelLikeRepository = reelLikeRepository;
        this.reelCommentRepository = reelCommentRepository;
        this.reelSaveRepository = reelSaveRepository;
        this.reelViewRepository = reelViewRepository;
    }

    public List<Reel> getFeed(int limit) {
        return reelRepository.findByStatusOrderByCreatedAtDesc(Reel.Status.PUBLISHED, PageRequest.of(0, limit)).getContent();
    }

    public Optional<Reel> getReel(String id) {
        return reelRepository.findById(id);
    }

    public Reel createReel(String title, String description, String videoUrl, String thumbnailUrl,
                           String audioId, List<String> tags) {
        var user = currentUserService.requireUser();
        Reel reel = new Reel();
        reel.setTitle(title);
        reel.setDescription(description);
        reel.setVideoUrl(videoUrl);
        reel.setThumbnailUrl(thumbnailUrl);
        reel.setAudioId(audioId);
        reel.setTags(tags);
        reel.setAuthorId(user.getId());
        reel.setAuthorName(user.getFullName());
        reel.setAuthorProfilePicture(user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null);
        return reelRepository.save(reel);
    }

    @Transactional
    public void likeReel(String reelId) {
        var user = currentUserService.requireUser();
        if (reelLikeRepository.findByReelIdAndUserId(reelId, user.getId()).isEmpty()) {
            ReelLike like = new ReelLike();
            like.setReelId(reelId);
            like.setUserId(user.getId());
            reelLikeRepository.save(like);
            reelRepository.findById(reelId).ifPresent(r -> {
                r.setLikeCount(r.getLikeCount() + 1);
                reelRepository.save(r);
            });
        }
    }

    @Transactional
    public void unlikeReel(String reelId) {
        var user = currentUserService.requireUser();
        reelLikeRepository.deleteByReelIdAndUserId(reelId, user.getId());
        reelRepository.findById(reelId).ifPresent(r -> {
            r.setLikeCount(Math.max(0, r.getLikeCount() - 1));
            reelRepository.save(r);
        });
    }

    @Transactional
    public ReelComment addComment(String reelId, String body) {
        var user = currentUserService.requireUser();
        ReelComment comment = new ReelComment();
        comment.setReelId(reelId);
        comment.setBody(body);
        comment.setAuthorId(user.getId());
        comment.setAuthorName(user.getFullName());
        comment.setAuthorProfilePicture(user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null);
        comment = reelCommentRepository.save(comment);
        reelRepository.findById(reelId).ifPresent(r -> {
            r.setCommentCount(r.getCommentCount() + 1);
            reelRepository.save(r);
        });
        return comment;
    }

    @Transactional
    public void saveReel(String reelId) {
        var user = currentUserService.requireUser();
        if (reelSaveRepository.findByReelIdAndUserId(reelId, user.getId()).isEmpty()) {
            ReelSave save = new ReelSave();
            save.setReelId(reelId);
            save.setUserId(user.getId());
            reelSaveRepository.save(save);
            reelRepository.findById(reelId).ifPresent(r -> {
                r.setSaveCount(r.getSaveCount() + 1);
                reelRepository.save(r);
            });
        }
    }

    @Transactional
    public void trackView(String reelId) {
        var user = currentUserService.requireUser();
        ReelView view = new ReelView();
        view.setReelId(reelId);
        view.setUserId(user.getId());
        reelViewRepository.save(view);
        reelRepository.findById(reelId).ifPresent(r -> {
            r.setViewCount(r.getViewCount() + 1);
            reelRepository.save(r);
        });
    }

    public List<Reel> getUserReels(String authorId, int limit) {
        return reelRepository.findByAuthorIdOrderByCreatedAtDesc(authorId, PageRequest.of(0, limit)).getContent();
    }
}
