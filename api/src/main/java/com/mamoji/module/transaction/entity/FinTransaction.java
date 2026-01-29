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

/** Transaction Entity (交易记录) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_transaction")
public class FinTransaction implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Transaction ID */
    @TableId(type = IdType.AUTO)
    private Long transactionId;

    /** User ID */
    private Long userId;

    /** Account ID */
    private Long accountId;

    /** Category ID (required) */
    private Long categoryId;

    /** Budget ID (optional) */
    private Long budgetId;

    /** Refund transaction ID (for refund transactions, linked to original expense) */
    private Long refundId;

    /** Transaction type: income, expense, refund */
    private String type;

    /** Amount */
    private BigDecimal amount;

    /** Currency */
    private String currency;

    /** Occurred time */
    private LocalDateTime occurredAt;

    /** Note/remark */
    private String note;

    /** Status: 0=deleted, 1=normal */
    private Integer status;

    /** Creation time */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Last update time */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
