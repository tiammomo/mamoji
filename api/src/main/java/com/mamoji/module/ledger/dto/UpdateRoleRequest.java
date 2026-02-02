package com.mamoji.module.ledger.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 更新成员角色请求 DTO
 * 用于修改账本成员的角色的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {

    /** 新的角色，必填 */
    @NotBlank(message = "角色不能为空")
    private String role;
}
