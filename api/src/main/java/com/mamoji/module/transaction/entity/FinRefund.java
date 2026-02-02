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
 * 退款记录实体类
 * 对应数据库表 fin_refund，存储退款交易信息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("fin_refund")
public class FinRefund implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 退款记录ID，自增主键 */
    @TableId(type = IdType.AUTO)
    private Long refundId;

    /** 所属用户ID */
    private Long userId;

    /** 原交易ID，指向被退款的交易记录 */
    private Long transactionId;

    /** 退款到的账户ID */
    private Long accountId;

    /** 关联的分类ID，通常与原交易分类相同 */
    private Long categoryId;

    /** 退款金额（正数） */
    private BigDecimal amount;

    /** 币种 */
    private String currency;

    /** 退款实际发生时间 */
    private LocalDateTime occurredAt;

    /** 备注信息，格式：退款：xxx */
    private String note;

    /** 状态：0=已取消，1=有效 */
    private Integer status;

    /** 创建时间 */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** 最后更新时间 */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
