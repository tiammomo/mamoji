package com.mamoji.module.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 成员响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberVO {

    private Long memberId;

    private Long userId;

    private String username;

    private String role;

    private LocalDateTime joinedAt;

    private Long invitedBy;

    private String invitedByUsername;
}
