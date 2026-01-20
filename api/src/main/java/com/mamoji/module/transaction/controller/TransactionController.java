package com.mamoji.module.transaction.controller;

import com.mamoji.common.result.PageResult;
import com.mamoji.common.result.Result;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.service.TransactionService;
import com.mamoji.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Transaction Controller
 */
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Get transactions with pagination
     */
    @GetMapping
    public Result<PageResult<TransactionVO>> listTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @ModelAttribute TransactionQueryDTO request) {
        PageResult<TransactionVO> result = transactionService.listTransactions(user.userId(), request);
        return Result.success(result);
    }

    /**
     * Get transaction by ID
     */
    @GetMapping("/{id}")
    public Result<TransactionVO> getTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) {
        TransactionVO transaction = transactionService.getTransaction(user.userId(), id);
        return Result.success(transaction);
    }

    /**
     * Create a new transaction
     */
    @PostMapping
    public Result<Long> createTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody TransactionDTO request) {
        Long transactionId = transactionService.createTransaction(user.userId(), request);
        return Result.success(transactionId);
    }

    /**
     * Update a transaction
     */
    @PutMapping("/{id}")
    public Result<Void> updateTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody TransactionDTO request) {
        transactionService.updateTransaction(user.userId(), id, request);
        return Result.success();
    }

    /**
     * Delete a transaction
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id) {
        transactionService.deleteTransaction(user.userId(), id);
        return Result.success();
    }
}
