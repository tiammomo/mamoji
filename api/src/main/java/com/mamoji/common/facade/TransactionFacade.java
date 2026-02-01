package com.mamoji.common.facade;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.service.TransactionService;
import com.mamoji.module.transaction.strategy.TransactionTypeStrategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Transaction Facade using Facade Pattern. Simplifies complex transaction operations by providing
 * a unified interface to the transaction subsystem.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransactionFacade {

    private final TransactionService transactionService;
    private final AccountService accountService;
    private final BudgetService budgetService;
    private final Map<String, TransactionTypeStrategy> strategyMap;

    private TransactionTypeStrategy getStrategy(String type) {
        TransactionTypeStrategy strategy = strategyMap.get(type + "TransactionStrategy");
        if (strategy == null) {
            strategy = strategyMap.get("expenseTransactionStrategy"); // default
        }
        return strategy;
    }

    /**
     * Complete transaction flow: create transaction, update balance, and update budget.
     */
    public TransactionVO completeTransaction(Long userId, TransactionDTO dto) {
        // 1. Create transaction
        Long transactionId = transactionService.createTransaction(userId, dto);

        // 2. Update account balance
        TransactionTypeStrategy strategy = getStrategy(dto.getType());
        BigDecimal balanceChange = strategy.calculateBalanceChange(dto.getAmount());
        if (dto.getAccountId() != null) {
            accountService.updateBalance(dto.getAccountId(), balanceChange);
        }

        // 3. Update budget spent
        if (dto.getBudgetId() != null) {
            budgetService.recalculateSpent(dto.getBudgetId());
        }

        log.info("Transaction completed: userId={}, transactionId={}, amount={}",
                userId, transactionId, dto.getAmount());

        return transactionService.getTransaction(userId, transactionId);
    }

    /**
     * Rollback transaction: reverse transaction, update balance, and update budget.
     */
    public void rollbackTransaction(Long userId, Long transactionId) {
        FinTransaction transaction = transactionService.findById(transactionId);

        // Skip if transaction doesn't belong to user
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            log.warn("Transaction not found or doesn't belong to user: {}", transactionId);
            return;
        }

        // 1. Reverse account balance
        TransactionTypeStrategy strategy = getStrategy(transaction.getType());
        BigDecimal balanceChange = strategy.calculateBalanceChange(transaction.getAmount()).negate();
        if (transaction.getAccountId() != null) {
            accountService.updateBalance(transaction.getAccountId(), balanceChange);
        }

        // 2. Update budget spent
        if (transaction.getBudgetId() != null) {
            budgetService.recalculateSpent(transaction.getBudgetId());
        }

        // 3. Mark transaction as deleted (status = 0)
        transactionService.deleteTransaction(userId, transactionId);

        log.info("Transaction rolled back: userId={}, transactionId={}", userId, transactionId);
    }

    /**
     * Get transaction summary for dashboard.
     */
    public TransactionSummary getTransactionSummary(Long userId) {
        List<TransactionVO> recentTransactions = transactionService.getRecentTransactions(userId, null, 10);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (TransactionVO tx : recentTransactions) {
            if ("income".equals(tx.getType())) {
                totalIncome = totalIncome.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);
            } else if ("expense".equals(tx.getType())) {
                totalExpense = totalExpense.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);
            }
        }

        return new TransactionSummary(
                totalIncome,
                totalExpense,
                totalIncome.subtract(totalExpense),
                recentTransactions
        );
    }

    // ==================== Summary Record ====================

    public record TransactionSummary(
            BigDecimal totalIncome,
            BigDecimal totalExpense,
            BigDecimal netAmount,
            List<TransactionVO> recentTransactions
    ) {}
}
