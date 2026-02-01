package com.mamoji;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.config.TestSecurityConfig;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.auth.mapper.SysUserMapper;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.budget.mapper.FinBudgetMapper;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;

/**
 * 集成测试基类 - 使用 Docker MySQL 进行真实数据库测试
 *
 * <p>提供测试数据工厂方法：
 * <ul>
 *   <li>{@link #createAccount()} - 创建测试账户</li>
 *   <li>{@link #createCategory(String, String)} - 创建测试分类</li>
 *   <li>{@link #createBudget()} - 创建测试预算</li>
 *   <li>{@link #createTransaction(Long, Long, String)} - 创建测试交易</li>
 *   <li>{@link #createUser(String)} - 创建测试用户</li>
 * </ul>
 *
 * <p>提供数据清理方法：
 * <ul>
 *   <li>{@link #cleanupAll()} - 清理所有测试数据</li>
 *   <li>{@link #cleanupAccounts()} - 清理账户数据</li>
 *   <li>{@link #cleanupCategories()} - 清理分类数据</li>
 * </ul>
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest
@ActiveProfiles("test")
@Transactional // 测试后自动回滚
@Import(TestSecurityConfig.class)
public abstract class MySqlIntegrationTestBase {

    /** 注入用户 Mapper */
    @Autowired protected SysUserMapper userMapper;

    /** 注入账户 Mapper */
    @Autowired protected FinAccountMapper accountMapper;

    /** 注入分类 Mapper */
    @Autowired protected FinCategoryMapper categoryMapper;

    /** 注入交易 Mapper */
    @Autowired protected FinTransactionMapper transactionMapper;

    /** 注入预算 Mapper */
    @Autowired protected FinBudgetMapper budgetMapper;

    /** 测试用户ID */
    protected final Long testUserId = 999L;

    /** 用于生成唯一ID，防止测试数据冲突 */
    private final AtomicLong uniqueIdCounter = new AtomicLong(System.currentTimeMillis() % 10000);

    // ==================== 账户工厂方法 ====================

    /** 创建测试账户（默认余额1000，名称自动生成） */
    protected FinAccount createAccount() {
        return createAccount("账户" + uniqueIdCounter.incrementAndGet());
    }

    /** 创建测试账户（自定义名称，默认余额1000） */
    protected FinAccount createAccount(String name) {
        return createAccount(name, new BigDecimal("1000.00"));
    }

    /** 创建测试账户（自定义名称和余额） */
    protected FinAccount createAccount(String name, BigDecimal balance) {
        FinAccount account = FinAccount.builder()
                .userId(testUserId)
                .name(name)
                .accountType("cash")
                .balance(balance)
                .currency("CNY")
                .status(1)
                .createdAt(LocalDateTime.now())
                .build();
        accountMapper.insert(account);
        return account;
    }

    // ==================== 分类工厂方法 ====================

    /** 创建测试分类 */
    protected FinCategory createCategory(String name, String type) {
        FinCategory category = FinCategory.builder()
                .userId(testUserId)
                .name(name)
                .type(type)
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        categoryMapper.insert(category);
        return category;
    }

    /** 创建支出分类（名称自动生成） */
    protected FinCategory createExpenseCategory() {
        return createCategory("支出" + uniqueIdCounter.incrementAndGet(), "expense");
    }

    /** 创建收入分类（名称自动生成） */
    protected FinCategory createIncomeCategory() {
        return createCategory("收入" + uniqueIdCounter.incrementAndGet(), "income");
    }

    // ==================== 预算工厂方法 ====================

    /** 创建测试预算（默认金额5000，名称自动生成） */
    protected FinBudget createBudget() {
        return createBudget("预算" + uniqueIdCounter.incrementAndGet());
    }

    /** 创建测试预算（自定义名称，默认金额5000） */
    protected FinBudget createBudget(String name) {
        return createBudget(name, new BigDecimal("5000.00"));
    }

    /** 创建测试预算（自定义名称和金额） */
    protected FinBudget createBudget(String name, BigDecimal amount) {
        LocalDate now = LocalDate.now();
        FinBudget budget = FinBudget.builder()
                .userId(testUserId)
                .name(name)
                .amount(amount)
                .spent(BigDecimal.ZERO)
                .startDate(now.withDayOfMonth(1))
                .endDate(now.withDayOfMonth(1).plusMonths(1))
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        budgetMapper.insert(budget);
        return budget;
    }

    /** 创建测试预算（自定义日期范围） */
    protected FinBudget createBudget(String name, BigDecimal amount, LocalDate startDate, LocalDate endDate) {
        FinBudget budget = FinBudget.builder()
                .userId(testUserId)
                .name(name)
                .amount(amount)
                .spent(BigDecimal.ZERO)
                .startDate(startDate)
                .endDate(endDate)
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        budgetMapper.insert(budget);
        return budget;
    }

    // ==================== 交易工厂方法 ====================

    /** 创建测试交易（默认金额100） */
    protected FinTransaction createTransaction(Long accountId, Long categoryId, String type) {
        return createTransaction(accountId, categoryId, type, new BigDecimal("100.00"));
    }

    /** 创建测试交易（自定义金额） */
    protected FinTransaction createTransaction(Long accountId, Long categoryId, String type, BigDecimal amount) {
        FinTransaction transaction = FinTransaction.builder()
                .userId(testUserId)
                .accountId(accountId)
                .categoryId(categoryId)
                .type(type)
                .amount(amount)
                .currency("CNY")
                .status(1)
                .occurredAt(LocalDateTime.now())
                .note("测试交易")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        transactionMapper.insert(transaction);
        return transaction;
    }

    /** 创建支出交易 */
    protected FinTransaction createExpenseTransaction(Long accountId, Long categoryId) {
        return createTransaction(accountId, categoryId, "expense");
    }

    /** 创建收入交易 */
    protected FinTransaction createIncomeTransaction(Long accountId, Long categoryId) {
        return createTransaction(accountId, categoryId, "income");
    }

    /** 批量创建交易 */
    protected List<FinTransaction> createTransactions(int count, Long accountId, Long categoryId, String type) {
        return IntStream.range(0, count)
                .mapToObj(i -> createTransaction(accountId, categoryId, type))
                .toList();
    }

    // ==================== 用户工厂方法 ====================

    /** 创建测试用户 */
    protected SysUser createUser(String username) {
        SysUser user = SysUser.builder()
                .username(username)
                .password("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/nMskyB.1oMPAux2aGRIuS") // "password" 的 BCrypt 编码
                .email(username + "@mamoji.com")
                .phone("13800138000")
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        userMapper.insert(user);
        return user;
    }

    // ==================== 数据清理方法 ====================

    /** 清理所有测试数据 */
    protected void cleanupAll() {
        cleanupTransactions();
        cleanupBudgets();
        cleanupCategories();
        cleanupAccounts();
        cleanupUsers();
    }

    /** 清理所有交易 */
    protected void cleanupTransactions() {
        transactionMapper.delete(
                new LambdaQueryWrapper<FinTransaction>().isNotNull(FinTransaction::getTransactionId));
    }

    /** 清理所有预算 */
    protected void cleanupBudgets() {
        budgetMapper.delete(new LambdaQueryWrapper<FinBudget>().isNotNull(FinBudget::getBudgetId));
    }

    /** 清理所有分类 */
    protected void cleanupCategories() {
        categoryMapper.delete(new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));
    }

    /** 清理所有账户 */
    protected void cleanupAccounts() {
        accountMapper.delete(new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
    }

    /** 清理所有用户 */
    protected void cleanupUsers() {
        userMapper.delete(new LambdaQueryWrapper<SysUser>().isNotNull(SysUser::getUserId));
    }

    /** 清理指定用户的所有数据 */
    protected void cleanupUserData(Long userId) {
        transactionMapper.delete(new LambdaQueryWrapper<FinTransaction>().eq(FinTransaction::getUserId, userId));
        budgetMapper.delete(new LambdaQueryWrapper<FinBudget>().eq(FinBudget::getUserId, userId));
        categoryMapper.delete(new LambdaQueryWrapper<FinCategory>().eq(FinCategory::getUserId, userId));
        accountMapper.delete(new LambdaQueryWrapper<FinAccount>().eq(FinAccount::getUserId, userId));
    }

    // ==================== 断言辅助方法 ====================

    /** 验证账户是否正确持久化 */
    protected void assertAccountPersisted(FinAccount account) {
        org.junit.jupiter.api.Assertions.assertNotNull(account.getAccountId());
        org.junit.jupiter.api.Assertions.assertEquals(testUserId, account.getUserId());
    }

    /** 验证分类是否正确持久化 */
    protected void assertCategoryPersisted(FinCategory category) {
        org.junit.jupiter.api.Assertions.assertNotNull(category.getCategoryId());
        org.junit.jupiter.api.Assertions.assertEquals(testUserId, category.getUserId());
    }

    /** 验证预算是否正确持久化 */
    protected void assertBudgetPersisted(FinBudget budget) {
        org.junit.jupiter.api.Assertions.assertNotNull(budget.getBudgetId());
        org.junit.jupiter.api.Assertions.assertEquals(testUserId, budget.getUserId());
    }

    /** 验证交易是否正确持久化 */
    protected void assertTransactionPersisted(FinTransaction transaction) {
        org.junit.jupiter.api.Assertions.assertNotNull(transaction.getTransactionId());
        org.junit.jupiter.api.Assertions.assertEquals(testUserId, transaction.getUserId());
    }
}
