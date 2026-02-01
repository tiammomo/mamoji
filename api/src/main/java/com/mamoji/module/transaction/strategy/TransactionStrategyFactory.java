package com.mamoji.module.transaction.strategy;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;

/** Factory for getting the appropriate TransactionTypeStrategy based on transaction type. */
@Component
public class TransactionStrategyFactory {

    private final Map<String, TransactionTypeStrategy> strategyMap;

    public TransactionStrategyFactory(
            IncomeTransactionStrategy incomeStrategy,
            ExpenseTransactionStrategy expenseStrategy,
            RefundTransactionStrategy refundStrategy) {
        this.strategyMap =
                Map.of(
                        "income", incomeStrategy,
                        "expense", expenseStrategy,
                        "refund", refundStrategy);
    }

    /**
     * Get the strategy for a given transaction type.
     *
     * @param type the transaction type (income, expense, refund)
     * @return the appropriate strategy
     * @throws BusinessException if type is not recognized
     */
    public TransactionTypeStrategy getStrategy(String type) {
        TransactionTypeStrategy strategy = strategyMap.get(type.toLowerCase());
        if (strategy == null) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "不支持的交易类型: " + type);
        }
        return strategy;
    }

    /**
     * Check if a transaction type is supported.
     *
     * @param type the transaction type
     * @return true if supported
     */
    public boolean isSupported(String type) {
        return strategyMap.containsKey(type.toLowerCase());
    }
}
