package com.sabahub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VerificationChallengeServiceTest {

    @Mock
    private ObjectProvider<StringRedisTemplate> redisProvider;

    @Mock
    private StringRedisTemplate redis;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Test
    void createLoginChallenge_fallsBackToInMemoryStoreWhenRedisWriteFails() {
        when(redisProvider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(valueOperations);
        doThrow(new RuntimeException("Redis unavailable"))
                .when(valueOperations)
                .set(anyString(), anyString(), any(Duration.class));
        when(valueOperations.get(anyString())).thenReturn(null);

        VerificationChallengeService service = new VerificationChallengeService(redisProvider, new ObjectMapper());

        String challengeId = service.createLoginChallenge("builder@sabahub.test", "PHONE");

        assertThat(service.getLoginChallenge(challengeId))
                .hasValueSatisfying(challenge -> {
                    assertThat(challenge.email()).isEqualTo("builder@sabahub.test");
                    assertThat(challenge.method()).isEqualTo("PHONE");
                    assertThat(challenge.requiredChannels()).containsExactly("PHONE");
                });

        service.deleteLoginChallenge(challengeId);

        assertThat(service.getLoginChallenge(challengeId)).isEmpty();
    }
}
