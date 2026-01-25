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
        
        String email = auth.getName();
        
        // Development mode: create temporary dev user if using mock token
        if ("dev-user@sabahub.com".equals(email)) {
            System.out.println("🔧 DEVELOPMENT MODE: Using or creating dev user");
            return userRepository.findByEmail(email)
                    .orElseGet(() -> {
                        System.out.println("Creating new development user in database");
                        User devUser = new User();
                        devUser.setEmail(email);
                        devUser.setFullName("Development User");
                        devUser.setRoles(new java.util.HashSet<>(java.util.Arrays.asList("FREELANCER", "EMPLOYER")));
                        return userRepository.save(devUser);
                    });
        }
        
        return userRepository.findByEmail(email)
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

    public String getCurrentUserId() {
        User user = requireUser();
        return user.getId();
    }
}
