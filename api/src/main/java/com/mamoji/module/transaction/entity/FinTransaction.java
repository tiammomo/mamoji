/**
 * 项目名称: Mamoji 记账系统
 * 文件名: FinTransaction.java
 * 功能描述: 交易记录实体类，对应数据库表 fin_transaction，存储用户的收支交易数据
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
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

/**
 * 交易记录实体类
 * 用于存储用户的每一笔收支交易，包括收入、支出和退款三种类型
 * 支持关联账户、分类、预算等信息，便于后续统计分析
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_transaction")
public class FinTransaction implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 交易记录ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long transactionId;

    /** 创建该交易记录的用户ID */
    private Long userId;

    /** 所属账本ID，用于多账本场景下的数据隔离 */
    private Long ledgerId;

    /** 关联的账户ID，指示交易发生在哪个账户 */
    private Long accountId;

    /** 关联的分类ID，用于标识交易的收支类别 */
    private Long categoryId;

    /** 关联的预算ID（可选），用于预算跟踪 */
    private Long budgetId;

    /** 关联的原交易ID（退款交易专用），指向被退款的那笔支出 */
    private Long refundId;

    /**
     * 交易类型
     * income：收入，expense：支出，refund：退款
     */
    private String type;

    /** 交易金额，正数表示收入，负数表示支出 */
    private BigDecimal amount;

    /** 交易货币类型，如 CNY、USD 等，默认 CNY */
    private String currency;

    /** 交易实际发生的时间，非记录创建时间 */
    private LocalDateTime occurredAt;

    /** 交易备注或说明，用户可自定义的简短描述 */
    private String note;

    /**
     * 交易记录状态
     * 0：已删除（软删除），1：正常
     */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
