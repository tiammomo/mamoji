package com.mamoji.module.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.config.JwtConfig;
import com.mamoji.module.auth.dto.LoginRequest;
import com.mamoji.module.auth.dto.LoginResponse;
import com.mamoji.module.auth.dto.RegisterRequest;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.auth.mapper.SysUserMapper;
import com.mamoji.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Authentication Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper userMapper;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername();

        // Check if account is locked
        if (jwtTokenProvider.isAccountLocked(username)) {
            throw new BusinessException(ResultCode.ACCOUNT_LOCKED);
        }

        // Find user by username
        SysUser user =
                userMapper.selectOne(
                        new LambdaQueryWrapper<SysUser>()
                                .eq(SysUser::getUsername, username)
                                .eq(SysUser::getStatus, 1));

        if (user == null) {
            jwtTokenProvider.recordLoginFailure(username);
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            jwtTokenProvider.recordLoginFailure(username);
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }

        // Clear login failure count
        jwtTokenProvider.clearLoginFailure(username);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(user.getUserId(), user.getUsername());

        log.info("User logged in: {}", username);

        return LoginResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getExpiration() / 1000)
                .build();
    }

    @Override
    public void register(RegisterRequest request) {
        // Check if username already exists
        if (existsByUsername(request.getUsername())) {
            throw new BusinessException(ResultCode.USERNAME_EXISTS);
        }

        // Create new user
        SysUser user =
                SysUser.builder()
                        .username(request.getUsername())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .phone(request.getPhone())
                        .email(request.getEmail())
                        .role("normal")
                        .status(1)
                        .build();

        userMapper.insert(user);

        log.info("User registered: {}", request.getUsername());
    }

    @Override
    public void logout(String token) {
        if (token != null && jwtTokenProvider.validateToken(token)) {
            jwtTokenProvider.addToBlacklist(token);
            log.info("User logged out");
        }
    }

    @Override
    public Object getProfile(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // Return user info without password
        return java.util.Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "role", user.getRole(),
                "status", user.getStatus(),
                "createdAt", user.getCreatedAt());
    }

    @Override
    public boolean existsByUsername(String username) {
        return userMapper.selectCount(
                        new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username))
                > 0;
    }
}
