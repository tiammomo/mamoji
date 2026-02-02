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

/**
 * 账户控制器
 * 提供账户管理的 REST API 接口，包括账户的增删改查和交易记录查询
 */
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final TransactionService transactionService;

    /**
     * 获取当前用户的所有账户列表
     * @param user 当前登录用户
     * @return 账户列表
     */
    @GetMapping
    public Result<List<AccountVO>> listAccounts(@AuthenticationPrincipal UserPrincipal user) {
        List<AccountVO> accounts = accountService.listAccounts(user.userId());
        return Result.success(accounts);
    }

    /**
     * 获取账户汇总信息
     * @param user 当前登录用户
     * @return 汇总信息（总余额、账户数量等）
     */
    @GetMapping("/summary")
    public Result<Map<String, Object>> getAccountSummary(
            @AuthenticationPrincipal UserPrincipal user) {
        Map<String, Object> summary = accountService.getAccountSummary(user.userId());
        return Result.success(summary);
    }

    /**
     * 获取单个账户详情
     * @param user 当前登录用户
     * @param id 账户ID
     * @return 账户详情
     */
    @GetMapping("/{id}")
    public Result<AccountVO> getAccount(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        AccountVO account = accountService.getAccount(user.userId(), id);
        return Result.success(account);
    }

    /**
     * 创建新账户
     * @param user 当前登录用户
     * @param request 账户创建请求
     * @return 创建成功的账户ID
     */
    @PostMapping
    public Result<Long> createAccount(
            @AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody AccountDTO request) {
        Long accountId = accountService.createAccount(user.userId(), request);
        return Result.success(accountId);
    }

    /**
     * 更新账户信息
     * @param user 当前登录用户
     * @param id 账户ID
     * @param request 账户更新请求
     * @return 无内容
     */
    @PutMapping("/{id}")
    public Result<Void> updateAccount(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody AccountDTO request) {
        accountService.updateAccount(user.userId(), id, request);
        return Result.success();
    }

    /**
     * 删除账户（软删除）
     * @param user 当前登录用户
     * @param id 账户ID
     * @return 无内容
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteAccount(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        accountService.deleteAccount(user.userId(), id);
        return Result.success();
    }

    /**
     * 获取账户的最近交易记录
     * @param user 当前登录用户
     * @param id 账户ID
     * @param limit 返回记录数量限制，默认10条
     * @return 最近交易记录列表
     */
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
