package com.mamoji.module.transaction.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.transaction.entity.FinTransaction;

/** Transaction Mapper Integration Tests */
class TransactionMapperTest extends MySqlIntegrationTestBase {

    @Autowired private FinTransactionMapper transactionMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        transactionMapper.delete(
                new LambdaQueryWrapper<FinTransaction>()
                        .isNotNull(FinTransaction::getTransactionId));
    }

    @AfterEach
    void tearDown() {
        transactionMapper.delete(
                new LambdaQueryWrapper<FinTransaction>()
                        .isNotNull(FinTransaction::getTransactionId));
    }

    @Test
    @DisplayName("Insert transaction should persist and return generated ID")
    void insert_ShouldPersistAndReturnGeneratedId() {
        FinTransaction transaction =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("100.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();

        int result = transactionMapper.insert(transaction);

        assertThat(result).isGreaterThan(0);
        assertThat(transaction.getTransactionId()).isNotNull();
    }

    @Test
    @DisplayName("Select by ID should return transaction when exists")
    void selectById_ShouldReturnTransactionWhenExists() {
        FinTransaction transaction =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("income")
                        .amount(new BigDecimal("5000.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(transaction);

        FinTransaction found = transactionMapper.selectById(transaction.getTransactionId());

        assertThat(found).isNotNull();
        assertThat(found.getAmount()).isEqualByComparingTo("5000.00");
    }

    @Test
    @DisplayName("Select with type filter should return only matching types")
    void selectList_WithTypeFilter_ShouldReturnOnlyMatchingTypes() {
        FinTransaction incomeTx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("income")
                        .amount(new BigDecimal("1000.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(incomeTx);

        FinTransaction expenseTx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(2L)
                        .type("expense")
                        .amount(new BigDecimal("100.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(expenseTx);

        List<FinTransaction> incomeResults =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, testUserId)
                                .eq(FinTransaction::getType, "income"));

        assertThat(incomeResults).hasSize(1);
        assertThat(incomeResults.get(0).getType()).isEqualTo("income");
    }

    @Test
    @DisplayName("Select with status filter should return only active transactions")
    void selectList_WithStatusFilter_ShouldReturnOnlyActiveTransactions() {
        FinTransaction activeTx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("50.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(activeTx);

        FinTransaction deletedTx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("25.00"))
                        .currency("CNY")
                        .status(0)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(deletedTx);

        List<FinTransaction> activeResults =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, testUserId)
                                .eq(FinTransaction::getStatus, 1));

        assertThat(activeResults).hasSize(1);
    }

    @Test
    @DisplayName("Update by ID should modify existing transaction")
    void updateById_ShouldModifyExistingTransaction() {
        FinTransaction transaction =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("100.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(transaction);

        transaction.setAmount(new BigDecimal("200.00"));
        transaction.setNote("Updated note");
        int result = transactionMapper.updateById(transaction);

        assertThat(result).isGreaterThan(0);

        FinTransaction updated = transactionMapper.selectById(transaction.getTransactionId());
        assertThat(updated.getAmount()).isEqualByComparingTo("200.00");
        assertThat(updated.getNote()).isEqualTo("Updated note");
    }

    @Test
    @DisplayName("Delete by ID should remove transaction")
    void deleteById_ShouldRemoveTransaction() {
        FinTransaction transaction =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("50.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        transactionMapper.insert(transaction);

        int result = transactionMapper.deleteById(transaction.getTransactionId());

        assertThat(result).isGreaterThan(0);

        FinTransaction deleted = transactionMapper.selectById(transaction.getTransactionId());
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("Select count should return correct count")
    void selectCount_ShouldReturnCorrectCount() {
        for (int i = 1; i <= 5; i++) {
            FinTransaction transaction =
                    FinTransaction.builder()
                            .userId(testUserId)
                            .accountId(1L)
                            .categoryId(1L)
                            .type("expense")
                            .amount(new BigDecimal("10.00"))
                            .currency("CNY")
                            .status(1)
                            .occurredAt(LocalDateTime.now())
                            .build();
            transactionMapper.insert(transaction);
        }

        Long count =
                transactionMapper.selectCount(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, testUserId)
                                .eq(FinTransaction::getStatus, 1));

        assertThat(count).isEqualTo(5L);
    }

    @Test
    @DisplayName("Select with date range should return transactions within range")
    void selectList_WithDateRange_ShouldReturnTransactionsWithinRange() {
        LocalDateTime now = LocalDateTime.now();
        FinTransaction recentTx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("100.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(now)
                        .build();
        transactionMapper.insert(recentTx);

        FinTransaction oldTx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("50.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(now.minusDays(30))
                        .build();
        transactionMapper.insert(oldTx);

        List<FinTransaction> recentResults =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, testUserId)
                                .ge(FinTransaction::getOccurredAt, now.minusDays(7)));

        assertThat(recentResults).hasSize(1);
    }

    @Test
    @DisplayName("Select with account filter should return only transactions for that account")
    void selectList_WithAccountFilter_ShouldReturnOnlyTransactionsForAccount() {
        LocalDateTime now = LocalDateTime.now();
        FinTransaction account1Tx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(1L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("100.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(now)
                        .build();
        transactionMapper.insert(account1Tx);

        FinTransaction account2Tx =
                FinTransaction.builder()
                        .userId(testUserId)
                        .accountId(2L)
                        .categoryId(1L)
                        .type("expense")
                        .amount(new BigDecimal("50.00"))
                        .currency("CNY")
                        .status(1)
                        .occurredAt(now)
                        .build();
        transactionMapper.insert(account2Tx);

        List<FinTransaction> account1Results =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, testUserId)
                                .eq(FinTransaction::getAccountId, 1L));

        assertThat(account1Results).hasSize(1);
        assertThat(account1Results.get(0).getAccountId()).isEqualTo(1L);
    }
}
