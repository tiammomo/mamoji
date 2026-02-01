package com.mamoji.module.transaction.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.transaction.dto.RefundDTO;
import com.mamoji.module.transaction.dto.RefundSummaryVO;
import com.mamoji.module.transaction.dto.RefundVO;
import com.mamoji.module.transaction.dto.TransactionRefundResponseVO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinRefund;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinRefundMapper;
import com.mamoji.module.transaction.strategy.ExpenseTransactionStrategy;
import com.mamoji.module.transaction.strategy.TransactionStrategyFactory;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RefundService Unit Tests")
class RefundServiceTest {

    @Mock private FinRefundMapper refundMapper;

    @Mock private AccountService accountService;

    @Mock private TransactionService transactionService;

    @Mock private TransactionStrategyFactory strategyFactory;

    private RefundServiceImpl refundService;

    private TransactionVO testTransaction;
    private RefundDTO testRefundDTO;

    @BeforeEach
    void setUp() {
        // Create service with mocked dependencies
        refundService =
                new RefundServiceImpl(
                        refundMapper, accountService, transactionService, strategyFactory);

        // Mock strategy factory for expense transactions
        ExpenseTransactionStrategy expenseStrategy = new ExpenseTransactionStrategy();
        when(strategyFactory.getStrategy("expense")).thenReturn(expenseStrategy);

        testTransaction =
                TransactionVO.builder()
                        .transactionId(1L)
                        .type("expense")
                        .amount(new BigDecimal("100.00"))
                        .accountId(1L)
                        .categoryId(1L)
                        .build();

        testRefundDTO =
                RefundDTO.builder()
                        .transactionId(1L)
                        .amount(new BigDecimal("25.00"))
                        .occurredAt(LocalDateTime.now())
                        .note("测试退款")
                        .build();
    }

    @Test
    @DisplayName("getTransactionRefunds - Should return refund list and summary")
    void getTransactionRefunds_Success() {
        // Given
        Long userId = 999L;
        Long transactionId = 1L;

        when(transactionService.getTransaction(userId, transactionId)).thenReturn(testTransaction);

        FinRefund refund =
                FinRefund.builder()
                        .refundId(1L)
                        .transactionId(transactionId)
                        .amount(new BigDecimal("25.00"))
                        .note("部分退款")
                        .occurredAt(LocalDateTime.now())
                        .status(1)
                        .createdAt(LocalDateTime.now())
                        .build();

        when(refundMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(refund));

        // When
        TransactionRefundResponseVO result =
                refundService.getTransactionRefunds(userId, transactionId);

        // Then
        assertNotNull(result);
        assertNotNull(result.getTransaction());
        assertEquals(transactionId, result.getTransaction().getTransactionId());
        assertEquals(1, result.getRefunds().size());
        assertEquals(new BigDecimal("25.00"), result.getSummary().getTotalRefunded());
        assertEquals(new BigDecimal("75.00"), result.getSummary().getRemainingRefundable());
        assertTrue(result.getSummary().getHasRefund());
        assertEquals(1, result.getSummary().getRefundCount());
    }

