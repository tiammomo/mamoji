package com.mamoji.module.account.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;

/**
 * 账户服务接口
 * 定义账户管理相关的业务操作
 */
public interface AccountService {

    /**
     * 获取用户的所有账户列表
     * @param userId 用户ID
     * @return 账户列表
     */
    List<AccountVO> listAccounts(Long userId);

    /**
     * 获取单个账户详情
     * @param userId 用户ID
     * @param accountId 账户ID
     * @return 账户详情
     */
    AccountVO getAccount(Long userId, Long accountId);

    /**
     * 创建新账户
     * @param userId 用户ID
     * @param request 账户创建请求
     * @return 创建成功的账户ID
     */
    Long createAccount(Long userId, AccountDTO request);

    /**
     * 更新账户信息
     * @param userId 用户ID
     * @param accountId 账户ID
     * @param request 更新请求
     */
    void updateAccount(Long userId, Long accountId, AccountDTO request);

    /**
     * 删除账户（软删除）
     * @param userId 用户ID
     * @param accountId 账户ID
     */
    void deleteAccount(Long userId, Long accountId);

    /**
     * 更新账户余额
     * @param accountId 账户ID
     * @param amount 变化金额（正数增加，负数减少）
     */
    void updateBalance(Long accountId, BigDecimal amount);

    /**
     * 获取账户汇总信息
     * @param userId 用户ID
     * @return 汇总信息
     */
    Map<String, Object> getAccountSummary(Long userId);
}
