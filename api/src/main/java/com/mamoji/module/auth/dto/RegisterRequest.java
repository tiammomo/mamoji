package com.mamoji.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 注册请求数据对象
 * 用于接收新用户注册时提交的信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    /** 用户名，6-15个字符，仅支持英文、数字和下划线 */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 6, max = 15, message = "用户名必须是6-15个字符")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含英文、数字和下划线")
    private String username;

    /** 密码，6-20个字符 */
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码必须是6-20个字符")
    private String password;

    /** 手机号，选填，格式为 1xxxxxxxxxx */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    /** 邮箱，选填，格式为 xxx@xxx.xxx */
    @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "邮箱格式不正确")
    private String email;
}
