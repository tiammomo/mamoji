package com.mamoji.security;

/**
 * User Principal for JWT Authentication
 */
public record UserPrincipal(Long userId, String username) {
}
