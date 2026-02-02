/**
 * 项目名称: Mamoji 记账系统
 * 文件名: ExpenseTransactionStrategy.java
 * 功能描述: 支出交易策略实现，处理支出类型的余额变更和预算影响逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * 支出交易策略
 *
 * 支出交易的业务规则：
 * - 账户余额减少（金额为负）
 * - 计入预算支出统计
 *
 * 典型场景：餐饮消费、交通出行、购物支出等
 *
 * @see TransactionTypeStrategy 策略接口
 * @see IncomeTransactionStrategy 收入策略
 */
@Component
public class ExpenseTransactionStrategy implements TransactionTypeStrategy {

    /**
     * 计算支出交易的余额变更
     *
     * 支出会减少账户余额，变更量为负数
     *
     * @param amount 支出金额（正数）
     * @return 余额变更量（负值，取反）
     */
    @Override
    public BigDecimal calculateBalanceChange(BigDecimal amount) {
        // 支出减少余额
        return amount.negate();
    }

    /**
     * 获取交易类型名称
     *
     * @return "expense"
     */
    @Override
    public String getTypeName() {
        return "expense";
    }

    /**
     * 判断是否影响预算
     *
     * 支出会增加预算已花费金额
     *
     * @return true
     */
    @Override
    public boolean affectsBudget() {
        return true;
    }
}
