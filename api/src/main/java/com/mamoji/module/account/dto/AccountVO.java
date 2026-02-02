package com.mamoji.module.account.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 账户响应 VO
 * 用于展示账户的详细信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountVO {

    /** 账户ID */
    private Long accountId;

    /** 账户名称 */
    private String name;

    /** 账户类型 */
    private String accountType;

    /** 账户子类型 */
    private String accountSubType;

    /** 币种 */
    private String currency;

    /** 当前余额 */
    private BigDecimal balance;

    /** 是否计入净资产：0=不计入，1=计入 */
    private Integer includeInTotal;

    /** 状态：0=禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    private LocalDateTime createdAt;
}
