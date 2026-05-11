package com.sabahub.config;

import com.sabahub.domain.User;
import com.sabahub.domain.UserRole;
import com.sabahub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashSet;
import java.util.Set;

@Configuration
public class AdminInitializer {

    @Value("${admin.email:admin@sabahub.local}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Bean
    CommandLineRunner ensureAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Use environment variables or properties
            String email = System.getenv().getOrDefault("ADMIN_EMAIL", adminEmail).toLowerCase();
            String password = System.getenv().getOrDefault("ADMIN_PASSWORD", adminPassword);

            // Do not create an admin without an explicit password.
            if (password.isBlank()) {
                System.out.println("[AdminInitializer] ADMIN_PASSWORD not set; skipping admin creation");
                return;
            }

            try {
                var existing = userRepository.findByEmail(email);
                if (existing.isPresent()) {
                    User user = existing.get();
                    Set<String> roles = user.getRoles() == null ? new HashSet<>() : new HashSet<>(user.getRoles());
                    String superAdminRole = UserRole.SUPER_ADMIN.toSpringRole();
                    if (!roles.contains(superAdminRole)) {
                        roles.add(superAdminRole);
                        user.setRoles(roles);
                        userRepository.save(user);
                        System.out.println("[AdminInitializer] Updated existing admin user roles: " + email);
                    } else {
                        System.out.println("[AdminInitializer] Admin user already exists: " + email);
                    }
                    return;
                }

                String hashed = passwordEncoder.encode(password);
                User admin = new User(email, "Administrator", hashed, Set.of(UserRole.SUPER_ADMIN.toSpringRole()));
                userRepository.save(admin);
                System.out.println("[AdminInitializer] Created admin user: " + email);
            } catch (DataAccessException ex) {
                // Mongo is not reachable during startup; skip seeding so the app can still start.
                // Connection will be validated through normal API usage.
                System.out.println("[AdminInitializer] MongoDB not reachable during startup; skipping admin creation");
            }
        };
    }
}
