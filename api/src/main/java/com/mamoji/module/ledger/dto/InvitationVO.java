package com.mamoji.module.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邀请响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationVO {

    private String inviteCode;

    private String inviteUrl;

    private String role;

    private Integer maxUses;

    private Integer usedCount;

    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;
}
