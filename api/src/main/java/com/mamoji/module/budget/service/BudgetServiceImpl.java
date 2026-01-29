package com.mamoji.module.budget.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.budget.mapper.FinBudgetMapper;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Budget Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetServiceImpl extends ServiceImpl<FinBudgetMapper, FinBudget>
        implements BudgetService {

    private final FinTransactionMapper transactionMapper;

    @Override
    public List<BudgetVO> listBudgets(Long userId) {
        List<FinBudget> budgets =
                this.list(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, userId)
                                .ne(FinBudget::getStatus, 0) // Exclude canceled
                                .orderByDesc(FinBudget::getCreatedAt));

        return budgets.stream().map(this::toVO).toList();
    }

    @Override
    public List<BudgetVO> listActiveBudgets(Long userId) {
        List<FinBudget> budgets =
                this.list(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, userId)
                                .eq(FinBudget::getStatus, 1) // Active only
                                .orderByDesc(FinBudget::getCreatedAt));

        return budgets.stream().map(this::toVO).toList();
    }

    @Override
    public BudgetVO getBudget(Long userId, Long budgetId) {
        // Query database directly to get fresh data, ignoring logic delete filter
        // This allows getting budgets with status=2 (completed) or status=3 (over-budget)
        FinBudget budget = this.baseMapper.selectByIdIgnoreLogicDelete(budgetId);
        if (budget == null || !budget.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND);
        }
        return toVO(budget);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createBudget(Long userId, BudgetDTO request) {
        // Validate date range
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException(5001, "结束日期不能早于开始日期");
        }

        FinBudget budget =
                FinBudget.builder()
                        .userId(userId)
                        .name(request.getName())
                        .amount(request.getAmount())
                        .spent(BigDecimal.ZERO)
                        .startDate(request.getStartDate())
                        .endDate(request.getEndDate())
                        .status(1) // Active
                        .build();

        this.save(budget);

        log.info("Budget created: userId={}, name={}", userId, request.getName());

        return budget.getBudgetId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateBudget(Long userId, Long budgetId, BudgetDTO request) {
        FinBudget budget = this.getById(budgetId);
        if (budget == null || !budget.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND);
        }

        // Validate date range
        if (request.getEndDate() != null
                && request.getStartDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessException(5001, "结束日期不能早于开始日期");
        }

        // Determine status based on spent vs amount
        BigDecimal amount = request.getAmount() != null ? request.getAmount() : budget.getAmount();
        BigDecimal spent = budget.getSpent() != null ? budget.getSpent() : BigDecimal.ZERO;
        Integer newStatus = determineStatus(spent, amount);

        this.update(
                new LambdaUpdateWrapper<FinBudget>()
                        .eq(FinBudget::getBudgetId, budgetId)
                        .set(FinBudget::getName, request.getName())
                        .set(request.getAmount() != null, FinBudget::getAmount, request.getAmount())
                        .set(
                                request.getStartDate() != null,
                                FinBudget::getStartDate,
                                request.getStartDate())
                        .set(
                                request.getEndDate() != null,
                                FinBudget::getEndDate,
                                request.getEndDate())
                        .set(newStatus != null, FinBudget::getStatus, newStatus));

        log.info("Budget updated: budgetId={}", budgetId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBudget(Long userId, Long budgetId) {
        FinBudget budget = this.getById(budgetId);
        if (budget == null || !budget.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND);
        }

        // Hard delete (or soft delete if preferred)
        this.removeById(budgetId);

        log.info("Budget deleted: budgetId={}", budgetId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recalculateSpent(Long budgetId) {
        // Use custom query to bypass logic delete filter
        FinBudget budget = this.baseMapper.selectByIdIgnoreLogicDelete(budgetId);
        if (budget == null) {
            return;
        }

        // Calculate total spent in the budget period using custom query
        BigDecimal spent =
                transactionMapper.sumExpenseByBudgetId(
                        budgetId,
                        budget.getStartDate().atStartOfDay(),
                        budget.getEndDate().atTime(23, 59, 59));

        if (spent == null) {
            spent = BigDecimal.ZERO;
        }

        // Update spent amount and status
        Integer newStatus = determineStatus(spent, budget.getAmount());

        this.update(
                new LambdaUpdateWrapper<FinBudget>()
                        .eq(FinBudget::getBudgetId, budgetId)
                        .set(FinBudget::getSpent, spent)
                        .set(FinBudget::getStatus, newStatus));
    }

    /** Determine budget status based on spent vs amount */
    private Integer determineStatus(BigDecimal spent, BigDecimal amount) {
        int cmp = spent.compareTo(amount);
        if (cmp > 0) {
            return 3; // Over-budget (超支)
        } else if (cmp == 0) {
            return 2; // Completed (已完成)
        }
        return 1; // Active (进行中)
    }

    /** Convert entity to VO */
    private BudgetVO toVO(FinBudget budget) {
        BudgetVO vo = new BudgetVO();
        BeanUtils.copyProperties(budget, vo);

        BigDecimal amount = budget.getAmount() != null ? budget.getAmount() : BigDecimal.ZERO;
        BigDecimal spent = budget.getSpent() != null ? budget.getSpent() : BigDecimal.ZERO;
        BigDecimal remaining = amount.subtract(spent);

        // Calculate progress percentage
        Double progress =
                BigDecimal.ZERO.compareTo(amount) == 0
                        ? 0.0
                        : spent.multiply(BigDecimal.valueOf(100))
                                .divide(amount, 2, RoundingMode.HALF_UP)
                                .doubleValue();

        // Calculate dynamic status based on spent vs amount
        Integer dynamicStatus = determineStatus(spent, amount);
        vo.setStatus(dynamicStatus);

        vo.setSpent(spent);
        vo.setRemaining(remaining);
        vo.setProgress(progress);
        vo.setStatusText(getStatusText(dynamicStatus));

        return vo;
    }

    /** Get status text */
    private String getStatusText(Integer status) {
        return switch (status) {
            case 0 -> "已取消";
            case 1 -> "进行中";
            case 2 -> "已完成";
            case 3 -> "超支";
            default -> "未知";
        };
    }
}
