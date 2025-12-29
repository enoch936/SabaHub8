package com.sabahub.web;

import com.sabahub.config.JwtService;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.AuditService;
import com.sabahub.service.AuthService;
import com.sabahub.web.dto.AuthRequest;
import com.sabahub.web.dto.AuthResponse;
import com.sabahub.web.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final StringRedisTemplate redis;

    public AuthController(AuthService authService, JwtService jwtService, UserRepository userRepository, AuditService auditService, StringRedisTemplate redis) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.redis = redis;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, @AuthenticationPrincipal UserDetails principal) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        try {
            String email = principal != null ? principal.getUsername() : (token != null ? jwtService.extractSubject(token) : null);
            String jti = token != null ? jwtService.extractJti(token) : null;
            auditService.log("LOGOUT", "USER", email != null ? email : null, Map.of(
                    "status", "SUCCESS",
                    "jti", jti != null ? jti : "",
                    "subject", email != null ? email : ""
            ));
            if (jti != null && !jti.isBlank() && redis != null) {
                Date exp = jwtService.extractExpiration(token);
                long ttlMillis = exp.getTime() - System.currentTimeMillis();
                if (ttlMillis > 0) {
                    redis.opsForValue().set("bl:" + jti, "1", Duration.ofMillis(ttlMillis));
                }
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        var user = userRepository.findByEmail(principal.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(Map.of(
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "roles", user.getRoles()
        ));
    }
}
