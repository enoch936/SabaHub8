package com.sabahub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class VerificationChallengeService {

    private static final Logger log = LoggerFactory.getLogger(VerificationChallengeService.class);
    private static final Duration REGISTRATION_CHALLENGE_TTL = Duration.ofMinutes(15);
    private static final Duration LOGIN_CHALLENGE_TTL = Duration.ofMinutes(10);
    private static final String REGISTRATION_CHALLENGE_PREFIX = "auth:register:challenge:";
    private static final String LOGIN_CHALLENGE_PREFIX = "auth:login:2fa:";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final ConcurrentMap<String, LocalChallengeEntry> localChallenges = new ConcurrentHashMap<>();

    public VerificationChallengeService(ObjectProvider<StringRedisTemplate> redisProvider, ObjectMapper objectMapper) {
        this.redis = redisProvider.getIfAvailable();
        this.objectMapper = objectMapper;
    }

    public String createRegistrationChallenge(String email, String phoneNumber, String verificationMethod) {
        String challengeId = UUID.randomUUID().toString();
        RegistrationChallenge challenge = new RegistrationChallenge(
                normalizeOptional(email),
                normalizeOptional(phoneNumber),
                normalizeRegistrationMethod(verificationMethod),
                false,
                false
        );
        writeChallenge(registrationKey(challengeId), challenge, REGISTRATION_CHALLENGE_TTL);
        return challengeId;
    }

    public Optional<RegistrationChallenge> getRegistrationChallenge(String challengeId) {
        return readChallenge(registrationKey(challengeId), RegistrationChallenge.class);
    }

    public RegistrationChallenge requireRegistrationChallenge(String challengeId) {
        return getRegistrationChallenge(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Registration challenge expired or invalid"));
    }

    public RegistrationChallenge markRegistrationChannelVerified(String challengeId, String channel) {
        RegistrationChallenge current = requireRegistrationChallenge(challengeId);
        String normalizedChannel = normalizeRegistrationChannel(channel);
        RegistrationChallenge updated = "PHONE".equals(normalizedChannel)
                ? current.withPhoneVerified()
                : current.withEmailVerified();
        writeChallenge(registrationKey(challengeId), updated, REGISTRATION_CHALLENGE_TTL);
        return updated;
    }

    public void deleteRegistrationChallenge(String challengeId) {
        if (challengeId != null && !challengeId.isBlank()) {
            deleteChallenge(registrationKey(challengeId));
        }
    }

    public String createLoginChallenge(String email, String method) {
        String normalizedMethod = normalizeLoginMethod(method);
        String challengeId = UUID.randomUUID().toString();
        LoginChallenge challenge = new LoginChallenge(
                normalizeOptional(email),
                normalizedMethod,
                channelsForMethod(normalizedMethod)
        );
        writeChallenge(loginKey(challengeId), challenge, LOGIN_CHALLENGE_TTL);
        return challengeId;
    }

    public Optional<LoginChallenge> getLoginChallenge(String challengeId) {
        return readChallenge(loginKey(challengeId), LoginChallenge.class);
    }

    public LoginChallenge requireLoginChallenge(String challengeId) {
        return getLoginChallenge(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge expired or invalid"));
    }

    public void refreshLoginChallenge(String challengeId, LoginChallenge challenge) {
        writeChallenge(loginKey(challengeId), challenge, LOGIN_CHALLENGE_TTL);
    }

    public void deleteLoginChallenge(String challengeId) {
        if (challengeId != null && !challengeId.isBlank()) {
            deleteChallenge(loginKey(challengeId));
        }
    }

    private String registrationKey(String challengeId) {
        return REGISTRATION_CHALLENGE_PREFIX + challengeId;
    }

    private String loginKey(String challengeId) {
        return LOGIN_CHALLENGE_PREFIX + challengeId;
    }

    private <T> Optional<T> readChallenge(String key, Class<T> type) {
        if (key == null || key.isBlank()) {
            return Optional.empty();
        }

        Optional<T> localChallenge = readLocalChallenge(key, type);
        if (localChallenge.isPresent()) {
            return localChallenge;
        }

        if (redis != null) {
            try {
                String payload = redis.opsForValue().get(key);
                if (payload != null && !payload.isBlank()) {
                    return deserializeChallenge(key, payload, type);
                }
            } catch (Exception ex) {
                log.warn("Falling back to local verification challenge store for {} after Redis read failure: {}", key, ex.getMessage());
            }
        }

        return Optional.empty();
    }

    private void writeChallenge(String key, Object challenge, Duration ttl) {
        try {
            String payload = objectMapper.writeValueAsString(challenge);
            if (redis != null) {
                try {
                    redis.opsForValue().set(key, payload, ttl);
                    localChallenges.remove(key);
                    return;
                } catch (Exception ex) {
                    log.warn("Redis unavailable while storing verification challenge {}. Falling back to in-memory storage: {}", key, ex.getMessage());
                }
            }
            localChallenges.put(key, new LocalChallengeEntry(payload, System.currentTimeMillis() + ttl.toMillis()));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to persist verification challenge", e);
        }
    }

    private void deleteChallenge(String key) {
        if (key == null || key.isBlank()) {
            return;
        }

        localChallenges.remove(key);
        if (redis == null) {
            return;
        }

        try {
            redis.delete(key);
        } catch (Exception ex) {
            log.warn("Failed to delete verification challenge {} from Redis: {}", key, ex.getMessage());
        }
    }

    private <T> Optional<T> readLocalChallenge(String key, Class<T> type) {
        LocalChallengeEntry entry = localChallenges.get(key);
        if (entry == null) {
            return Optional.empty();
        }
        if (entry.expiresAtMillis() <= System.currentTimeMillis()) {
            localChallenges.remove(key, entry);
            return Optional.empty();
        }

        return deserializeChallenge(key, entry.payload(), type);
    }

    private <T> Optional<T> deserializeChallenge(String key, String payload, Class<T> type) {
        try {
            return Optional.of(objectMapper.readValue(payload, type));
        } catch (Exception ignored) {
            deleteChallenge(key);
            return Optional.empty();
        }
    }

    private List<String> channelsForMethod(String method) {
        List<String> factors = TwoFactorMethodNormalizer.normalizeFactors(method);
        return factors.isEmpty() ? List.of("EMAIL") : factors;
    }

    private String normalizeRegistrationMethod(String method) {
        List<String> factors = TwoFactorMethodNormalizer.normalizeFactors(method).stream()
                .filter(factor -> "EMAIL".equals(factor) || "PHONE".equals(factor))
                .toList();
        return factors.isEmpty() ? "EMAIL" : String.join("+", factors);
    }

    private String normalizeLoginMethod(String method) {
        return TwoFactorMethodNormalizer.normalizeOrDefault(method, "EMAIL");
    }

    private String normalizeRegistrationChannel(String channel) {
        String normalized = channel != null ? channel.trim().toUpperCase(Locale.ROOT) : "";
        return "PHONE".equals(normalized) ? "PHONE" : "EMAIL";
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    public record RegistrationChallenge(
            String email,
            String phoneNumber,
            String verificationMethod,
            boolean emailVerified,
            boolean phoneVerified
    ) {
        public RegistrationChallenge withEmailVerified() {
            return new RegistrationChallenge(email, phoneNumber, verificationMethod, true, phoneVerified);
        }

        public RegistrationChallenge withPhoneVerified() {
            return new RegistrationChallenge(email, phoneNumber, verificationMethod, emailVerified, true);
        }
    }

    public record LoginChallenge(
            String email,
            String method,
            List<String> requiredChannels
    ) {
    }

    private record LocalChallengeEntry(
            String payload,
            long expiresAtMillis
    ) {
    }
}
