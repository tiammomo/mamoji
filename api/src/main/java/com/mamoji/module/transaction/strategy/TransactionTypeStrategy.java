/**
 * 项目名称: Mamoji 记账系统
 * 文件名: TransactionTypeStrategy.java
 * 功能描述: 交易类型策略接口，定义不同交易类型的余额变更和预算影响逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

/**
 * 交易类型策略接口
 *
 * 使用策略模式封装不同交易类型的业务逻辑：
 * - 余额变更计算（收入增加、支出减少）
 * - 预算影响判断（支出影响预算，收入不影响）
 *
 * 策略实现类：
 * - IncomeTransactionStrategy: 收入交易策略
 * - ExpenseTransactionStrategy: 支出交易策略
 * - RefundTransactionStrategy: 退款交易策略
 *
 * @see IncomeTransactionStrategy 收入策略
 * @see ExpenseTransactionStrategy 支出策略
 * @see RefundTransactionStrategy 退款策略
 * @see TransactionStrategyFactory 策略工厂
 */
public interface TransactionTypeStrategy {

    /**
     * 计算余额变更金额
     *
     * 正数表示增加账户余额，负数表示减少账户余额
     * 例如：收入 1000 返回 +1000，支出 500 返回 -500
     *
     * @param amount 交易金额（原始金额，正数）
     * @return 余额变更量（带符号）
     */
    BigDecimal calculateBalanceChange(BigDecimal amount);

    /**
     * 获取交易类型名称
     *
     * @return 类型标识符（income/expense/refund）
     */
    String getTypeName();

    /**
     * 判断该交易类型是否影响预算支出统计
     *
     * 通常支出类交易会影响预算，的收入和退款不影响预算
     *
     * @return true 表示会更新预算已花费金额
     */
    default boolean affectsBudget() {
        return false;
    }
}
