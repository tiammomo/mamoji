package com.mamoji.module.ledger.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 创建邀请请求 DTO
 * 用于创建邀请码的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvitationRequest {

    /** 被邀请人角色，必填 */
    @NotNull(message = "角色不能为空")
    private String role;

    /** 最大使用次数，可选，0表示无限 */
    private Integer maxUses;

    /** 过期时间，可选 */
    private LocalDateTime expiresAt;
}
