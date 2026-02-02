package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 邀请码实体类
 * 对应数据库表 fin_invitation，存储账本邀请码信息
 */
@Data
@TableName("fin_invitation")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinInvitation {

    /** 邀请记录ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long inviteId;

    /** 所属账本ID */
    private Long ledgerId;

    /** 邀请码 */
    private String inviteCode;

    /** 被邀请人默认角色：editor（编辑者）、viewer（查看者）、admin（管理员） */
    private String role;

    /** 最大使用次数，0表示无限 */
    private Integer maxUses;

    /** 已使用次数 */
    private Integer usedCount;

    /** 过期时间 */
    private LocalDateTime expiresAt;

    /** 创建人ID */
    private Long createdBy;

    /** 状态：0=已禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
