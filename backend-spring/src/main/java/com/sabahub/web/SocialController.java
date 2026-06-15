package com.sabahub.web;

import com.sabahub.domain.SocialComment;
import com.sabahub.domain.SocialPost;
import com.sabahub.service.SocialService;
import com.sabahub.web.dto.SocialDTOs.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    // --- Following ---

    @PostMapping("/follow")
    public ResponseEntity<?> follow(@RequestBody FollowRequest request) {
        socialService.follow(request.getUserId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Followed successfully"));
    }

    @PostMapping("/unfollow")
    public ResponseEntity<?> unfollow(@RequestBody FollowRequest request) {
        socialService.unfollow(request.getUserId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Unfollowed successfully"));
    }

    // --- Posts ---

    @PostMapping("/posts")
    public ResponseEntity<SocialPost> createPost(@RequestBody CreatePostRequest request) {
        SocialPost post = socialService.createPost(
                request.getContent(),
                request.getMediaAssetIds(),
                request.getTags(),
                request.getCategory(),
                request.getType()
        );
        return ResponseEntity.ok(post);
    }

    @GetMapping("/stories")
    public ResponseEntity<?> getActiveStories() {
        return ResponseEntity.ok(socialService.getActiveStoryUsers());
    }

    @GetMapping("/users/{userId}/stories")
    public ResponseEntity<?> getUserStories(@PathVariable String userId) {
        return ResponseEntity.ok(socialService.getUserStories(userId));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<SocialPostResponse>> getFeed(Pageable pageable) {
        return ResponseEntity.ok(socialService.getFeed(pageable));
    }

    @GetMapping("/feed/global")
    public ResponseEntity<Page<SocialPostResponse>> getGlobalFeed(Pageable pageable) {
        return ResponseEntity.ok(socialService.getGlobalFeed(pageable));
    }

    @GetMapping("/users/{userId}/posts")
    public ResponseEntity<Page<SocialPostResponse>> getUserPosts(@PathVariable String userId, Pageable pageable) {
        return ResponseEntity.ok(socialService.getUserPosts(userId, pageable));
    }

    @GetMapping("/users/{userId}/posts/liked")
    public ResponseEntity<Page<SocialPostResponse>> getLikedPosts(@PathVariable String userId, Pageable pageable) {
        return ResponseEntity.ok(socialService.getLikedPosts(userId, pageable));
    }

    @GetMapping("/users/{userId}/posts/saved")
    public ResponseEntity<Page<SocialPostResponse>> getSavedPosts(@PathVariable String userId, Pageable pageable) {
        return ResponseEntity.ok(socialService.getSavedPosts(userId, pageable));
    }

    @GetMapping("/users/{userId}/gallery")
    public ResponseEntity<?> getMediaGallery(@PathVariable String userId) {
        return ResponseEntity.ok(socialService.getMediaGallery(userId));
    }

    // --- Likes ---

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<?> likePost(@PathVariable String postId) {
        socialService.likePost(postId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/posts/{postId}/unlike")
    public ResponseEntity<?> unlikePost(@PathVariable String postId) {
        socialService.unlikePost(postId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // --- Saves ---

    @PostMapping("/posts/{postId}/save")
    public ResponseEntity<?> savePost(@PathVariable String postId) {
        socialService.savePost(postId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/posts/{postId}/unsave")
    public ResponseEntity<?> unsavePost(@PathVariable String postId) {
        socialService.unsavePost(postId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // --- Comments ---

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<SocialComment> addComment(@PathVariable String postId, @RequestBody CommentRequest request) {
        SocialComment comment = socialService.addComment(postId, request.getContent());
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<Page<SocialComment>> getComments(@PathVariable String postId, Pageable pageable) {
        return ResponseEntity.ok(socialService.getComments(postId, pageable));
    }
}
