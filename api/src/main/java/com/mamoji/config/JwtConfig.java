package com.mamoji.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT Configuration Properties
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    /**
     * JWT Secret Key
     */
    private String secret;

    /**
     * JWT Expiration Time (milliseconds)
     */
    private Long expiration;

    /**
     * JWT Header Name
     */
    private String header;

    /**
     * JWT Token Prefix
     */
    private String prefix;
}
