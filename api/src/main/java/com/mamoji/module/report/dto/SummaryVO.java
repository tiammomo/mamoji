package com.mamoji.module.report.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 收支汇总报表 VO
 * 用于展示指定时间范围内的收支汇总数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SummaryVO {

    /** 总收入金额 */
    private BigDecimal totalIncome;

    /** 总支出金额 */
    private BigDecimal totalExpense;

    /** 净收入（收入 - 支出） */
    private BigDecimal netIncome;

    /** 交易笔数 */
    private Integer transactionCount;

    /** 账户数量 */
    private Integer accountCount;
}
