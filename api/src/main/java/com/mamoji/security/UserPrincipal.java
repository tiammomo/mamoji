package com.mamoji.security;

/**
 * 用户主体记录类
 * 用于 JWT 认证时存储用户身份信息
 */
public record UserPrincipal(Long userId, String username) {}
