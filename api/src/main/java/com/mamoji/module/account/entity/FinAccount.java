package com.mamoji.module.account.entity;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Account Entity (账户) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_account")
public class FinAccount implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Account ID */
    @TableId(type = IdType.AUTO)
    private Long accountId;

    /** User ID */
    private Long userId;

    /** Account name */
    private String name;

    /**
     * Account type: bank, credit, cash, alipay, wechat, gold, fund_accumulation, fund, stock,
     * topup, debt
     */
    private String accountType;

    /** Sub type: bank_primary, bank_secondary, credit_card */
    private String accountSubType;

    /** Currency */
    private String currency;

    /** Balance (positive for assets, negative for liabilities) */
    private BigDecimal balance;

    /** Include in total assets: 0=no, 1=yes */
    private Integer includeInTotal;

    /** Status: 0=disabled, 1=normal */
    private Integer status;

    /** Creation time */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Last update time */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
