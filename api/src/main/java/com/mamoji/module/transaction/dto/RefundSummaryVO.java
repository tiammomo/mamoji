package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Refund Summary VO (included in transaction response) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundSummaryVO {

    /** Total refunded amount */
    private BigDecimal totalRefunded;

    /** Remaining refundable amount */
    private BigDecimal remainingRefundable;

    /** Whether there are refund records */
    private Boolean hasRefund;

    /** Number of refund records */
    private Integer refundCount;
}
