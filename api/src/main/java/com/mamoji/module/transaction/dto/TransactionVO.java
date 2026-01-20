package com.mamoji.module.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction Response VO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionVO {

    /**
     * Transaction ID
     */
    private Long transactionId;

    /**
     * User ID
     */
    private Long userId;

    /**
     * Account ID
     */
    private Long accountId;

    /**
     * Account name
     */
    private String accountName;

    /**
     * Category ID
     */
    private Long categoryId;

    /**
     * Category name
     */
    private String categoryName;

    /**
     * Budget ID
     */
    private Long budgetId;

    /**
     * Transaction type
     */
    private String type;

    /**
     * Amount
     */
    private BigDecimal amount;

    /**
     * Currency
     */
    private String currency;

    /**
     * Occurred time
     */
    private LocalDateTime occurredAt;

    /**
     * Note
     */
    private String note;

    /**
     * Status
     */
    private Integer status;

    /**
     * Creation time
     */
    private LocalDateTime createdAt;
}
