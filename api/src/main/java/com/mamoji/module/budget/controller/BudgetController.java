package com.mamoji.module.budget.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mamoji.common.result.Result;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetProgressVO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Budget Controller */
@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    /** Get all budgets for current user */
    @GetMapping
    public Result<List<BudgetVO>> listBudgets(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly) {
        List<BudgetVO> budgets;
        if (activeOnly) {
            budgets = budgetService.listActiveBudgets(user.userId());
        } else {
            budgets = budgetService.listBudgets(user.userId());
        }
        return Result.success(budgets);
    }

    /** Get budget by ID */
    @GetMapping("/{id}")
    public Result<BudgetVO> getBudget(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        BudgetVO budget = budgetService.getBudget(user.userId(), id);
        return Result.success(budget);
    }

    /** Get budget progress details */
    @GetMapping("/{id}/progress")
    public Result<BudgetProgressVO> getBudgetProgress(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        BudgetVO budget = budgetService.getBudget(user.userId(), id);

        BudgetProgressVO progressVO =
                BudgetProgressVO.builder()
                        .budgetId(budget.getBudgetId())
                        .name(budget.getName())
                        .amount(budget.getAmount())
                        .spent(budget.getSpent())
                        .remaining(budget.getRemaining())
                        .progress(budget.getProgress())
                        .status(budget.getStatus())
                        .statusText(budget.getStatusText())
                        .startDate(budget.getStartDate())
                        .endDate(budget.getEndDate())
                        .build();

        // Calculate additional metrics
        LocalDate today = LocalDate.now();
        if (budget.getEndDate() != null && !today.isAfter(budget.getEndDate())) {
            long daysRemaining =
                    java.time.temporal.ChronoUnit.DAYS.between(today, budget.getEndDate());
            progressVO.setDaysRemaining((int) daysRemaining);

            if (daysRemaining > 0 && budget.getSpent() != null) {
                BigDecimal spent = budget.getSpent();
                long daysElapsed =
                        java.time.temporal.ChronoUnit.DAYS.between(budget.getStartDate(), today)
                                + 1;
                if (daysElapsed > 0) {
                    BigDecimal avgDaily =
                            spent.divide(
                                    BigDecimal.valueOf(daysElapsed),
                                    2,
                                    java.math.RoundingMode.HALF_UP);
                    progressVO.setAverageDailySpend(avgDaily);

                    // Projected balance at end of budget period
                    BigDecimal projectedRemaining =
                            budget.getAmount()
                                    .subtract(
                                            avgDaily.multiply(
                                                    BigDecimal.valueOf(
                                                            daysRemaining + daysElapsed)));
                    progressVO.setProjectedBalance(projectedRemaining);
                }
            }
        } else {
            progressVO.setDaysRemaining(0);
        }

        return Result.success(progressVO);
    }

    /** Create a new budget */
    @PostMapping
    public Result<Long> createBudget(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody BudgetDTO request) {
        Long budgetId = budgetService.createBudget(user.userId(), request);
        return Result.success(budgetId);
    }

    /** Update a budget */
    @PutMapping("/{id}")
    public Result<Void> updateBudget(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody BudgetDTO request) {
        budgetService.updateBudget(user.userId(), id, request);
        return Result.success();
    }

    /** Delete a budget */
    @DeleteMapping("/{id}")
    public Result<Void> deleteBudget(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        budgetService.deleteBudget(user.userId(), id);
        return Result.success();
    }
}
