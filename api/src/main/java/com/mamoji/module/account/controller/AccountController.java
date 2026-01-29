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

    /** Get all accounts for current user */
    @GetMapping
    public Result<List<AccountVO>> listAccounts(@AuthenticationPrincipal UserPrincipal user) {
        List<AccountVO> accounts = accountService.listAccounts(user.userId());
        return Result.success(accounts);
    }

    /** Get account by ID */
    @GetMapping("/{id}")
    public Result<AccountVO> getAccount(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        AccountVO account = accountService.getAccount(user.userId(), id);
        return Result.success(account);
    }

    /** Create a new account */
    @PostMapping
    public Result<Long> createAccount(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody AccountDTO request) {
        Long accountId = accountService.createAccount(user.userId(), request);
        return Result.success(accountId);
    }

    /** Update an account */
    @PutMapping("/{id}")
    public Result<Void> updateAccount(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody AccountDTO request) {
        accountService.updateAccount(user.userId(), id, request);
        return Result.success();
    }

    /** Delete an account */
    @DeleteMapping("/{id}")
    public Result<Void> deleteAccount(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        accountService.deleteAccount(user.userId(), id);
        return Result.success();
    }

    /** Get recent transactions for an account */
    @GetMapping("/{id}/flows")
    public Result<List<TransactionVO>> listAccountFlows(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<TransactionVO> flows =
                transactionService.getRecentTransactions(user.userId(), id, limit);
        return Result.success(flows);
    }

    /** Get account summary */
    @GetMapping("/summary")
    public Result<Map<String, Object>> getAccountSummary(
            @AuthenticationPrincipal UserPrincipal user) {
        Map<String, Object> summary =
                (Map<String, Object>) accountService.getAccountSummary(user.userId());
        return Result.success(summary);
    }
}
