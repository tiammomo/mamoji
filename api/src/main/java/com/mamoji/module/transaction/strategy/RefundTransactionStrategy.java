package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * Refund transaction strategy. Refund behavior depends on the original transaction type: - Refund
 * of expense: increases balance (money returned) - Refund of income: decreases balance (money
 * returned back)
 *
 * <p>Note: This strategy is used when creating a refund transaction record, but the actual balance
 * adjustment logic is handled by RefundOrchestrator which determines the correct strategy based on
 * the original transaction type.
 */
@Component
public class RefundTransactionStrategy implements TransactionTypeStrategy {

    @Override
    public BigDecimal calculateBalanceChange(BigDecimal amount) {
        // For refund transactions, we typically negate the amount
        // as they reverse the original transaction
        return amount.negate();
    }

    @Override
    public String getTypeName() {
        return "refund";
    }

    @Override
    public boolean affectsBudget() {
        return true;
    }
}
