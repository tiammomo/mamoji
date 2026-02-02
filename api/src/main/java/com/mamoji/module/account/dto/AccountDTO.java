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

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 账户请求 DTO
 * 用于创建和更新账户的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {

    /** 账户ID，更新时必传 */
    private Long accountId;

    /** 账户名称，必填 */
    @NotBlank(message = "账户名称不能为空")
    private String name;

    /** 账户类型，必填 */
    @NotNull(message = "账户类型不能为空")
    private String accountType;

    /** 账户子类型 */
    private String accountSubType;

    /** 币种 */
    private String currency;

    /** 初始余额 */
    private BigDecimal balance;

    /** 是否计入净资产：0=不计入，1=计入 */
    private Integer includeInTotal;
}
