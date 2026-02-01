package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邀请码实体
 */
@Data
@TableName("fin_invitation")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinInvitation {

    @TableId(type = IdType.AUTO)
    private Long inviteId;

    private Long ledgerId;

    private String inviteCode;

    private String role; // 默认角色: editor, viewer, admin

    private Integer maxUses; // 0 = 无限

    private Integer usedCount;

    private LocalDateTime expiresAt;

    private Long createdBy;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
