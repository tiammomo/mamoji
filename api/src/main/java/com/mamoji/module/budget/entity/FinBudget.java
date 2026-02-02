package com.mamoji.module.budget.entity;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 预算实体类
 * 对应数据库表 fin_budget，存储用户预算信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_budget")
public class FinBudget implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 预算ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long budgetId;

    /** 所属用户ID */
    private Long userId;

    /** 所属账本ID，用于多账本场景下的数据隔离 */
    private Long ledgerId;

    /** 预算名称 */
    private String name;

    /** 预算金额 */
    private BigDecimal amount;

    /** 已花费金额，实时更新 */
    private BigDecimal spent;

    /** 预算开始日期 */
    private LocalDate startDate;

    /** 预算结束日期 */
    private LocalDate endDate;

    /** 状态：0=已取消，1=进行中，2=已完成，3=超预算 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
