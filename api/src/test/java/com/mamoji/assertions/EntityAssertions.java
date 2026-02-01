package com.mamoji.assertions;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.assertj.core.api.AbstractAssert;
import org.assertj.core.api.Assertions;

import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.transaction.entity.FinTransaction;

/**
 * 实体自定义断言 - 提供流式 API 进行测试验证
 *
 * <p>使用示例：
 * <pre>
 * assertThat(account)
 *     .hasUserId(999L)
 *     .hasPositiveBalance()
 *     .isActive();
 *
 * assertThat(transaction)
 *     .isExpense()
 *     .hasAmountGreaterThan(BigDecimal.ZERO);
 * </pre>
 */
public class EntityAssertions {

    // ==================== 账户断言 ====================

    /** 创建账户断言 */
    public static FinAccountAssert assertThat(FinAccount actual) {
        return new FinAccountAssert(actual);
    }

    /** 账户断言类 */
    public static class FinAccountAssert extends AbstractAssert<FinAccountAssert, FinAccount> {

        public FinAccountAssert(FinAccount actual) {
            super(actual, FinAccountAssert.class);
        }

        /** 验证用户ID */
        public FinAccountAssert hasUserId(Long expected) {
            Assertions.assertThat(actual.getUserId())
                    .as("账户用户ID应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证账户ID不为空 */
        public FinAccountAssert hasAccountIdNotNull() {
            Assertions.assertThat(actual.getAccountId())
                    .as("账户ID不应为空")
                    .isNotNull();
            return this;
        }

        /** 验证账户名称 */
        public FinAccountAssert hasName(String expected) {
            Assertions.assertThat(actual.getName())
                    .as("账户名称应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证余额为正数 */
        public FinAccountAssert hasPositiveBalance() {
            Assertions.assertThat(actual.getBalance())
                    .as("账户余额应为正数")
                    .isPositive();
            return this;
        }

        /** 验证余额大于指定值 */
        public FinAccountAssert hasBalanceGreaterThan(BigDecimal amount) {
            Assertions.assertThat(actual.getBalance())
                    .as("账户余额应大于 %s", amount)
                    .isGreaterThan(amount);
            return this;
        }

        /** 验证货币类型 */
        public FinAccountAssert hasCurrency(String expected) {
            Assertions.assertThat(actual.getCurrency())
                    .as("账户货币类型应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证账户状态为激活 */
        public FinAccountAssert isActive() {
            Assertions.assertThat(actual.getStatus())
                    .as("账户应为激活状态(status=1)")
                    .isEqualTo(1);
            return this;
        }

        /** 验证账户状态为禁用 */
        public FinAccountAssert isInactive() {
            Assertions.assertThat(actual.getStatus())
                    .as("账户应为禁用状态(status=0)")
                    .isEqualTo(0);
            return this;
        }
    }

    // ==================== 分类断言 ====================

    /** 创建分类断言 */
    public static FinCategoryAssert assertThat(FinCategory actual) {
        return new FinCategoryAssert(actual);
    }

    /** 分类断言类 */
    public static class FinCategoryAssert extends AbstractAssert<FinCategoryAssert, FinCategory> {

        public FinCategoryAssert(FinCategory actual) {
            super(actual, FinCategoryAssert.class);
        }

        /** 验证用户ID */
        public FinCategoryAssert hasUserId(Long expected) {
            Assertions.assertThat(actual.getUserId())
                    .as("分类用户ID应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证分类ID不为空 */
        public FinCategoryAssert hasCategoryIdNotNull() {
            Assertions.assertThat(actual.getCategoryId())
                    .as("分类ID不应为空")
                    .isNotNull();
            return this;
        }

        /** 验证是支出分类 */
        public FinCategoryAssert isExpense() {
            Assertions.assertThat(actual.getType())
                    .as("分类类型应为支出(expense)")
                    .isEqualTo("expense");
            return this;
        }

        /** 验证是收入分类 */
        public FinCategoryAssert isIncome() {
            Assertions.assertThat(actual.getType())
                    .as("分类类型应为收入(income)")
                    .isEqualTo("income");
            return this;
        }

        /** 验证分类状态为激活 */
        public FinCategoryAssert isActive() {
            Assertions.assertThat(actual.getStatus())
                    .as("分类应为激活状态(status=1)")
                    .isEqualTo(1);
            return this;
        }
    }

    // ==================== 预算断言 ====================

    /** 创建预算断言 */
    public static FinBudgetAssert assertThat(FinBudget actual) {
        return new FinBudgetAssert(actual);
    }

    /** 预算断言类 */
    public static class FinBudgetAssert extends AbstractAssert<FinBudgetAssert, FinBudget> {

        public FinBudgetAssert(FinBudget actual) {
            super(actual, FinBudgetAssert.class);
        }

        /** 验证用户ID */
        public FinBudgetAssert hasUserId(Long expected) {
            Assertions.assertThat(actual.getUserId())
                    .as("预算用户ID应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证预算ID不为空 */
        public FinBudgetAssert hasBudgetIdNotNull() {
            Assertions.assertThat(actual.getBudgetId())
                    .as("预算ID不应为空")
                    .isNotNull();
            return this;
        }

        /** 验证预算金额 */
        public FinBudgetAssert hasAmount(BigDecimal expected) {
            Assertions.assertThat(actual.getAmount())
                    .as("预算金额应为 %s", expected)
                    .isEqualByComparingTo(expected);
            return this;
        }

        /** 验证已花费金额 */
        public FinBudgetAssert hasSpentAmount(BigDecimal expected) {
            Assertions.assertThat(actual.getSpent())
                    .as("预算已花费金额应为 %s", expected)
                    .isEqualByComparingTo(expected);
            return this;
        }

        /** 验证已花费为正数 */
        public FinBudgetAssert hasPositiveSpent() {
            Assertions.assertThat(actual.getSpent())
                    .as("预算已花费金额应为正数")
                    .isPositive();
            return this;
        }

        /** 验证预算状态为激活 */
        public FinBudgetAssert isActive() {
            Assertions.assertThat(actual.getStatus())
                    .as("预算应为激活状态(status=1)")
                    .isEqualTo(1);
            return this;
        }

        /** 验证超支 */
        public FinBudgetAssert isOverBudget() {
            Assertions.assertThat(actual.getSpent())
                    .as("已花费应超过预算金额")
                    .isGreaterThan(actual.getAmount());
            return this;
        }

        /** 验证未超支 */
        public FinBudgetAssert isUnderBudget() {
            Assertions.assertThat(actual.getSpent())
                    .as("已花费应小于预算金额")
                    .isLessThan(actual.getAmount());
            return this;
        }

        /** 验证剩余金额 */
        public FinBudgetAssert hasRemainingBudget(BigDecimal expected) {
            BigDecimal remaining = actual.getAmount().subtract(actual.getSpent());
            Assertions.assertThat(remaining)
                    .as("预算剩余金额应为 %s", expected)
                    .isEqualByComparingTo(expected);
            return this;
        }
    }

    // ==================== 交易断言 ====================

    /** 创建交易断言 */
    public static FinTransactionAssert assertThat(FinTransaction actual) {
        return new FinTransactionAssert(actual);
    }

    /** 交易断言类 */
    public static class FinTransactionAssert extends AbstractAssert<FinTransactionAssert, FinTransaction> {

        public FinTransactionAssert(FinTransaction actual) {
            super(actual, FinTransactionAssert.class);
        }

        /** 验证用户ID */
        public FinTransactionAssert hasUserId(Long expected) {
            Assertions.assertThat(actual.getUserId())
                    .as("交易用户ID应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证交易ID不为空 */
        public FinTransactionAssert hasTransactionIdNotNull() {
            Assertions.assertThat(actual.getTransactionId())
                    .as("交易ID不应为空")
                    .isNotNull();
            return this;
        }

        /** 验证是支出交易 */
        public FinTransactionAssert isExpense() {
            Assertions.assertThat(actual.getType())
                    .as("交易类型应为支出(expense)")
                    .isEqualTo("expense");
            return this;
        }

        /** 验证是收入交易 */
        public FinTransactionAssert isIncome() {
            Assertions.assertThat(actual.getType())
                    .as("交易类型应为收入(income)")
                    .isEqualTo("income");
            return this;
        }

        /** 验证交易金额 */
        public FinTransactionAssert hasAmount(BigDecimal expected) {
            Assertions.assertThat(actual.getAmount())
                    .as("交易金额应为 %s", expected)
                    .isEqualByComparingTo(expected);
            return this;
        }

        /** 验证交易金额大于指定值 */
        public FinTransactionAssert hasAmountGreaterThan(BigDecimal amount) {
            Assertions.assertThat(actual.getAmount())
                    .as("交易金额应大于 %s", amount)
                    .isGreaterThan(amount);
            return this;
        }

        /** 验证交易金额为正数 */
        public FinTransactionAssert hasPositiveAmount() {
            Assertions.assertThat(actual.getAmount())
                    .as("交易金额应为正数")
                    .isPositive();
            return this;
        }

        /** 验证货币类型 */
        public FinTransactionAssert hasCurrency(String expected) {
            Assertions.assertThat(actual.getCurrency())
                    .as("交易货币类型应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证交易状态为激活 */
        public FinTransactionAssert isActive() {
            Assertions.assertThat(actual.getStatus())
                    .as("交易应为激活状态(status=1)")
                    .isEqualTo(1);
            return this;
        }

        /** 验证备注 */
        public FinTransactionAssert hasNote(String expected) {
            Assertions.assertThat(actual.getNote())
                    .as("交易备注应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }
    }

    // ==================== 用户断言 ====================

    /** 创建用户断言 */
    public static SysUserAssert assertThat(SysUser actual) {
        return new SysUserAssert(actual);
    }

    /** 用户断言类 */
    public static class SysUserAssert extends AbstractAssert<SysUserAssert, SysUser> {

        public SysUserAssert(SysUser actual) {
            super(actual, SysUserAssert.class);
        }

        /** 验证用户ID不为空 */
        public SysUserAssert hasUserIdNotNull() {
            Assertions.assertThat(actual.getUserId())
                    .as("用户ID不应为空")
                    .isNotNull();
            return this;
        }

        /** 验证用户名 */
        public SysUserAssert hasUsername(String expected) {
            Assertions.assertThat(actual.getUsername())
                    .as("用户名应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证邮箱 */
        public SysUserAssert hasEmail(String expected) {
            Assertions.assertThat(actual.getEmail())
                    .as("邮箱应为 %s", expected)
                    .isEqualTo(expected);
            return this;
        }

        /** 验证用户状态为激活 */
        public SysUserAssert isActive() {
            Assertions.assertThat(actual.getStatus())
                    .as("用户应为激活状态(status=1)")
                    .isEqualTo(1);
            return this;
        }

        /** 验证用户状态为禁用 */
        public SysUserAssert isInactive() {
            Assertions.assertThat(actual.getStatus())
                    .as("用户应为禁用状态(status=0)")
                    .isEqualTo(0);
            return this;
        }
    }

    // ==================== 集合断言 ====================

    /** 账户列表断言 */
    public static class FinAccountListAssert {
        private final List<FinAccount> actual;

        public FinAccountListAssert(List<FinAccount> actual) {
            this.actual = actual;
        }

        /** 验证列表大小 */
        public FinAccountListAssert hasSize(int expected) {
            Assertions.assertThat(actual)
                    .as("账户列表大小应为 %s", expected)
                    .hasSize(expected);
            return this;
        }

        /** 验证列表为空 */
        public FinAccountListAssert isEmpty() {
            Assertions.assertThat(actual)
                    .as("账户列表应为空")
                    .isEmpty();
            return this;
        }

        /** 验证列表非空 */
        public FinAccountListAssert isNotEmpty() {
            Assertions.assertThat(actual)
                    .as("账户列表应非空")
                    .isNotEmpty();
            return this;
        }
    }

    /** 创建账户列表断言 */
    public static FinAccountListAssert assertThat(List<FinAccount> actual) {
        return new FinAccountListAssert(actual);
    }
}
