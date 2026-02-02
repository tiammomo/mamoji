/**
 * 项目名称: Mamoji 记账系统
 * 文件名: RefundServiceImpl.java
 * 功能描述: 退款服务实现类，提供退款的创建、查询、取消等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.transaction.dto.*;
import com.mamoji.module.transaction.entity.FinRefund;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinRefundMapper;
import com.mamoji.module.transaction.strategy.TransactionStrategyFactory;
import com.mamoji.module.transaction.strategy.TransactionTypeStrategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 退款服务实现类
 * <p>
 * 负责处理退款相关的业务逻辑，包括：
 * <ul>
 *   <li>查询交易的退款记录列表</li>
 *   <li>创建新的退款记录</li>
 *   <li>取消（撤回）已创建的退款</li>
 *   <li>计算退款金额汇总</li>
 * </ul>
 * </p>
 * <p>
 * 退款机制说明：
 * <ul>
 *   <li>仅支持对支出（expense）交易进行退款</li>
 *   <li>支持部分退款，退款总额不能超过原交易金额</li>
 *   <li>退款时会更新账户余额（与原交易相反的方向）</li>
 *   <li>取消退款会恢复账户余额到退款前的状态</li>
 * </ul>
 * </p>
 *
 * @see RefundService 退款服务接口
 * @see FinRefund 退款记录实体
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl extends ServiceImpl<FinRefundMapper, FinRefund>
        implements RefundService {

    /** 退款记录 Mapper，用于数据库操作 */
    private final FinRefundMapper refundMapper;

    /** 账户服务，用于更新账户余额 */
    private final AccountService accountService;

    /** 交易服务，用于查询原交易信息 */
    private final TransactionService transactionService;

    /** 交易策略工厂，用于计算余额变化 */
    private final TransactionStrategyFactory strategyFactory;

    // ==================== 查询退款相关方法 ====================

    /**
     * 获取交易的退款记录及汇总信息
     * <p>
     * 返回该交易的完整退款信息，包括：
     * <ul>
     *   <li>原交易基本信息（金额、类型）</li>
     *   <li>退款记录列表</li>
     *   <li>退款汇总（已退金额、剩余可退、是否已退款）</li>
     * </ul>
     * </p>
     *
     * @param userId       当前用户ID，用于验证交易归属
     * @param transactionId 原交易ID
     * @return 退款的完整响应对象，包含原交易、退款列表、汇总信息
     * @throws BusinessException 交易不存在或无权限访问
     */
    @Override
    public TransactionRefundResponseVO getTransactionRefunds(Long userId, Long transactionId) {
        // 验证原交易是否存在且属于当前用户
        TransactionVO transaction = transactionService.getTransaction(userId, transactionId);
        if (transaction == null) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // 查询该交易的所有有效退款记录（状态为1表示有效）
        List<FinRefund> refunds =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>()
                                .eq(FinRefund::getTransactionId, transactionId)
                                .eq(FinRefund::getStatus, 1)
                                .orderByDesc(FinRefund::getOccurredAt));

        // 将退款实体转换为 VO 对象
        List<RefundVO> refundVOs = refunds.stream().map(this::toVO).toList();

        // 计算退款汇总信息
        BigDecimal totalRefunded =
                refunds.stream().map(FinRefund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        RefundSummaryVO summary =
                RefundSummaryVO.builder()
                        .totalRefunded(totalRefunded) // 已退款总额
                        .remainingRefundable(transaction.getAmount().subtract(totalRefunded)) // 剩余可退金额
                        .hasRefund(!refunds.isEmpty()) // 是否有退款记录
                        .refundCount(refunds.size()) // 退款次数
                        .build();

        // 构建原交易基本信息
        TransactionRefundResponseVO.TransactionBasicVO basicVO =
                TransactionRefundResponseVO.TransactionBasicVO.builder()
                        .transactionId(transactionId)
                        .amount(transaction.getAmount())
                        .type(transaction.getType())
                        .build();

        // 组装并返回完整响应
        return TransactionRefundResponseVO.builder()
                .transaction(basicVO)
                .refunds(refundVOs)
                .summary(summary)
                .build();
    }

    // ==================== 创建退款相关方法 ====================

    /**
     * 创建退款记录
     * <p>
     * 创建退款的完整流程：
     * <ol>
     *   <li>验证原交易存在且属于当前用户</li>
     *   <li>验证原交易类型为支出（expense）</li>
     *   <li>计算已退款总额，验证退款金额不超过可退范围</li>
     *   <li>验证原交易关联的账户存在</li>
     *   <li>创建退款记录</li>
     *   <li>使用策略模式更新账户余额（退款会使余额增加）</li>
     * </ol>
     * </p>
     * <p>
     * 余额变化说明：
     * <ul>
     *   <li>支出交易：金额为负，退款时金额为正（钱回来）</li>
     *   <li>收入交易（理论上不应退款）：金额为正，退款时金额为负（钱扣回）</li>
     * </ul>
     * </p>
     *
     * @param userId  当前用户ID
     * @param request 退款请求数据（包含原交易ID、退款金额、退款原因等）
     * @return 创建成功的退款记录信息
     * @throws BusinessException 验证失败（交易不存在、非支出交易、退款金额超限、账户不存在）
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public RefundVO createRefund(Long userId, RefundDTO request) {
        // 验证原交易存在
        TransactionVO originalTransaction =
                transactionService.getTransaction(userId, request.getTransactionId());
        if (originalTransaction == null) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // 仅支持对支出交易进行退款
        if (!"expense".equals(originalTransaction.getType())) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "只有支出交易可退款");
        }

        // 计算已退款总额
        BigDecimal totalRefunded = calculateTotalRefunded(request.getTransactionId());

        // 验证退款金额不超过可退范围
        BigDecimal remainingRefundable = originalTransaction.getAmount().subtract(totalRefunded);
        if (request.getAmount().compareTo(remainingRefundable) > 0) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "退款金额超出可退范围");
        }

        // 验证原交易关联的账户仍存在
        List<AccountVO> accounts = accountService.listAccounts(userId);
        boolean accountExists =
                accounts.stream()
                        .anyMatch(a -> a.getAccountId().equals(originalTransaction.getAccountId()));
        if (!accountExists) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }

        // 构建退款备注：若用户提供了备注则拼接，否则使用默认"退款"
        String note =
                request.getNote() != null && !request.getNote().isEmpty()
                        ? "退款：" + request.getNote()
                        : "退款";

        // 创建退款记录实体
        FinRefund refund =
                FinRefund.builder()
                        .userId(userId)
                        .transactionId(request.getTransactionId())
                        .accountId(originalTransaction.getAccountId())
                        .categoryId(originalTransaction.getCategoryId())
                        .amount(request.getAmount())
                        .currency("CNY")
                        .occurredAt(
                                request.getOccurredAt() != null
                                        ? request.getOccurredAt()
                                        : LocalDateTime.now())
                        .note(note)
                        .status(1) // 状态为1表示有效
                        .build();

        // 插入退款记录到数据库
        refundMapper.insert(refund);

        // 使用策略模式更新账户余额
        // 退款与原交易的余额变化方向相反：
        // - 支出退款：原交易扣款（负），退款应加款（正），所以取反
        // - 收入退款：原交易入账（正），退款应扣款（负），所以取反
        TransactionTypeStrategy strategy =
                strategyFactory.getStrategy(originalTransaction.getType());
        BigDecimal balanceChange = strategy.calculateBalanceChange(request.getAmount()).negate();
        accountService.updateBalance(originalTransaction.getAccountId(), balanceChange);

        // 记录退款操作日志
        log.info(
                "退款创建成功: userId={}, transactionId={}, amount={}, originalType={}",
                userId,
                request.getTransactionId(),
                request.getAmount(),
                originalTransaction.getType());

        return toVO(refund);
    }

    // ==================== 取消退款相关方法 ====================

    /**
     * 取消（撤回）已创建的退款
     * <p>
     * 取消退款的流程：
     * <ol>
     *   <li>验证原交易存在</li>
     *   <li>验证退款记录存在且属于该交易和用户</li>
     *   <li>验证退款状态为有效（未取消）</li>
     *   <li>软删除退款（更新状态为0）</li>
     *   <li>恢复账户余额（抵消退款时的余额变化）</li>
     * </ol>
     * </p>
     *
     * @param userId       当前用户ID
     * @param transactionId 原交易ID
     * @param refundId     要取消的退款记录ID
     * @return 取消后的退款汇总信息
     * @throws BusinessException 验证失败（记录不存在、已取消等）
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public RefundSummaryVO cancelRefund(Long userId, Long transactionId, Long refundId) {
        // 验证原交易存在
        TransactionVO originalTransaction =
                transactionService.getTransaction(userId, transactionId);
        if (originalTransaction == null) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // 验证退款记录存在且归属正确
        FinRefund refund = refundMapper.selectById(refundId);
        if (refund == null
                || !refund.getTransactionId().equals(transactionId)
                || !refund.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "退款记录不存在");
        }

        // 验证退款状态为有效（未取消）
        if (refund.getStatus() != 1) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "退款已取消");
        }

        // 软删除退款：更新状态为0（0表示已取消）
        FinRefund updateRefund = new FinRefund();
        updateRefund.setRefundId(refundId);
        updateRefund.setStatus(0);
        refundMapper.updateById(updateRefund);

        // 恢复账户余额（抵消退款时的余额变化）
        // 退款时加了钱 (+)，取消时应该扣回 (-)
        TransactionTypeStrategy strategy =
                strategyFactory.getStrategy(originalTransaction.getType());
        BigDecimal balanceChange = strategy.calculateBalanceChange(refund.getAmount());
        accountService.updateBalance(refund.getAccountId(), balanceChange);

        // 记录取消操作日志
        log.info(
                "退款已取消: userId={}, refundId={}, amount={}, originalType={}",
                userId,
                refundId,
                refund.getAmount(),
                originalTransaction.getType());

        // 返回更新后的退款汇总
        return getRefundSummary(transactionId);
    }

    // ==================== 汇总查询相关方法 ====================

    /**
     * 获取指定交易的退款汇总信息
     * <p>
     * 汇总信息包括：
     * <ul>
     *   <li>totalRefunded: 已退款总额</li>
     *   <li>remainingRefundable: 剩余可退金额</li>
     *   <li>hasRefund: 是否有退款记录</li>
     *   <li>refundCount: 退款次数</li>
     * </ul>
     * </p>
     *
     * @param transactionId 原交易ID
     * @return 退款汇总信息
     */
    @Override
    public RefundSummaryVO getRefundSummary(Long transactionId) {
        // 查询原交易
        FinTransaction transaction = transactionService.findById(transactionId);
        if (transaction == null) {
            // 交易不存在时返回空的汇总信息
            return RefundSummaryVO.builder()
                    .totalRefunded(BigDecimal.ZERO)
                    .remainingRefundable(BigDecimal.ZERO)
                    .hasRefund(false)
                    .refundCount(0)
                    .build();
        }

        // 计算已退款总额
        BigDecimal totalRefunded = calculateTotalRefunded(transactionId);

        // 构建并返回汇总信息
        return RefundSummaryVO.builder()
                .totalRefunded(totalRefunded)
                .remainingRefundable(transaction.getAmount().subtract(totalRefunded))
                .hasRefund(totalRefunded.compareTo(BigDecimal.ZERO) > 0)
                .refundCount(
                        refundMapper
                                .selectCount(
                                        new LambdaQueryWrapper<FinRefund>()
                                                .eq(FinRefund::getTransactionId, transactionId)
                                                .eq(FinRefund::getStatus, 1))
                                .intValue())
                .build();
    }

    /**
     * 计算指定交易的已退款总额
     *
     * @param transactionId 原交易ID
     * @return 所有有效退款（状态为1）的金额总和
     */
    @Override
    public BigDecimal calculateTotalRefunded(Long transactionId) {
        List<FinRefund> refunds =
                refundMapper.selectList(
                        new LambdaQueryWrapper<FinRefund>()
                                .eq(FinRefund::getTransactionId, transactionId)
                                .eq(FinRefund::getStatus, 1));

        // 使用 reduce 累加所有退款金额
        return refunds.stream().map(FinRefund::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 将退款实体转换为 VO 对象
     * <p>
     * 用于将数据库实体转换为 API 响应对象，
     * 复制实体属性到 VO（排除内部字段如密码等）
     * </p>
     *
     * @param refund 退款记录实体
     * @return 退款响应 VO 对象
     */
    private RefundVO toVO(FinRefund refund) {
        RefundVO vo = new RefundVO();
        BeanUtils.copyProperties(refund, vo);
        return vo;
    }
}
