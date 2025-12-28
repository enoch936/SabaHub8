package com.sabahub.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@ConditionalOnBean(StringRedisTemplate.class)
public class RedisRateLimitService implements RateLimiter {

    private final StringRedisTemplate redis;

    public RedisRateLimitService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public boolean allow(String key, int limit, int windowSeconds) {
        String rkey = "rl:" + key;
        ZSetOperations<String, String> zset = redis.opsForZSet();
        long nowSec = Instant.now().getEpochSecond();
        long windowStart = nowSec - windowSeconds;

        zset.removeRangeByScore(rkey, 0, windowStart);
        Long count = zset.zCard(rkey);
        if (count != null && count >= limit) {
            return false;
        }
        zset.add(rkey, Long.toString(nowSec), nowSec);
        redis.expire(rkey, Duration.ofSeconds(windowSeconds * 2L));
        return true;
    }
}