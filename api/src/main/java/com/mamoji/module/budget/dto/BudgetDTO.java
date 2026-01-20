package com.mamoji.module.budget.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Budget Request DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetDTO {

    /**
     * Budget ID (for update)
     */
    private Long budgetId;

    /**
     * Budget name
     */
    @NotBlank(message = "预算名称不能为空")
    private String name;

    /**
     * Budget amount
     */
    @NotNull(message = "预算金额不能为空")
    private BigDecimal amount;

    /**
     * Start date
     */
    @NotNull(message = "开始日期不能为空")
    private LocalDate startDate;

    /**
     * End date
     */
    @NotNull(message = "结束日期不能为空")
    private LocalDate endDate;
}
