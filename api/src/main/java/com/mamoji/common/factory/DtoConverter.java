package com.mamoji.common.factory;

import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Component;

import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.category.dto.CategoryVO;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;

/**
 * DTO 转换器工厂
 * 使用工厂模式集中管理实体与 VO 之间的转换逻辑
 */
@Component
public class DtoConverter {

    /**
     * 将交易实体转换为交易 VO
     *
     * @param tx 交易实体
     * @return 交易 VO
     */
    public TransactionVO convertTransaction(FinTransaction tx) {
        TransactionVO vo = new TransactionVO();
        BeanUtils.copyProperties(tx, vo);
        return vo;
    }

    /**
     * 将账户实体转换为账户 VO
     *
     * @param account 账户实体
     * @return 账户 VO
     */
    public AccountVO convertAccount(FinAccount account) {
        AccountVO vo = new AccountVO();
        BeanUtils.copyProperties(account, vo);
        return vo;
    }

    /**
     * 将分类实体转换为分类 VO
     *
     * @param category 分类实体
     * @return 分类 VO
     */
    public CategoryVO convertCategory(FinCategory category) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    /**
     * 将预算实体转换为预算 VO
     *
     * @param budget 预算实体
     * @return 预算 VO
     */
    public BudgetVO convertBudget(FinBudget budget) {
        BudgetVO vo = new BudgetVO();
        BeanUtils.copyProperties(budget, vo);
        return vo;
    }

    /**
     * 批量转换交易列表为 VO 列表
     *
     * @param transactions 交易实体列表
     * @return 交易 VO 列表
     */
    public List<TransactionVO> convertTransactionList(List<FinTransaction> transactions) {
        return transactions.stream().map(this::convertTransaction).toList();
    }

    /**
     * 批量转换账户列表为 VO 列表
     *
     * @param accounts 账户实体列表
     * @return 账户 VO 列表
     */
    public List<AccountVO> convertAccountList(List<FinAccount> accounts) {
        return accounts.stream().map(this::convertAccount).toList();
    }

    /**
     * 批量转换分类列表为 VO 列表
     *
     * @param categories 分类实体列表
     * @return 分类 VO 列表
     */
    public List<CategoryVO> convertCategoryList(List<FinCategory> categories) {
        return categories.stream().map(this::convertCategory).toList();
    }

    /**
     * 批量转换预算列表为 VO 列表
     *
     * @param budgets 预算实体列表
     * @return 预算 VO 列表
     */
    public List<BudgetVO> convertBudgetList(List<FinBudget> budgets) {
        return budgets.stream().map(this::convertBudget).toList();
    }
}
