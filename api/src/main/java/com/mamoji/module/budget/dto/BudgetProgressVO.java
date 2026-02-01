package com.mamoji.module.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Budget Progress Response VO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetProgressVO {

    /** Budget ID */
    private Long budgetId;

    /** Budget name */
    private String name;

    /** Total budget amount */
    private BigDecimal amount;

    /** Spent amount */
    private BigDecimal spent;

    /** Remaining amount */
    private BigDecimal remaining;

    /** Progress percentage (0-100) */
    private Double progress;

    /** Status: 0=canceled, 1=active, 2=completed, 3=over-budget */
    private Integer status;

    /** Status text */
    private String statusText;

    /** Start date */
    private LocalDate startDate;

    /** End date */
    private LocalDate endDate;

    /** Days remaining */
    private Integer daysRemaining;

    /** Average daily spend */
    private BigDecimal averageDailySpend;

    /** Projected end balance */
    private BigDecimal projectedBalance;

    /** Creation time */
    private LocalDateTime createdAt;
}
