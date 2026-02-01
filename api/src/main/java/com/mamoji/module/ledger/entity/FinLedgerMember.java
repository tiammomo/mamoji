package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本成员实体
 */
@Data
@TableName("fin_ledger_member")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinLedgerMember {

    @TableId(type = IdType.AUTO)
    private Long memberId;

    private Long ledgerId;

    private Long userId;

    private String role; // owner, admin, editor, viewer

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;

    private Long invitedBy;

    private Integer status;
}
