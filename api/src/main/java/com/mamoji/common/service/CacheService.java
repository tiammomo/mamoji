package com.mamoji.common.service;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Multi-level cache service using Caffeine (L1) + Redis (L2) for optimal performance.
 * Uses Decorator Pattern to provide caching functionality.
 * Only active when Redis is available.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBean(RedisTemplate.class)
@Profile("!test")
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    // L1: Local Caffeine cache for fast access
    private final Cache<String, Object> localCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .recordStats()
            .build();

    private static final String CACHE_PREFIX = "mamoji:cache:";
    private static final long DEFAULT_TTL = 30; // minutes

    /**
     * Get cached value - check L1 first, then L2.
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        String cacheKey = CACHE_PREFIX + key;

        // Check L1 (Caffeine) first
        Object l1Value = localCache.getIfPresent(cacheKey);
        if (l1Value != null) {
            log.debug("L1 cache hit for key: {}", key);
            return (T) l1Value;
        }

        // Check L2 (Redis)
        try {
            Object l2Value = redisTemplate.opsForValue().get(cacheKey);
            if (l2Value != null) {
                log.debug("L2 cache hit for key: {}", key);
                // Populate L1 cache
                localCache.put(cacheKey, l2Value);
                return (T) l2Value;
            }
        } catch (Exception e) {
            log.warn("Cache get failed for key: {}", key, e);
        }

        return null;
    }

    /**
     * Set value in cache - both L1 and L2.
     */
    public <T> void set(String key, T value) {
        set(key, value, DEFAULT_TTL);
    }

    /**
     * Set value in cache with custom TTL.
     */
    public <T> void set(String key, T value, long ttlMinutes) {
        String cacheKey = CACHE_PREFIX + key;

        try {
            // Update L1 cache
            localCache.put(cacheKey, value);

            // Update L2 cache
            redisTemplate.opsForValue().set(cacheKey, value, ttlMinutes, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Cache set failed for key: {}", key, e);
        }
    }

    /**
     * Delete cached value - both L1 and L2.
     */
    public void delete(String key) {
        String cacheKey = CACHE_PREFIX + key;

        try {
            // Delete from L1
            localCache.invalidate(cacheKey);

            // Delete from L2
            redisTemplate.delete(cacheKey);
        } catch (Exception e) {
            log.warn("Cache delete failed for key: {}", key, e);
        }
    }

    /**
     * Delete cached value by pattern.
     */
    public void deleteByPattern(String pattern) {
        try {
            String fullPattern = CACHE_PREFIX + pattern;

            // Get matching keys from Redis
            var keys = redisTemplate.keys(fullPattern);
            if (keys != null && !keys.isEmpty()) {
                // Delete from L2
                redisTemplate.delete(keys);

                // Invalidate matching keys in L1
                for (String key : keys) {
                    localCache.invalidate(key);
                }
            }
        } catch (Exception e) {
            log.warn("Cache delete by pattern failed for: {}", pattern, e);
        }
    }

    /**
     * Check if key exists in cache (L1 or L2).
     */
    public boolean exists(String key) {
        String cacheKey = CACHE_PREFIX + key;

        // Check L1 first
        if (localCache.getIfPresent(cacheKey) != null) {
            return true;
        }

        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(cacheKey));
        } catch (Exception e) {
            log.warn("Cache exists check failed for key: {}", key, e);
            return false;
        }
    }

    /**
     * Clear all L1 cache entries.
     */
    public void clearLocalCache() {
        localCache.invalidateAll();
        log.info("L1 cache cleared");
    }

    /**
     * Get cache statistics.
     */
    public String getStats() {
        var stats = localCache.stats();
        return String.format("hitRate=%.2f, size=%d",
                stats.hitRate(), localCache.estimatedSize());
    }

    /**
     * Generate cache key from method arguments.
     */
    public String generateKey(String className, String methodName, Object... args) {
        StringBuilder sb = new StringBuilder();
        sb.append(className).append(":").append(methodName);
        for (Object arg : args) {
            if (arg != null) {
                sb.append(":").append(arg.toString());
            }
        }
        return sb.toString();
    }
}
