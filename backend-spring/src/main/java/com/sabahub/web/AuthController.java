package com.sabahub.web;

import com.sabahub.config.JwtService;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.AuditService;
import com.sabahub.service.AuthService;
import com.sabahub.service.SessionTrackingService;
import com.sabahub.service.VerificationDeliveryException;
import com.sabahub.web.dto.AuthRequest;
import com.sabahub.web.dto.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final SessionTrackingService sessionTrackingService;

    public AuthController(AuthService authService,
                          JwtService jwtService,
                          UserRepository userRepository,
                          AuditService auditService,
                          SessionTrackingService sessionTrackingService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.sessionTrackingService = sessionTrackingService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        try {
            var response = authService.register(request);
            sessionTrackingService.trackSession(response.token(), response.email(), httpRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest) {
        try {
            var response = authService.login(request);
            trackSession(response.token(), response.email(), httpRequest);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (DataAccessException e) {
            log.warn("Login failed because the data store is unavailable: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable. Please try again."));
        } catch (VerificationDeliveryException e) {
            log.warn("Login verification delivery failed: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.warn("Login failed while completing verification or token setup: {}", e.getMessage(), e);
            return ResponseEntity.status(503).body(Map.of("error", "Unable to complete login right now. Please try again."));
        }
    }

    @PostMapping("/login/2fa/verify")
    public ResponseEntity<?> verifyLoginTwoFactor(@RequestBody Map<String, String> payload, HttpServletRequest httpRequest) {
        String challengeId = payload.get("challengeId");
        String otpCode = firstNonBlank(payload.get("otpCode"), payload.get("otp"), payload.get("code"));
        String emailOtp = payload.get("emailOtp");
        String phoneOtp = payload.get("phoneOtp");
        String authenticatorCode = firstNonBlank(
            payload.get("authenticatorCode"),
            payload.get("totpCode"),
            payload.get("toptp"),
            payload.get("otpAuthenticatorCode")
        );
        String pinCode = payload.get("pinCode");
        String recoveryCode = payload.get("recoveryCode");

        try {
            var response = authService.verifyLoginTwoFactor(
                    challengeId,
                    otpCode,
                    emailOtp,
                    phoneOtp,
                    authenticatorCode,
                    pinCode,
                    recoveryCode
            );
            trackSession(response.token(), response.email(), httpRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (DataAccessException e) {
            log.warn("2FA verification failed because the data store is unavailable: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable. Please try again."));
        } catch (VerificationDeliveryException e) {
            log.warn("2FA verification delivery failed: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.warn("2FA verification failed while completing login: {}", e.getMessage(), e);
            return ResponseEntity.status(503).body(Map.of("error", "Unable to complete verification right now. Please try again."));
        }
    }

    @PostMapping("/login/2fa/resend")
    public ResponseEntity<?> resendLoginTwoFactor(@RequestBody Map<String, String> payload) {
        String challengeId = payload.get("challengeId");
        try {
            authService.resendLoginTwoFactor(challengeId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Verification code sent"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (DataAccessException e) {
            log.warn("2FA resend failed because the data store is unavailable: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", "Service unavailable. Please try again."));
        } catch (VerificationDeliveryException e) {
            log.warn("2FA resend delivery failed: {}", e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            log.warn("2FA resend failed while sending verification code: {}", e.getMessage(), e);
            return ResponseEntity.status(503).body(Map.of("error", "Unable to send verification code right now. Please try again."));
        }
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
            if (jti != null && !jti.isBlank()) {
                sessionTrackingService.blacklistToken(token);
                sessionTrackingService.removeSessionReference(email, jti);
            }
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> listSessions(HttpServletRequest request, @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!sessionTrackingService.isAvailable()) {
            return ResponseEntity.ok(Map.of("sessions", List.of(), "count", 0));
        }

        String email = principal.getUsername();
        String token = readBearerToken(request);
        if (!token.isBlank()) {
            sessionTrackingService.trackSession(token, email, request);
        }
        String currentJti = readTokenJti(request);
        Set<String> jtis = sessionTrackingService.getUserSessionIds(email);
        if (jtis == null || jtis.isEmpty()) {
            return ResponseEntity.ok(Map.of("sessions", List.of(), "count", 0));
        }

        List<Map<String, Object>> sessions = new ArrayList<>();
        for (String jti : jtis) {
            Map<Object, Object> hash = sessionTrackingService.getSession(jti);
            if (hash == null || hash.isEmpty()) {
                sessionTrackingService.removeSessionReference(email, jti);
                continue;
            }
            Map<String, Object> item = new HashMap<>();
            item.put("jti", jti);
            item.put("device", hash.getOrDefault("device", "Unknown device"));
            item.put("platform", hash.getOrDefault("platform", "Unknown OS"));
            item.put("browser", hash.getOrDefault("browser", "Browser"));
            item.put("deviceType", hash.getOrDefault("deviceType", "Unknown"));
            item.put("ip", hash.getOrDefault("ip", "unknown"));
            item.put("userAgent", hash.getOrDefault("userAgent", "unknown"));
            item.put("location", String.valueOf(hash.getOrDefault("location", "Unknown")));
            item.put("deviceId", String.valueOf(hash.getOrDefault("deviceId", "")));
            item.put("timezone", String.valueOf(hash.getOrDefault("timezone", "")));
            item.put("language", String.valueOf(hash.getOrDefault("language", "")));
            item.put("viewport", String.valueOf(hash.getOrDefault("viewport", "")));
            item.put("createdAt", parseLong(hash.get("createdAt"), 0L));
            item.put("lastSeenAt", parseLong(hash.get("lastSeenAt"), 0L));
            item.put("expiresAt", parseLong(hash.get("expiresAt"), 0L));
            item.put("current", jti.equals(currentJti));
            sessions.add(item);
        }

        sessions.sort(Comparator.comparingLong((Map<String, Object> m) -> (Long) m.get("lastSeenAt")).reversed());
        return ResponseEntity.ok(Map.of("sessions", sessions, "count", sessions.size()));
    }

    @PostMapping("/sessions/{jti}/revoke")
    public ResponseEntity<?> revokeSession(@PathVariable String jti,
                                           HttpServletRequest request,
                                           @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!sessionTrackingService.isAvailable()) {
            return ResponseEntity.status(503).body(Map.of("error", "Session store unavailable"));
        }

        String email = principal.getUsername();
        if (!sessionTrackingService.sessionBelongsToUser(email, jti)) {
            return ResponseEntity.status(404).body(Map.of("error", "Session not found"));
        }

        Date exp = sessionTrackingService.readSessionExpiry(jti);
        if (exp != null) {
            sessionTrackingService.blacklistSession(jti, exp);
        }

        sessionTrackingService.removeSessionReference(email, jti);

        auditService.log("SESSION_REVOKE", "USER", email, Map.of(
                "status", "SUCCESS",
                "targetJti", jti,
                "remoteIp", clientIp(request)
        ));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/sessions/revoke-others")
    public ResponseEntity<?> revokeOtherSessions(HttpServletRequest request, @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        if (!sessionTrackingService.isAvailable()) {
            return ResponseEntity.status(503).body(Map.of("error", "Session store unavailable"));
        }

        String email = principal.getUsername();
        String currentJti = readTokenJti(request);
        Set<String> jtis = sessionTrackingService.getUserSessionIds(email);
        if (jtis == null || jtis.isEmpty()) {
            return ResponseEntity.ok(Map.of("ok", true, "revoked", 0));
        }

        int revoked = 0;
        for (String jti : jtis) {
            if (jti.equals(currentJti)) {
                continue;
            }
            Date exp = sessionTrackingService.readSessionExpiry(jti);
            if (exp != null) {
                sessionTrackingService.blacklistSession(jti, exp);
            }
            sessionTrackingService.removeSessionReference(email, jti);
            revoked++;
        }

        auditService.log("SESSION_REVOKE_OTHERS", "USER", email, Map.of(
                "status", "SUCCESS",
                "revoked", revoked,
                "remoteIp", clientIp(request)
        ));
        return ResponseEntity.ok(Map.of("ok", true, "revoked", revoked));
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
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", user.getId());
        payload.put("email", user.getEmail());
        payload.put("username", user.getUsername());
        payload.put("fullName", user.getFullName());
        payload.put("profilePictureUrl", user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null);
        payload.put("roles", user.getRoles());
        return ResponseEntity.ok(payload);
    }

    /**
     * Reset password after OTP verification
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (password == null || password.isBlank() || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
        }

        try {
            authService.resetPassword(email, password);
            auditService.log("PASSWORD_RESET", "USER", email, Map.of("status", "SUCCESS"));
            return ResponseEntity.ok(Map.of("message", "Password reset successfully", "success", true));
        } catch (Exception e) {
            auditService.log("PASSWORD_RESET", "USER", email, Map.of("status", "FAILED", "error", e.getMessage()));
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage(), "success", false));
        }
    }

    private void trackSession(String token, String email, HttpServletRequest request) {
        if (token == null || token.isBlank() || email == null || email.isBlank()) {
            return;
        }
        sessionTrackingService.trackSession(token, email, request);
    }

    private String readTokenJti(HttpServletRequest request) {
        String token = readBearerToken(request);
        if (token.isBlank()) {
            return "";
        }
        try {
            return jwtService.extractJti(token);
        } catch (Exception ignored) {
            return "";
        }
    }

    private String readBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "";
        }
        return authHeader.substring(7);
    }

    private long parseLong(Object value, long fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }
}
