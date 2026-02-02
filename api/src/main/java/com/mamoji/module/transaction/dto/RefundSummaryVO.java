package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 退款汇总 VO
 * 包含在交易响应中，展示退款统计信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundSummaryVO {

    /** 已退款总金额 */
    private BigDecimal totalRefunded;

    /** 剩余可退款金额 */
    private BigDecimal remainingRefundable;

    /** 是否有退款记录 */
    private Boolean hasRefund;

    /** 退款记录数量 */
    private Integer refundCount;
}
