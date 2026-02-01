package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * Income transaction strategy. Income transactions increase account balance and do not affect
 * budget spending.
 */
@Component
public class IncomeTransactionStrategy implements TransactionTypeStrategy {

    @Override
    public BigDecimal calculateBalanceChange(BigDecimal amount) {
        // Income increases the balance
        return amount;
    }

    @Override
    public String getTypeName() {
        return "income";
    }

    @Override
    public boolean affectsBudget() {
        return false;
    }
}
