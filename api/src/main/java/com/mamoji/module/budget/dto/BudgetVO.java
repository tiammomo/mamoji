package com.mamoji.module.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Budget Response VO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetVO {

    /** Budget ID */
    private Long budgetId;

    /** User ID */
    private Long userId;

    /** Budget name */
    private String name;

    /** Budget amount */
    private BigDecimal amount;

    /** Spent amount */
    private BigDecimal spent;

    /** Remaining amount */
    private BigDecimal remaining;

    /** Progress percentage (0-100) */
    private Double progress;

    /** Start date */
    private LocalDate startDate;

    /** End date */
    private LocalDate endDate;

    /** Status: 0=canceled, 1=active, 2=completed, 3=over-budget */
    private Integer status;

    /** Status text */
    private String statusText;

    /** Creation time */
    private LocalDateTime createdAt;
}
