package com.sabahub.service;

public interface RateLimiter {
    boolean allow(String key, int limit, int windowSeconds);
}