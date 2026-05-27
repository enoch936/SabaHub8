package com.sabahub.config;

import com.sabahub.service.AppUserDetailsService;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
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
    public boolean beforeHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                                   @NonNull WebSocketHandler wsHandler, @NonNull Map<String, Object> attributes) {
        // Check Authorization header first
        String token = null;
        List<String> authHeaders = request.getHeaders().get("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String header = authHeaders.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }
        
        // Check query parameter if not in header
        if (token == null) {
            String query = request.getURI().getQuery();
            if (query != null && query.contains("token=")) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("token=")) {
                        token = param.substring(6);
                        try {
                            token = java.net.URLDecoder.decode(token, "UTF-8");
                        } catch (Exception ignored) {}
                        break;
                    }
                }
            }
        }

        // Extract user from token if found
        if (token != null && !token.isEmpty()) {
            try {
                String email = jwtService.extractSubject(token);
                var userDetails = userDetailsService.loadUserByUsername(email);
                attributes.put("wsUser", userDetails);
            } catch (Exception ignored) {
                // ignore invalid token
            }
        }
        return true; // allow connect; message send will fail if unauthenticated
    }

    @Override
    public void afterHandshake(@NonNull ServerHttpRequest request, @NonNull ServerHttpResponse response,
                               @NonNull WebSocketHandler wsHandler, @Nullable Exception exception) {
        // no-op
    }
}
