package com.mamoji.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

/**
 * JWT 配置属性类
 * 用于读取 application.yml 中 JWT 相关的配置项
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /** JWT 签名密钥 */
    private String secret;

    /** JWT 过期时间（毫秒） */
    private Long expiration;

    /** JWT 请求头名称 */
    private String header;

    /** JWT Token 前缀 */
    private String prefix;
}
