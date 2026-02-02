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

/**
 * 退款请求 DTO
 * 用于创建退款记录的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundDTO {

    /** 原交易ID（从URL路径参数获取，请求体中不强制要求） */
    private Long transactionId;

    /** 退款金额，必填 */
    @NotNull(message = "退款金额不能为空")
    private BigDecimal amount;

    /** 退款发生时间，必填 */
    @NotNull(message = "发生时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime occurredAt;

    /** 备注说明 */
    private String note;
}
