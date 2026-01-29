package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Refund Request DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundDTO {

    /** Original transaction ID */
    @NotNull(message = "原交易ID不能为空")
    private Long transactionId;

    /** Refund amount */
    @NotNull(message = "退款金额不能为空")
    private BigDecimal amount;

    /** Occurred time */
    @NotNull(message = "发生时间不能为空")
    private LocalDateTime occurredAt;

    /** Note */
    private String note;
}
