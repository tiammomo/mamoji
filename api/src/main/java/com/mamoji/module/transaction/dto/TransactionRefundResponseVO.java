package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Transaction Refund Response VO (for GET /transactions/{id}/refunds) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRefundResponseVO {

    /** Original transaction info */
    private TransactionBasicVO transaction;

    /** Refund records list */
    private List<RefundVO> refunds;

    /** Refund summary */
    private RefundSummaryVO summary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionBasicVO {
        private Long transactionId;
        private BigDecimal amount;
        private String type;
    }
}
