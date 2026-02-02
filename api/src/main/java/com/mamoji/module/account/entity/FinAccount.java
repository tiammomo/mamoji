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

/**
 * 账户实体类
 * 对应数据库表 fin_account，存储用户的账户信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_account")
public class FinAccount implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 账户ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long accountId;

    /** 所属用户ID */
    private Long userId;

    /** 所属账本ID，用于多账本场景下的数据隔离 */
    private Long ledgerId;

    /** 账户名称 */
    private String name;

    /**
     * 账户类型
     * bank: 银行卡
     * credit: 信用卡
     * cash: 现金
     * alipay: 支付宝
     * wechat: 微信
     * gold: 黄金
     * fund_accumulation: 公积金
     * fund: 基金
     * stock: 股票
     * topup: 充值卡
     * debt: 负债
     */
    private String accountType;

    /** 账户子类型：bank_primary（主卡）、bank_secondary（副卡）、credit_card（信用卡） */
    private String accountSubType;

    /** 币种，如 CNY、USD 等，默认 CNY */
    private String currency;

    /** 账户余额，正数表示资产，负数表示负债 */
    private BigDecimal balance;

    /** 是否计入净资产：0=不计入，1=计入 */
    private Integer includeInTotal;

    /** 状态：0=禁用，1=正常 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
