package com.mamoji.module.transaction.service;

import java.util.List;

import com.mamoji.common.result.PageResult;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;

/**
 * 交易服务接口
 * 定义交易记录相关的业务操作
 */
public interface TransactionService {

    /**
     * 分页查询交易记录列表
     * @param userId 用户ID
     * @param request 查询条件
     * @return 分页后的交易记录
     */
    PageResult<TransactionVO> listTransactions(Long userId, TransactionQueryDTO request);

    /**
     * 获取单笔交易详情
     * @param userId 用户ID
     * @param transactionId 交易ID
     * @return 交易详情
     */
    TransactionVO getTransaction(Long userId, Long transactionId);

    /**
     * 根据ID查询交易实体（内部使用）
     * @param transactionId 交易ID
     * @return 交易实体
     */
    FinTransaction findById(Long transactionId);

    /**
     * 创建新交易
     * @param userId 用户ID
     * @param request 交易请求
     * @return 创建成功的交易ID
     */
    Long createTransaction(Long userId, TransactionDTO request);

    /**
     * 更新交易记录
     * @param userId 用户ID
     * @param transactionId 交易ID
     * @param request 更新请求
     */
    void updateTransaction(Long userId, Long transactionId, TransactionDTO request);

    /**
     * 删除交易记录（软删除）
     * @param userId 用户ID
     * @param transactionId 交易ID
     */
    void deleteTransaction(Long userId, Long transactionId);

    /**
     * 获取账户的最近交易记录
     * @param userId 用户ID
     * @param accountId 账户ID
     * @param limit 限制数量
     * @return 最近交易列表
     */
    List<TransactionVO> getRecentTransactions(Long userId, Long accountId, Integer limit);

    /**
     * 导出交易记录为CSV格式
     * @param userId 用户ID
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param type 交易类型
     * @return CSV格式字符串
     */
    String exportTransactions(Long userId, String startDate, String endDate, String type);

    /**
     * 预览导入数据（验证但不保存）
     * @param userId 用户ID
     * @param transactions 待导入数据
     * @return 验证后的数据列表
     */
    List<TransactionDTO> previewImport(Long userId, List<TransactionDTO> transactions);

    /**
     * 导入交易记录
     * @param userId 用户ID
     * @param transactions 待导入数据
     * @return 成功导入的交易ID列表
     */
    List<Long> importTransactions(Long userId, List<TransactionDTO> transactions);
}
