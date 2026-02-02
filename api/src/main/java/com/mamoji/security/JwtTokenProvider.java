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

/**
 * JWT Token 提供者
 * 负责 JWT Token 的生成、验证、解析和黑名单管理
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;
    private final RedisTemplate<String, Object> redisTemplate;

    /** Token 黑名单前缀 */
    private static final String TOKEN_BLACKLIST_PREFIX = "mamoji:token:blacklist:";

    /** 登录失败记录前缀 */
    private static final String LOGIN_FAIL_PREFIX = "mamoji:login:fail:";

    /** 账户锁定前缀 */
    private static final String LOCKED_PREFIX = "mamoji:account:locked:";

    /** 锁定时长（分钟） */
    private static final long LOCK_DURATION_MINUTES = 15L;

    /** 最大登录失败次数 */
    private static final int MAX_LOGIN_ATTEMPTS = 5;

    private final boolean redisAvailable;

    private SecretKey secretKey;

    /**
     * 构造函数
     * 注入 JWT 配置和 Redis 模板
     */
    @Autowired
    public JwtTokenProvider(JwtConfig jwtConfig, ObjectProvider<RedisTemplate<String, Object>> redisTemplateProvider) {
        this.jwtConfig = jwtConfig;
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
        this.redisAvailable = this.redisTemplate != null;
    }

    /**
     * 初始化方法
     * 在 Bean 创建后执行，初始化签名密钥
     */
    @PostConstruct
    public void init() {
        String secret = jwtConfig.getSecret();
        if (secret == null || secret.isEmpty()) {
            secret = "mamoji-secret-key-for-jwt-token-generation-min-256-bits-required";
            jwtConfig.setSecret(secret);
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        log.info("JWT Token Provider 初始化成功");
    }

    /**
     * 生成 JWT Token
     *
     * @param userId 用户ID
     * @param username 用户名
     * @return JWT Token 字符串
     */
    public String generateToken(Long userId, String username) {
        return generateToken(userId, username, Map.of());
    }

    /**
     * 生成 JWT Token（带额外声明）
     *
     * @param userId 用户ID
     * @param username 用户名
     * @param extraClaims 额外声明
     * @return JWT Token 字符串
     */
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

    /**
     * 从 Token 中获取用户ID
     *
     * @param token JWT Token
     * @return 用户ID
     */
    public Long getUserIdFromToken(String token) {
        return parseToken(token).get("userId", Long.class);
    }

    /**
     * 从 Token 中获取用户名
     *
     * @param token JWT Token
     * @return 用户名
     */
    public String getUsernameFromToken(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * 验证 Token 有效性
     * 检查 Token 签名、格式、过期时间及是否在黑名单中
     *
     * @param token JWT Token
     * @return true 表示有效，false 表示无效
     */
    public boolean validateToken(String token) {
        try {
            if (isTokenBlacklisted(token)) {
                log.warn("Token 已在黑名单中");
                return false;
            }
            parseToken(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT Token 已过期: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("不支持的 JWT Token: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.warn("格式错误的 JWT Token: {}", ex.getMessage());
        } catch (SecurityException ex) {
            log.warn("无效的 JWT 签名: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims 字符串为空: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * 解析 Token 获取声明
     *
     * @param token JWT Token
     * @return 声明对象
     */
    private Claims parseToken(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }

    /**
     * 将 Token 加入黑名单
     * 用于用户登出时使 Token 失效
     *
     * @param token JWT Token
     */
    public void addToBlacklist(String token) {
        try {
            Claims claims = parseToken(token);
            long remainingTime = claims.getExpiration().getTime() - System.currentTimeMillis();
            if (remainingTime > 0) {
                setRedisValue(TOKEN_BLACKLIST_PREFIX + token, "1", remainingTime);
            }
        } catch (Exception e) {
            log.error("将 Token 加入黑名单时出错", e);
        }
    }

    /**
     * 检查 Token 是否在黑名单中
     *
     * @param token JWT Token
     * @return true 表示在黑名单中
     */
    public boolean isTokenBlacklisted(String token) {
        return checkRedisKey(TOKEN_BLACKLIST_PREFIX + token);
    }

    /**
     * 记录登录失败
     * 失败次数超过阈值时自动锁定账户
     *
     * @param username 用户名
     */
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
            log.debug("Redis 不可用，跳过登录失败记录");
        }
    }

    /**
     * 清除登录失败记录
     * 登录成功后调用
     *
     * @param username 用户名
     */
    public void clearLoginFailure(String username) {
        deleteRedisKey(LOGIN_FAIL_PREFIX + username);
    }

    /**
     * 获取登录失败次数
     *
     * @param username 用户名
     * @return 失败次数
     */
    public Long getLoginFailCount(String username) {
        try {
            String key = LOGIN_FAIL_PREFIX + username;
            Object count = redisTemplate.opsForValue().get(key);
            return count != null ? Long.parseLong(count.toString()) : 0L;
        } catch (Exception e) {
            log.debug("Redis 不可用，返回登录失败次数为 0");
            return 0L;
        }
    }

    /**
     * 锁定账户
     *
     * @param username 用户名
     */
    public void lockAccount(String username) {
        setRedisValue(LOCKED_PREFIX + username, "1", LOCK_DURATION_MINUTES * 60 * 1000);
    }

    /**
     * 检查账户是否被锁定
     *
     * @param username 用户名
     * @return true 表示已锁定
     */
    public boolean isAccountLocked(String username) {
        return checkRedisKey(LOCKED_PREFIX + username);
    }

    /**
     * 解锁账户
     *
     * @param username 用户名
     */
    public void unlockAccount(String username) {
        deleteRedisKey(LOCKED_PREFIX + username);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 设置 Redis 值
     *
     * @param key 键
     * @param value 值
     * @param ttlMs 过期时间（毫秒）
     */
    private void setRedisValue(String key, String value, long ttlMs) {
        if (!redisAvailable) return;
        redisTemplate.opsForValue().set(key, value, ttlMs, TimeUnit.MILLISECONDS);
    }

    /**
     * 检查 Redis 键是否存在
     *
     * @param key 键
     * @return true 表示存在
     */
    private boolean checkRedisKey(String key) {
        if (!redisAvailable) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.debug("Redis 不可用，跳过键检查: {}", key);
            return false;
        }
    }

    /**
     * 删除 Redis 键
     *
     * @param key 键
     */
    private void deleteRedisKey(String key) {
        if (!redisAvailable) return;
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.debug("Redis 不可用，跳过键删除: {}", key);
        }
    }
}
