package com.mamoji.module.transaction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.context.LedgerContextHolder;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.PageResult;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.utils.DateRangeUtils;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import com.mamoji.module.transaction.strategy.TransactionStrategyFactory;
import com.mamoji.module.transaction.strategy.TransactionTypeStrategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


/** Transaction Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl extends ServiceImpl<FinTransactionMapper, FinTransaction>
        implements TransactionService {

    private final FinCategoryMapper categoryMapper;
    private final AccountService accountService;
    private final BudgetService budgetService;
    private final TransactionStrategyFactory strategyFactory;
    private final DtoConverter dtoConverter;

    @Override
    public PageResult<TransactionVO> listTransactions(Long userId, TransactionQueryDTO request) {
        Page<FinTransaction> page =
                new Page<>(
                        request.getCurrent() != null ? request.getCurrent() : 1L,
                        request.getSize() != null ? request.getSize() : 20L);

        LambdaQueryWrapper<FinTransaction> wrapper =
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1);

        // Add ledger_id filter if available in context
        Long ledgerId = LedgerContextHolder.getLedgerId();
        if (ledgerId != null) {
            wrapper.eq(FinTransaction::getLedgerId, ledgerId);
        }

        if (request.getType() != null && !request.getType().isEmpty()) {
            wrapper.eq(FinTransaction::getType, request.getType());
        }
        if (request.getAccountId() != null)
            wrapper.eq(FinTransaction::getAccountId, request.getAccountId());
        if (request.getCategoryId() != null)
            wrapper.eq(FinTransaction::getCategoryId, request.getCategoryId());
        if (request.getStartDate() != null && request.getEndDate() != null) {
            wrapper.ge(
                            FinTransaction::getOccurredAt,
                            DateRangeUtils.startOfDay(request.getStartDate()))
                    .le(
                            FinTransaction::getOccurredAt,
                            DateRangeUtils.endOfDay(request.getEndDate()));
        }
        wrapper.orderByDesc(FinTransaction::getOccurredAt);

        IPage<FinTransaction> result = this.page(page, wrapper);
        return PageResult.of(
                result.getCurrent(),
                result.getSize(),
                result.getTotal(),
                dtoConverter.convertTransactionList(result.getRecords()));
    }

    @Override
    public TransactionVO getTransaction(Long userId, Long transactionId) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null
                || !transaction.getUserId().equals(userId)
                || transaction.getStatus() != 1) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }
        return dtoConverter.convertTransaction(transaction);
    }

    @Override
    public FinTransaction findById(Long transactionId) {
        return this.getById(transactionId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createTransaction(Long userId, TransactionDTO request) {
        validateAccount(userId, request.getAccountId());
        validateCategory(request.getCategoryId());

        // Get ledger_id from context or use user's default ledger
        Long ledgerId = LedgerContextHolder.getLedgerId();

        FinTransaction transaction =
                FinTransaction.builder()
                        .userId(userId)
                        .ledgerId(ledgerId)
                        .accountId(request.getAccountId())
                        .categoryId(request.getCategoryId())
                        .budgetId(request.getBudgetId())
                        .refundId(request.getRefundId())
                        .type(request.getType())
                        .amount(request.getAmount())
                        .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
                        .occurredAt(
                                request.getOccurredAt() != null
                                        ? request.getOccurredAt()
                                        : LocalDateTime.now())
                        .note(request.getNote())
                        .status(1)
                        .build();

        this.save(transaction);
        applyBalanceChange(request.getAccountId(), request.getType(), request.getAmount(), true);
        handleBudgetUpdate(request, transaction);

        log.info(
                "Transaction created: userId={}, type={}, amount={}",
                userId,
                request.getType(),
                request.getAmount());
        return transaction.getTransactionId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTransaction(Long userId, Long transactionId, TransactionDTO request) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        if (!transaction.getAccountId().equals(request.getAccountId())) {
            applyBalanceChange(
                    transaction.getAccountId(),
                    transaction.getType(),
                    transaction.getAmount(),
                    false);
            applyBalanceChange(
                    request.getAccountId(), request.getType(), request.getAmount(), true);
        } else if (!transaction.getAmount().equals(request.getAmount())
                || !transaction.getType().equals(request.getType())) {
            BigDecimal oldChange =
                    strategyFactory
                            .getStrategy(transaction.getType())
                            .calculateBalanceChange(transaction.getAmount());
            BigDecimal newChange =
                    strategyFactory
                            .getStrategy(request.getType())
                            .calculateBalanceChange(request.getAmount());
            accountService.updateBalance(request.getAccountId(), newChange.subtract(oldChange));
        }

        handleBudgetUpdateOnDelete(transaction);
        handleBudgetUpdate(request, transaction);

        this.update(
                new LambdaUpdateWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, transactionId)
                        .set(FinTransaction::getAccountId, request.getAccountId())
                        .set(FinTransaction::getCategoryId, request.getCategoryId())
                        .set(FinTransaction::getBudgetId, request.getBudgetId())
                        .set(FinTransaction::getType, request.getType())
                        .set(FinTransaction::getAmount, request.getAmount())
                        .set(
                                request.getOccurredAt() != null,
                                FinTransaction::getOccurredAt,
                                request.getOccurredAt())
                        .set(FinTransaction::getNote, request.getNote()));

        log.info("Transaction updated: transactionId={}", transactionId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTransaction(Long userId, Long transactionId) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        applyBalanceChange(
                transaction.getAccountId(), transaction.getType(), transaction.getAmount(), false);
        if (transaction.getBudgetId() != null)
            budgetService.recalculateSpent(transaction.getBudgetId());

        this.update(
                new LambdaUpdateWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, transactionId)
                        .set(FinTransaction::getStatus, 0));

        log.info("Transaction deleted: transactionId={}", transactionId);
    }

    @Override
    public List<TransactionVO> getRecentTransactions(Long userId, Long accountId, Integer limit) {
        LambdaQueryWrapper<FinTransaction> wrapper =
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .orderByDesc(FinTransaction::getOccurredAt)
                        .last("LIMIT " + (limit != null ? limit : 10));
        if (accountId != null) wrapper.eq(FinTransaction::getAccountId, accountId);
        return dtoConverter.convertTransactionList(this.list(wrapper));
    }

    @Override
    public String exportTransactions(Long userId, String startDate, String endDate, String type) {
        LambdaQueryWrapper<FinTransaction> wrapper =
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1);

        if (startDate != null && !startDate.isEmpty()) {
            wrapper.ge(
                    FinTransaction::getOccurredAt,
                    DateRangeUtils.startOfDay(java.time.LocalDate.parse(startDate)));
        }
        if (endDate != null && !endDate.isEmpty()) {
            wrapper.le(
                    FinTransaction::getOccurredAt,
                    DateRangeUtils.endOfDay(java.time.LocalDate.parse(endDate)));
        }
        if (type != null && !type.isEmpty()) wrapper.eq(FinTransaction::getType, type);
        wrapper.orderByDesc(FinTransaction::getOccurredAt);

        List<FinTransaction> transactions = this.list(wrapper);
        StringBuilder csv = new StringBuilder("日期,类型,金额,分类,账户,备注\n");
        transactions.forEach(
                tx ->
                        csv.append(tx.getOccurredAt().toLocalDate())
                                .append(",")
                                .append("income".equals(tx.getType()) ? "收入" : "支出")
                                .append(",")
                                .append(tx.getAmount())
                                .append(",")
                                .append(tx.getCategoryId())
                                .append(",")
                                .append(tx.getAccountId())
                                .append(",")
                                .append(tx.getNote() != null ? tx.getNote() : "")
                                .append("\n"));
        return csv.toString();
    }

    @Override
    public List<TransactionDTO> previewImport(Long userId, List<TransactionDTO> transactions) {
        return transactions.stream()
                .peek(
                        tx -> {
                            if (tx.getCurrency() == null) tx.setCurrency("CNY");
                            if (tx.getOccurredAt() == null) tx.setOccurredAt(LocalDateTime.now());
                        })
                .toList();
    }

    @Override
    public List<Long> importTransactions(Long userId, List<TransactionDTO> transactions) {
        return transactions.stream().map(tx -> createTransaction(userId, tx)).toList();
    }

    // ==================== Private Helper Methods ====================

    private void validateAccount(Long userId, Long accountId) {
        if (accountService.listAccounts(userId).stream()
                .noneMatch(a -> a.getAccountId().equals(accountId))) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }
    }

    private void validateCategory(Long categoryId) {
        FinCategory category = categoryMapper.selectById(categoryId);
        if (category == null || category.getStatus() != 1) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
    }

    private void applyBalanceChange(
            Long accountId, String type, BigDecimal amount, boolean isPositive) {
        TransactionTypeStrategy strategy = strategyFactory.getStrategy(type);
        BigDecimal change = strategy.calculateBalanceChange(amount);
        accountService.updateBalance(accountId, isPositive ? change : change.negate());
    }

    private void handleBudgetUpdate(TransactionDTO request, FinTransaction transaction) {
        TransactionTypeStrategy strategy = strategyFactory.getStrategy(request.getType());
        if (strategy.affectsBudget() && request.getBudgetId() != null) {
            budgetService.recalculateSpent(request.getBudgetId());
        }
        if ("refund".equals(request.getType()) && request.getRefundId() != null) {
            FinTransaction original = this.getById(request.getRefundId());
            if (original != null && original.getBudgetId() != null) {
                budgetService.recalculateSpent(original.getBudgetId());
            }
        }
    }

    private void handleBudgetUpdateOnDelete(FinTransaction transaction) {
        TransactionTypeStrategy strategy = strategyFactory.getStrategy(transaction.getType());
        if (strategy.affectsBudget() && transaction.getBudgetId() != null) {
            budgetService.recalculateSpent(transaction.getBudgetId());
        }
    }
}
