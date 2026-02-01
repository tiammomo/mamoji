package com.mamoji.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.security.JwtTokenProvider;

/**
 * 测试配置类 - 提供集成测试所需的模拟 bean
 * 使用方式：在测试类上添加 @Import(TestSecurityConfig.class)
 */
@TestConfiguration
public class TestSecurityConfig {

    /** 测试用户ID */
    private static final Long TEST_USER_ID = 999L;

    /** 测试用户名 */
    private static final String TEST_USERNAME = "testuser";

    /**
     * 密码编码器 bean - 用于测试环境
     */
    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 测试用户 bean - 用于认证测试场景
     */
    @Bean
    @Primary
    public SysUser testUser(PasswordEncoder encoder) {
        return SysUser.builder()
                .userId(TEST_USER_ID)
                .username(TEST_USERNAME)
                .password(encoder.encode("test123"))
                .email("test@mamoji.com")
                .phone("13800138000")
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * 测试 Token 生成器 - 用于生成 JWT 测试令牌
     */
    @Bean
    @Primary
    public TestTokenGenerator testTokenGenerator(JwtTokenProvider jwtTokenProvider) {
        return new TestTokenGenerator(jwtTokenProvider);
    }

    // ==================== 测试数据工厂方法 ====================

    /**
     * 创建测试账户（默认余额 1000）
     */
    public static FinAccount createTestAccount() {
        return createTestAccount("测试账户", new BigDecimal("1000.00"));
    }

    /**
     * 创建测试账户（自定义名称和余额）
     */
    public static FinAccount createTestAccount(String name, BigDecimal balance) {
        return FinAccount.builder()
                .userId(TEST_USER_ID)
                .name(name)
                .accountType("cash")
                .balance(balance)
                .currency("CNY")
                .status(1)
                .createdAt(LocalDateTime.now())
                .build();
    }

    /**
     * 创建测试分类
     */
    public static FinCategory createTestCategory(String name, String type) {
        return FinCategory.builder()
                .userId(TEST_USER_ID)
                .name(name)
                .type(type)
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /** 创建支出分类 */
    public static FinCategory createExpenseCategory() {
        return createTestCategory("测试支出", "expense");
    }

    /** 创建收入分类 */
    public static FinCategory createIncomeCategory() {
        return createTestCategory("测试收入", "income");
    }

    /**
     * 创建测试预算（默认金额 5000）
     */
    public static FinBudget createTestBudget() {
        return createTestBudget("测试预算", new BigDecimal("5000.00"));
    }

    /**
     * 创建测试预算（自定义名称和金额）
     */
    public static FinBudget createTestBudget(String name, BigDecimal amount) {
        LocalDate now = LocalDate.now();
        return FinBudget.builder()
                .userId(TEST_USER_ID)
                .name(name)
                .amount(amount)
                .spent(BigDecimal.ZERO)
                .startDate(now.withDayOfMonth(1))
                .endDate(now.withDayOfMonth(1).plusMonths(1))
                .status(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * 创建测试交易（默认金额 100）
     */
    public static FinTransaction createTestTransaction(Long accountId, Long categoryId, String type) {
        return FinTransaction.builder()
                .userId(TEST_USER_ID)
                .accountId(accountId)
                .categoryId(categoryId)
                .type(type)
                .amount(new BigDecimal("100.00"))
                .currency("CNY")
                .status(1)
                .occurredAt(LocalDateTime.now())
                .note("测试交易")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /** 创建支出交易 */
    public static FinTransaction createExpenseTransaction(Long accountId, Long categoryId) {
        return createTestTransaction(accountId, categoryId, "expense");
    }

    /** 创建收入交易 */
    public static FinTransaction createIncomeTransaction(Long accountId, Long categoryId) {
        return createTestTransaction(accountId, categoryId, "income");
    }

    // ==================== 测试 Token 生成器 ====================

    /**
     * 测试 JWT Token 生成器
     */
    public static class TestTokenGenerator {
        private final JwtTokenProvider jwtTokenProvider;

        public TestTokenGenerator(JwtTokenProvider jwtTokenProvider) {
            this.jwtTokenProvider = jwtTokenProvider;
        }

        /** 为测试用户生成 Token */
        public String forTestUser() {
            return jwtTokenProvider.generateToken(TEST_USER_ID, TEST_USERNAME);
        }

        /** 为指定用户生成 Token */
        public String forUser(Long userId, String username) {
            return jwtTokenProvider.generateToken(userId, username);
        }

        /** 为指定用户生成 Token（带额外 claims） */
        public String forUser(Long userId, String username, Map<String, Object> extraClaims) {
            return jwtTokenProvider.generateToken(userId, username, extraClaims);
        }
    }
}
