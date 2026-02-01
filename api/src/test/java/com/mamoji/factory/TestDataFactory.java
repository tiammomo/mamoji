package com.mamoji.factory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.IntStream;

import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.transaction.entity.FinTransaction;

/**
 * 测试数据工厂 - 提供流式 API 构建测试数据
 *
 * <p>使用示例：
 * <pre>
 * // 创建账户
 * FinAccount account = TestDataFactory.account().name("我的账户").create();
 *
 * // 批量创建并持久化
 * List&lt;FinAccount&gt; accounts = TestDataFactory.account().createMultiple(3, accountMapper);
 * </pre>
 */
public class TestDataFactory {

    /** ID 生成器 */
    private static final AtomicLong ID_COUNTER = new AtomicLong(System.currentTimeMillis());

    // ==================== 账户工厂 ====================

    /** 创建账户构建器 */
    public static AccountBuilder account() {
        return new AccountBuilder();
    }

    /** 账户构建器 */
    public static class AccountBuilder {
        private String name = "测试账户";
        private String accountType = "cash";
        private BigDecimal balance = new BigDecimal("1000.00");
        private String currency = "CNY";
        private Long userId = 999L;

        public AccountBuilder name(String name) {
            this.name = name;
            return this;
        }

        public AccountBuilder accountType(String accountType) {
            this.accountType = accountType;
            return this;
        }

        public AccountBuilder balance(BigDecimal balance) {
            this.balance = balance;
            return this;
        }

        public AccountBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public AccountBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        /** 创建账户对象（不持久化） */
        public FinAccount create() {
            return FinAccount.builder()
                    .userId(userId)
                    .name(name + " " + ID_COUNTER.incrementAndGet())
                    .accountType(accountType)
                    .balance(balance)
                    .currency(currency)
                    .status(1)
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        /** 创建并持久化账户 */
        public FinAccount createAndPersist(FinAccountMapper mapper) {
            FinAccount account = create();
            mapper.insert(account);
            return account;
        }

        /** 批量创建并持久化 */
        public List<FinAccount> createMultiple(int count, FinAccountMapper mapper) {
            return IntStream.range(0, count)
                    .mapToObj(i -> createAndPersist(mapper))
                    .toList();
        }

        /** Mapper 接口 */
        public interface FinAccountMapper {
            int insert(FinAccount entity);
        }
    }

    // ==================== 分类工厂 ====================

    /** 创建分类构建器 */
    public static CategoryBuilder category() {
        return new CategoryBuilder();
    }

    /** 分类构建器 */
    public static class CategoryBuilder {
        private String name = "测试分类";
        private String type = "expense";
        private Long userId = 999L;

        public CategoryBuilder name(String name) {
            this.name = name;
            return this;
        }

        public CategoryBuilder type(String type) {
            this.type = type;
            return this;
        }

        public CategoryBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public CategoryBuilder expense() {
            this.type = "expense";
            return this;
        }

        public CategoryBuilder income() {
            this.type = "income";
            return this;
        }

        /** 创建分类对象 */
        public FinCategory create() {
            return FinCategory.builder()
                    .userId(userId)
                    .name(name + " " + ID_COUNTER.incrementAndGet())
                    .type(type)
                    .status(1)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        /** 创建并持久化分类 */
        public FinCategory createAndPersist(FinCategoryMapper mapper) {
            FinCategory category = create();
            mapper.insert(category);
            return category;
        }

        /** 批量创建 */
        public List<FinCategory> createMultiple(int count, String type, FinCategoryMapper mapper) {
            return IntStream.range(0, count)
                    .mapToObj(i -> category().type(type).createAndPersist(mapper))
                    .toList();
        }

        public interface FinCategoryMapper {
            int insert(FinCategory entity);
        }
    }

    // ==================== 预算工厂 ====================

    /** 创建预算构建器 */
    public static BudgetBuilder budget() {
        return new BudgetBuilder();
    }

    /** 预算构建器 */
    public static class BudgetBuilder {
        private String name = "测试预算";
        private BigDecimal amount = new BigDecimal("5000.00");
        private BigDecimal spent = BigDecimal.ZERO;
        private LocalDate startDate = LocalDate.now().withDayOfMonth(1);
        private LocalDate endDate = LocalDate.now().withDayOfMonth(1).plusMonths(1);
        private Long userId = 999L;

        public BudgetBuilder name(String name) {
            this.name = name;
            return this;
        }

