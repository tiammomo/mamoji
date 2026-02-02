package com.mamoji.module.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 预算响应 VO
 * 用于展示预算的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetVO {

    /** 预算ID */
    private Long budgetId;

    /** 用户ID */
    private Long userId;

    /** 预算名称 */
    private String name;

    /** 预算金额 */
    private BigDecimal amount;

    /** 已花费金额 */
    private BigDecimal spent;

    /** 剩余金额 */
    private BigDecimal remaining;

    /** 进度百分比（0-100） */
    private Double progress;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 状态：0=已取消，1=进行中，2=已完成，3=超预算 */
    private Integer status;

    /** 状态文本 */
    private String statusText;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
