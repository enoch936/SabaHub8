package com.sabahub.service;

import com.sabahub.config.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockHttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SessionTrackingServiceTest {

    private SessionTrackingService sessionTrackingService;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        String secret = Base64.getEncoder().encodeToString(
                "0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.UTF_8)
        );
        jwtService = new JwtService(secret, 60_000L);
        sessionTrackingService = new SessionTrackingService(
                new DefaultListableBeanFactory().getBeanProvider(StringRedisTemplate.class),
                jwtService
        );
    }

    @Test
    void trackSessionStoresRichDeviceMetadataWithoutRedis() {
        String token = jwtService.generateToken("builder@sabahub.test", Map.of());
        String jti = jwtService.extractJti(token);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36");
        request.addHeader("X-Session-Location", "Addis Ababa, Ethiopia");
        request.addHeader("X-Timezone", "Africa/Addis_Ababa");
        request.addHeader("X-Device-Id", "device-1");
        request.addHeader("X-Device-Platform", "Windows");
        request.addHeader("X-Device-Browser", "Chrome");
        request.addHeader("X-Device-Type", "Desktop");
        request.addHeader("X-Device-Viewport", "1920x1080");
        request.addHeader("X-Device-Language", "en-US");
        request.setRemoteAddr("127.0.0.1");

        sessionTrackingService.trackSession(token, "builder@sabahub.test", request);

        assertThat(sessionTrackingService.isAvailable()).isTrue();
        assertThat(sessionTrackingService.getUserSessionIds("builder@sabahub.test")).contains(jti);

        Map<Object, Object> session = sessionTrackingService.getSession(jti);
        assertThat(session)
                .containsEntry("device", "Windows · Chrome")
                .containsEntry("deviceType", "Desktop")
                .containsEntry("platform", "Windows")
                .containsEntry("browser", "Chrome")
                .containsEntry("location", "Addis Ababa, Ethiopia")
                .containsEntry("timezone", "Africa/Addis_Ababa")
                .containsEntry("deviceId", "device-1")
                .containsEntry("language", "en-US")
                .containsEntry("viewport", "1920x1080")
                .containsEntry("ip", "127.0.0.1");
    }

    @Test
    void blacklistSessionUsesInMemoryFallbackWithoutRedis() {
        String token = jwtService.generateToken("builder@sabahub.test", Map.of());
        String jti = jwtService.extractJti(token);

        sessionTrackingService.blacklistToken(token);

        assertThat(sessionTrackingService.isTokenBlacklisted(jti)).isTrue();
    }
}
