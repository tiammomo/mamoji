package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

import jakarta.validation.constraints.NotNull;

/** Transaction Request DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {

    /** Transaction ID (for update) */
    private Long transactionId;

    /** Account ID */
    @NotNull(message = "账户不能为空")
    private Long accountId;

    /** Category ID (required) */
    @NotNull(message = "分类不能为空")
    private Long categoryId;

    /** Budget ID (optional) */
    private Long budgetId;

    /** Transaction type: income, expense */
    @NotNull(message = "交易类型不能为空")
    private String type;

    /** Amount */
    @NotNull(message = "金额不能为空")
    private BigDecimal amount;

    /** Currency */
    private String currency;

    /** Occurred time */
    @NotNull(message = "发生时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime occurredAt;

    /** Note */
    private String note;

    /** Refund transaction ID (for refund transactions) */
    private Long refundId;
}
