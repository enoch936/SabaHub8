package com.sabahub.web;

import com.sabahub.domain.SocialComment;
import com.sabahub.domain.SocialPost;
import com.sabahub.domain.User;
import com.sabahub.service.SocialService;
import com.sabahub.web.dto.SocialDTOs.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<User>> getFollowers(@PathVariable String userId) {
        return ResponseEntity.ok(socialService.getFollowers(userId));
    }

    @GetMapping("/following/{userId}")
    public ResponseEntity<List<User>> getFollowing(@PathVariable String userId) {
        return ResponseEntity.ok(socialService.getFollowing(userId));
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

    @PutMapping("/posts/{postId}")
    public ResponseEntity<SocialPost> editPost(@PathVariable String postId, @RequestBody CreatePostRequest request) {
        SocialPost post = socialService.editPost(postId, request.getContent(), request.getMediaAssetIds(), request.getTags());
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable String postId) {
        socialService.deletePost(postId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Post deleted"));
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

    @GetMapping("/trending")
    public ResponseEntity<Page<SocialPostResponse>> getTrending(Pageable pageable) {
        return ResponseEntity.ok(socialService.getTrending(pageable));
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

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String postId, @PathVariable String commentId) {
        socialService.deleteComment(postId, commentId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Comment deleted"));
    }

    // --- Shares ---

    @PostMapping("/posts/{postId}/share")
    public ResponseEntity<?> sharePost(@PathVariable String postId) {
        socialService.sharePost(postId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Post shared"));
    }

    // --- Activity ---

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity() {
        return ResponseEntity.ok(socialService.getActivity());
    }
}
