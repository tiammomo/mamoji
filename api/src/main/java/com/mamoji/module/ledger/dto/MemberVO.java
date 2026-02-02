package com.mamoji.module.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本成员响应 VO
 * 用于展示账本成员的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberVO {

    /** 成员记录ID */
    private Long memberId;

    /** 用户ID */
    private Long userId;

    /** 用户名 */
    private String username;

    /** 成员角色：owner（所有者）、admin（管理员）、member（普通成员） */
    private String role;

    /** 加入时间 */
    private LocalDateTime joinedAt;

    /** 邀请人ID */
    private Long invitedBy;

    /** 邀请人用户名 */
    private String invitedByUsername;
}
