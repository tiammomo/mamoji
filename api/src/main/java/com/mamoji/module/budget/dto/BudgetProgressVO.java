package com.mamoji.module.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 预算进度响应 VO
 * 用于展示预算的详细进度信息，包括分析和预测数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetProgressVO {

    /** 预算ID */
    private Long budgetId;

    /** 预算名称 */
    private String name;

    /** 预算总金额 */
    private BigDecimal amount;

    /** 已花费金额 */
    private BigDecimal spent;

    /** 剩余金额 */
    private BigDecimal remaining;

    /** 进度百分比（0-100） */
    private Double progress;

    /** 状态：0=已取消，1=进行中，2=已完成，3=超预算 */
    private Integer status;

    /** 状态文本 */
    private String statusText;

    /** 开始日期 */
    private LocalDate startDate;

    /** 结束日期 */
    private LocalDate endDate;

    /** 剩余天数 */
    private Integer daysRemaining;

    /** 日均支出 */
    private BigDecimal averageDailySpend;

    /** 预计结束余额（预测值） */
    private BigDecimal projectedBalance;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
