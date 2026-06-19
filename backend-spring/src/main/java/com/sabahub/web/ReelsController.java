package com.sabahub.web;

import com.sabahub.service.CurrentUserService;
import com.sabahub.service.ReelService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reels")
@RequiredArgsConstructor
public class ReelsController {

    private final ReelService reelService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<?> getFeed(@RequestParam(defaultValue = "20") int limit) {
        try {
            return ResponseEntity.ok(reelService.getFeed(limit));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReel(@PathVariable String id) {
        return reelService.getReel(id)
                .map(reel -> ResponseEntity.ok((Object) reel))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createReel(@RequestBody Map<String, Object> body) {
        try {
            var reel = reelService.createReel(
                    (String) body.get("title"),
                    (String) body.get("description"),
                    (String) body.get("videoUrl"),
                    (String) body.get("thumbnailUrl"),
                    (String) body.get("audioId"),
                    (java.util.List<String>) body.get("tags")
            );
            return ResponseEntity.ok(reel);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeReel(@PathVariable String id) {
        try {
            reelService.likeReel(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unlike")
    public ResponseEntity<?> unlikeReel(@PathVariable String id) {
        try {
            reelService.unlikeReel(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable String id,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        try {
            var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            return ResponseEntity.ok(reelService.getComments(id, pageable));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            var comment = reelService.addComment(id, body.get("body"));
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<?> saveReel(@PathVariable String id) {
        try {
            reelService.saveReel(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unsave")
    public ResponseEntity<?> unsaveReel(@PathVariable String id) {
        try {
            reelService.unsaveReel(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareReel(@PathVariable String id) {
        try {
            reelService.shareReel(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> trackView(@PathVariable String id) {
        try {
            reelService.trackView(id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{authorId}")
    public ResponseEntity<?> getUserReels(@PathVariable String authorId,
                                          @RequestParam(defaultValue = "20") int limit) {
        try {
            return ResponseEntity.ok(reelService.getUserReels(authorId, limit));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seed() {
        try {
            reelService.seedData();
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
