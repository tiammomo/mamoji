package com.mamoji.module.transaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Transaction Query Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionQueryDTO {

    /**
     * Transaction type: income, expense
     */
    private String type;

    /**
     * Account ID filter
     */
    private Long accountId;

    /**
     * Category ID filter
     */
    private Long categoryId;

    /**
     * Start date
     */
    private LocalDate startDate;

    /**
     * End date
     */
    private LocalDate endDate;

    /**
     * Current page
     */
    private Long current;

    /**
     * Page size
     */
    private Long size;
}
