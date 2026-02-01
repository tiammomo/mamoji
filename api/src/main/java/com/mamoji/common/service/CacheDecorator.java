package com.mamoji.common.service;

import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Cache decorator for service methods using Decorator Pattern. Provides transparent caching for
 * read-heavy operations. Only active when Redis is available.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBean(RedisTemplate.class)
@Profile("!test")
public class CacheDecorator {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "mamoji:cache:";
    private static final long DEFAULT_TTL = 30; // minutes

    /**
     * Get cached value.
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(CACHE_PREFIX + key);
            return value != null ? (T) value : null;
        } catch (Exception e) {
            log.warn("Cache get failed: {}", key, e);
            return null;
        }
    }

    /**
     * Set cached value.
     */
    public <T> void set(String key, T value) {
        set(key, value, DEFAULT_TTL);
    }

    /**
     * Set cached value with TTL.
     */
    public <T> void set(String key, T value, long ttlMinutes) {
        try {
            redisTemplate.opsForValue().set(CACHE_PREFIX + key, value, ttlMinutes, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Cache set failed: {}", key, e);
        }
    }

    /**
     * Delete cached value.
     */
    public void delete(String key) {
        try {
            redisTemplate.delete(CACHE_PREFIX + key);
        } catch (Exception e) {
            log.warn("Cache delete failed: {}", key, e);
        }
    }

    /**
     * Delete by pattern.
     */
    public void deleteByPattern(String pattern) {
        try {
            var keys = redisTemplate.keys(CACHE_PREFIX + pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Cache delete pattern failed: {}", pattern, e);
        }
    }

    /**
     * Generate cache key.
     */
    public String key(String className, String method, Object... args) {
        StringBuilder sb = new StringBuilder();
        sb.append(className).append(":").append(method);
        for (Object arg : args) {
            if (arg != null) {
                sb.append(":").append(arg);
            }
        }
        return sb.toString();
    }
}
