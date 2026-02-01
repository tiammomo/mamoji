package com.mamoji.module.ledger.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 账本实体
 */
@Data
@TableName("fin_ledger")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinLedger {

    @TableId(type = IdType.AUTO)
    private Long ledgerId;

    private String name;

    private String description;

    private Long ownerId;

    @TableField(fill = FieldFill.INSERT)
    private Integer isDefault;

    private String currency;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
