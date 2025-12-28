package com.sabahub.config;

import com.sabahub.service.AppUserDetailsService;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;

    public JwtHandshakeInterceptor(JwtService jwtService, AppUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        List<String> authHeaders = request.getHeaders().get("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            return true; // allow connect; message send will fail if unauthenticated
        }

        String header = authHeaders.get(0);
        if (header == null || !header.startsWith("Bearer ")) {
            return true;
        }

        String token = header.substring(7);
        try {
            String email = jwtService.extractSubject(token);
            var userDetails = userDetailsService.loadUserByUsername(email);
            attributes.put("wsUser", userDetails);
        } catch (Exception ignored) {
            // ignore invalid token
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
