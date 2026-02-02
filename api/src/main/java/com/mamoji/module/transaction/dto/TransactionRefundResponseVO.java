package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 交易退款响应 VO
 * 用于 GET /transactions/{id}/refunds 接口，展示原交易及退款记录
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRefundResponseVO {

    /** 原交易信息 */
    private TransactionBasicVO transaction;

    /** 退款记录列表 */
    private List<RefundVO> refunds;

    /** 退款汇总信息 */
    private RefundSummaryVO summary;

    /** 原交易基本信息（内部类） */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionBasicVO {
        /** 交易ID */
        private Long transactionId;
        /** 交易金额 */
        private BigDecimal amount;
        /** 交易类型 */
        private String type;
    }
}
