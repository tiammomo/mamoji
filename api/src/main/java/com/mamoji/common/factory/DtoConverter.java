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
 * DTO Converter Factory for converting between entities and VOs. Uses Factory Pattern to centralize
 * conversion logic.
 */
@Component
public class DtoConverter {

    /** Convert FinTransaction to TransactionVO. */
    public TransactionVO convertTransaction(FinTransaction tx) {
        TransactionVO vo = new TransactionVO();
        BeanUtils.copyProperties(tx, vo);
        return vo;
    }

    /** Convert FinAccount to AccountVO. */
    public AccountVO convertAccount(FinAccount account) {
        AccountVO vo = new AccountVO();
        BeanUtils.copyProperties(account, vo);
        return vo;
    }

    /** Convert FinCategory to CategoryVO. */
    public CategoryVO convertCategory(FinCategory category) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    /** Convert FinBudget to BudgetVO. */
    public BudgetVO convertBudget(FinBudget budget) {
        BudgetVO vo = new BudgetVO();
        BeanUtils.copyProperties(budget, vo);
        return vo;
    }

    /** Convert list of transactions to VOs. */
    public List<TransactionVO> convertTransactionList(List<FinTransaction> transactions) {
        return transactions.stream().map(this::convertTransaction).toList();
    }

    /** Convert list of accounts to VOs. */
    public List<AccountVO> convertAccountList(List<FinAccount> accounts) {
        return accounts.stream().map(this::convertAccount).toList();
    }

    /** Convert list of categories to VOs. */
    public List<CategoryVO> convertCategoryList(List<FinCategory> categories) {
        return categories.stream().map(this::convertCategory).toList();
    }

    /** Convert list of budgets to VOs. */
    public List<BudgetVO> convertBudgetList(List<FinBudget> budgets) {
        return budgets.stream().map(this::convertBudget).toList();
    }
}
