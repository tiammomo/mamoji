package com.mamoji.module.account.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.service.AbstractCrudService;
import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Account Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl extends AbstractCrudService<FinAccountMapper, FinAccount, AccountVO>
        implements AccountService {

    private final DtoConverter dtoConverter;

    @Override
    protected AccountVO toVO(FinAccount entity) {
        return dtoConverter.convertAccount(entity);
    }

    @Override
    protected void validateOwnership(Long userId, FinAccount entity) {
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }
    }

    @Override
    public List<AccountVO> listAccounts(Long userId) {
        List<FinAccount> accounts =
                this.list(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1)
                                .orderByDesc(FinAccount::getCreatedAt));
        return dtoConverter.convertAccountList(accounts);
    }

    @Override
    public AccountVO getAccount(Long userId, Long accountId) {
        return get(userId, accountId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createAccount(Long userId, AccountDTO request) {
        validateUniqueName(userId, request.getName());

        FinAccount account =
                FinAccount.builder()
                        .userId(userId)
                        .name(request.getName())
                        .accountType(request.getAccountType())
                        .accountSubType(request.getAccountSubType())
                        .balance(
                                request.getBalance() != null
                                        ? request.getBalance()
                                        : BigDecimal.ZERO)
                        .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
                        .includeInTotal(
                                request.getIncludeInTotal() != null
                                        ? request.getIncludeInTotal()
                                        : 1)
                        .status(1)
                        .build();

        this.save(account);
        log.info("Account created: userId={}, accountId={}", userId, account.getAccountId());
        return account.getAccountId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateAccount(Long userId, Long accountId, AccountDTO request) {
        getByIdWithValidation(userId, accountId);
        validateUniqueName(userId, request.getName(), accountId);

        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getName, request.getName())
                        .set(FinAccount::getAccountType, request.getAccountType())
                        .set(FinAccount::getAccountSubType, request.getAccountSubType())
                        .set(FinAccount::getCurrency, request.getCurrency())
                        .set(FinAccount::getIncludeInTotal, request.getIncludeInTotal()));

        log.info("Account updated: accountId={}", accountId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAccount(Long userId, Long accountId) {
        getByIdWithValidation(userId, accountId);

        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getStatus, 0));

        log.info("Account deleted: accountId={}", accountId);
    }

    @Override
    public Map<String, Object> getAccountSummary(Long userId) {
        List<FinAccount> accounts =
                this.list(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1));

        BigDecimal totalBalance =
                accounts.stream()
                        .filter(a -> a.getIncludeInTotal() == null || a.getIncludeInTotal() == 1)
                        .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", userId);
        summary.put("totalBalance", totalBalance);
        summary.put("accountCount", accounts.size());
        return summary;
    }

    @Override
    public void updateBalance(Long accountId, BigDecimal changeAmount) {
        FinAccount account = this.getById(accountId);
        if (account == null) {
            log.warn("Account not found: accountId={}", accountId);
            return;
        }

        BigDecimal newBalance =
                (account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO)
                        .add(changeAmount);

        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getBalance, newBalance));

        log.info(
                "Balance updated: accountId={}, change={}, newBalance={}",
                accountId,
                changeAmount,
                newBalance);
    }

    private void validateUniqueName(Long userId, String name) {
        validateUniqueName(userId, name, null);
    }

    private void validateUniqueName(Long userId, String name, Long excludeId) {
        LambdaQueryWrapper<FinAccount> wrapper =
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getName, name)
                        .eq(FinAccount::getStatus, 1);
        if (excludeId != null) {
            wrapper.ne(FinAccount::getAccountId, excludeId);
        }
        if (this.count(wrapper) > 0) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "账户名称已存在");
        }
    }
}
