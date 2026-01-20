package com.mamoji.module.account.service;

import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;

import java.math.BigDecimal;
import java.util.List;

/**
 * Account Service Interface
 */
public interface AccountService {

    /**
     * Get all accounts for a user
     */
    List<AccountVO> listAccounts(Long userId);

    /**
     * Get account by ID
     */
    AccountVO getAccount(Long userId, Long accountId);

    /**
     * Create a new account
     */
    Long createAccount(Long userId, AccountDTO request);

    /**
     * Update an account
     */
    void updateAccount(Long userId, Long accountId, AccountDTO request);

    /**
     * Delete an account (soft delete)
     */
    void deleteAccount(Long userId, Long accountId);

    /**
     * Update account balance
     */
    void updateBalance(Long accountId, BigDecimal amount);

    /**
     * Get account summary
     */
    Object getAccountSummary(Long userId);
}
