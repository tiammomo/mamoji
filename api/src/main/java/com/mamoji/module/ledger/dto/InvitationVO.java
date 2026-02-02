package com.mamoji.module.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邀请响应 VO
 * 用于展示邀请码和邀请链接信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationVO {

    /** 邀请码 */
    private String inviteCode;

    /** 邀请链接 */
    private String inviteUrl;

    /** 被邀请人角色 */
    private String role;

    /** 最大使用次数 */
    private Integer maxUses;

    /** 已使用次数 */
    private Integer usedCount;

    /** 过期时间 */
    private LocalDateTime expiresAt;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
