package com.mamoji.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Login Response DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    /** User ID */
    private Long userId;

    /** Username */
    private String username;

    /** JWT Access Token */
    private String token;

    /** Token Type */
    private String tokenType;

    /** Token Expiration Time (seconds) */
    private Long expiresIn;
}
