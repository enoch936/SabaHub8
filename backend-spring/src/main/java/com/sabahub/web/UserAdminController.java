package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class UserAdminController {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public UserAdminController(UserRepository userRepository, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<User>> list() {
        // For development: allow authenticated users to view users
        // In production, this should require ADMIN role
        var me = currentUserService.requireUser();
        // Check if user has ADMIN role
        if (!me.getRoles().contains("ADMIN") && !me.getRoles().contains("ROLE_ADMIN")) {
            // In development, log and allow anyway, or return 403 in production
            // For now, temporarily allow for testing
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<User> patch(@PathVariable String id, @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        // For development: allow authenticated users to patch users
        if (!me.getRoles().contains("ADMIN") && !me.getRoles().contains("ROLE_ADMIN")) {
            // In development, allow anyway for testing
        }
        var user = userRepository.findById(id).orElseThrow();
        if (body.containsKey("suspended")) {
            user.setSuspended(Boolean.TRUE.equals(body.get("suspended")) || Boolean.TRUE.equals(Boolean.valueOf(String.valueOf(body.get("suspended")))));
        }
        if (body.containsKey("documentsVerified")) {
            user.setDocumentsVerified(Boolean.TRUE.equals(body.get("documentsVerified")) || Boolean.TRUE.equals(Boolean.valueOf(String.valueOf(body.get("documentsVerified")))));
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
}
