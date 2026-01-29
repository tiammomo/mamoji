package com.mamoji.module.transaction.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mamoji.common.result.PageResult;
import com.mamoji.common.result.Result;
import com.mamoji.module.transaction.dto.RefundDTO;
import com.mamoji.module.transaction.dto.RefundSummaryVO;
import com.mamoji.module.transaction.dto.RefundVO;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionRefundResponseVO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.service.RefundService;
import com.mamoji.module.transaction.service.TransactionService;
import com.mamoji.security.UserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Transaction Controller */
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final RefundService refundService;

    /** Get transactions with pagination */
    @GetMapping
    public Result<PageResult<TransactionVO>> listTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @ModelAttribute TransactionQueryDTO request) {
        PageResult<TransactionVO> result =
                transactionService.listTransactions(user.userId(), request);
        return Result.success(result);
    }

    /** Get transaction by ID */
    @GetMapping("/{id}")
    public Result<TransactionVO> getTransaction(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        TransactionVO transaction = transactionService.getTransaction(user.userId(), id);
        return Result.success(transaction);
    }

    /** Create a new transaction */
    @PostMapping
    public Result<Long> createTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody TransactionDTO request) {
        Long transactionId = transactionService.createTransaction(user.userId(), request);
        return Result.success(transactionId);
    }

    /** Update a transaction */
    @PutMapping("/{id}")
    public Result<Void> updateTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody TransactionDTO request) {
        transactionService.updateTransaction(user.userId(), id, request);
        return Result.success();
    }

    /** Delete a transaction */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        transactionService.deleteTransaction(user.userId(), id);
        return Result.success();
    }

    /** Get recent transactions */
    @GetMapping("/recent")
    public Result<List<TransactionVO>> getRecentTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long accountId,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<TransactionVO> transactions;
        if (accountId != null) {
            transactions =
                    transactionService.getRecentTransactions(user.userId(), accountId, limit);
        } else {
            // Get recent transactions across all accounts
            transactions = transactionService.getRecentTransactions(user.userId(), null, limit);
        }
        return Result.success(transactions);
    }

    // ==================== Refund Endpoints ====================

    /** Get all refunds for a transaction */
    @GetMapping("/{id}/refunds")
    public Result<TransactionRefundResponseVO> getTransactionRefunds(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        TransactionRefundResponseVO result = refundService.getTransactionRefunds(user.userId(), id);
        return Result.success(result);
    }

    /** Create a refund for a transaction */
    @PostMapping("/{id}/refunds")
    public Result<RefundVO> createRefund(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody RefundDTO request) {
        request.setTransactionId(id);
        RefundVO result = refundService.createRefund(user.userId(), request);
        return Result.success(result);
    }

    /** Cancel a refund */
    @DeleteMapping("/{transactionId}/refunds/{refundId}")
    public Result<RefundSummaryVO> cancelRefund(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long transactionId,
            @PathVariable Long refundId) {
        RefundSummaryVO result = refundService.cancelRefund(user.userId(), transactionId, refundId);
        return Result.success(result);
    }

    // ==================== Import/Export Endpoints ====================

    /** Export transactions to CSV */
    @GetMapping("/export")
    public Result<String> exportTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String type) {
        String csvContent =
                transactionService.exportTransactions(user.userId(), startDate, endDate, type);
        return Result.success(csvContent);
    }

    /** Get import template */
    @GetMapping("/import/template")
    public Result<String> getImportTemplate() {
        String template =
                "日期,类型,金额,分类,账户,备注\n"
                        + "2024-01-15,income,5000,薪资,银行卡,工资\n"
                        + "2024-01-14,expense,100,餐饮,微信,午餐";
        return Result.success(template);
    }

    /** Preview import data */
    @PostMapping("/import/preview")
    public Result<List<TransactionDTO>> previewImport(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody List<TransactionDTO> transactions) {
        List<TransactionDTO> preview =
                transactionService.previewImport(user.userId(), transactions);
        return Result.success(preview);
    }

    /** Import transactions from previewed data */
    @PostMapping("/import")
    public Result<List<Long>> importTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody List<TransactionDTO> transactions) {
        List<Long> ids = transactionService.importTransactions(user.userId(), transactions);
        return Result.success(ids);
    }
}
