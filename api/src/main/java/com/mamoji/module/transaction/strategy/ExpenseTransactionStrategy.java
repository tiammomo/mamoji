package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * Expense transaction strategy. Expense transactions decrease account balance and affect budget
 * spending.
 */
@Component
public class ExpenseTransactionStrategy implements TransactionTypeStrategy {

    @Override
    public BigDecimal calculateBalanceChange(BigDecimal amount) {
        // Expense decreases the balance
        return amount.negate();
    }

    @Override
    public String getTypeName() {
        return "expense";
    }

    @Override
    public boolean affectsBudget() {
        return true;
    }
}
