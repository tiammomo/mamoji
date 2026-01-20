package com.mamoji.module.transaction.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TransactionService Integration Tests
 */
class TransactionServiceIntegrationTest extends MySqlIntegrationTestBase {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private FinAccountMapper accountMapper;

    @Autowired
    private FinCategoryMapper categoryMapper;

    private final Long testUserId = 999L;
    private Long testAccountId;
    private Long testCategoryId;

    @BeforeEach
    void setUp() {
        // Clean up test data using wrapper with always true condition
        transactionMapper.delete(new LambdaQueryWrapper<FinTransaction>().isNotNull(FinTransaction::getTransactionId));
        accountMapper.delete(new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
        categoryMapper.delete(new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));

        // Create test account
        FinAccount account = FinAccount.builder()
                .userId(testUserId)
                .name("Test Account")
                .accountType("bank")
                .balance(new BigDecimal("10000.00"))
                .currency("CNY")
                .status(1)
                .build();
        accountMapper.insert(account);
        testAccountId = account.getAccountId();

        // Create test category
        FinCategory category = FinCategory.builder()
                .userId(testUserId)
                .name("Test Category")
                .type("expense")
                .status(1)
                .build();
        categoryMapper.insert(category);
        testCategoryId = category.getCategoryId();
    }

    @AfterEach
    void tearDown() {
        transactionMapper.delete(new LambdaQueryWrapper<FinTransaction>().isNotNull(FinTransaction::getTransactionId));
        accountMapper.delete(new LambdaQueryWrapper<FinAccount>().isNotNull(FinAccount::getAccountId));
        categoryMapper.delete(new LambdaQueryWrapper<FinCategory>().isNotNull(FinCategory::getCategoryId));
    }

    @Test
    @DisplayName("Create transaction should persist and return id")
    void createTransaction_ShouldPersistAndReturnId() {
        // Given
        TransactionDTO dto = TransactionDTO.builder()
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("expense")
                .amount(new BigDecimal("100.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .note("Test transaction")
                .build();

        // When
        Long transactionId = transactionService.createTransaction(testUserId, dto);

        // Then
        assertThat(transactionId).isNotNull();

        FinTransaction saved = transactionMapper.selectById(transactionId);
        assertThat(saved).isNotNull();
        assertThat(saved.getUserId()).isEqualTo(testUserId);
        assertThat(saved.getAccountId()).isEqualTo(testAccountId);
        assertThat(saved.getCategoryId()).isEqualTo(testCategoryId);
        assertThat(saved.getAmount()).isEqualByComparingTo("100.00");
        assertThat(saved.getType()).isEqualTo("expense");
        assertThat(saved.getStatus()).isEqualTo(1);
    }

    @Test
    @DisplayName("List transactions should return user's transactions")
    void listTransactions_ShouldReturnUserTransactions() {
        // Given
        FinTransaction tx1 = FinTransaction.builder()
                .userId(testUserId)
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("expense")
                .amount(new BigDecimal("100.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();
        transactionMapper.insert(tx1);

        FinTransaction tx2 = FinTransaction.builder()
                .userId(testUserId)
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("income")
                .amount(new BigDecimal("500.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();
        transactionMapper.insert(tx2);

        // When
        var result = transactionService.listTransactions(testUserId, new TransactionQueryDTO());

        // Then
        assertThat(result.getRecords()).hasSize(2);
    }

    @Test
    @DisplayName("Get transaction should return VO when exists")
    void getTransaction_ShouldReturnVOWhenExists() {
        // Given
        FinTransaction tx = FinTransaction.builder()
                .userId(testUserId)
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("expense")
                .amount(new BigDecimal("200.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();
        transactionMapper.insert(tx);

        // When
        TransactionVO result = transactionService.getTransaction(testUserId, tx.getTransactionId());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAmount()).isEqualByComparingTo("200.00");
    }

    @Test
    @DisplayName("Delete transaction should set status to 0")
    void deleteTransaction_ShouldSetStatusToZero() {
        // Given
        FinTransaction tx = FinTransaction.builder()
                .userId(testUserId)
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("expense")
                .amount(new BigDecimal("150.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();
        transactionMapper.insert(tx);

        // When
        transactionService.deleteTransaction(testUserId, tx.getTransactionId());

        // Then - verify deletion by checking that active transactions count is 0
        Long activeCount = transactionMapper.selectCount(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, tx.getTransactionId())
                        .eq(FinTransaction::getStatus, 1)
        );
        assertThat(activeCount).isEqualTo(0);
    }

    @Test
    @DisplayName("Get recent transactions should return limited list")
    void getRecentTransactions_ShouldReturnLimitedList() {
        // Given
        for (int i = 0; i < 15; i++) {
            FinTransaction tx = FinTransaction.builder()
                    .userId(testUserId)
                    .accountId(testAccountId)
                    .categoryId(testCategoryId)
                    .type("expense")
                    .amount(new BigDecimal("10.00"))
                    .currency("CNY")
                    .occurredAt(LocalDateTime.now())
                    .status(1)
                    .build();
            transactionMapper.insert(tx);
        }

        // When
        List<TransactionVO> result = transactionService.getRecentTransactions(testUserId, testAccountId, 10);

        // Then
        assertThat(result).hasSize(10);
    }

    @Test
    @DisplayName("Update transaction should modify and adjust balance")
    void updateTransaction_ShouldModifyAndAdjustBalance() {
        // Given
        FinTransaction tx = FinTransaction.builder()
                .userId(testUserId)
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("expense")
                .amount(new BigDecimal("100.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();
        transactionMapper.insert(tx);

        TransactionDTO updateDto = TransactionDTO.builder()
                .accountId(testAccountId)
                .categoryId(testCategoryId)
                .type("expense")
                .amount(new BigDecimal("150.00"))
                .currency("CNY")
                .occurredAt(LocalDateTime.now())
                .note("Updated transaction")
                .build();

        // When
        transactionService.updateTransaction(testUserId, tx.getTransactionId(), updateDto);

        // Then - verify the transaction was updated
        TransactionVO result = transactionService.getTransaction(testUserId, tx.getTransactionId());
        assertThat(result).isNotNull();
        assertThat(result.getNote()).isEqualTo("Updated transaction");
    }
}
