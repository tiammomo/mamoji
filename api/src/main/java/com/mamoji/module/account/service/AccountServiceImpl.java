package com.mamoji.module.account.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Account Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl extends ServiceImpl<FinAccountMapper, FinAccount>
        implements AccountService {

    @Override
    public List<AccountVO> listAccounts(Long userId) {
        List<FinAccount> accounts =
                this.list(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1)
                                .orderByDesc(FinAccount::getCreatedAt));

        return accounts.stream().map(this::toVO).toList();
    }

    @Override
    public AccountVO getAccount(Long userId, Long accountId) {
        FinAccount account = this.getById(accountId);
        if (account == null || !account.getUserId().equals(userId) || account.getStatus() != 1) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }
        return toVO(account);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createAccount(Long userId, AccountDTO request) {
        FinAccount account =
                FinAccount.builder()
                        .userId(userId)
                        .name(request.getName())
                        .accountType(request.getAccountType())
                        .accountSubType(request.getAccountSubType())
                        .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
                        .balance(
                                request.getBalance() != null
                                        ? request.getBalance()
                                        : BigDecimal.ZERO)
                        .includeInTotal(
                                determineIncludeInTotal(
                                        request.getAccountType(), request.getIncludeInTotal()))
                        .status(1)
                        .build();

        this.save(account);

        log.info("Account created: userId={}, name={}", userId, request.getName());

        return account.getAccountId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateAccount(Long userId, Long accountId, AccountDTO request) {
        FinAccount account = this.getById(accountId);
        if (account == null || !account.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }

        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getName, request.getName())
                        .set(FinAccount::getAccountSubType, request.getAccountSubType())
                        .set(
                                request.getCurrency() != null,
                                FinAccount::getCurrency,
                                request.getCurrency())
                        .set(
                                request.getBalance() != null,
                                FinAccount::getBalance,
                                request.getBalance())
                        .set(
                                request.getIncludeInTotal() != null,
                                FinAccount::getIncludeInTotal,
                                request.getIncludeInTotal()));

        log.info("Account updated: accountId={}", accountId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAccount(Long userId, Long accountId) {
        FinAccount account = this.getById(accountId);
        if (account == null || !account.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }

        // Soft delete
        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getStatus, 0));

        log.info("Account deleted: accountId={}", accountId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateBalance(Long accountId, BigDecimal amount) {
        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .setSql("balance = balance + " + amount));
    }

    @Override
    public Object getAccountSummary(Long userId) {
        List<FinAccount> accounts =
                this.list(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1));

        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;
        BigDecimal fundBalance = BigDecimal.ZERO;
        BigDecimal creditLimit = BigDecimal.ZERO;
        BigDecimal debtBalance = BigDecimal.ZERO;

        for (FinAccount account : accounts) {
            BigDecimal balance =
                    account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO;
            Integer includeInTotal =
                    account.getIncludeInTotal() != null ? account.getIncludeInTotal() : 1;

            if (includeInTotal == 1) {
                String type = account.getAccountType();
                if ("credit".equals(type) || "debt".equals(type)) {
                    totalLiabilities = totalLiabilities.add(balance.abs());
                    if ("credit".equals(type)) {
                        creditLimit = creditLimit.add(balance.abs());
                    } else if ("debt".equals(type)) {
                        debtBalance = debtBalance.add(balance.abs());
                    }
                } else {
                    totalAssets = totalAssets.add(balance.abs());
                    if ("fund".equals(type) || "fund_accumulation".equals(type)) {
                        fundBalance = fundBalance.add(balance.abs());
                    }
                }
            }
        }

        return java.util.Map.of(
                "totalAssets", totalAssets,
                "totalLiabilities", totalLiabilities,
                "netAssets", totalAssets.subtract(totalLiabilities),
                "fundBalance", fundBalance,
                "creditLimit", creditLimit,
                "debtBalance", debtBalance,
                "accountCount", accounts.size());
    }

    /** Determine if account should be included in total assets */
    private Integer determineIncludeInTotal(String accountType, Integer includeInTotal) {
        if (includeInTotal != null) {
            return includeInTotal;
        }
        // Default: credit and debt are not included
        if ("credit".equals(accountType) || "debt".equals(accountType)) {
            return 0;
        }
        return 1;
    }

    /** Convert entity to VO */
    private AccountVO toVO(FinAccount account) {
        AccountVO vo = new AccountVO();
        BeanUtils.copyProperties(account, vo);
        return vo;
    }
}
