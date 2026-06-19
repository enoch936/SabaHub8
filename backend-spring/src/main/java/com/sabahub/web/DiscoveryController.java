package com.sabahub.web;

import com.sabahub.service.DiscoveryFeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/discovery")
@RequiredArgsConstructor
public class DiscoveryController {

    private final DiscoveryFeedService discoveryFeedService;

    @GetMapping("/feed")
    public ResponseEntity<Map<String, Object>> getFeed(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(discoveryFeedService.getFeed(category, limit, offset));
    }
}
