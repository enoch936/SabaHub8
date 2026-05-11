package com.sabahub.web;

import com.sabahub.domain.FreelancerProjectPost;
import com.sabahub.service.FreelancerProjectPostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/freelancer/project-posts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FreelancerProjectPostController {

    private final FreelancerProjectPostService service;

    public FreelancerProjectPostController(FreelancerProjectPostService service) {
        this.service = service;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> listMine() {
        try {
            List<FreelancerProjectPost> posts = service.listMyProjectPosts();
            return ResponseEntity.ok(posts);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> create(@RequestBody FreelancerProjectPost post) {
        try {
            if (post.getTitle() == null || post.getTitle().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Project post title is required"));
            }
            if (post.getDescription() == null || post.getDescription().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Project post description is required"));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(service.createProjectPost(post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    @PutMapping("/{postId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> update(@PathVariable String postId, @RequestBody FreelancerProjectPost post) {
        try {
            return ResponseEntity.ok(service.updateProjectPost(postId, post));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> delete(@PathVariable String postId) {
        try {
            service.deleteProjectPost(postId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }
}