    @Test
    @DisplayName("getTransactionRefunds - Should return empty for non-expense transaction")
    void getTransactionRefunds_NonExpenseTransaction_ReturnsEmpty() {
        // Given
        Long userId = 999L;
        Long transactionId = 1L;

        TransactionVO incomeTransaction =
                TransactionVO.builder()
                        .transactionId(transactionId)
                        .type("income")
                        .amount(new BigDecimal("100.00"))
                        .build();

        when(transactionService.getTransaction(userId, transactionId))
                .thenReturn(incomeTransaction);
        when(refundMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

        // When
        TransactionRefundResponseVO result =
                refundService.getTransactionRefunds(userId, transactionId);

        // Then - query method works for any transaction type, just returns empty
        assertNotNull(result);
        assertEquals(0, result.getRefunds().size());
        assertEquals(BigDecimal.ZERO, result.getSummary().getTotalRefunded());
    }

    @Test
    @DisplayName("createRefund - Should create refund successfully")
    void createRefund_Success() {
        // Given
        Long userId = 999L;

        when(transactionService.getTransaction(userId, testRefundDTO.getTransactionId()))
                .thenReturn(testTransaction);
        when(refundMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of()); // No existing refunds
        when(accountService.listAccounts(userId))
                .thenReturn(List.of(AccountVO.builder().accountId(1L).name("测试账户").build()));

        FinRefund savedRefund =
                FinRefund.builder()
                        .refundId(1L)
                        .userId(userId)
                        .transactionId(testRefundDTO.getTransactionId())
                        .amount(testRefundDTO.getAmount())
                        .note("退款：测试退款")
                        .status(1)
                        .build();

        when(refundMapper.insert(any(FinRefund.class)))
                .thenAnswer(
                        invocation -> {
                            FinRefund refund = invocation.getArgument(0);
                            refund.setRefundId(1L);
                            return 1;
                        });

        // When
        RefundVO result = refundService.createRefund(userId, testRefundDTO);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.getRefundId());
        assertEquals(testRefundDTO.getAmount(), result.getAmount());
        assertTrue(result.getNote().contains("退款："));

        verify(accountService).updateBalance(eq(1L), eq(testRefundDTO.getAmount()));
    }

    @Test
    @DisplayName("createRefund - Should throw exception when refund amount exceeds limit")
    void createRefund_ExceedsLimit_ThrowsException() {
        // Given
        Long userId = 999L;

        RefundDTO largeRefundDTO =
                RefundDTO.builder()
                        .transactionId(1L)
                        .amount(new BigDecimal("150.00")) // More than transaction amount
                        .occurredAt(LocalDateTime.now())
                        .build();

        when(transactionService.getTransaction(userId, largeRefundDTO.getTransactionId()))
                .thenReturn(testTransaction);
        when(refundMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of()); // No existing refunds

        // When & Then
        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> refundService.createRefund(userId, largeRefundDTO));

