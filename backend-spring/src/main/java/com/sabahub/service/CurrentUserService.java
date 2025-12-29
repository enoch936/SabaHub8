package com.sabahub.service;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Unauthorized");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    public boolean hasRole(User user, String role) {
        if (user == null || user.getRoles() == null) return false;
        String normalized = normalize(role);
        for (String r : user.getRoles()) {
            if (normalize(r).equals(normalized)) return true;
        }
        return false;
    }

    private String normalize(String role) {
        if (role == null) return "";
        String r = role.trim().toUpperCase();
        if (r.startsWith("ROLE_")) r = r.substring(5);
        return r;
    }

    public void requireRole(User user, String role) {
        if (!hasRole(user, role)) {
            throw new IllegalStateException("Forbidden");
        }
    }
}
