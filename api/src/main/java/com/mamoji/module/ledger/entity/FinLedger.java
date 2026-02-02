package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本实体类
 * 对应数据库表 fin_ledger，存储用户的账本信息
 * 支持多账本场景下的数据隔离
 */
@Data
@TableName("fin_ledger")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinLedger {

    /** 账本ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long ledgerId;

    /** 账本名称 */
    private String name;

    /** 账本描述 */
    private String description;

    /** 账本所有者ID */
    private Long ownerId;

    /** 是否为默认账本：0=否，1=是 */
    @TableField(fill = FieldFill.INSERT)
    private Integer isDefault;

    /** 账本默认货币 */
    private String currency;

    /** 状态：0=禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
