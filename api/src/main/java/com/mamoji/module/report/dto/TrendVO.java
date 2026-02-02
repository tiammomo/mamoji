package com.mamoji.module.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 趋势报表 VO
 * 按周期展示收支趋势，用于报表页面的趋势图表展示
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendVO {

    /** 周期标识符，根据周期类型生成（如 2024-01、2024-W01、2024-01-15） */
    private String period;

    /** 周期开始日期 */
    private LocalDate startDate;

    /** 周期结束日期 */
    private LocalDate endDate;

    /** 该周期内的总收入 */
    private BigDecimal income;

    /** 该周期内的总支出 */
    private BigDecimal expense;

    /** 该周期的净收入（收入 - 支出） */
    private BigDecimal netIncome;

    /** 该周期的交易笔数 */
    private Integer transactionCount;

    /** 收入较上一周期的变化百分比 */
    private Double incomeChangePercent;

    /** 支出较上一周期的变化百分比 */
    private Double expenseChangePercent;

    /** 净收入较上一周期的变化百分比 */
    private Double netIncomeChangePercent;
}
