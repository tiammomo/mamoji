package com.mamoji.module.ledger.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 创建邀请请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvitationRequest {

    @NotNull(message = "角色不能为空")
    private String role;

    private Integer maxUses;

    private LocalDateTime expiresAt;
}
