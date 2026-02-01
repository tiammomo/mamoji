package com.mamoji.module.budget.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.service.AbstractCrudService;
import com.mamoji.common.utils.DateRangeUtils;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.budget.mapper.FinBudgetMapper;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Budget Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetServiceImpl
        extends AbstractCrudService<FinBudgetMapper, FinBudget, BudgetVO>
        implements BudgetService {

    private final FinTransactionMapper transactionMapper;
    private final DtoConverter dtoConverter;

    @Override
    protected BudgetVO toVO(FinBudget entity) {
        BudgetVO vo = dtoConverter.convertBudget(entity);
        BigDecimal amount = entity.getAmount() != null ? entity.getAmount() : BigDecimal.ZERO;
        BigDecimal spent = entity.getSpent() != null ? entity.getSpent() : BigDecimal.ZERO;
        Integer status = determineStatus(spent, amount);

        vo.setSpent(spent);
        vo.setRemaining(amount.subtract(spent));
        vo.setProgress(
                amount.compareTo(BigDecimal.ZERO) == 0
                        ? 0.0
                        : spent.multiply(BigDecimal.valueOf(100))
                                .divide(amount, 2, RoundingMode.HALF_UP)
                                .doubleValue());
        vo.setStatus(status);
        vo.setStatusText(getStatusText(status));
        return vo;
    }

    @Override
    protected void validateOwnership(Long userId, FinBudget entity) {
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND);
        }
    }

    @Override
    protected FinBudget getByIdWithValidation(Long userId, Long id) {
        FinBudget entity = this.baseMapper.selectByIdIgnoreLogicDelete(id);
        if (entity == null) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND.getCode(), "预算不存在");
        }
        validateOwnership(userId, entity);
        return entity;
    }

    @Override
    public List<BudgetVO> listBudgets(Long userId) {
        return dtoConverter.convertBudgetList(
                this.list(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, userId)
                                .ne(FinBudget::getStatus, 0)
                                .orderByDesc(FinBudget::getCreatedAt)));
    }

    @Override
    public List<BudgetVO> listActiveBudgets(Long userId) {
        return dtoConverter.convertBudgetList(
                this.list(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, userId)
                                .eq(FinBudget::getStatus, 1)
                                .orderByDesc(FinBudget::getCreatedAt)));
    }

    @Override
    public BudgetVO getBudget(Long userId, Long budgetId) {
        FinBudget budget = getByIdWithValidation(userId, budgetId);
        return toVO(budget);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createBudget(Long userId, BudgetDTO request) {
        validateDateRange(request.getStartDate(), request.getEndDate());
        FinBudget budget =
                FinBudget.builder()
                        .userId(userId)
                        .name(request.getName())
                        .amount(request.getAmount())
                        .spent(BigDecimal.ZERO)
                        .startDate(request.getStartDate())
                        .endDate(request.getEndDate())
                        .status(1)
                        .build();
        this.save(budget);
        log.info("Budget created: userId={}, name={}", userId, request.getName());
        return budget.getBudgetId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateBudget(Long userId, Long budgetId, BudgetDTO request) {
        FinBudget budget = getByIdWithValidation(userId, budgetId);
        if (request.getStartDate() != null && request.getEndDate() != null) {
            validateDateRange(request.getStartDate(), request.getEndDate());
        }

        BigDecimal newAmount =
                request.getAmount() != null ? request.getAmount() : budget.getAmount();
        BigDecimal newSpent = budget.getSpent() != null ? budget.getSpent() : BigDecimal.ZERO;
        Integer newStatus = determineStatus(newSpent, newAmount);

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
        getByIdWithValidation(userId, budgetId);
        // Hard delete since budget is sensitive data
        this.removeById(budgetId);
        log.info("Budget deleted: budgetId={}", budgetId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recalculateSpent(Long budgetId) {
        FinBudget budget = this.baseMapper.selectById(budgetId);
        if (budget == null) return;

        BigDecimal spent =
                transactionMapper.sumExpenseByBudgetId(
                        budgetId,
                        DateRangeUtils.startOfDay(budget.getStartDate()),
                        DateRangeUtils.endOfDay(budget.getEndDate()));
        if (spent == null) spent = BigDecimal.ZERO;

        this.update(
                new LambdaUpdateWrapper<FinBudget>()
                        .eq(FinBudget::getBudgetId, budgetId)
                        .set(FinBudget::getSpent, spent)
                        .set(FinBudget::getStatus, determineStatus(spent, budget.getAmount())));
    }

    // ==================== Private Helper Methods ====================

    private void validateDateRange(java.time.LocalDate start, java.time.LocalDate end) {
        if (end.isBefore(start)) {
            throw new BusinessException(5001, "结束日期不能早于开始日期");
        }
    }

    private Integer determineStatus(BigDecimal spent, BigDecimal amount) {
        int cmp = spent.compareTo(amount);
        return switch (cmp) {
            case 1 -> 3; // Over-budget
            case 0 -> 2; // Completed
            default -> 1; // Active
        };
    }

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
