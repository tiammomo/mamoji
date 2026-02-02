package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 交易请求 DTO
 * 用于创建和更新交易记录的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {

    /** 交易ID，更新时必传 */
    private Long transactionId;

    /** 账户ID，必填 */
    @NotNull(message = "账户不能为空")
    private Long accountId;

    /** 分类ID，必填 */
    @NotNull(message = "分类不能为空")
    private Long categoryId;

    /** 预算ID，可选 */
    private Long budgetId;

    /** 交易类型：income（收入）、expense（支出），必填 */
    @NotNull(message = "交易类型不能为空")
    private String type;

    /** 交易金额，必填 */
    @NotNull(message = "金额不能为空")
    private BigDecimal amount;

    /** 币种，可选 */
    private String currency;

    /** 交易发生时间，必填 */
    @NotNull(message = "发生时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime occurredAt;

    /** 备注说明 */
    private String note;

    /** 原交易ID（退款交易专用） */
    private Long refundId;
}
