package com.mamoji.module.report.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/** Category Report VO */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryReportVO {

    /** Category ID */
    private Long categoryId;

    /** Category name */
    private String categoryName;

    /** Category type: income, expense */
    private String type;

    /** Total amount */
    private BigDecimal amount;

    /** Percentage of total */
    private Double percentage;

    /** Transaction count */
    private Integer count;
}
