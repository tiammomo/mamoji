package com.mamoji.module.report.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Summary Report VO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryVO {

    /** Total income */
    private BigDecimal totalIncome;

    /** Total expense */
    private BigDecimal totalExpense;

    /** Net income (income - expense) */
    private BigDecimal netIncome;

    /** Transaction count */
    private Integer transactionCount;

    /** Account count */
    private Integer accountCount;
}
