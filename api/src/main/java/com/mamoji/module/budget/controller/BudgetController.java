package com.mamoji.module.budget.controller;

import com.mamoji.common.result.Result;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Budget Controller
 */
@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    /**
     * Get all budgets for current user
     */
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

    /**
     * Get budget by ID
     */
    @GetMapping("/{id}")
    public Result<BudgetVO> getBudget(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) {
        BudgetVO budget = budgetService.getBudget(user.userId(), id);
        return Result.success(budget);
    }

    /**
     * Create a new budget
     */
    @PostMapping
    public Result<Long> createBudget(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody BudgetDTO request) {
        Long budgetId = budgetService.createBudget(user.userId(), request);
        return Result.success(budgetId);
    }

    /**
     * Update a budget
     */
    @PutMapping("/{id}")
    public Result<Void> updateBudget(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody BudgetDTO request) {
        budgetService.updateBudget(user.userId(), id, request);
        return Result.success();
    }

    /**
     * Delete a budget
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteBudget(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) {
        budgetService.deleteBudget(user.userId(), id);
        return Result.success();
    }
}
