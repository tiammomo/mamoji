package com.mamoji.module.transaction.service;

import java.util.List;

import com.mamoji.common.result.PageResult;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;

/** Transaction Service Interface */
public interface TransactionService {

    /** Get transactions with pagination */
    PageResult<TransactionVO> listTransactions(Long userId, TransactionQueryDTO request);

    /** Get transaction by ID */
    TransactionVO getTransaction(Long userId, Long transactionId);

    /** Find transaction entity by ID (internal use) */
    FinTransaction findById(Long transactionId);

    /** Create a new transaction */
    Long createTransaction(Long userId, TransactionDTO request);

    /** Update a transaction */
    void updateTransaction(Long userId, Long transactionId, TransactionDTO request);

    /** Delete a transaction (soft delete) */
    void deleteTransaction(Long userId, Long transactionId);

    /** Get recent transactions for an account */
    List<TransactionVO> getRecentTransactions(Long userId, Long accountId, Integer limit);

    /** Export transactions to CSV format */
    String exportTransactions(Long userId, String startDate, String endDate, String type);

    /** Preview import data (validate without saving) */
    List<TransactionDTO> previewImport(Long userId, List<TransactionDTO> transactions);

    /** Import transactions from list */
    List<Long> importTransactions(Long userId, List<TransactionDTO> transactions);
}
