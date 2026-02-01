package com.mamoji.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import com.mamoji.config.JwtConfig;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/** JWT Token Provider Handles JWT token generation, validation, and parsing */
@Slf4j
@Component
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private final RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public JwtTokenProvider(JwtConfig jwtConfig, ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider) {
        this.jwtConfig = jwtConfig;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.redisAvailable = this.redisTemplate != null;
    }

    private static final String TOKEN_BLACKLIST_PREFIX = "mamoji:token:blacklist:";
    private static final String LOGIN_FAIL_PREFIX = "mamoji:login:fail:";
    private static final String LOCKED_PREFIX = "mamoji:account:locked:";
    private static final long LOCK_DURATION_MINUTES = 15L;
    private static final int MAX_LOGIN_ATTEMPTS = 5;

    private final boolean redisAvailable;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        String secret = jwtConfig.getSecret();
        if (secret == null || secret.isEmpty()) {
            secret = "mamoji-secret-key-for-jwt-token-generation-min-256-bits-required";
            jwtConfig.setSecret(secret);
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        log.info("JWT Token Provider initialized successfully");
    }

    public String generateToken(Long userId, String username) {
        return generateToken(userId, username, Map.of());
    }

    public String generateToken(Long userId, String username, Map<String, Object> extraClaims) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtConfig.getExpiration());

        Map<String, Object> claims = new java.util.HashMap<>(extraClaims);
        claims.put("userId", userId);
        claims.put("username", username);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        return parseToken(token).get("userId", Long.class);
    }

    public String getUsernameFromToken(String token) {
        return parseToken(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            if (isTokenBlacklisted(token)) {
                log.warn("Token is in blacklist");
                return false;
            }
            parseToken(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.warn("Malformed JWT token: {}", ex.getMessage());
        } catch (SecurityException ex) {
            log.warn("Invalid JWT signature: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    private Claims parseToken(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }

    public void addToBlacklist(String token) {
        try {
            Claims claims = parseToken(token);
            long remainingTime = claims.getExpiration().getTime() - System.currentTimeMillis();
            if (remainingTime > 0) {
                setRedisValue(TOKEN_BLACKLIST_PREFIX + token, "1", remainingTime);
            }
        } catch (Exception e) {
            log.error("Error adding token to blacklist", e);
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return checkRedisKey(TOKEN_BLACKLIST_PREFIX + token);
    }

    public void recordLoginFailure(String username) {
        if (!redisAvailable) return;
        try {
            String key = LOGIN_FAIL_PREFIX + username;
            Long failCount = redisTemplate.opsForValue().increment(key);
            redisTemplate.expire(key, LOCK_DURATION_MINUTES, TimeUnit.MINUTES);

            if (failCount != null && failCount >= MAX_LOGIN_ATTEMPTS) {
                lockAccount(username);
            }
        } catch (Exception e) {
            log.debug("Redis unavailable, skipping login failure recording");
        }
    }

    public void clearLoginFailure(String username) {
        deleteRedisKey(LOGIN_FAIL_PREFIX + username);
    }

    public Long getLoginFailCount(String username) {
        try {
            String key = LOGIN_FAIL_PREFIX + username;
            Object count = redisTemplate.opsForValue().get(key);
            return count != null ? Long.parseLong(count.toString()) : 0L;
        } catch (Exception e) {
            log.debug("Redis unavailable, returning 0 for login fail count");
            return 0L;
        }
    }

    public void lockAccount(String username) {
        setRedisValue(LOCKED_PREFIX + username, "1", LOCK_DURATION_MINUTES * 60 * 1000);
    }

    public boolean isAccountLocked(String username) {
        return checkRedisKey(LOCKED_PREFIX + username);
    }

    public void unlockAccount(String username) {
        deleteRedisKey(LOCKED_PREFIX + username);
    }

    // ==================== Private Helper Methods ====================

    private void setRedisValue(String key, String value, long ttlMs) {
        if (!redisAvailable) return;
        redisTemplate.opsForValue().set(key, value, ttlMs, TimeUnit.MILLISECONDS);
    }

    private boolean checkRedisKey(String key) {
        if (!redisAvailable) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.debug("Redis unavailable, skipping key check: {}", key);
            return false;
        }
    }

    private void deleteRedisKey(String key) {
        if (!redisAvailable) return;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.debug("Redis unavailable, skipping key deletion: {}", key);
        }
    }
}
