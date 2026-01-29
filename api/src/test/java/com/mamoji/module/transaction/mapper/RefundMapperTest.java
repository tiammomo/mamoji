package com.mamoji.module.transaction.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.transaction.entity.FinRefund;

/** Refund Mapper Integration Tests */
class RefundMapperTest extends MySqlIntegrationTestBase {

    @Autowired private FinRefundMapper refundMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        refundMapper.delete(new LambdaQueryWrapper<FinRefund>().isNotNull(FinRefund::getRefundId));
    }

    @AfterEach
    void tearDown() {
        refundMapper.delete(new LambdaQueryWrapper<FinRefund>().isNotNull(FinRefund::getRefundId));
    }

    @Test
    @DisplayName("Insert refund should persist and return generated ID")
    void insert_ShouldPersistAndReturnGeneratedId() {
        FinRefund refund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("50.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();

        int result = refundMapper.insert(refund);

        assertThat(result).isGreaterThan(0);
        assertThat(refund.getRefundId()).isNotNull();
    }

    @Test
    @DisplayName("Select by ID should return refund when exists")
    void selectById_ShouldReturnRefundWhenExists() {
        FinRefund refund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("100.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(refund);

        FinRefund found = refundMapper.selectById(refund.getRefundId());

        assertThat(found).isNotNull();
        assertThat(found.getAmount()).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName(
            "Select with transaction ID filter should return only refunds for that transaction")
    void selectList_WithTransactionIdFilter_ShouldReturnOnlyRefundsForTransaction() {
        FinRefund refund1 =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("50.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(refund1);

        FinRefund refund2 =
                FinRefund.builder()
                        .transactionId(2L)
                        .userId(testUserId)
                        .amount(new BigDecimal("30.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(refund2);

        List<FinRefund> transaction1Refunds =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>().eq(FinRefund::getTransactionId, 1L));

        assertThat(transaction1Refunds).hasSize(1);
        assertThat(transaction1Refunds.get(0).getTransactionId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("Select with status filter should return only active refunds")
    void selectList_WithStatusFilter_ShouldReturnOnlyActiveRefunds() {
        FinRefund activeRefund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("50.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(activeRefund);

        FinRefund cancelledRefund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("25.00"))
                        .status(0)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(cancelledRefund);

        List<FinRefund> activeResults =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>()
                                .eq(FinRefund::getTransactionId, 1L)
                                .eq(FinRefund::getStatus, 1));

        assertThat(activeResults).hasSize(1);
    }

    @Test
    @DisplayName("Update by ID should modify existing refund")
    void updateById_ShouldModifyExistingRefund() {
        FinRefund refund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("50.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(refund);

        refund.setAmount(new BigDecimal("75.00"));
        refund.setNote("Updated note");
        int result = refundMapper.updateById(refund);

        assertThat(result).isGreaterThan(0);

        FinRefund updated = refundMapper.selectById(refund.getRefundId());
        assertThat(updated.getAmount()).isEqualByComparingTo("75.00");
        assertThat(updated.getNote()).isEqualTo("Updated note");
    }

    @Test
    @DisplayName("Delete by ID should remove refund")
    void deleteById_ShouldRemoveRefund() {
        FinRefund refund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("25.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(refund);

        int result = refundMapper.deleteById(refund.getRefundId());

        assertThat(result).isGreaterThan(0);

        FinRefund deleted = refundMapper.selectById(refund.getRefundId());
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("Select count should return correct count")
    void selectCount_ShouldReturnCorrectCount() {
        for (int i = 1; i <= 3; i++) {
            FinRefund refund =
                    FinRefund.builder()
                            .transactionId(1L)
                            .userId(testUserId)
                            .amount(new BigDecimal("10.00"))
                            .status(1)
                            .occurredAt(LocalDateTime.now())
                            .build();
            refundMapper.insert(refund);
        }

        Long count =
                refundMapper.selectCount(
                        new LambdaQueryWrapper<FinRefund>()
                                .eq(FinRefund::getTransactionId, 1L)
                                .eq(FinRefund::getStatus, 1));

        assertThat(count).isEqualTo(3L);
    }

    @Test
    @DisplayName("Select with user ID filter should return only refunds for that user")
    void selectList_WithUserIdFilter_ShouldReturnOnlyRefundsForUser() {
        FinRefund userRefund =
                FinRefund.builder()
                        .transactionId(1L)
                        .userId(testUserId)
                        .amount(new BigDecimal("50.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(userRefund);

        FinRefund otherRefund =
                FinRefund.builder()
                        .transactionId(2L)
                        .userId(testUserId + 1)
                        .amount(new BigDecimal("30.00"))
                        .status(1)
                        .occurredAt(LocalDateTime.now())
                        .build();
        refundMapper.insert(otherRefund);

        List<FinRefund> userRefunds =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>().eq(FinRefund::getUserId, testUserId));

        assertThat(userRefunds).hasSize(1);
        assertThat(userRefunds.get(0).getUserId()).isEqualTo(testUserId);
    }
}
