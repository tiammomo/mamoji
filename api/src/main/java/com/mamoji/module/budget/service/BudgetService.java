package com.mamoji.module.budget.service;

import java.util.List;

import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;

/**
 * 预算服务接口
 * 定义预算管理相关的业务操作
 */
public interface BudgetService {

    /**
     * 获取用户的所有预算列表
     * @param userId 用户ID
     * @return 预算列表
     */
    List<BudgetVO> listBudgets(Long userId);

    /**
     * 获取用户的所有进行中预算
     * @param userId 用户ID
     * @return 进行中的预算列表
     */
    List<BudgetVO> listActiveBudgets(Long userId);

    /**
     * 获取单个预算详情
     * @param userId 用户ID
     * @param budgetId 预算ID
     * @return 预算详情
     */
    BudgetVO getBudget(Long userId, Long budgetId);

    /**
     * 创建新预算
     * @param userId 用户ID
     * @param request 预算创建请求
     * @return 创建成功的预算ID
     */
    Long createBudget(Long userId, BudgetDTO request);

    /**
     * 更新预算信息
     * @param userId 用户ID
     * @param budgetId 预算ID
     * @param request 更新请求
     */
    void updateBudget(Long userId, Long budgetId, BudgetDTO request);

    /**
     * 删除预算
     * @param userId 用户ID
     * @param budgetId 预算ID
     */
    void deleteBudget(Long userId, Long budgetId);

    /**
     * 重新计算预算花费金额
     * @param budgetId 预算ID
     */
    void recalculateSpent(Long budgetId);
}
