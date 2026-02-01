package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

/**
 * Transaction type strategy interface for handling different transaction types. Uses Strategy
 * Pattern to encapsulate balance change and budget update logic.
 */
public interface TransactionTypeStrategy {

    /**
     * Calculate the balance change amount for this transaction type. Positive value means increase
     * balance, negative means decrease.
     *
     * @param amount the transaction amount
     * @return the balance change amount
     */
    BigDecimal calculateBalanceChange(BigDecimal amount);

    /**
     * Get the transaction type name.
     *
     * @return type name (income, expense, refund)
     */
    String getTypeName();

    /**
     * Check if this transaction type affects budget spending.
     *
     * @return true if affects budget
     */
    default boolean affectsBudget() {
        return false;
    }
}
