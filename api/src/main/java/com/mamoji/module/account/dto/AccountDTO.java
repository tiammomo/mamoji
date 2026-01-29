package com.mamoji.module.account.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Account Request DTO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {

    /** Account ID (for update) */
    private Long accountId;

    /** Account name */
    @NotBlank(message = "账户名称不能为空")
    private String name;

    /** Account type */
    @NotNull(message = "账户类型不能为空")
    private String accountType;

    /** Account sub type */
    private String accountSubType;

    /** Currency */
    private String currency;

    /** Balance */
    private BigDecimal balance;

    /** Include in total assets */
    private Integer includeInTotal;
}
