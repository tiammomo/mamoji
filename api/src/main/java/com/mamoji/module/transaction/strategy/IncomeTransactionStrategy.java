/**
 * 项目名称: Mamoji 记账系统
 * 文件名: IncomeTransactionStrategy.java
 * 功能描述: 收入交易策略实现，处理收入类型的余额变更逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * 收入交易策略
 *
 * 收入交易的业务规则：
 * - 账户余额增加（金额为正）
 * - 不影响预算支出统计
 *
 * 典型场景：工资收入、投资收益、奖金等
 *
 * @see TransactionTypeStrategy 策略接口
 * @see ExpenseTransactionStrategy 支出策略
 */
@Component
public class IncomeTransactionStrategy implements TransactionTypeStrategy {

    /**
     * 计算收入交易的余额变更
     *
     * 收入直接增加账户余额，变更量等于收入金额
     *
     * @param amount 收入金额（正数）
     * @return 余额变更量（正值，等于收入金额）
     */
    @Override
    public BigDecimal calculateBalanceChange(BigDecimal amount) {
        // 收入增加余额
        return amount;
    }

    /**
     * 获取交易类型名称
     *
     * @return "income"
     */
    @Override
    public String getTypeName() {
        return "income";
    }

    /**
     * 判断是否影响预算
     *
     * 收入不影响预算支出统计
     *
     * @return false
     */
    @Override
    public boolean affectsBudget() {
        return false;
    }
}
