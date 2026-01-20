package com.mamoji.module.account.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Account Response VO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountVO {

    /**
     * Account ID
     */
    private Long accountId;

    /**
     * Account name
     */
    private String name;

    /**
     * Account type
     */
    private String accountType;

    /**
     * Account sub type
     */
    private String accountSubType;

    /**
     * Currency
     */
    private String currency;

    /**
     * Balance
     */
    private BigDecimal balance;

    /**
     * Include in total assets
     */
    private Integer includeInTotal;

    /**
     * Status
     */
    private Integer status;

    /**
     * Creation time
     */
    private LocalDateTime createdAt;
}