        public BudgetBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public BudgetBuilder spent(BigDecimal spent) {
            this.spent = spent;
            return this;
        }

        public BudgetBuilder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public BudgetBuilder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        /** 设置本月预算周期 */
        public BudgetBuilder thisMonth() {
            LocalDate now = LocalDate.now();
            this.startDate = now.withDayOfMonth(1);
            this.endDate = now.withDayOfMonth(1).plusMonths(1);
            return this;
        }

        public BudgetBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        /** 创建预算对象 */
        public FinBudget create() {
            return FinBudget.builder()
                    .userId(userId)
                    .name(name + " " + ID_COUNTER.incrementAndGet())
                    .amount(amount)
                    .spent(spent)
                    .startDate(startDate)
                    .endDate(endDate)
                    .status(1)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        /** 创建并持久化预算 */
        public FinBudget createAndPersist(FinBudgetMapper mapper) {
            FinBudget budget = create();
            mapper.insert(budget);
            return budget;
        }

        public interface FinBudgetMapper {
            int insert(FinBudget entity);
        }
    }

    // ==================== 交易工厂 ====================

    /** 创建交易构建器 */
    public static TransactionBuilder transaction() {
        return new TransactionBuilder();
    }

    /** 交易构建器 */
    public static class TransactionBuilder {
        private Long accountId;
        private Long categoryId;
        private String type = "expense";
        private BigDecimal amount = new BigDecimal("100.00");
        private String currency = "CNY";
        private String note = "测试交易";
        private LocalDateTime occurredAt = LocalDateTime.now();
        private Long userId = 999L;

        public TransactionBuilder accountId(Long accountId) {
            this.accountId = accountId;
            return this;
        }

        public TransactionBuilder categoryId(Long categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public TransactionBuilder type(String type) {
            this.type = type;
            return this;
        }

        public TransactionBuilder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public TransactionBuilder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public TransactionBuilder note(String note) {
            this.note = note;
            return this;
        }

        public TransactionBuilder occurredAt(LocalDateTime occurredAt) {
            this.occurredAt = occurredAt;
            return this;
        }

        public TransactionBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public TransactionBuilder expense() {
            this.type = "expense";
            return this;
        }

        public TransactionBuilder income() {
            this.type = "income";
            return this;
        }

        /** 随机金额（10-1010） */
        public TransactionBuilder randomAmount() {
            this.amount = new BigDecimal(Math.random() * 1000 + 10);
            return this;
        }

        /** 几天前的交易 */
        public TransactionBuilder daysAgo(int days) {
            this.occurredAt = LocalDateTime.now().minusDays(days);
            return this;
        }

        /** 创建交易对象 */
        public FinTransaction create() {
            return FinTransaction.builder()
                    .userId(userId)
                    .accountId(accountId)
                    .categoryId(categoryId)
                    .type(type)
                    .amount(amount)
                    .currency(currency)
                    .status(1)
                    .occurredAt(occurredAt)
                    .note(note)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        /** 创建并持久化交易 */
        public FinTransaction createAndPersist(FinTransactionMapper mapper) {
            FinTransaction tx = create();
            mapper.insert(tx);
            return tx;
        }

        public interface FinTransactionMapper {
            int insert(FinTransaction entity);
        }
    }

    // ==================== 用户工厂 ====================

    /** 创建用户构建器 */
    public static UserBuilder user() {
        return new UserBuilder();
    }

    /** 用户构建器 */
    public static class UserBuilder {
        private String username = "testuser";
        private String email = "test@mamoji.com";
        private String phone = "13800138000";
        private Integer status = 1;

        public UserBuilder username(String username) {
            this.username = username;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public UserBuilder status(Integer status) {
            this.status = status;
            return this;
        }

        /** 随机用户名 */
        public UserBuilder randomUsername() {
            this.username = "user_" + UUID.randomUUID().toString().substring(0, 8);
            this.email = this.username + "@test.com";
            return this;
        }

        /** 创建用户对象 */
        public SysUser create() {
            return SysUser.builder()
                    .username(username)
                    .password("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/nMskyB.1oMPAux2aGRIuS")
                    .email(email)
                    .phone(phone)
                    .status(status)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        /** 创建并持久化用户 */
        public SysUser createAndPersist(SysUserMapper mapper) {
            SysUser user = create();
            mapper.insert(user);
            return user;
        }

        public interface SysUserMapper {
            int insert(SysUser entity);
        }
    }
}
