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
 * <p>
 * 用于存储用户的每一笔收支交易，包括收入、支出和退款三种类型。
 * 支持关联账户、分类、预算等信息，便于后续统计分析。
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_transaction")
public class FinTransaction implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    // ==================== 主键字段 ====================

    /** 交易记录唯一标识符，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long transactionId;

    // ==================== 关联字段 ====================

    /** 创建该交易记录的用户 ID */
    private Long userId;

    /** 所属账本 ID，用于多账本场景下的数据隔离 */
    private Long ledgerId;

    /** 关联的账户 ID，指示交易发生在哪个账户 */
    private Long accountId;

    /** 关联的分类 ID，用于标识交易的收支类别 */
    private Long categoryId;

    /** 关联的预算 ID（可选），用于预算跟踪 */
    private Long budgetId;

    /** 关联的原交易 ID（退款交易专用），指向被退款的那笔支出 */
    private Long refundId;

    // ==================== 业务字段 ====================

    /**
     * 交易类型
     * <ul>
     *   <li>income: 收入</li>
     *   <li>expense: 支出</li>
     *   <li>refund: 退款</li>
     * </ul>
     */
    private String type;

    /** 交易金额，正数表示收入，负数表示支出 */
    private BigDecimal amount;

    /** 交易货币类型，如 CNY、USD 等，默认 CNY */
    private String currency;

    /** 交易实际发生的时间，非记录创建时间 */
    private LocalDateTime occurredAt;

    /** 交易备注/说明，用户可自定义的简短描述 */
    private String note;

    // ==================== 状态字段 ====================

    /**
     * 交易记录状态
     * <ul>
     *   <li>0: 已删除（软删除）</li>
     *   <li>1: 正常</li>
     * </ul>
     */
    private Integer status;

    // ==================== 审计字段 ====================

    /** 记录创建时间，由 MyBatis-Plus 自动填充 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间，由 MyBatis-Plus 自动填充 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
