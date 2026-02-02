/**
 * 项目名称: Mamoji 记账系统
 * 文件名: RefundTransactionStrategy.java
 * 功能描述: 退款交易策略实现，处理退款类型的余额变更和预算影响逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.strategy;

import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * 退款交易策略
 *
 * 退款交易的反向操作：
 * - 支出退款：钱回来了，余额增加
 * - 收入退款：钱还回去，余额减少
 *
 * 注意：实际退款时的余额调整逻辑由 RefundOrchestrator
 * 根据原交易类型决定使用哪个策略
 *
 * @see TransactionTypeStrategy 策略接口
 * @see IncomeTransactionStrategy 收入策略
 * @see ExpenseTransactionStrategy 支出策略
 */
@Component
public class RefundTransactionStrategy implements TransactionTypeStrategy {

    /**
     * 计算退款交易的余额变更
     *
     * 退款会冲抵原交易，变更量取反
     *
     * @param amount 退款金额（正数）
     * @return 余额变更量（负值，表示反向操作）
     */
    @Override
    public BigDecimal calculateBalanceChange(BigDecimal amount) {
        // 退款冲抵原交易
        return amount.negate();
    }

    /**
     * 获取交易类型名称
     *
     * @return "refund"
     */
    @Override
    public String getTypeName() {
        return "refund";
    }

    /**
     * 判断是否影响预算
     *
     * 退款会减少预算已花费金额（把钱退回）
     *
     * @return true
     */
    @Override
    public boolean affectsBudget() {
        return true;
    }
}
