package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 退款响应 VO
 * 用于展示退款记录的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundVO {

    /** 退款ID */
    private Long refundId;

    /** 原交易ID */
    private Long transactionId;

    /** 退款金额 */
    private BigDecimal amount;

    /** 备注 */
    private String note;

    /** 退款发生时间 */
    private LocalDateTime occurredAt;

    /** 状态：0=已取消，1=有效 */
    private Integer status;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
