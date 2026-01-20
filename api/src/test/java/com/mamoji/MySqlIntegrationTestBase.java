package com.mamoji;

import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.auth.mapper.SysUserMapper;
import com.mamoji.module.budget.mapper.FinBudgetMapper;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base integration test class with MySQL database
 * Uses local MySQL Docker container for real database testing
 * Uses @Transactional for automatic rollback after each test
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest
@ActiveProfiles("test")
@Transactional  // Automatic rollback after each test
public abstract class MySqlIntegrationTestBase {

    @Autowired
    protected SysUserMapper userMapper;

    @Autowired
    protected FinAccountMapper accountMapper;

    @Autowired
    protected FinCategoryMapper categoryMapper;

    @Autowired
    protected FinTransactionMapper transactionMapper;

    @Autowired
    protected FinBudgetMapper budgetMapper;

    protected final Long testUserId = 999L;
}
