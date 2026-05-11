package com.sabahub.service;

import com.sabahub.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Locale;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        var normalizedRoles = (user.getRoles() == null ? java.util.Set.<String>of() : user.getRoles()).stream()
                .map(this::normalizeRole)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        boolean hasWorkspaceRole = normalizedRoles.contains("EMPLOYER") || normalizedRoles.contains("FREELANCER");
        if (hasWorkspaceRole) {
            normalizedRoles.add("EMPLOYER");
            normalizedRoles.add("FREELANCER");
        }

        var authorities = normalizedRoles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();

        return new User(user.getEmail(), user.getPasswordHash(), authorities);
    }

    private String normalizeRole(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        return normalized;
    }
}
