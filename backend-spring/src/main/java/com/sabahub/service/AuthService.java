package com.sabahub.service;

import com.sabahub.config.JwtService;
import com.sabahub.domain.User;
import com.sabahub.domain.UserRole;
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
        String email = request.email() != null ? request.email().toLowerCase() : null;
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String fullName = request.resolvedFullName();
        if (fullName == null || fullName.isBlank()) {
            throw new IllegalArgumentException("Full name is required");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String hashed = passwordEncoder.encode(request.password());
        
        // Determine role (default to FREELANCER if not specified)
        String roleString = request.role() != null ? request.role().toUpperCase() : "FREELANCER";
        UserRole userRole = UserRole.fromString(roleString);
        if (userRole == null) {
            userRole = UserRole.FREELANCER; // Default to freelancer
        }
        
        // Non-admin users can only register as EMPLOYER or FREELANCER
        if (userRole.isAdmin()) {
            throw new IllegalArgumentException("Admin roles must be assigned by system administrator");
        }
        
        Set<String> roles = Set.of(userRole.toSpringRole());
        User user = new User(email, fullName, hashed, roles);
        userRepository.save(user);
        
        // Build JWT claims with roles
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());
        claims.put("role", userRole.name());
        String token = jwtService.generateToken(user.getEmail(), claims);

        // Audit log: registration successful
        auditService.log("REGISTER", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "role", userRole.name(),
            "status", "SUCCESS"
        ));

        return new AuthResponse(token, user.getEmail(), user.getFullName());
    }

    /**
     * Register user after OTP verification (with role support)
     */
    @Transactional
    public AuthResponse registerWithOTP(String email, String fullName, String password, String roleString) {
        email = email.toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String hashed = passwordEncoder.encode(password);
        
        // Determine role (default to FREELANCER if not specified)
        UserRole userRole = UserRole.FREELANCER;
        if (roleString != null && !roleString.isBlank()) {
            UserRole parsed = UserRole.fromString(roleString);
            if (parsed != null && !parsed.isAdmin()) {
                userRole = parsed;
            }
        }
        
        Set<String> roles = Set.of(userRole.toSpringRole());
        User user = new User(email, fullName, hashed, roles);
        userRepository.save(user);

        // Build JWT claims with roles
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles());
        claims.put("role", userRole.name());
        String token = jwtService.generateToken(user.getEmail(), claims);

        // Audit log: OTP-verified registration
        auditService.log("REGISTER_OTP", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "role", userRole.name(),
            "status", "SUCCESS",
            "verified", "true"
        ));

        return new AuthResponse(token, user.getEmail(), user.getFullName());
    }

    /**
     * Overload for backward compatibility
     */
    @Transactional
    public AuthResponse registerWithOTP(String email, String fullName, String password) {
        return registerWithOTP(email, fullName, password, "FREELANCER");
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
        
        // Get primary role from user roles
        String roleString = "USER";
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            String firstRole = user.getRoles().iterator().next();
            UserRole userRole = UserRole.fromString(firstRole);
            if (userRole != null) {
                roleString = userRole.name();
            }
        }
        claims.put("role", roleString);
        
        String token = jwtService.generateToken(user.getEmail(), claims);
        
        // Audit log: login successful
        auditService.log("LOGIN", "USER", user.getId(), Map.of(
            "email", user.getEmail(),
            "status", "SUCCESS"
        ));
        
        return new AuthResponse(token, user.getEmail(), user.getFullName());
    }

    /**
     * Reset password after OTP verification
     */
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Encode the new password
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hashedPassword);
        
        userRepository.save(user);
    }
}
