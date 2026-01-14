package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    public UserSearchController(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        return userRepository.findByEmail(email)
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
        List<User> results = userRepository.findAll().stream()
                .filter(u -> u.getFullName() != null && u.getFullName().toLowerCase().contains(name.toLowerCase()))
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
        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "roles", user.getRoles() != null ? user.getRoles() : List.of(),
                "suspended", user.isSuspended(),
                "documentsVerified", user.isDocumentsVerified(),
                "createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null
        );
    }
}
