package com.sabahub.config;

import com.sabahub.service.AppUserDetailsService;
import com.sabahub.service.SessionTrackingService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;
    private final SessionTrackingService sessionTrackingService;

    public JwtAuthFilter(JwtService jwtService,
                         AppUserDetailsService userDetailsService,
                         SessionTrackingService sessionTrackingService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.sessionTrackingService = sessionTrackingService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            String tokenParam = request.getParameter("token");
            if (tokenParam != null && !tokenParam.trim().isEmpty()) {
                authHeader = "Bearer " + tokenParam.trim();
            }
        }
        
        String contentType = request.getHeader("Content-Type");
        String contentLength = request.getHeader("Content-Length");
        
        System.out.println("\n========== JWT FILTER START ==========");
        System.out.println("Method: " + method + ", Path: " + path);
        System.out.println("Content-Type: " + contentType);
        System.out.println("Content-Length: " + contentLength);
        System.out.println("Auth header present: " + (authHeader != null));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("No Bearer token found, continuing without authentication");
            filterChain.doFilter(request, response);
            System.out.println("========== JWT FILTER END (no auth) ==========\n");
            return;
        }

        String token = authHeader.substring(7);
        System.out.println("Token extracted (len=" + token.length() + ")");
        
        // Development mode: Accept mock tokens
        if (token.contains("mock-signature-for-development")) {
            System.out.println("🔧 DEVELOPMENT MODE: Mock token detected, creating dev user");
            var devUserDetails = org.springframework.security.core.userdetails.User
                    .withUsername("dev-user@sabahub.com")
                    .password("")
                    .authorities("ROLE_USER", "ROLE_FREELANCER", "ROLE_EMPLOYER")
                    .build();
            var authToken = new UsernamePasswordAuthenticationToken(
                    devUserDetails, null, devUserDetails.getAuthorities());
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
            System.out.println("Development authentication set successfully");
            filterChain.doFilter(request, response);
            System.out.println("========== JWT FILTER END (dev mode) ==========\n");
            return;
        }
        
        String jti = null;
        try {
            jti = jwtService.extractJti(token);
        } catch (Exception e) {
            System.out.println("Failed to extract JTI: " + e.getMessage());
        }
        
        if (jti != null) {
            try {
                if (sessionTrackingService.isTokenBlacklisted(jti)) {
                    filterChain.doFilter(request, response);
                    return;
                }
            } catch (Exception e) {
                System.err.println("Session blacklist lookup failed: " + e.getMessage());
            }
        }

        String email;
        try {
            email = jwtService.extractSubject(token);
        } catch (Exception e) {
            System.out.println("Failed to extract subject from token: " + e.getMessage());
            filterChain.doFilter(request, response);
            System.out.println("========== JWT FILTER END (invalid token) ==========\n");
            return;
        }
        System.out.println("Extracted email: " + email);

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                var userDetails = userDetailsService.loadUserByUsername(email);
                if (jwtService.isTokenValid(token, userDetails.getUsername())) {
                    System.out.println("Token valid! Setting authentication for user: " + email);
                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    sessionTrackingService.trackSession(token, email, request);
                    System.out.println("Authentication set successfully");
                } else {
                    System.out.println("Token INVALID for user: " + email);
                }
            } catch (DataAccessException e) {
                // Database unavailable: don't 500 public endpoints; proceed as anonymous.
                System.err.println("User lookup failed (db unavailable). Continuing unauthenticated: " + e.getMessage());
            } catch (Exception e) {
                // Any auth lookup failure should not crash the request pipeline.
                System.err.println("User lookup failed. Continuing unauthenticated: " + e.getMessage());
            }
        } else {
            System.out.println("Email: " + email + ", Current auth: " + SecurityContextHolder.getContext().getAuthentication());
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            System.out.println("========== JWT FILTER END ==========\n");
        }
    }
}
