/**
 * 项目名称: Mamoji 记账系统
 * 文件名: AuthServiceImpl.java
 * 功能描述: 认证服务实现类，提供用户登录、注册、登出、资料管理等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
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

/**
 * 认证服务实现类
 *
 * 负责处理用户身份验证相关的业务逻辑：
 * - 用户登录：验证账号密码，生成 JWT Token
 * - 用户注册：创建新用户账号
 * - 用户登出：将 Token 加入黑名单
 * - 资料获取：返回用户基本信息
 *
 * 安全机制：
 * - 密码加密存储（BCrypt）
 * - 登录失败计数锁定
 * - JWT Token 黑名单
 *
 * @see AuthService 认证服务接口
 * @see JwtTokenProvider JWT 令牌 provider
 * @see JwtConfig JWT 配置
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    /** 用户 Mapper，用于数据库操作 */
    private final SysUserMapper userMapper;

    /** JWT Token 提供者，用于 Token 生成和验证 */
    private final JwtTokenProvider jwtTokenProvider;

    /** JWT 配置，包含过期时间等信息 */
    private final JwtConfig jwtConfig;

    /** 密码加密器 */
    private final PasswordEncoder passwordEncoder;

    // ==================== 登录方法 ====================

    /**
     * 用户登录
     *
     * 登录流程：
     * 1. 检查账号是否已被锁定
     * 2. 根据用户名查询用户
     * 3. 验证密码是否正确
     * 4. 清零登录失败计数
     * 5. 生成 JWT Token
     *
     * 登录失败处理：
     * - 账号锁定：直接拒绝
     * - 用户不存在：记录失败，抛出异常
     * - 密码错误：记录失败，抛出异常
     *
     * @param request 登录请求（用户名、密码）
     * @return 登录响应（用户信息、Token、过期时间）
     * @throws BusinessException 账号锁定、用户不存在、密码错误
     */
    @Override
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername();

        // 检查账号是否已被锁定
        if (jwtTokenProvider.isAccountLocked(username)) {
            throw new BusinessException(ResultCode.ACCOUNT_LOCKED);
        }

        // 查询用户
        SysUser user =
                userMapper.selectOne(
                        new LambdaQueryWrapper<SysUser>()
                                .eq(SysUser::getUsername, username)
                                .eq(SysUser::getStatus, 1));

        // 用户不存在
        if (user == null) {
            jwtTokenProvider.recordLoginFailure(username);
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            jwtTokenProvider.recordLoginFailure(username);
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }

        // 清零登录失败计数
        jwtTokenProvider.clearLoginFailure(username);

        // 生成 JWT Token
        String token = jwtTokenProvider.generateToken(user.getUserId(), user.getUsername());

        log.info("用户登录成功: {}", username);

        return LoginResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getExpiration() / 1000)
                .build();
    }

    // ==================== 注册方法 ====================

    /**
     * 用户注册
     *
     * 注册流程：
     * 1. 检查用户名是否已存在
     * 2. 构建用户实体（密码加密）
     * 3. 保存到数据库
     *
     * 默认设置：
     * - 角色：普通用户 (normal)
     * - 状态：正常 (1)
     *
     * @param request 注册请求（用户名、密码、手机号、邮箱）
     * @throws BusinessException 用户名已存在
     */
    @Override
    public void register(RegisterRequest request) {
        // 检查用户名是否已存在
        if (existsByUsername(request.getUsername())) {
            throw new BusinessException(ResultCode.USERNAME_EXISTS);
        }

        // 构建用户实体
        SysUser user =
                SysUser.builder()
                        .username(request.getUsername())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .phone(request.getPhone())
                        .email(request.getEmail())
                        .role("normal")
                        .status(1)
                        .build();

        // 保存用户
        userMapper.insert(user);

        log.info("用户注册成功: {}", request.getUsername());
    }

    // ==================== 登出方法 ====================

    /**
     * 用户登出
     *
     * 将当前 Token 加入黑名单，
     * 使其后续请求无法通过验证
     *
     * @param token 要登出的 JWT Token
     */
    @Override
    public void logout(String token) {
        if (token != null && jwtTokenProvider.validateToken(token)) {
            jwtTokenProvider.addToBlacklist(token);
            log.info("用户已登出");
        }
    }

    // ==================== 资料方法 ====================

    /**
     * 获取用户资料
     *
     * 返回用户基本信息（不含密码）
     *
     * @param userId 用户ID
     * @return 用户资料 Map
     * @throws BusinessException 用户不存在
     */
    @Override
    public Object getProfile(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 返回用户信息（不包含密码）
        return java.util.Map.of(
                "userId", user.getUserId(),
                "username", user.getUsername(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "role", user.getRole(),
                "status", user.getStatus(),
                "createdAt", user.getCreatedAt());
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 检查用户名是否存在
     *
     * @param username 用户名
     * @return true 表示已存在
     */
    @Override
    public boolean existsByUsername(String username) {
        return userMapper.selectCount(
                        new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username))
                > 0;
    }
}
