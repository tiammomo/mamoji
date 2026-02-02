package com.mamoji.module.auth.service;

import com.mamoji.module.auth.dto.LoginRequest;
import com.mamoji.module.auth.dto.LoginResponse;
import com.mamoji.module.auth.dto.RegisterRequest;

/**
 * 认证服务接口
 * 定义用户认证相关的业务操作
 */
public interface AuthService {

    /**
     * 用户登录
     * @param request 登录请求
     * @return 登录响应（包含Token和用户信息）
     */
    LoginResponse login(LoginRequest request);

    /**
     * 用户注册
     * @param request 注册请求
     */
    void register(RegisterRequest request);

    /**
     * 用户登出
     * @param token 要失效的Token
     */
    void logout(String token);

    /**
     * 获取当前用户信息
     * @param userId 用户ID
     * @return 用户详细信息
     */
    Object getProfile(Long userId);

    /**
     * 检查用户名是否已存在
     * @param username 用户名
     * @return 是否存在
     */
    boolean existsByUsername(String username);
}
