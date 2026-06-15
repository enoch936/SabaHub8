package com.sabahub.web;

import com.sabahub.service.ReelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reels")
public class ReelsController {

    private final ReelService reelService;

    public ReelsController(ReelService reelService) {
        this.reelService = reelService;
    }

    @GetMapping
    public ResponseEntity<?> getFeed(@RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(reelService.getFeed(limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReel(@PathVariable String id) {
        return reelService.getReel(id)
                .map(ResponseEntity::ok)
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
        reelService.likeReel(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/{id}/unlike")
    public ResponseEntity<?> unlikeReel(@PathVariable String id) {
        reelService.unlikeReel(id);
        return ResponseEntity.ok(Map.of("ok", true));
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
        reelService.saveReel(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> trackView(@PathVariable String id) {
        reelService.trackView(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/user/{authorId}")
    public ResponseEntity<?> getUserReels(@PathVariable String authorId,
                                          @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(reelService.getUserReels(authorId, limit));
    }
}
