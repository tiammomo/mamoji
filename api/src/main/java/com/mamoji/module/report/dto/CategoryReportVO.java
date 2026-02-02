package com.mamoji.module.report.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * 分类报表 VO
 * 按分类展示收支情况，用于报表页面的分类统计展示
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryReportVO {

    /** 分类ID */
    private Long categoryId;

    /** 分类名称 */
    private String categoryName;

    /** 分类类型：income（收入）、expense（支出） */
    private String type;

    /** 该分类的总金额 */
    private BigDecimal amount;

    /** 占同类型总金额的百分比 */
    private Double percentage;

    /** 交易笔数 */
    private Integer count;
}
