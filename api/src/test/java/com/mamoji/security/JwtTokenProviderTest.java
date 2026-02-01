package com.mamoji.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.RedisTemplate;

/** JwtTokenProvider Unit Tests */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtTokenProviderTest {

    @Mock private com.mamoji.config.JwtConfig jwtConfig;

    @Mock private RedisTemplate<String, Object> redisTemplate;

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        // Setup mock config
        when(jwtConfig.getSecret())
                .thenReturn("test-secret-key-for-jwt-token-generation-min-256-bits-required");
        when(jwtConfig.getExpiration()).thenReturn(86400000L);

        // Create ObjectProvider that returns the mock redisTemplate
        ObjectProvider<RedisTemplate<String, Object>> redisProvider = new ObjectProvider<>() {
            @Override
            public RedisTemplate<String, Object> getObject() {
                return redisTemplate;
            }
            @Override
            public RedisTemplate<String, Object> getIfAvailable() {
                return redisTemplate;
            }
            @Override
            public RedisTemplate<String, Object> getIfUnique() {
                return redisTemplate;
            }
        };
        jwtTokenProvider = new JwtTokenProvider(jwtConfig, redisProvider);
        jwtTokenProvider.init();
    }

    @Test
    @DisplayName("Generate token should return valid JWT")
    void generateToken_WithValidParams_ReturnsJWT() {
        // When
        String token = jwtTokenProvider.generateToken(1L, "testuser");

        // Then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3); // JWT has 3 parts
    }

    @Test
    @DisplayName("Validate token should return true for valid token")
    void validateToken_WithValidToken_ReturnsTrue() {
        // Given
        String token = jwtTokenProvider.generateToken(1L, "testuser");

        // When
        boolean isValid = jwtTokenProvider.validateToken(token);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Validate token should return false for invalid token")
    void validateToken_WithInvalidToken_ReturnsFalse() {
        // When
        boolean isValid = jwtTokenProvider.validateToken("invalid.token.here");

        // Then
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Get user id from token should return correct user id")
    void getUserIdFromToken_WithValidToken_ReturnsUserId() {
        // Given
        String token = jwtTokenProvider.generateToken(123L, "testuser");

        // When
        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        // Then
        assertThat(userId).isEqualTo(123L);
    }

    @Test
    @DisplayName("Get username from token should return correct username")
    void getUsernameFromToken_WithValidToken_ReturnsUsername() {
        // Given
        String token = jwtTokenProvider.generateToken(1L, "testuser");

        // When
        String username = jwtTokenProvider.getUsernameFromToken(token);

        // Then
        assertThat(username).isEqualTo("testuser");
    }
}
