package com.mamoji.module.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Trend Report VO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendVO {

    /** Period identifier (date string based on period type) */
    private String period;

    /** Start date of the period */
    private LocalDate startDate;

    /** End date of the period */
    private LocalDate endDate;

    /** Total income for the period */
    private BigDecimal income;

    /** Total expense for the period */
    private BigDecimal expense;

    /** Net income (income - expense) */
    private BigDecimal netIncome;

    /** Transaction count */
    private Integer transactionCount;

    /** Income change percentage compared to previous period */
    private Double incomeChangePercent;

    /** Expense change percentage compared to previous period */
    private Double expenseChangePercent;

    /** Net income change percentage compared to previous period */
    private Double netIncomeChangePercent;
}
