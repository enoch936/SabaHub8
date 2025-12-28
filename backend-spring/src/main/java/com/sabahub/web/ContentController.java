package com.sabahub.web;

import com.sabahub.domain.ContentItem;
import com.sabahub.service.ContentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/content")
    public ResponseEntity<List<ContentItem>> list(@RequestParam(name = "type", defaultValue = "FAQ") String type) {
        return ResponseEntity.ok(contentService.listPublic(type));
    }

    @PostMapping("/admin/content")
    public ResponseEntity<ContentItem> adminCreate(@RequestBody ContentItem item) {
        return ResponseEntity.ok(contentService.adminCreate(item));
    }

    @PatchMapping("/admin/content/{id}")
    public ResponseEntity<ContentItem> adminUpdate(@PathVariable String id, @RequestBody ContentItem patch) {
        return ResponseEntity.ok(contentService.adminUpdate(id, patch));
    }
}
