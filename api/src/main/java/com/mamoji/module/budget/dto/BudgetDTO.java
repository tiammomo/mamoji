package com.mamoji.module.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

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
 * 预算请求 DTO
 * 用于创建和更新预算的请求参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetDTO {

    /** 预算ID，更新时必传 */
    private Long budgetId;

    /** 预算名称，必填 */
    @NotBlank(message = "预算名称不能为空")
    private String name;

    /** 预算金额，必填 */
    @NotNull(message = "预算金额不能为空")
    private BigDecimal amount;

    /** 预算开始日期，必填 */
    @NotNull(message = "开始日期不能为空")
    private LocalDate startDate;

    /** 预算结束日期，必填 */
    @NotNull(message = "结束日期不能为空")
    private LocalDate endDate;
}
