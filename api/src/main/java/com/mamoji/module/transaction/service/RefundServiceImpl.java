package com.mamoji.module.transaction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.transaction.dto.*;
import com.mamoji.module.transaction.entity.FinRefund;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinRefundMapper;
import com.mamoji.module.transaction.strategy.TransactionStrategyFactory;
import com.mamoji.module.transaction.strategy.TransactionTypeStrategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


/** Refund Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl extends ServiceImpl<FinRefundMapper, FinRefund>
        implements RefundService {

    private final FinRefundMapper refundMapper;
    private final AccountService accountService;
    private final TransactionService transactionService;
    private final TransactionStrategyFactory strategyFactory;

    @Override
    public TransactionRefundResponseVO getTransactionRefunds(Long userId, Long transactionId) {
        // Verify transaction exists and belongs to user
        TransactionVO transaction = transactionService.getTransaction(userId, transactionId);
        if (transaction == null) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // Get refund list - use mapper directly
        List<FinRefund> refunds =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>()
                                .eq(FinRefund::getTransactionId, transactionId)
                                .eq(FinRefund::getStatus, 1)
                                .orderByDesc(FinRefund::getOccurredAt));

        List<RefundVO> refundVOs = refunds.stream().map(this::toVO).toList();

        // Calculate summary
        BigDecimal totalRefunded =
                refunds.stream().map(FinRefund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        RefundSummaryVO summary =
                RefundSummaryVO.builder()
                        .totalRefunded(totalRefunded)
                        .remainingRefundable(transaction.getAmount().subtract(totalRefunded))
                        .hasRefund(!refunds.isEmpty())
                        .refundCount(refunds.size())
                        .build();

        // Build response
        TransactionRefundResponseVO.TransactionBasicVO basicVO =
                TransactionRefundResponseVO.TransactionBasicVO.builder()
                        .transactionId(transactionId)
                        .amount(transaction.getAmount())
                        .type(transaction.getType())
                        .build();

        return TransactionRefundResponseVO.builder()
                .transaction(basicVO)
                .refunds(refundVOs)
                .summary(summary)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RefundVO createRefund(Long userId, RefundDTO request) {
        // Verify original transaction
        TransactionVO originalTransaction =
                transactionService.getTransaction(userId, request.getTransactionId());
        if (originalTransaction == null) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // Only expense transactions can be refunded
        if (!"expense".equals(originalTransaction.getType())) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "只有支出交易可退款");
        }

        // Calculate total refunded amount
        BigDecimal totalRefunded = calculateTotalRefunded(request.getTransactionId());

        // Validate refund amount
        BigDecimal remainingRefundable = originalTransaction.getAmount().subtract(totalRefunded);
        if (request.getAmount().compareTo(remainingRefundable) > 0) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "退款金额超出可退范围");
        }

        // Verify account exists
        List<AccountVO> accounts = accountService.listAccounts(userId);
        boolean accountExists =
                accounts.stream()
                        .anyMatch(a -> a.getAccountId().equals(originalTransaction.getAccountId()));
        if (!accountExists) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }

        // Create refund record
        String note =
                request.getNote() != null && !request.getNote().isEmpty()
                        ? "退款：" + request.getNote()
                        : "退款";

        FinRefund refund =
                FinRefund.builder()
                        .userId(userId)
                        .transactionId(request.getTransactionId())
                        .accountId(originalTransaction.getAccountId())
                        .categoryId(originalTransaction.getCategoryId())
                        .amount(request.getAmount())
                        .currency("CNY")
                        .occurredAt(
                                request.getOccurredAt() != null
                                        ? request.getOccurredAt()
                                        : LocalDateTime.now())
                        .note(note)
                        .status(1)
                        .build();

        refundMapper.insert(refund);

        // Use strategy pattern for balance update
        // Refund reverses the original transaction's balance effect:
        // - Refund of expense (original was negative): money comes back (positive)
        // - Refund of income (original was positive): money goes back (negative)
        TransactionTypeStrategy strategy =
                strategyFactory.getStrategy(originalTransaction.getType());
        BigDecimal balanceChange = strategy.calculateBalanceChange(request.getAmount()).negate();
        accountService.updateBalance(originalTransaction.getAccountId(), balanceChange);

        log.info(
                "Refund created: userId={}, transactionId={}, amount={}, originalType={}",
                userId,
                request.getTransactionId(),
                request.getAmount(),
                originalTransaction.getType());

        return toVO(refund);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RefundSummaryVO cancelRefund(Long userId, Long transactionId, Long refundId) {
        // Verify transaction
        TransactionVO originalTransaction =
                transactionService.getTransaction(userId, transactionId);
        if (originalTransaction == null) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // Verify refund exists
        FinRefund refund = refundMapper.selectById(refundId);
        if (refund == null
                || !refund.getTransactionId().equals(transactionId)
                || !refund.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "退款记录不存在");
        }

        if (refund.getStatus() != 1) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "退款已取消");
        }

        // Soft delete refund - set status to 0
        FinRefund updateRefund = new FinRefund();
        updateRefund.setRefundId(refundId);
        updateRefund.setStatus(0);
        refundMapper.updateById(updateRefund);

        // Use strategy pattern for balance reversal
        // This reverses the balance change made when the refund was created
        // Refund added money back (+), cancel should remove money (-)
        TransactionTypeStrategy strategy =
                strategyFactory.getStrategy(originalTransaction.getType());
        BigDecimal balanceChange = strategy.calculateBalanceChange(refund.getAmount());
        accountService.updateBalance(refund.getAccountId(), balanceChange);

        log.info(
                "Refund cancelled: userId={}, refundId={}, amount={}, originalType={}",
                userId,
                refundId,
                refund.getAmount(),
                originalTransaction.getType());

        // Return updated summary
        return getRefundSummary(transactionId);
    }

    @Override
    public RefundSummaryVO getRefundSummary(Long transactionId) {
        // Get transaction
        FinTransaction transaction = transactionService.findById(transactionId);
        if (transaction == null) {
            return RefundSummaryVO.builder()
                    .totalRefunded(BigDecimal.ZERO)
                    .remainingRefundable(BigDecimal.ZERO)
                    .hasRefund(false)
                    .refundCount(0)
                    .build();
        }

        // Calculate total refunded
        BigDecimal totalRefunded = calculateTotalRefunded(transactionId);

        return RefundSummaryVO.builder()
                .totalRefunded(totalRefunded)
                .remainingRefundable(transaction.getAmount().subtract(totalRefunded))
                .hasRefund(totalRefunded.compareTo(BigDecimal.ZERO) > 0)
                .refundCount(
                        refundMapper
                                .selectCount(
                                        new LambdaQueryWrapper<FinRefund>()
                                                .eq(FinRefund::getTransactionId, transactionId)
                                                .eq(FinRefund::getStatus, 1))
                                .intValue())
                .build();
    }

    @Override
    public BigDecimal calculateTotalRefunded(Long transactionId) {
        List<FinRefund> refunds =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>()
                                .eq(FinRefund::getTransactionId, transactionId)
                                .eq(FinRefund::getStatus, 1));

        return refunds.stream().map(FinRefund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Convert entity to VO */
    private RefundVO toVO(FinRefund refund) {
        RefundVO vo = new RefundVO();
        BeanUtils.copyProperties(refund, vo);
        return vo;
    }
}
