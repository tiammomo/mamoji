package com.mamoji.module.transaction.entity;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

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

/** Refund Entity (退款记录) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_refund")
public class FinRefund implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Refund ID */
    @TableId(type = IdType.AUTO)
    private Long refundId;

    /** User ID */
    private Long userId;

    /** Original transaction ID */
    private Long transactionId;

    /** Account ID (refund to this account) */
    private Long accountId;

    /** Category ID (usually same as original transaction) */
    private Long categoryId;

    /** Refund amount (positive number) */
    private BigDecimal amount;

    /** Currency */
    private String currency;

    /** Occurred time */
    private LocalDateTime occurredAt;

    /** Note (format: "退款：xxx") */
    private String note;

    /** Status: 0=cancelled, 1=valid */
    private Integer status;

    /** Creation time */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Last update time */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