        assertEquals(ResultCode.VALIDATION_ERROR.getCode(), exception.getCode());
        assertTrue(exception.getMessage().contains("超出可退范围"));
    }

    @Test
    @DisplayName("createRefund - Should throw exception for non-expense transaction")
    void createRefund_NonExpenseTransaction_ThrowsException() {
        // Given
        Long userId = 999L;

        TransactionVO incomeTransaction =
                TransactionVO.builder()
                        .transactionId(1L)
                        .type("income")
                        .amount(new BigDecimal("100.00"))
                        .build();

        when(transactionService.getTransaction(userId, testRefundDTO.getTransactionId()))
                .thenReturn(incomeTransaction);

        // When & Then
        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> refundService.createRefund(userId, testRefundDTO));

        assertEquals(ResultCode.VALIDATION_ERROR.getCode(), exception.getCode());
    }

    @Test
    @DisplayName("cancelRefund - Should cancel refund successfully")
    void cancelRefund_Success() {
        // Given
        Long userId = 999L;
        Long transactionId = 1L;
        Long refundId = 1L;

        when(transactionService.getTransaction(userId, transactionId)).thenReturn(testTransaction);

        // getRefundSummary calls findById
        FinTransaction transaction =
                FinTransaction.builder()
                        .transactionId(transactionId)
                        .amount(new BigDecimal("100.00"))
                        .build();
        when(transactionService.findById(transactionId)).thenReturn(transaction);

        FinRefund existingRefund =
                FinRefund.builder()
                        .refundId(refundId)
                        .transactionId(transactionId)
                        .userId(userId)
                        .accountId(1L)
                        .amount(new BigDecimal("25.00"))
                        .status(1)
                        .build();

        when(refundMapper.selectById(refundId)).thenReturn(existingRefund);
        when(refundMapper.updateById(any(FinRefund.class))).thenReturn(1);
        when(refundMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of()); // After cancel, no refunds

        // When
        RefundSummaryVO result = refundService.cancelRefund(userId, transactionId, refundId);

        // Then
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalRefunded());
        assertEquals(new BigDecimal("100.00"), result.getRemainingRefundable());

        verify(accountService).updateBalance(eq(1L), eq(new BigDecimal("-25.00")));
    }

    @Test
    @DisplayName("cancelRefund - Should throw exception for non-existing refund")
    void cancelRefund_NotFound_ThrowsException() {
        // Given
        Long userId = 999L;
        Long transactionId = 1L;
        Long refundId = 999L;

        when(transactionService.getTransaction(userId, transactionId)).thenReturn(testTransaction);
        when(refundMapper.selectById(refundId)).thenReturn(null);

        // When & Then
        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> refundService.cancelRefund(userId, transactionId, refundId));

        assertEquals(ResultCode.VALIDATION_ERROR.getCode(), exception.getCode());
        assertTrue(exception.getMessage().contains("不存在"));
    }

    @Test
    @DisplayName("cancelRefund - Should throw exception for already cancelled refund")
    void cancelRefund_AlreadyCancelled_ThrowsException() {
        // Given
        Long userId = 999L;
        Long transactionId = 1L;
        Long refundId = 1L;

        when(transactionService.getTransaction(userId, transactionId)).thenReturn(testTransaction);

        FinRefund cancelledRefund =
                FinRefund.builder()
                        .refundId(refundId)
                        .transactionId(transactionId)
                        .userId(userId)
                        .status(0) // Already cancelled
                        .build();

        when(refundMapper.selectById(refundId)).thenReturn(cancelledRefund);

        // When & Then
        BusinessException exception =
                assertThrows(
                        BusinessException.class,
                        () -> refundService.cancelRefund(userId, transactionId, refundId));

        assertEquals(ResultCode.VALIDATION_ERROR.getCode(), exception.getCode());
        assertTrue(exception.getMessage().contains("已取消"));
    }

    @Test
    @DisplayName("calculateTotalRefunded - Should calculate correctly")
    void calculateTotalRefunded_Success() {
        // Given
        Long transactionId = 1L;

        FinRefund refund1 = FinRefund.builder().amount(new BigDecimal("25.00")).status(1).build();

        FinRefund refund2 = FinRefund.builder().amount(new BigDecimal("30.00")).status(1).build();

        when(refundMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(refund1, refund2));

        // When
        BigDecimal result = refundService.calculateTotalRefunded(transactionId);

        // Then
        assertEquals(new BigDecimal("55.00"), result);
    }

    @Test
    @DisplayName("getRefundSummary - Should return correct summary for transaction with refunds")
    void getRefundSummary_WithRefunds_Success() {
        // Given
        Long transactionId = 1L;

        FinTransaction transaction =
                FinTransaction.builder()
                        .transactionId(transactionId)
                        .amount(new BigDecimal("100.00"))
                        .build();

        FinRefund refund = FinRefund.builder().amount(new BigDecimal("40.00")).status(1).build();

        when(transactionService.findById(transactionId)).thenReturn(transaction);
        when(refundMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(refund));
        when(refundMapper.selectCount(any())).thenReturn(1L);

        // When
        RefundSummaryVO result = refundService.getRefundSummary(transactionId);

        // Then
        assertNotNull(result);
        assertEquals(new BigDecimal("40.00"), result.getTotalRefunded());
        assertEquals(new BigDecimal("60.00"), result.getRemainingRefundable());
        assertTrue(result.getHasRefund());
        assertEquals(1, result.getRefundCount());
    }

    @Test
    @DisplayName("getRefundSummary - Should return zero summary for non-existing transaction")
    void getRefundSummary_TransactionNotFound_ReturnsZero() {
        // Given
        Long transactionId = 999L;

        when(transactionService.findById(transactionId)).thenReturn(null);

        // When
        RefundSummaryVO result = refundService.getRefundSummary(transactionId);

        // Then
        assertNotNull(result);
        assertEquals(BigDecimal.ZERO, result.getTotalRefunded());
        assertEquals(BigDecimal.ZERO, result.getRemainingRefundable());
        assertFalse(result.getHasRefund());
        assertEquals(0, result.getRefundCount());
    }
}
