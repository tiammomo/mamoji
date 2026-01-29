package com.mamoji.config;

import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Caffeine Cache Configuration Provides high-performance local caching for budget queries Only
 * enabled in non-test profiles
 */
@Configuration
@EnableCaching
@Profile("!test")
public class CacheConfig {

    /** Primary Cache Manager - Caffeine Used for application caching */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // Configure Caffeine
        cacheManager.setCaffeine(
                Caffeine.newBuilder()
                        // Maximum number of entries
                        .maximumSize(1000)
                        // Expire after 10 minutes of inactivity
                        .expireAfterAccess(10, TimeUnit.MINUTES)
                        // Record statistics for monitoring
                        .recordStats());

        // Register specific cache names
        cacheManager.setCacheNames(
                java.util.List.of("budgets", "accounts", "transactions", "categories"));

        return cacheManager;
    }
}
