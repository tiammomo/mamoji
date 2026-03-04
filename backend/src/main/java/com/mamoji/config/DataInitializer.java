package com.mamoji.config;

import com.mamoji.entity.Account;
import com.mamoji.entity.Budget;
import com.mamoji.entity.Category;
import com.mamoji.entity.User;
import com.mamoji.repository.AccountRepository;
import com.mamoji.repository.BudgetRepository;
import com.mamoji.repository.CategoryRepository;
import com.mamoji.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final BudgetRepository budgetRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initDefaultData() {
        // 初始化分类
        if (categoryRepository.count() == 0) {
            // 收入分类 - PRD预置
            List<Category> incomeCategories = List.of(
                Category.builder().name("工资").type(1).icon("salary").color("#27AE60").isSystem(1).build(),
                Category.builder().name("奖金").type(1).icon("bonus").color("#E74C3C").isSystem(1).build(),
                Category.builder().name("投资").type(1).icon("investment").color("#3498DB").isSystem(1).build(),
                Category.builder().name("其他收入").type(1).icon("other_income").color("#9B59B6").isSystem(1).build()
            );

            // 支出分类 - PRD预置
            List<Category> expenseCategories = List.of(
                Category.builder().name("餐饮").type(2).icon("food").color("#FF6B6B").isSystem(1).build(),
                Category.builder().name("交通").type(2).icon("transport").color("#4ECDC4").isSystem(1).build(),
                Category.builder().name("购物").type(2).icon("shopping").color("#45B7D1").isSystem(1).build(),
                Category.builder().name("娱乐").type(2).icon("entertainment").color("#F7DC6F").isSystem(1).build(),
                Category.builder().name("居住").type(2).icon("housing").color("#BB8FCE").isSystem(1).build(),
                Category.builder().name("生活").type(2).icon("living").color("#85C1E9").isSystem(1).build(),
                Category.builder().name("医疗").type(2).icon("medical").color("#58D68D").isSystem(1).build(),
                Category.builder().name("教育").type(2).icon("education").color("#E67E22").isSystem(1).build(),
                Category.builder().name("人情").type(2).icon("social").color("#E91E63").isSystem(1).build(),
                Category.builder().name("其他支出").type(2).icon("other_expense").color("#ABB2B9").isSystem(1).build()
            );

            categoryRepository.saveAll(incomeCategories);
            categoryRepository.saveAll(expenseCategories);
            log.info("Default categories initialized");
        }

        // 初始化测试用户
        if (!userRepository.existsByEmail("test@mamoji.com")) {
            User testUser = User.builder()
                .email("test@mamoji.com")
                .passwordHash(passwordEncoder.encode("123456"))
                .nickname("测试用户")
                .role(1)
                .permissions(15)
                .build();
            testUser = userRepository.save(testUser);
            log.info("Test user created: test@mamoji.com / 123456");

            // 初始化默认账户
            List<Account> defaultAccounts = List.of(
                Account.builder()
                    .name("现金")
                    .type("cash")
                    .balance(BigDecimal.ZERO)
                    .userId(testUser.getId())
                    .includeInNetWorth(true)
                    .status(1)
                    .build(),
                Account.builder()
                    .name("银行卡")
                    .type("bank")
                    .balance(BigDecimal.ZERO)
                    .userId(testUser.getId())
                    .includeInNetWorth(true)
                    .status(1)
                    .build(),
                Account.builder()
                    .name("支付宝")
                    .type("digital")
                    .balance(BigDecimal.ZERO)
                    .userId(testUser.getId())
                    .includeInNetWorth(true)
                    .status(1)
                    .build(),
                Account.builder()
                    .name("微信支付")
                    .type("digital")
                    .balance(BigDecimal.ZERO)
                    .userId(testUser.getId())
                    .includeInNetWorth(true)
                    .status(1)
                    .build()
            );
            accountRepository.saveAll(defaultAccounts);
            log.info("Default accounts initialized");

            // 初始化默认预算 - 本月总预算
            LocalDate now = LocalDate.now();
            LocalDate startOfMonth = now.withDayOfMonth(1);
            LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

            Budget defaultBudget = Budget.builder()
                .name(now.getYear() + "年" + now.getMonthValue() + "月预算")
                .amount(new BigDecimal("5000"))
                .startDate(startOfMonth)
                .endDate(endOfMonth)
                .warningThreshold(85)
                .spent(BigDecimal.ZERO)
                .userId(testUser.getId())
                .status(1)
                .build();
            budgetRepository.save(defaultBudget);
            log.info("Default budget initialized: " + defaultBudget.getName());
        }
    }
}
