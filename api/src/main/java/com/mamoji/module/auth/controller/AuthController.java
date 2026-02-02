package com.mamoji.module.auth.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mamoji.common.result.Result;
import com.mamoji.module.auth.dto.LoginRequest;
import com.mamoji.module.auth.dto.LoginResponse;
import com.mamoji.module.auth.dto.RegisterRequest;
import com.mamoji.module.auth.service.AuthService;
import com.mamoji.security.JwtTokenProvider;
import com.mamoji.security.UserPrincipal;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 认证控制器
 * 提供用户登录、注册、登出、用户信息等接口
 */
@Tag(name = "认证管理", description = "用户登录、注册、登出等相关接口")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 用户登录
     * 根据用户名和密码验证身份，返回 JWT Token
     *
     * @param request 登录请求，包含用户名和密码
     * @return 登录响应，包含 Token 和用户信息
     */
    @Operation(summary = "用户登录", description = "根据用户名和密码获取 JWT Token")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return Result.success(response);
    }

    /**
     * 用户注册
     * 创建新用户账户
     *
     * @param request 注册请求，包含用户名、密码、手机号、邮箱
     * @return 空响应，注册成功
     */
    @Operation(summary = "用户注册", description = "注册新用户账户")
    @PostMapping("/register")
    public Result<Void> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return Result.success();
    }

    /**
     * 获取当前用户信息
     * 获取已登录用户的详细信息
     *
     * @param userPrincipal 当前登录用户信息
     * @return 用户详细信息
     */
    @SecurityRequirement(name = "Bearer Token")
    @Operation(summary = "获取当前用户信息", description = "获取已登录用户的详细信息")
    @GetMapping("/me")
    public Result<Object> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return Result.fail(401, "未登录");
        }
        Object user = authService.getProfile(userPrincipal.userId());
        return Result.success(user);
    }

    /**
     * 用户登出
     * 使当前 Token 失效
     *
     * @param user 当前登录用户
     * @param request HTTP 请求
     * @return 空响应
     */
    @SecurityRequirement(name = "Bearer Token")
    @Operation(summary = "用户登出", description = "使当前 Token 失效")
    @PostMapping("/logout")
    public Result<Void> logout(
            @AuthenticationPrincipal UserPrincipal user, HttpServletRequest request) {
        String token = extractToken(request);
        if (token != null) {
            jwtTokenProvider.addToBlacklist(token);
        }
        return Result.success();
    }

    /**
     * 获取登录失败次数
     * 查询指定用户的登录失败次数
     *
     * @param username 用户名
     * @return 登录失败次数
     */
    @Operation(summary = "获取登录失败次数", description = "查询指定用户的登录失败次数")
    @GetMapping("/login-fail-count")
    public Result<Long> getLoginFailCount(@RequestParam String username) {
        Long count = jwtTokenProvider.getLoginFailCount(username);
        return Result.success(count);
    }

    /**
     * 检查账户是否锁定
     * 查询指定账户是否因登录失败过多而被锁定
     *
     * @param username 用户名
     * @return 是否锁定
     */
    @Operation(summary = "检查账户是否锁定", description = "查询指定账户是否因登录失败过多而被锁定")
    @GetMapping("/account-locked")
    public Result<Boolean> isAccountLocked(@RequestParam String username) {
        Boolean isLocked = jwtTokenProvider.isAccountLocked(username);
        return Result.success(isLocked);
    }

    /**
     * 从请求头中提取 Bearer Token
     *
     * @param request HTTP 请求
     * @return Token 字符串，提取失败返回 null
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
