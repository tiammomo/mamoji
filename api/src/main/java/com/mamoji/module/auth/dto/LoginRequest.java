package com.mamoji.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.NotBlank;

/** Login Request DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    /** Username */
    @NotBlank(message = "用户名不能为空")
    private String username;

    /** Password */
    @NotBlank(message = "密码不能为空")
    private String password;
}
