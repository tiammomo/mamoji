package com.mamoji.module.auth.service;

import com.mamoji.module.auth.dto.LoginRequest;
import com.mamoji.module.auth.dto.LoginResponse;
import com.mamoji.module.auth.dto.RegisterRequest;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.auth.mapper.SysUserMapper;
import com.mamoji.config.JwtConfig;
import com.mamoji.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * AuthService Unit Tests
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private SysUserMapper userMapper;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtConfig jwtConfig;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthServiceImpl authService;

    private SysUser testUser;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(userMapper, jwtTokenProvider, jwtConfig, passwordEncoder);

        testUser = SysUser.builder()
                .userId(1L)
                .username("testuser")
                .phone("13800138000")
                .password("encoded_password")
                .role("normal")
                .status(1)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Login with valid credentials should return token")
    void login_WithValidCredentials_ReturnsToken() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .username("testuser")
                .password("password123")
                .build();

        when(userMapper.selectOne(any())).thenReturn(testUser);
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(jwtTokenProvider.generateToken(1L, "testuser")).thenReturn("jwt_token");

        // When
        LoginResponse response = authService.login(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt_token");
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getUsername()).isEqualTo("testuser");
        verify(jwtTokenProvider).generateToken(1L, "testuser");
    }

    @Test
    @DisplayName("Login with invalid password should throw exception")
    void login_WithInvalidPassword_ThrowsException() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .username("testuser")
                .password("wrongpassword")
                .build();

        when(userMapper.selectOne(any())).thenReturn(testUser);
        when(passwordEncoder.matches("wrongpassword", "encoded_password")).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Login with non-existent user should throw exception")
    void login_WithNonExistentUser_ThrowsException() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .username("nonexistent")
                .password("password123")
                .build();

        when(userMapper.selectOne(any())).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Register new user should call insert")
    void register_NewUser_CallsInsert() {
        // Given
        RegisterRequest request = RegisterRequest.builder()
                .username("newuser")
                .password("password123")
                .phone("13900139000")
                .build();

        when(userMapper.selectOne(any())).thenReturn(null);
        when(passwordEncoder.encode("password123")).thenReturn("encoded_password");
        when(userMapper.insert(any(SysUser.class))).thenReturn(1);

        // When
        authService.register(request);

        // Then
        verify(userMapper).insert(any(SysUser.class));
    }

    @Test
    @DisplayName("Logout should add token to blacklist")
    void logout_ValidToken_AddsToBlacklist() {
        // Given
        String token = "valid_jwt_token";
        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        doNothing().when(jwtTokenProvider).addToBlacklist(token);

        // When
        authService.logout(token);

        // Then
        verify(jwtTokenProvider).validateToken(token);
        verify(jwtTokenProvider).addToBlacklist(token);
    }

    @Test
    @DisplayName("Get profile should return user info when user exists")
    void getProfile_UserExists_ReturnsUserInfo() {
        // Given
        when(userMapper.selectById(1L)).thenReturn(testUser);

        // When
        Object result = authService.getProfile(1L);

        // Then
        assertThat(result).isNotNull();
        verify(userMapper).selectById(1L);
    }

    @Test
    @DisplayName("Get profile should throw exception when user not found")
    void getProfile_UserNotFound_ThrowsException() {
        // Given
        when(userMapper.selectById(999L)).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> authService.getProfile(999L))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Exists by username should return true when user exists")
    void existsByUsername_UserExists_ReturnsTrue() {
        // Given
        when(userMapper.selectCount(any())).thenReturn(1L);

        // When
        boolean result = authService.existsByUsername("testuser");

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Exists by username should return false when user not exists")
    void existsByUsername_UserNotExists_ReturnsFalse() {
        // Given
        when(userMapper.selectCount(any())).thenReturn(0L);

        // When
        boolean result = authService.existsByUsername("nonexistent");

        // Then
        assertThat(result).isFalse();
    }
}
