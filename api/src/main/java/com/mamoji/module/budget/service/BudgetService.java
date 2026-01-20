package com.mamoji.module.budget.service;

import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;

import java.util.List;

/**
 * Budget Service Interface
 */
public interface BudgetService {

    /**
     * Get all budgets for a user
     */
    List<BudgetVO> listBudgets(Long userId);

    /**
     * Get active budgets for a user
     */
    List<BudgetVO> listActiveBudgets(Long userId);

    /**
     * Get budget by ID
     */
    BudgetVO getBudget(Long userId, Long budgetId);

    /**
     * Create a new budget
     */
    Long createBudget(Long userId, BudgetDTO request);

    /**
     * Update a budget
     */
    void updateBudget(Long userId, Long budgetId, BudgetDTO request);

    /**
     * Delete a budget
     */
    void deleteBudget(Long userId, Long budgetId);

    /**
     * Calculate and update spent amount for a budget
     */
    void recalculateSpent(Long budgetId);
}
