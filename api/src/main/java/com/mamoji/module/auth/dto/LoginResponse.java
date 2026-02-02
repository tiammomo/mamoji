package com.mamoji.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应数据对象
 * 登录成功后返回的用户信息和 Token 信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /** 用户ID */
    private Long userId;

    /** 用户名 */
    private String username;

    /** JWT 访问令牌 */
    private String token;

    /** Token 类型，固定为 Bearer */
    private String tokenType;

    /** Token 过期时间（秒） */
    private Long expiresIn;
}
