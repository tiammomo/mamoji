package com.mamoji.module.transaction.service;

import com.mamoji.module.transaction.dto.RefundDTO;
import com.mamoji.module.transaction.dto.RefundSummaryVO;
import com.mamoji.module.transaction.dto.RefundVO;
import com.mamoji.module.transaction.dto.TransactionRefundResponseVO;

/**
 * 退款服务接口
 * 定义退款管理相关的业务操作
 */
public interface RefundService {

    /**
     * 获取交易的所有退款记录
     * @param userId 用户ID
     * @param transactionId 交易ID
     * @return 退款响应（包含原交易和退款列表）
     */
    TransactionRefundResponseVO getTransactionRefunds(Long userId, Long transactionId);

    /**
     * 为交易创建退款
     * @param userId 用户ID
     * @param request 退款请求
     * @return 退款记录详情
     */
    RefundVO createRefund(Long userId, RefundDTO request);

    /**
     * 取消退款（软删除）
     * @param userId 用户ID
     * @param transactionId 原交易ID
     * @param refundId 退款记录ID
     * @return 退款汇总信息
     */
    RefundSummaryVO cancelRefund(Long userId, Long transactionId, Long refundId);

    /**
     * 获取交易的退款汇总
     * @param transactionId 交易ID
     * @return 退款汇总信息
     */
    RefundSummaryVO getRefundSummary(Long transactionId);

    /**
     * 计算交易的总退款金额
     * @param transactionId 交易ID
     * @return 总退款金额
     */
    java.math.BigDecimal calculateTotalRefunded(Long transactionId);
}
