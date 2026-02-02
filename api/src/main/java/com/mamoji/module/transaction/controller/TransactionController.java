/**
 * 项目名称: Mamoji 记账系统
 * 文件名: TransactionController.java
 * 功能描述: 交易记录控制器，提供交易记录的 CRUD、导入导出、退款等 REST API 接口
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
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

/**
 * 交易记录控制器
 * 提供交易记录的完整 REST API 接口，包括：
 * - 交易记录的增删改查
 * - 交易分页查询和最近交易
 * - 退款管理和退款记录查询
 * - 交易数据导入导出
 */
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final RefundService refundService;

    // ==================== 查询接口 ====================

    /**
     * 获取最近交易记录
     * 注意：此接口必须放在 /{id} 之前定义，否则 /recent 会被当作交易 ID 解析
     *
     * @param user      当前登录用户
     * @param accountId 可选的账户 ID 过滤条件
     * @param limit     返回记录数量限制，默认 10 条
     * @return 最近的交易记录列表
     */
    @GetMapping("/recent")
    public Result<List<TransactionVO>> getRecentTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) Long accountId,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<TransactionVO> transactions =
                transactionService.getRecentTransactions(user.userId(), accountId, limit);
        return Result.success(transactions);
    }

    /**
     * 分页查询交易记录列表
     *
     * @param user    当前登录用户
     * @param request 查询条件（时间范围、分类、账户、类型等）
     * @return 分页后的交易记录列表
     */
    @GetMapping
    public Result<PageResult<TransactionVO>> listTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @ModelAttribute TransactionQueryDTO request) {
        PageResult<TransactionVO> result =
                transactionService.listTransactions(user.userId(), request);
        return Result.success(result);
    }

    /**
     * 根据 ID 获取单笔交易详情
     *
     * @param user 当前登录用户
     * @param id   交易记录 ID
     * @return 交易记录详情
     */
    @GetMapping("/{id}")
    public Result<TransactionVO> getTransaction(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        TransactionVO transaction = transactionService.getTransaction(user.userId(), id);
        return Result.success(transaction);
    }

    // ==================== 增删改接口 ====================

    /**
     * 创建新的交易记录
     *
     * @param user    当前登录用户
     * @param request 交易记录请求数据
     * @return 创建成功的交易记录 ID
     */
    @PostMapping
    public Result<Long> createTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody TransactionDTO request) {
        Long transactionId = transactionService.createTransaction(user.userId(), request);
        return Result.success(transactionId);
    }

    /**
     * 更新已有交易记录
     *
     * @param user    当前登录用户
     * @param id      要更新的交易记录 ID
     * @param request 新的交易记录数据
     * @return 操作结果
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
     * 删除交易记录
     *
     * @param user 当前登录用户
     * @param id   要删除的交易记录 ID
     * @return 操作结果
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        transactionService.deleteTransaction(user.userId(), id);
        return Result.success();
    }

    // ==================== 退款接口 ====================

    /**
     * 获取某笔交易的全部退款记录
     *
     * @param user 当前登录用户
     * @param id   原始交易记录 ID
     * @return 该交易的退款信息汇总
     */
    @GetMapping("/{id}/refunds")
    public Result<TransactionRefundResponseVO> getTransactionRefunds(
            @AuthenticationPrincipal UserPrincipal user, @PathVariable Long id) {
        TransactionRefundResponseVO result = refundService.getTransactionRefunds(user.userId(), id);
        return Result.success(result);
    }

    /**
     * 为交易创建退款记录
     * 支持全额退款和部分退款，退款金额不能超过原交易金额
     *
     * @param user    当前登录用户
     * @param id      原始交易记录 ID
     * @param request 退款请求数据
     * @return 创建成功的退款记录
     */
    @PostMapping("/{id}/refunds")
    public Result<RefundVO> createRefund(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long id,
            @Valid @RequestBody RefundDTO request) {
        request.setTransactionId(id);
        RefundVO result = refundService.createRefund(user.userId(), request);
        return Result.success(result);
    }

    /**
     * 取消（撤回）已创建的退款
     *
     * @param user        当前登录用户
     * @param transactionId 原始交易记录 ID
     * @param refundId    要取消的退款记录 ID
     * @return 取消后的退款汇总信息
     */
    @DeleteMapping("/{transactionId}/refunds/{refundId}")
    public Result<RefundSummaryVO> cancelRefund(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable Long transactionId,
            @PathVariable Long refundId) {
        RefundSummaryVO result = refundService.cancelRefund(user.userId(), transactionId, refundId);
        return Result.success(result);
    }

    // ==================== 导入导出接口 ====================

    /**
     * 导出交易记录为 CSV 格式
     *
     * @param user      当前登录用户
     * @param startDate 可选的开始日期（yyyy-MM-dd）
     * @param endDate   可选的结束日期（yyyy-MM-dd）
     * @param type      可选的交易类型过滤（income/expense）
     * @return CSV 格式的交易数据
     */
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

    /**
     * 获取导入模板
     * 返回 CSV 格式的导入模板，包含示例数据行
     *
     * @return CSV 格式的导入模板
     */
    @GetMapping("/import/template")
    public Result<String> getImportTemplate() {
        String template =
                "日期,类型,金额,分类,账户,备注\n"
                        + "2024-01-15,income,5000,薪资,银行卡,工资\n"
                        + "2024-01-14,expense,100,餐饮,微信,午餐";
        return Result.success(template);
    }

    /**
     * 预览导入数据
     * 在正式导入前，先验证数据格式并返回预览结果
     *
     * @param user        当前登录用户
     * @param transactions 要导入的交易数据列表
     * @return 验证后的交易数据列表
     */
    @PostMapping("/import/preview")
    public Result<List<TransactionDTO>> previewImport(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody List<TransactionDTO> transactions) {
        List<TransactionDTO> preview =
                transactionService.previewImport(user.userId(), transactions);
        return Result.success(preview);
    }

    /**
     * 正式导入交易数据
     * 只有经过预览确认的数据才能导入系统
     *
     * @param user        当前登录用户
     * @param transactions 已预览确认的交易数据列表
     * @return 成功导入的交易记录 ID 列表
     */
    @PostMapping("/import")
    public Result<List<Long>> importTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody List<TransactionDTO> transactions) {
        List<Long> ids = transactionService.importTransactions(user.userId(), transactions);
        return Result.success(ids);
    }
}
