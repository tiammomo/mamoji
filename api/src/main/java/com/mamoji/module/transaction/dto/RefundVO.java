package com.mamoji.module.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Refund Response VO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundVO {

    /** Refund ID */
    private Long refundId;

    /** Original transaction ID */
    private Long transactionId;

    /** Refund amount */
    private BigDecimal amount;

    /** Note */
    private String note;

    /** Occurred time */
    private LocalDateTime occurredAt;

    /** Status: 0=cancelled, 1=valid */
    private Integer status;

    /** Creation time */
    private LocalDateTime createdAt;
}
