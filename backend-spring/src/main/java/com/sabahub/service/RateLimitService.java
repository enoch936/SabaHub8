package com.sabahub.service;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Primary
public class RateLimitService implements RateLimiter {

    private final Map<String, Deque<Long>> buckets = new ConcurrentHashMap<>();

    /**
     * Sliding window rate limiter (in-memory).
     */
    @Override
    public boolean allow(String key, int limit, int windowSeconds) {
        long now = Instant.now().toEpochMilli();
        long windowMs = windowSeconds * 1000L;
        Deque<Long> q = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > windowMs) {
                q.pollFirst();
            }
            if (q.size() >= limit) {
                return false;
            }
            q.addLast(now);
            return true;
        }
    }
}