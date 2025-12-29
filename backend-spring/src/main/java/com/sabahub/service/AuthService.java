package com.sabahub.service;

import com.sabahub.config.JwtService;
import com.sabahub.domain.User;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.AuthRequest;
import com.sabahub.web.dto.AuthResponse;
import com.sabahub.web.dto.RegisterRequest;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.HashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new IllegalArgumentException("Email already registered");
        }
        String hashed = passwordEncoder.encode(request.password());
        User user = new User(request.email().toLowerCase(), request.fullName(), hashed, Set.of("ROLE_USER"));
        userRepository.save(user);
        // Build JWT claims with roles
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());
        // Derive convenience single role for UI
        String topRole = user.getRoles().contains("ROLE_ADMIN") ? "ADMIN" : "USER";
        claims.put("role", topRole);
        String token = jwtService.generateToken(user.getEmail(), claims);
        
        // Audit log: login successful
        auditService.log("LOGIN", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "status", "SUCCESS"
        ));
        
        return new AuthResponse(token, user.getEmail(), user.getFullName());
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase(), request.password())
        );
        String email = authentication.getName();
        var user = userRepository.findByEmail(email).orElseThrow();
        // Build JWT claims with roles so frontend can detect admin
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());
        String topRole = user.getRoles() != null && user.getRoles().contains("ROLE_ADMIN") ? "ADMIN" : "USER";
        claims.put("role", topRole);
        String token = jwtService.generateToken(user.getEmail(), claims);
        
        // Audit log: login successful
        auditService.log("LOGIN", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "status", "SUCCESS"
        ));
        
        return new AuthResponse(token, user.getEmail(), user.getFullName());
    }
}
