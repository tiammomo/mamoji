package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本成员实体类
 * 对应数据库表 fin_ledger_member，存储账本与用户的关联关系
 */
@Data
@TableName("fin_ledger_member")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinLedgerMember {

    /** 成员记录ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long memberId;

    /** 所属账本ID */
    private Long ledgerId;

    /** 用户ID */
    private Long userId;

    /** 成员角色：owner（所有者）、admin（管理员）、editor（编辑者）、viewer（查看者） */
    private String role;

    /** 加入时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;

    /** 邀请人ID */
    private Long invitedBy;

    /** 状态：0=已退出，1=正常 */
    private Integer status;
}
