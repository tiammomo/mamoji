package com.mamoji.service;

import com.mamoji.dto.BudgetDTO;
import com.mamoji.entity.Budget;
import com.mamoji.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgetRepository;

    public List<BudgetDTO> getBudgets(Long userId) {
        return budgetRepository.findByUserIdAndStatus(userId, 1)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<BudgetDTO> getBudgetsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return budgetRepository.findByUserIdAndStatus(userId, 1)
                .stream()
                .filter(b -> {
                    // Include budget if its date range overlaps with the query range
                    LocalDate budgetStart = b.getStartDate();
                    LocalDate budgetEnd = b.getEndDate();
                    return !(budgetEnd.isBefore(startDate) || budgetStart.isAfter(endDate));
                })
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<BudgetDTO> getActiveBudgets(Long userId) {
        return budgetRepository.findActiveBudgets(userId, LocalDate.now())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public BudgetDTO getBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        return toDTO(budget);
    }

    @Transactional
    public BudgetDTO createBudget(BudgetDTO dto, Long userId) {
        // Validate amount is not negative
        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("预算金额不能为负数");
        }

        Budget budget = new Budget();
        budget.setName(dto.getName());
        budget.setAmount(dto.getAmount());
        budget.setStartDate(dto.getStartDate());
        budget.setEndDate(dto.getEndDate());
        budget.setWarningThreshold(dto.getWarningThreshold() != null ? dto.getWarningThreshold() : 85);
        budget.setUserId(userId);
        budget.setLedgerId(dto.getLedgerId());
        budget.setCategoryId(dto.getCategoryId());
        budget.setSpent(BigDecimal.ZERO);
        budget.setStatus(1);

        return toDTO(budgetRepository.save(budget));
    }

    @Transactional
    public BudgetDTO updateBudget(Long id, BudgetDTO dto, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (dto.getName() != null) budget.setName(dto.getName());
        if (dto.getAmount() != null) {
            if (dto.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("预算金额不能为负数");
            }
            budget.setAmount(dto.getAmount());
        }
        if (dto.getStartDate() != null) budget.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null) budget.setEndDate(dto.getEndDate());
        if (dto.getWarningThreshold() != null) {
            if (dto.getWarningThreshold() < 0 || dto.getWarningThreshold() > 100) {
                throw new RuntimeException("预警阈值必须在0-100之间");
            }
            budget.setWarningThreshold(dto.getWarningThreshold());
        }

        // Check budget status
        updateBudgetStatus(budget);

        return toDTO(budgetRepository.save(budget));
    }

    @Transactional
    public void deleteBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        budget.setStatus(0);
        budgetRepository.save(budget);
    }

    @Transactional
    public void updateBudgetSpent(Long budgetId, BigDecimal amount) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found"));
        budget.setSpent(budget.getSpent().add(amount));
        updateBudgetStatus(budget);
        budgetRepository.save(budget);
    }

    private void updateBudgetStatus(Budget budget) {
        LocalDate today = LocalDate.now();

        if (today.isAfter(budget.getEndDate())) {
            if (budget.getSpent().compareTo(budget.getAmount()) > 0) {
                budget.setStatus(3); // 超支
            } else {
                budget.setStatus(2); // 已完成
            }
        } else if (budget.getSpent().compareTo(budget.getAmount()) > 0) {
            budget.setStatus(3); // 超支
        } else {
            budget.setStatus(1); // 进行中
        }
    }

    private BudgetDTO toDTO(Budget budget) {
        BudgetDTO dto = new BudgetDTO();
        dto.setId(budget.getId());
        dto.setName(budget.getName());
        dto.setAmount(budget.getAmount());
        dto.setStartDate(budget.getStartDate());
        dto.setEndDate(budget.getEndDate());
        dto.setWarningThreshold(budget.getWarningThreshold());
        dto.setStatus(budget.getStatus());
        dto.setSpent(budget.getSpent());
        dto.setUserId(budget.getUserId());
        dto.setLedgerId(budget.getLedgerId());
        dto.setCategoryId(budget.getCategoryId());

        // Calculate usage rate
        if (budget.getAmount() != null && budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal usageRate = budget.getSpent()
                    .divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            dto.setUsageRate(usageRate);
        }

        return dto;
    }
}
