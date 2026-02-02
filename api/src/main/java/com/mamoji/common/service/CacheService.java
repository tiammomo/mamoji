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
 * 多级缓存服务
 * 使用 Caffeine (L1) + Redis (L2) 实现二级缓存，提供最佳性能
 * 使用装饰器模式提供缓存功能，仅在 Redis 可用时激活
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnBean(RedisTemplate.class)
@Profile("!test")
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    /** L1: 本地 Caffeine 缓存，用于快速访问 */
    private final Cache<String, Object> localCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .recordStats()
            .build();

    private static final String CACHE_PREFIX = "mamoji:cache:";
    private static final long DEFAULT_TTL = 30; // 缓存默认过期时间（分钟）

    /**
     * 获取缓存值
     * 优先检查 L1 缓存，然后检查 L2 缓存
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        String cacheKey = CACHE_PREFIX + key;

        // 先检查 L1 (Caffeine) 缓存
        Object l1Value = localCache.getIfPresent(cacheKey);
        if (l1Value != null) {
            log.debug("L1 cache hit for key: {}", key);
            return (T) l1Value;
        }

        // 检查 L2 (Redis) 缓存
        try {
            Object l2Value = redisTemplate.opsForValue().get(cacheKey);
            if (l2Value != null) {
                log.debug("L2 cache hit for key: {}", key);
                // 填充 L1 缓存
                localCache.put(cacheKey, l2Value);
                return (T) l2Value;
            }
        } catch (Exception e) {
            log.warn("Cache get failed for key: {}", key, e);
        }

        return null;
    }

    /**
     * 设置缓存值，同时写入 L1 和 L2 缓存
     */
    public <T> void set(String key, T value) {
        set(key, value, DEFAULT_TTL);
    }

    /**
     * 设置缓存值，使用自定义过期时间
     */
    public <T> void set(String key, T value, long ttlMinutes) {
        String cacheKey = CACHE_PREFIX + key;

        try {
            // 更新 L1 缓存
            localCache.put(cacheKey, value);

            // 更新 L2 缓存
            redisTemplate.opsForValue().set(cacheKey, value, ttlMinutes, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("缓存设置失败，key: {}", key, e);
        }
    }

    /**
     * 删除缓存值，同时删除 L1 和 L2 缓存
     */
    public void delete(String key) {
        String cacheKey = CACHE_PREFIX + key;

        try {
            // 从 L1 删除
            localCache.invalidate(cacheKey);

            // 从 L2 删除
            redisTemplate.delete(cacheKey);
        } catch (Exception e) {
            log.warn("缓存删除失败，key: {}", key, e);
        }
    }

    /**
     * 按模式删除缓存值
     */
    public void deleteByPattern(String pattern) {
        try {
            String fullPattern = CACHE_PREFIX + pattern;

            // 从 Redis 获取匹配的键
            var keys = redisTemplate.keys(fullPattern);
            if (keys != null && !keys.isEmpty()) {
                // 从 L2 删除
                redisTemplate.delete(keys);

                // 使 L1 中匹配的键失效
                for (String key : keys) {
                    localCache.invalidate(key);
                }
            }
        } catch (Exception e) {
            log.warn("按模式删除缓存失败: {}", pattern, e);
        }
    }

    /**
     * 检查缓存键是否存在（L1 或 L2）
     */
    public boolean exists(String key) {
        String cacheKey = CACHE_PREFIX + key;

        // 先检查 L1
        if (localCache.getIfPresent(cacheKey) != null) {
            return true;
        }

        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(cacheKey));
        } catch (Exception e) {
            log.warn("缓存存在性检查失败，key: {}", key, e);
            return false;
        }
    }

    /**
     * 清除所有 L1 缓存条目
     */
    public void clearLocalCache() {
        localCache.invalidateAll();
        log.info("L1 缓存已清除");
    }

    /**
     * 获取缓存统计信息
     */
    public String getStats() {
        var stats = localCache.stats();
        return String.format("hitRate=%.2f, size=%d",
                stats.hitRate(), localCache.estimatedSize());
    }

    /**
     * 根据方法参数生成缓存键
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
