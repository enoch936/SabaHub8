package com.sabahub.service;

import com.sabahub.config.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class SessionTrackingService {

    private static final long CLEANUP_INTERVAL_MILLIS = Duration.ofMinutes(2).toMillis();
    private static final String UNKNOWN_DEVICE = "Unknown device";
    private static final String UNKNOWN_PLATFORM = "Unknown OS";
    private static final String UNKNOWN_BROWSER = "Browser";
    private static final String UNKNOWN_LOCATION = "Unknown";

    private final StringRedisTemplate redis;
    private final JwtService jwtService;
    private final Map<String, SessionRecord> inMemorySessions = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> inMemoryUserSessions = new ConcurrentHashMap<>();
    private final Map<String, Long> inMemoryBlacklist = new ConcurrentHashMap<>();
    private final AtomicLong nextCleanupAt = new AtomicLong(0L);

    public SessionTrackingService(ObjectProvider<StringRedisTemplate> redisProvider, JwtService jwtService) {
        this.redis = redisProvider.getIfAvailable();
        this.jwtService = jwtService;
    }

    public boolean isAvailable() {
        return true;
    }

    public void trackSession(String token, String email, HttpServletRequest request) {
        if (token == null || token.isBlank() || email == null || email.isBlank()) {
            return;
        }

        cleanupExpiredEntries();
        try {
            String jti = jwtService.extractJti(token);
            Date exp = jwtService.extractExpiration(token);
            if (jti == null || jti.isBlank() || exp == null) {
                return;
            }

            long ttlMillis = exp.getTime() - System.currentTimeMillis();
            if (ttlMillis <= 0) {
                return;
            }

            long now = System.currentTimeMillis();
            String normalizedEmail = email.toLowerCase(Locale.ROOT);
            String userAgent = normalizeUserAgent(request != null ? request.getHeader("User-Agent") : null);
            DeviceDetails deviceDetails = resolveDeviceDetails(request, userAgent);
            SessionRecord record = new SessionRecord(
                    jti,
                    normalizedEmail,
                    readExistingCreatedAt(jti, now),
                    now,
                    exp.getTime(),
                    clientIp(request),
                    userAgent,
                    deviceDetails.label(),
                    deviceDetails.platform(),
                    deviceDetails.browser(),
                    deviceDetails.deviceType(),
                    resolveLocation(request),
                    normalizeOptional(readHeader(request, "X-Device-Id")),
                    normalizeOptional(readHeader(request, "X-Timezone")),
                    resolveLanguage(request),
                    normalizeOptional(readHeader(request, "X-Device-Viewport"))
            );

            storeInMemorySession(record);
            storeRedisSession(record, ttlMillis);
        } catch (Exception ignored) {
        }
    }

    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            String jti = jwtService.extractJti(token);
            Date exp = jwtService.extractExpiration(token);
            blacklistSession(jti, exp);
        } catch (Exception ignored) {
        }
    }

    public void blacklistSession(String jti, Date expiresAt) {
        if (jti == null || jti.isBlank() || expiresAt == null) {
            return;
        }

        long ttlMillis = expiresAt.getTime() - System.currentTimeMillis();
        if (ttlMillis <= 0) {
            return;
        }

        inMemoryBlacklist.put(jti, expiresAt.getTime());
        if (redis != null) {
            try {
                redis.opsForValue().set("bl:" + jti, "1", Duration.ofMillis(ttlMillis));
            } catch (Exception ignored) {
            }
        }
    }

    public Set<String> getUserSessionIds(String email) {
        if (email == null || email.isBlank()) {
            return Collections.emptySet();
        }

        cleanupExpiredEntries();
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        Set<String> result = new HashSet<>(inMemoryUserSessions.getOrDefault(normalizedEmail, Collections.emptySet()));
        if (redis != null) {
            try {
                Set<String> jtis = redis.opsForSet().members(userSessionsKey(normalizedEmail));
                if (jtis != null) {
                    result.addAll(jtis);
                }
            } catch (Exception ignored) {
            }
        }
        return result;
    }

    public Map<Object, Object> getSession(String jti) {
        if (jti == null || jti.isBlank()) {
            return Collections.emptyMap();
        }

        cleanupExpiredEntries();
        Map<Object, Object> session = readRedisSession(jti);
        if (!session.isEmpty()) {
            return session;
        }

        SessionRecord record = inMemorySessions.get(jti);
        if (record == null || record.isExpired(System.currentTimeMillis())) {
            removeInMemorySession(null, jti);
            return Collections.emptyMap();
        }

        return record.asMap();
    }

    public boolean sessionBelongsToUser(String email, String jti) {
        if (email == null || email.isBlank() || jti == null || jti.isBlank()) {
            return false;
        }

        cleanupExpiredEntries();
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        if (inMemoryUserSessions.getOrDefault(normalizedEmail, Collections.emptySet()).contains(jti)) {
            return true;
        }

        if (redis != null) {
            try {
                Boolean member = redis.opsForSet().isMember(userSessionsKey(normalizedEmail), jti);
                return Boolean.TRUE.equals(member);
            } catch (Exception ignored) {
            }
        }

        return false;
    }

    public void removeSessionReference(String email, String jti) {
        if (jti == null || jti.isBlank()) {
            return;
        }

        cleanupExpiredEntries();
        String ownerEmail = resolveSessionOwnerEmail(email, jti);
        removeInMemorySession(ownerEmail.isBlank() ? null : ownerEmail, jti);

        if (redis != null) {
            try {
                redis.delete(sessionKey(jti));
                if (!ownerEmail.isBlank()) {
                    redis.opsForSet().remove(userSessionsKey(ownerEmail), jti);
                }
            } catch (Exception ignored) {
            }
        }
    }

    public long getActiveSessionCount() {
        cleanupExpiredEntries();
        return inMemorySessions.size();
    }

    public long getActiveUserCount() {
        cleanupExpiredEntries();
        return inMemoryUserSessions.size();
    }

    public Date readSessionExpiry(String jti) {
        if (jti == null || jti.isBlank()) {
            return null;
        }

        cleanupExpiredEntries();
        Map<Object, Object> redisSession = readRedisSession(jti);
        long timestamp = parseLong(redisSession.get("expiresAt"), -1L);
        if (timestamp > 0) {
            return new Date(timestamp);
        }

        SessionRecord record = inMemorySessions.get(jti);
        return record == null ? null : new Date(record.expiresAt());
    }

    public boolean isTokenBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }

        cleanupExpiredEntries();

        if (redis != null) {
            try {
                String value = redis.opsForValue().get("bl:" + jti);
                if (value != null) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }

        Long expiresAt = inMemoryBlacklist.get(jti);
        if (expiresAt == null) {
            return false;
        }
        if (expiresAt <= System.currentTimeMillis()) {
            inMemoryBlacklist.remove(jti);
            return false;
        }
        return true;
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

    private String userSessionsKey(String email) {
        return "user_sessions:" + email.toLowerCase(Locale.ROOT);
    }

    private String sessionKey(String jti) {
        return "session:" + jti;
    }

    private String clientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

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

    private String resolveLanguage(HttpServletRequest request) {
        if (request == null) {
            return "";
        }

        String acceptLanguage = request.getHeader("Accept-Language");
        return normalizeOptional(firstNonBlank(
                readHeader(request, "X-Device-Language"),
                acceptLanguage == null ? "" : acceptLanguage.split(",")[0]
        ));
    }

    private String resolveLocation(HttpServletRequest request) {
        if (request == null) {
            return UNKNOWN_LOCATION;
        }

        String cloudFrontCity = request.getHeader("CloudFront-Viewer-City");
        String cloudFrontCountry = request.getHeader("CloudFront-Viewer-Country-Name");
        String cloudFrontLocation = joinLocation(cloudFrontCity, cloudFrontCountry);

        return normalizeLocation(firstNonBlank(
                request.getHeader("X-Session-Location"),
                request.getHeader("X-Location"),
                cloudFrontLocation,
                request.getHeader("X-Timezone"),
                request.getHeader("CF-IPCountry")
        ));
    }

    private String joinLocation(String city, String country) {
        String normalizedCity = city == null ? "" : city.trim();
        String normalizedCountry = country == null ? "" : country.trim();
        if (normalizedCity.isBlank() && normalizedCountry.isBlank()) {
            return "";
        }
        if (normalizedCity.isBlank()) {
            return normalizedCountry;
        }
        if (normalizedCountry.isBlank()) {
            return normalizedCity;
        }
        return normalizedCity + ", " + normalizedCountry;
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return "";
        }

        for (String value : values) {
            if (value != null && !value.trim().isBlank()) {
                return value.trim();
            }
        }

        return "";
    }

    private String normalizeLocation(String value) {
        if (value == null || value.trim().isBlank()) {
            return UNKNOWN_LOCATION;
        }

        return value.trim().replace("_", " ").replace("/", " / ");
    }

    private String normalizeOptional(String value) {
        return value == null ? "" : value.trim();
    }

    private String readHeader(HttpServletRequest request, String headerName) {
        return request == null ? "" : normalizeOptional(request.getHeader(headerName));
    }

    private String normalizeUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "unknown";
        }

        return userAgent.trim();
    }

    private DeviceDetails resolveDeviceDetails(HttpServletRequest request, String userAgent) {
        DeviceDetails inferred = parseDeviceDetails(userAgent);
        String platform = normalizeDeviceValue(firstNonBlank(
                readHeader(request, "X-Device-Platform"),
                inferred.platform()
        ), UNKNOWN_PLATFORM);
        String browser = normalizeDeviceValue(firstNonBlank(
                readHeader(request, "X-Device-Browser"),
                inferred.browser()
        ), UNKNOWN_BROWSER);
        String deviceType = normalizeDeviceValue(firstNonBlank(
                readHeader(request, "X-Device-Type"),
                inferred.deviceType()
        ), "Unknown");
        String label = normalizeOptional(firstNonBlank(
                readHeader(request, "X-Device-Name"),
                readHeader(request, "X-Device-Label"),
                buildDeviceLabel(platform, browser, deviceType)
        ));

        return new DeviceDetails(
                label.isBlank() ? UNKNOWN_DEVICE : label,
                platform,
                browser,
                deviceType
        );
    }

    private DeviceDetails parseDeviceDetails(String userAgent) {
        if (userAgent == null || userAgent.isBlank() || "unknown".equalsIgnoreCase(userAgent)) {
            return new DeviceDetails(UNKNOWN_DEVICE, UNKNOWN_PLATFORM, UNKNOWN_BROWSER, "Unknown");
        }

        String ua = userAgent.toLowerCase(Locale.ROOT);

        String platform;
        if (ua.contains("android")) {
            platform = "Android";
        } else if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) {
            platform = "iOS";
        } else if (ua.contains("windows")) {
            platform = "Windows";
        } else if (ua.contains("mac os") || ua.contains("macintosh")) {
            platform = "macOS";
        } else if (ua.contains("linux")) {
            platform = "Linux";
        } else {
            platform = UNKNOWN_PLATFORM;
        }

        String browser;
        if (ua.contains("edg/")) {
            browser = "Edge";
        } else if (ua.contains("opr/") || ua.contains("opera")) {
            browser = "Opera";
        } else if (ua.contains("samsungbrowser/")) {
            browser = "Samsung Internet";
        } else if (ua.contains("chrome/")) {
            browser = "Chrome";
        } else if (ua.contains("safari/") && !ua.contains("chrome/")) {
            browser = "Safari";
        } else if (ua.contains("firefox/")) {
            browser = "Firefox";
        } else {
            browser = UNKNOWN_BROWSER;
        }

        String deviceType;
        if (ua.contains("ipad") || ua.contains("tablet")) {
            deviceType = "Tablet";
        } else if (ua.contains("mobi") || ua.contains("iphone")) {
            deviceType = "Mobile";
        } else if (ua.contains("android")) {
            deviceType = "Mobile";
        } else {
            deviceType = "Desktop";
        }

        String label = UNKNOWN_DEVICE;
        if (!UNKNOWN_PLATFORM.equals(platform) || !UNKNOWN_BROWSER.equals(browser)) {
            label = platform + " · " + browser;
        }

        return new DeviceDetails(label, platform, browser, deviceType);
    }

    private String normalizeDeviceValue(String value, String fallback) {
        String normalized = normalizeOptional(value);
        return normalized.isBlank() ? fallback : normalized;
    }

    private String buildDeviceLabel(String platform, String browser, String deviceType) {
        if (!platform.isBlank() && !browser.isBlank()
                && !UNKNOWN_PLATFORM.equals(platform) && !UNKNOWN_BROWSER.equals(browser)) {
            return platform + " · " + browser;
        }
        if (!deviceType.isBlank() && !"Unknown".equalsIgnoreCase(deviceType)) {
            return deviceType;
        }
        return UNKNOWN_DEVICE;
    }

    private long readExistingCreatedAt(String jti, long fallback) {
        SessionRecord existing = inMemorySessions.get(jti);
        if (existing != null && !existing.isExpired(System.currentTimeMillis())) {
            return existing.createdAt();
        }

        Map<Object, Object> redisSession = readRedisSession(jti);
        if (redisSession.isEmpty()) {
            return fallback;
        }
        return parseLong(redisSession.get("createdAt"), fallback);
    }

    private void storeInMemorySession(SessionRecord record) {
        inMemorySessions.put(record.jti(), record);
        inMemoryUserSessions
                .computeIfAbsent(record.email(), ignored -> ConcurrentHashMap.newKeySet())
                .add(record.jti());
    }

    private void storeRedisSession(SessionRecord record, long ttlMillis) {
        if (redis == null) {
            return;
        }

        try {
            String key = sessionKey(record.jti());
            Map<String, String> payload = record.asStringMap();
            payload.forEach((field, value) -> redis.opsForHash().put(key, field, value));
            redis.expire(key, Duration.ofMillis(ttlMillis));
            redis.opsForSet().add(userSessionsKey(record.email()), record.jti());
            redis.expire(userSessionsKey(record.email()), Duration.ofMillis(ttlMillis));
        } catch (Exception ignored) {
        }
    }

    private Map<Object, Object> readRedisSession(String jti) {
        if (redis == null || jti == null || jti.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            Map<Object, Object> session = redis.opsForHash().entries(sessionKey(jti));
            return session != null ? session : Collections.emptyMap();
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }

    private String resolveSessionOwnerEmail(String email, String jti) {
        if (email != null && !email.isBlank()) {
            return email.toLowerCase(Locale.ROOT);
        }

        SessionRecord record = inMemorySessions.get(jti);
        if (record != null) {
            return record.email();
        }

        Map<Object, Object> redisSession = readRedisSession(jti);
        String owner = redisSession.get("email") == null ? "" : String.valueOf(redisSession.get("email"));
        return owner == null ? "" : owner.trim().toLowerCase(Locale.ROOT);
    }

    private void removeInMemorySession(String email, String jti) {
        SessionRecord removed = inMemorySessions.remove(jti);
        String ownerEmail = email;
        if ((ownerEmail == null || ownerEmail.isBlank()) && removed != null) {
            ownerEmail = removed.email();
        }
        if (ownerEmail == null || ownerEmail.isBlank()) {
            return;
        }
        Set<String> sessions = inMemoryUserSessions.get(ownerEmail);
        if (sessions == null) {
            return;
        }
        sessions.remove(jti);
        if (sessions.isEmpty()) {
            inMemoryUserSessions.remove(ownerEmail, sessions);
        }
    }

    private void cleanupExpiredEntries() {
        long now = System.currentTimeMillis();
        long scheduled = nextCleanupAt.get();
        if (scheduled > now || !nextCleanupAt.compareAndSet(scheduled, now + CLEANUP_INTERVAL_MILLIS)) {
            return;
        }

        inMemoryBlacklist.entrySet().removeIf(entry -> entry.getValue() <= now);

        for (Map.Entry<String, SessionRecord> entry : new ArrayList<>(inMemorySessions.entrySet())) {
            SessionRecord record = entry.getValue();
            if (record != null && record.isExpired(now) && inMemorySessions.remove(entry.getKey(), record)) {
                removeInMemorySession(record.email(), entry.getKey());
            }
        }

        for (Map.Entry<String, Set<String>> entry : new ArrayList<>(inMemoryUserSessions.entrySet())) {
            Set<String> sessionIds = entry.getValue();
            if (sessionIds == null) {
                continue;
            }
            sessionIds.removeIf(jti -> {
                SessionRecord record = inMemorySessions.get(jti);
                return record == null || record.isExpired(now);
            });
            if (sessionIds.isEmpty()) {
                inMemoryUserSessions.remove(entry.getKey(), sessionIds);
            }
        }
    }

    private record SessionRecord(
            String jti,
            String email,
            long createdAt,
            long lastSeenAt,
            long expiresAt,
            String ip,
            String userAgent,
            String device,
            String platform,
            String browser,
            String deviceType,
            String location,
            String deviceId,
            String timezone,
            String language,
            String viewport
    ) {
        private boolean isExpired(long now) {
            return expiresAt <= now;
        }

        private Map<Object, Object> asMap() {
            return new HashMap<>(asStringMap());
        }

        private Map<String, String> asStringMap() {
            Map<String, String> payload = new HashMap<>();
            payload.put("email", email);
            payload.put("createdAt", String.valueOf(createdAt));
            payload.put("lastSeenAt", String.valueOf(lastSeenAt));
            payload.put("expiresAt", String.valueOf(expiresAt));
            payload.put("ip", ip);
            payload.put("userAgent", userAgent);
            payload.put("device", device);
            payload.put("platform", platform);
            payload.put("browser", browser);
            payload.put("deviceType", deviceType);
            payload.put("location", location);
            payload.put("deviceId", deviceId);
            payload.put("timezone", timezone);
            payload.put("language", language);
            payload.put("viewport", viewport);
            return payload;
        }
    }

    private record DeviceDetails(String label, String platform, String browser, String deviceType) {
    }
}
