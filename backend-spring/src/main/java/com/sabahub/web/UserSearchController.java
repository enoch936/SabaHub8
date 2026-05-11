package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.ChatPresenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

/**
 * User Search Controller
 * Provides endpoints to search users by ID, email, and other criteria
 * Enables user discovery for chat, project assignment, and other features
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserSearchController {

    private final UserRepository userRepository;
    private final ChatPresenceService chatPresenceService;

    public UserSearchController(UserRepository userRepository, ChatPresenceService chatPresenceService) {
        this.userRepository = userRepository;
        this.chatPresenceService = chatPresenceService;
    }

    /**
     * Search user by unique ID
     * GET /api/users/{id}
     * This is the primary way to access user by their unique identifier
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(buildUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search users by email
     * GET /api/users/search/email?email=user@example.com
     * Useful for finding specific users by email address
     */
    @GetMapping("/search/email")
    public ResponseEntity<?> searchByEmail(@RequestParam(name = "email") String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email parameter required"));
        }
        return userRepository.findByEmailIgnoreCase(email.trim())
                .map(user -> ResponseEntity.ok(buildUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search user by exact username
     * GET /api/users/search/username?username=john_doe
     */
    @GetMapping("/search/username")
    public ResponseEntity<?> searchByUsername(@RequestParam(name = "username") String username) {
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username parameter required"));
        }
        return userRepository.findByUsernameIgnoreCase(username.trim())
                .map(user -> ResponseEntity.ok(buildUserResponse(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Search users by name (partial match)
     * GET /api/users/search/name?name=John
     * Finds all users whose name contains the search term
     */
    @GetMapping("/search/name")
    public ResponseEntity<?> searchByName(@RequestParam(name = "name") String name) {
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name parameter required"));
        }
        String normalizedQuery = normalizeSearchQuery(name);
        List<User> results = userRepository.findAll().stream()
                .filter(user -> matchesUserSearch(user, normalizedQuery))
                .limit(20)
                .toList();
        return ResponseEntity.ok(Map.of(
                "query", name,
                "results", results.stream().map(this::buildUserResponse).toList(),
                "count", results.size()
        ));
    }

    /**
     * Get all users (admin only, limited to 100)
     * GET /api/users/list?limit=50
     * Returns a list of users for admin purposes
     */
    @GetMapping("/list")
    public ResponseEntity<?> listUsers(@RequestParam(name = "limit", defaultValue = "100") int limit) {
        List<User> users = userRepository.findAll().stream()
                .limit(Math.min(limit, 100))
                .toList();
        return ResponseEntity.ok(Map.of(
                "total", users.size(),
                "users", users.stream().map(this::buildUserResponse).toList()
        ));
    }

    /**
     * Build a safe user response object (excludes password hash)
     */
    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("username", user.getUsername());
        response.put("fullName", user.getFullName());
        response.put("roles", user.getRoles() != null ? user.getRoles() : List.of());
        response.put("suspended", user.isSuspended());
        response.put("documentsVerified", user.isDocumentsVerified());
        response.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
        response.put("lastSeenAt", user.getLastSeenAt() != null ? user.getLastSeenAt().toString() : null);
        response.put("online", chatPresenceService.isOnline(user.getId()));
        return response;
    }

    private boolean matchesUserSearch(User user, String normalizedQuery) {
        return containsIgnoreCase(user.getId(), normalizedQuery)
                || containsIgnoreCase(user.getFullName(), normalizedQuery)
                || containsIgnoreCase(user.getUsername(), normalizedQuery)
                || containsIgnoreCase(user.getEmail(), normalizedQuery);
    }

    private boolean containsIgnoreCase(String candidate, String normalizedQuery) {
        return candidate != null && candidate.toLowerCase(Locale.ROOT).contains(normalizedQuery);
    }

    private String normalizeSearchQuery(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
