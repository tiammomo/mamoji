package com.mamoji.module.account.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mamoji.common.result.Result;
import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.service.TransactionService;
import com.mamoji.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Account Controller */
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final TransactionService transactionService;

    /** List all accounts for user */
    @GetMapping
    public Result<List<AccountVO>> listAccounts(@AuthenticationPrincipal UserPrincipal user) {
        List<AccountVO> accounts = accountService.listAccounts(user.userId());
        return Result.success(accounts);
    }

    /** Get account summary (total balance, account count) */
    @GetMapping("/summary")
    public Result<Map<String, Object>> getAccountSummary(
            @AuthenticationPrincipal UserPrincipal user) {
        Map<String, Object> summary = accountService.getAccountSummary(user.userId());
        return Result.success(summary);
    }

    /** Get account details by ID */
    @GetMapping("/{id}")
    public Result<AccountVO> getAccount(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        AccountVO account = accountService.getAccount(user.userId(), id);
        return Result.success(account);
    }

    /** Create new account */
    @PostMapping
    public Result<Long> createAccount(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody AccountDTO request) {
        Long accountId = accountService.createAccount(user.userId(), request);
        return Result.success(accountId);
    }

    /** Update account */
    @PutMapping("/{id}")
    public Result<Void> updateAccount(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody AccountDTO request) {
        accountService.updateAccount(user.userId(), id, request);
        return Result.success();
    }

    /** Delete account (soft delete) */
    @DeleteMapping("/{id}")
    public Result<Void> deleteAccount(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        accountService.deleteAccount(user.userId(), id);
        return Result.success();
    }

    /** Get recent transactions for an account */
    @GetMapping("/{id}/transactions/recent")
    public Result<List<TransactionVO>> getRecentAccountTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<TransactionVO> transactions =
                transactionService.getRecentTransactions(user.userId(), id, limit);
        return Result.success(transactions);
    }
}
