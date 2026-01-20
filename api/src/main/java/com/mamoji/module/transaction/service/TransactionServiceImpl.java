package com.mamoji.module.transaction.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.PageResult;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Transaction Service Implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl extends ServiceImpl<FinTransactionMapper, FinTransaction>
        implements TransactionService {

    private final FinCategoryMapper categoryMapper;
    private final AccountService accountService;
    private final BudgetService budgetService;

    @Override
    public PageResult<TransactionVO> listTransactions(Long userId, TransactionQueryDTO request) {
        Page<FinTransaction> page = new Page<>(
                request.getCurrent() != null ? request.getCurrent() : 1L,
                request.getSize() != null ? request.getSize() : 20L
        );

        LambdaQueryWrapper<FinTransaction> wrapper = new LambdaQueryWrapper<FinTransaction>()
                .eq(FinTransaction::getUserId, userId)
                .eq(FinTransaction::getStatus, 1);

        // Apply filters
        if (request.getType() != null && !request.getType().isEmpty()) {
            wrapper.eq(FinTransaction::getType, request.getType());
        }
        if (request.getAccountId() != null) {
            wrapper.eq(FinTransaction::getAccountId, request.getAccountId());
        }
        if (request.getCategoryId() != null) {
            wrapper.eq(FinTransaction::getCategoryId, request.getCategoryId());
        }
        if (request.getStartDate() != null && request.getEndDate() != null) {
            wrapper.ge(FinTransaction::getOccurredAt, request.getStartDate().atStartOfDay())
                    .le(FinTransaction::getOccurredAt, request.getEndDate().atTime(23, 59, 59));
        }

        wrapper.orderByDesc(FinTransaction::getOccurredAt);

        IPage<FinTransaction> result = this.page(page, wrapper);

        List<TransactionVO> voList = result.getRecords().stream()
                .map(this::toVO)
                .toList();

        return PageResult.of(result.getCurrent(), result.getSize(), result.getTotal(), voList);
    }

    @Override
    public TransactionVO getTransaction(Long userId, Long transactionId) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId) || transaction.getStatus() != 1) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }
        return toVO(transaction);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createTransaction(Long userId, TransactionDTO request) {
        // Verify account exists and belongs to user
        FinAccount account = accountService.listAccounts(userId).stream()
                .filter(a -> a.getAccountId().equals(request.getAccountId()))
                .findFirst()
                .map(a -> {
                    FinAccount entity = new FinAccount();
                    BeanUtils.copyProperties(a, entity);
                    return entity;
                })
                .orElseThrow(() -> new BusinessException(ResultCode.ACCOUNT_NOT_FOUND));

        // Verify category exists
        FinCategory category = categoryMapper.selectById(request.getCategoryId());
        if (category == null || category.getStatus() != 1) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }

        // Create transaction
        FinTransaction transaction = FinTransaction.builder()
                .userId(userId)
                .accountId(request.getAccountId())
                .categoryId(request.getCategoryId())
                .budgetId(request.getBudgetId())
                .type(request.getType())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
                .occurredAt(request.getOccurredAt() != null ? request.getOccurredAt() : LocalDateTime.now())
                .note(request.getNote())
                .status(1)
                .build();

        this.save(transaction);

        // Update account balance
        BigDecimal balanceChange = "income".equals(request.getType())
                ? request.getAmount()
                : request.getAmount().negate();
        accountService.updateBalance(request.getAccountId(), balanceChange);

        // Recalculate budget spent if expense transaction linked to budget
        if (request.getBudgetId() != null && "expense".equals(request.getType())) {
            budgetService.recalculateSpent(request.getBudgetId());
        }

        log.info("Transaction created: userId={}, type={}, amount={}", userId, request.getType(), request.getAmount());

        return transaction.getTransactionId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTransaction(Long userId, Long transactionId, TransactionDTO request) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // If account changed, need to adjust balances
        if (!transaction.getAccountId().equals(request.getAccountId())) {
            // Revert old account balance
            BigDecimal oldChange = "income".equals(transaction.getType())
                    ? transaction.getAmount()
                    : transaction.getAmount().negate();
            accountService.updateBalance(transaction.getAccountId(), oldChange.negate());

            // Update new account balance
            BigDecimal newChange = "income".equals(request.getType())
                    ? request.getAmount()
                    : request.getAmount().negate();
            accountService.updateBalance(request.getAccountId(), newChange);
        } else if (!transaction.getAmount().equals(request.getAmount())
                || !transaction.getType().equals(request.getType())) {
            // Same account but amount/type changed
            BigDecimal oldChange = "income".equals(transaction.getType())
                    ? transaction.getAmount()
                    : transaction.getAmount().negate();
            BigDecimal newChange = "income".equals(request.getType())
                    ? request.getAmount()
                    : request.getAmount().negate();

            accountService.updateBalance(request.getAccountId(), newChange.subtract(oldChange));
        }

        this.update(
                new LambdaUpdateWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, transactionId)
                        .set(FinTransaction::getAccountId, request.getAccountId())
                        .set(FinTransaction::getCategoryId, request.getCategoryId())
                        .set(FinTransaction::getBudgetId, request.getBudgetId())
                        .set(FinTransaction::getType, request.getType())
                        .set(FinTransaction::getAmount, request.getAmount())
                        .set(request.getOccurredAt() != null, FinTransaction::getOccurredAt, request.getOccurredAt())
                        .set(FinTransaction::getNote, request.getNote())
        );

        log.info("Transaction updated: transactionId={}", transactionId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTransaction(Long userId, Long transactionId) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // Revert account balance
        BigDecimal balanceChange = "income".equals(transaction.getType())
                ? transaction.getAmount().negate()
                : transaction.getAmount();
        accountService.updateBalance(transaction.getAccountId(), balanceChange);

        // Recalculate budget spent if expense transaction was linked to budget
        if (transaction.getBudgetId() != null && "expense".equals(transaction.getType())) {
            budgetService.recalculateSpent(transaction.getBudgetId());
        }

        // Soft delete
        this.update(
                new LambdaUpdateWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, transactionId)
                        .set(FinTransaction::getStatus, 0)
        );

        log.info("Transaction deleted: transactionId={}", transactionId);
    }

    @Override
    public List<TransactionVO> getRecentTransactions(Long userId, Long accountId, Integer limit) {
        List<FinTransaction> transactions = this.list(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getAccountId, accountId)
                        .eq(FinTransaction::getStatus, 1)
                        .orderByDesc(FinTransaction::getOccurredAt)
                        .last("LIMIT " + (limit != null ? limit : 10))
        );

        return transactions.stream().map(this::toVO).toList();
    }

    /**
     * Convert entity to VO
     */
    private TransactionVO toVO(FinTransaction transaction) {
        TransactionVO vo = new TransactionVO();
        BeanUtils.copyProperties(transaction, vo);

        // Get account name
        accountService.listAccounts(transaction.getUserId()).stream()
                .filter(a -> a.getAccountId().equals(transaction.getAccountId()))
                .findFirst()
                .ifPresent(a -> vo.setAccountName(a.getName()));

        // Get category name
        FinCategory category = categoryMapper.selectById(transaction.getCategoryId());
        if (category != null) {
            vo.setCategoryName(category.getName());
        }

        return vo;
    }
}
