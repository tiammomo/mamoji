package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 交易响应 VO
 * 用于展示交易记录的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionVO {

    /** 交易ID */
    private Long transactionId;

    /** 用户ID */
    private Long userId;

    /** 账户ID */
    private Long accountId;

    /** 账户名称 */
    private String accountName;

    /** 分类ID */
    private Long categoryId;

    /** 分类名称 */
    private String categoryName;

    /** 预算ID */
    private Long budgetId;

    /** 交易类型 */
    private String type;

    /** 交易金额 */
    private BigDecimal amount;

    /** 币种 */
    private String currency;

    /** 交易发生时间 */
    private LocalDateTime occurredAt;

    /** 备注 */
    private String note;

    /** 状态 */
    private Integer status;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
