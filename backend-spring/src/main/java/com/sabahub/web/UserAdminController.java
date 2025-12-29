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
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<User> patch(@PathVariable String id, @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
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
