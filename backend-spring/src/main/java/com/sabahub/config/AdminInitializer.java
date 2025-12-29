package com.sabahub.config;

import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner ensureAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String adminEmail = System.getenv().getOrDefault("ADMIN_EMAIL", "admin@sabahub.local");
            String adminPassword = System.getenv().getOrDefault("ADMIN_PASSWORD", "");

            // Do not create an admin without an explicit password.
            if (adminPassword.isBlank()) {
                return;
            }

            try {
                if (userRepository.existsByEmail(adminEmail)) {
                    return;
                }

                String hashed = passwordEncoder.encode(adminPassword);
                User admin = new User(adminEmail, "Administrator", hashed, Set.of("ROLE_ADMIN", "ROLE_USER", "ADMIN", "USER"));
                userRepository.save(admin);
            } catch (DataAccessException ex) {
                // Mongo is not reachable during startup; skip seeding so the app can still start.
                // Connection will be validated through normal API usage.
            }
        };
    }
}
