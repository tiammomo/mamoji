/**
 * 项目名称: Mamoji 记账系统
 * 文件名: AccountServiceImpl.java
 * 功能描述: 账户服务实现类，提供账户的 CRUD、余额管理、汇总统计等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.account.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.service.AbstractCrudService;
import com.mamoji.module.account.dto.AccountDTO;
import com.mamoji.module.account.dto.AccountVO;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 账户服务实现类
 * <p>
 * 负责处理账户相关的业务逻辑，包括：
 * <ul>
 *   <li>账户的增删改查（CRUD）</li>
 *   <li>账户余额更新（交易、退款时自动更新）</li>
 *   <li>账户汇总统计（总资产、账户数量等）</li>
 *   <li>账户名称唯一性校验</li>
 * </ul>
 * </p>
 * <p>
 * 账户类型说明：
 * <ul>
 *   <li>bank: 银行卡、储蓄卡（计入净资产）</li>
 *   <li>credit: 信用卡、贷记卡（不计入净资产，显示为负数）</li>
 *   <li>cash: 现金（计入净资产）</li>
 *   <li>alipay/wechat: 数字钱包（计入净资产）</li>
 *   <li>stock/fund: 投资账户（计入净资产）</li>
 *   <li>debt: 负债账户（不计入净资产）</li>
 * </ul>
 * </p>
 *
 * @see AccountService 账户服务接口
 * @see FinAccount 账户实体
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl extends AbstractCrudService<FinAccountMapper, FinAccount, AccountVO>
        implements AccountService {

    /** DTO 转换器，用于实体与 VO/DTO 之间的转换 */
    private final DtoConverter dtoConverter;

    // ==================== 抽象方法实现 ====================

    /**
     * 将账户实体转换为 VO 对象
     *
     * @param entity 账户实体
     * @return 账户响应 VO
     */
    @Override
    protected AccountVO toVO(FinAccount entity) {
        return dtoConverter.convertAccount(entity);
    }

    /**
     * 验证账户归属权
     * <p>
     * 确保只有账户所有者才能对其进行操作
     * </p>
     *
     * @param userId 当前用户ID
     * @param entity 要验证的账户实体
     * @throws BusinessException 账户不属于当前用户
     */
    @Override
    protected void validateOwnership(Long userId, FinAccount entity) {
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }
    }

    // ==================== 查询方法 ====================

    /**
     * 获取当前用户的所有有效账户列表
     * <p>
     * 按创建时间倒序排列，返回状态为正常的账户
     * </p>
     *
     * @param userId 当前用户ID
     * @return 账户列表（VO 格式）
     */
    @Override
    public List<AccountVO> listAccounts(Long userId) {
        List<FinAccount> accounts =
                this.list(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1)
                                .orderByDesc(FinAccount::getCreatedAt));
        return dtoConverter.convertAccountList(accounts);
    }

    /**
     * 获取单个账户详情
     *
     * @param userId    当前用户ID
     * @param accountId 账户ID
     * @return 账户信息（VO 格式）
     * @throws BusinessException 账户不存在或无权限
     */
    @Override
    public AccountVO getAccount(Long userId, Long accountId) {
        return get(userId, accountId);
    }

    // ==================== 创建方法 ====================

    /**
     * 创建新账户
     * <p>
     * 创建流程：
     * <ol>
     *   <li>校验账户名称唯一性</li>
     *   <li>构建账户实体（设置默认值）</li>
     *   <li>保存到数据库</li>
     *   <li>记录操作日志</li>
     * </ol>
     * </p>
     *
     * @param userId  当前用户ID
     * @param request 账户创建请求数据
     * @return 创建成功的账户ID
     * @throws BusinessException 账户名称已存在
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createAccount(Long userId, AccountDTO request) {
        // 验证账户名称唯一性
        validateUniqueName(userId, request.getName());

        // 构建账户实体，设置默认值
        FinAccount account =
                FinAccount.builder()
                        .userId(userId)
                        .name(request.getName())
                        .accountType(request.getAccountType())
                        .accountSubType(request.getAccountSubType())
                        .balance(
                                request.getBalance() != null
                                        ? request.getBalance()
                                        : BigDecimal.ZERO)
                        .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
                        .includeInTotal(
                                request.getIncludeInTotal() != null
                                        ? request.getIncludeInTotal()
                                        : 1)
                        .status(1) // 状态为1表示正常
                        .build();

        // 保存账户
        this.save(account);
        log.info("账户创建成功: userId={}, accountId={}", userId, account.getAccountId());
        return account.getAccountId();
    }

    // ==================== 更新方法 ====================

    /**
     * 更新账户信息
     * <p>
     * 可更新的字段：名称、类型、子类型、货币、是否计入净资产
     * 注意：账户余额通过 updateBalance 方法单独更新
     * </p>
     *
     * @param userId    当前用户ID
     * @param accountId 要更新的账户ID
     * @param request   新的账户信息
     * @throws BusinessException 账户不存在、无权限或名称重复
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateAccount(Long userId, Long accountId, AccountDTO request) {
        // 验证账户存在且属于当前用户
        getByIdWithValidation(userId, accountId);
        // 验证新名称唯一性（排除自身）
        validateUniqueName(userId, request.getName(), accountId);

        // 更新账户信息
        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getName, request.getName())
                        .set(FinAccount::getAccountType, request.getAccountType())
                        .set(FinAccount::getAccountSubType, request.getAccountSubType())
                        .set(FinAccount::getCurrency, request.getCurrency())
                        .set(FinAccount::getIncludeInTotal, request.getIncludeInTotal()));

        log.info("账户信息已更新: accountId={}", accountId);
    }

    // ==================== 删除方法 ====================

    /**
     * 删除账户（软删除）
     * <p>
     * 软删除：将账户状态改为 0（禁用），
     * 账户数据仍保留在数据库中，只是不再显示
     * </p>
     *
     * @param userId    当前用户ID
     * @param accountId 要删除的账户ID
     * @throws BusinessException 账户不存在或无权限
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAccount(Long userId, Long accountId) {
        // 验证账户存在且属于当前用户
        getByIdWithValidation(userId, accountId);

        // 软删除：更新状态为 0
        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getStatus, 0));

        log.info("账户已删除: accountId={}", accountId);
    }

    // ==================== 统计方法 ====================

    /**
     * 获取账户汇总信息
     * <p>
     * 汇总信息包括：
     * <ul>
     *   <li>userId: 用户ID</li>
     *   <li>totalBalance: 总净资产（仅计入净资产的账户）</li>
     *   <li>accountCount: 账户总数</li>
     * </ul>
     * </p>
     * <p>
     * 净资产计算说明：
     * <ul>
     *   <li>includeInTotal = 1 的账户计入净资产（如银行卡、现金）</li>
       <li>includeInTotal = 0 的账户不计入（如信用卡、负债）</li>
     * </ul>
     * </p>
     *
     * @param userId 当前用户ID
     * @return 账户汇总信息 Map
     */
    @Override
    public Map<String, Object> getAccountSummary(Long userId) {
        // 查询用户所有账户（包含已删除的，用于计算总资产时参考）
        List<FinAccount> accounts =
                this.list(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1));

        // 计算净资产：仅累加 includeInTotal = 1 的账户
        BigDecimal totalBalance =
                accounts.stream()
                        .filter(a -> a.getIncludeInTotal() == null || a.getIncludeInTotal() == 1)
                        .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 构建汇总信息
        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", userId);
        summary.put("totalBalance", totalBalance);
        summary.put("accountCount", accounts.size());
        return summary;
    }

    // ==================== 余额更新方法 ====================

    /**
     * 更新账户余额
     * <p>
     * 用于交易创建、退款、取消退款等场景下的余额变更。
     * 正数表示增加余额（如收入、退款），负数表示减少余额（如支出）。
     * </p>
     * <p>
     * 余额变更场景示例：
     * <ul>
     *   <li>收入 100 元：changeAmount = +100</li>
     *   <li>支出 50 元：changeAmount = -50</li>
     *   <li>退款 30 元：changeAmount = +30</li>
     *   <li>取消退款：changeAmount = -30</li>
     * </ul>
     * </p>
     *
     * @param accountId    账户ID
     * @param changeAmount 余额变化量（正数增加，负数减少）
     */
    @Override
    public void updateBalance(Long accountId, BigDecimal changeAmount) {
        // 查询账户
        FinAccount account = this.getById(accountId);
        if (account == null) {
            log.warn("账户不存在: accountId={}", accountId);
            return;
        }

        // 计算新余额
        BigDecimal newBalance =
                (account.getBalance() != null ? account.getBalance() : BigDecimal.ZERO)
                        .add(changeAmount);

        // 更新余额
        this.update(
                new LambdaUpdateWrapper<FinAccount>()
                        .eq(FinAccount::getAccountId, accountId)
                        .set(FinAccount::getBalance, newBalance));

        // 记录余额变更日志
        log.info(
                "账户余额已更新: accountId={}, 变化量={}, 新余额={}",
                accountId,
                changeAmount,
                newBalance);
    }

    // ==================== 私有校验方法 ====================

    /**
     * 验证账户名称唯一性（内部调用）
     *
     * @param userId 当前用户ID
     * @param name   账户名称
     */
    private void validateUniqueName(Long userId, String name) {
        validateUniqueName(userId, name, null);
    }

    /**
     * 验证账户名称唯一性
     * <p>
     * 同一用户下不能有名称相同的账户，
     * 更新时可排除自身（excludeId）
     * </p>
     *
     * @param userId    当前用户ID
     * @param name      账户名称
     * @param excludeId 要排除的账户ID（更新时传入自身ID）
     * @throws BusinessException 账户名称已存在
     */
    private void validateUniqueName(Long userId, String name, Long excludeId) {
        LambdaQueryWrapper<FinAccount> wrapper =
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getName, name)
                        .eq(FinAccount::getStatus, 1);
        if (excludeId != null) {
            // 更新时排除自身
            wrapper.ne(FinAccount::getAccountId, excludeId);
        }
        if (this.count(wrapper) > 0) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "账户名称已存在");
        }
    }
}
