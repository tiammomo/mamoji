package com.mamoji.module.transaction.service;

import com.mamoji.module.transaction.dto.RefundDTO;
import com.mamoji.module.transaction.dto.RefundSummaryVO;
import com.mamoji.module.transaction.dto.RefundVO;
import com.mamoji.module.transaction.dto.TransactionRefundResponseVO;

/** Refund Service Interface */
public interface RefundService {

    /** Get all refunds for a transaction */
    TransactionRefundResponseVO getTransactionRefunds(Long userId, Long transactionId);

    /** Create a refund for a transaction */
    RefundVO createRefund(Long userId, RefundDTO request);

    /** Cancel a refund (soft delete) */
    RefundSummaryVO cancelRefund(Long userId, Long transactionId, Long refundId);

    /** Get refund summary for a transaction */
    RefundSummaryVO getRefundSummary(Long transactionId);

    /** Calculate total refunded amount for a transaction */
    java.math.BigDecimal calculateTotalRefunded(Long transactionId);
}
