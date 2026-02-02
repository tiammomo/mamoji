/**
 * 项目名称: Mamoji 记账系统
 * 文件名: TransactionStrategyFactory.java
 * 功能描述: 交易策略工厂，根据交易类型提供对应的策略实现
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.strategy;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;

/**
 * 交易策略工厂
 *
 * 负责管理和分发不同交易类型的策略实现。
 * 采用依赖注入方式将所有策略实现注入到工厂中，
 * 根据传入的交易类型返回对应的策略对象。
 *
 * 支持的交易类型：
 * - income: 收入交易
 * - expense: 支出交易
 * - refund: 退款交易
 *
 * @see TransactionTypeStrategy 策略接口
 * @see IncomeTransactionStrategy 收入策略
 * @see ExpenseTransactionStrategy 支出策略
 * @see RefundTransactionStrategy 退款策略
 */
@Component
public class TransactionStrategyFactory {

    /** 策略映射表：类型标识符 -> 策略实现 */
    private final Map<String, TransactionTypeStrategy> strategyMap;

    /**
     * 构造函数，Spring 自动注入所有策略实现
     *
     * @param incomeStrategy   收入交易策略
     * @param expenseStrategy  支出交易策略
     * @param refundStrategy   退款交易策略
     */
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
     * 获取指定交易类型的策略实现
     *
     * @param type 交易类型标识符（income/expense/refund）
     * @return 对应的策略实现
     * @throws BusinessException 不支持的交易类型
     */
    public TransactionTypeStrategy getStrategy(String type) {
        TransactionTypeStrategy strategy = strategyMap.get(type.toLowerCase());
        if (strategy == null) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "不支持的交易类型: " + type);
        }
        return strategy;
    }

    /**
     * 判断交易类型是否支持
     *
     * @param type 交易类型标识符
     * @return true 表示支持该类型
     */
    public boolean isSupported(String type) {
        return strategyMap.containsKey(type.toLowerCase());
    }
}
