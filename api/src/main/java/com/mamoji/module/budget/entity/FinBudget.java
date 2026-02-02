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


/** Budget Entity (预算) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_budget")
public class FinBudget implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Budget ID */
    @TableId(type = IdType.AUTO)
    private Long budgetId;

    /** User ID */
    private Long userId;

    /** Ledger ID (账本ID) */
    private Long ledgerId;

    /** Budget name */
    private String name;

    /** Budget amount */
    private BigDecimal amount;

    /** Spent amount (real-time updated) */
    private BigDecimal spent;

    /** Start date */
    private LocalDate startDate;

    /** End date */
    private LocalDate endDate;

    /** Status: 0=canceled, 1=active, 2=completed, 3=over-budget */
    private Integer status;

    /** Creation time */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Last update time */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
