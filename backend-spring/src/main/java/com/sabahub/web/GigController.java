package com.sabahub.web;

import com.sabahub.domain.Gig;
import com.sabahub.service.GigService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gigs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GigController {

    private final GigService gigService;

    public GigController(GigService gigService) {
        this.gigService = gigService;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> listMyGigs() {
        try {
            List<Gig> gigs = gigService.listMyGigs();
            return ResponseEntity.ok(gigs);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> createGig(@RequestBody Gig gig) {
        try {
            if (gig.getTitle() == null || gig.getTitle().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Gig title is required"));
            }
            if (gig.getDescription() == null || gig.getDescription().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Gig description is required"));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(gigService.createGig(gig));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    @PutMapping("/{gigId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> updateGig(@PathVariable String gigId, @RequestBody Gig gig) {
        try {
            return ResponseEntity.ok(gigService.updateGig(gigId, gig));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    @DeleteMapping("/{gigId}")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> deleteGig(@PathVariable String gigId) {
        try {
            gigService.deleteGig(gigId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }
}
