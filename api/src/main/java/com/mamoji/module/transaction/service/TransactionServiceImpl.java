/**
 * 项目名称: Mamoji 记账系统
 * 文件名: TransactionServiceImpl.java
 * 功能描述: 交易记录服务实现类，提供交易的增删改查、导入导出、预算关联等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.context.LedgerContextHolder;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.PageResult;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.utils.DateRangeUtils;
import com.mamoji.module.account.service.AccountService;
import com.mamoji.module.budget.service.BudgetService;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.transaction.dto.TransactionDTO;
import com.mamoji.module.transaction.dto.TransactionQueryDTO;
import com.mamoji.module.transaction.dto.TransactionVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import com.mamoji.module.transaction.strategy.TransactionStrategyFactory;
import com.mamoji.module.transaction.strategy.TransactionTypeStrategy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 交易记录服务实现类
 * 负责处理交易记录的核心业务逻辑，包括：
 * - 交易记录的增删改查（CRUD）
 * - 分页查询和条件筛选
 * - 最近交易记录获取
 * - 账户余额更新（收入增加、支出减少）
 * - 预算关联和花费计算
 * - 交易数据导入导出（CSV 格式）
 *
 * 交易类型说明：
 * - income: 收入交易（增加账户余额）
 * - expense: 支出交易（减少账户余额）
 * - refund: 退款交易（增加账户余额，相当于收入的反向操作）
 *
 * 账本隔离说明：
 * - 通过 LedgerContextHolder 获取当前请求的账本上下文
 * - 查询时自动过滤当前账本的交易记录
 * - 创建交易时自动关联当前账本
 *
 * @see TransactionService 交易服务接口
 * @see FinTransaction 交易记录实体
 * @see TransactionStrategyFactory 交易策略工厂
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl extends ServiceImpl<FinTransactionMapper, FinTransaction>
        implements TransactionService {

    /** 分类 Mapper，用于验证分类存在性 */
    private final FinCategoryMapper categoryMapper;

    /** 账户服务，用于更新账户余额和验证账户 */
    private final AccountService accountService;

    /** 预算服务，用于更新预算花费 */
    private final BudgetService budgetService;

    /** 交易策略工厂，用于计算不同类型交易的余额变化 */
    private final TransactionStrategyFactory strategyFactory;

    /** DTO 转换器，用于实体与 VO/DTO 之间的转换 */
    private final DtoConverter dtoConverter;

    // ==================== 查询方法 ====================

    /**
     * 分页查询交易记录列表
     * <p>
     * 支持多种筛选条件：
     * <ul>
     *   <li>按交易类型（收入/支出/退款）</li>
     *   <li>按账户 ID</li>
     *   <li>按分类 ID</li>
     *   <li>按日期范围</li>
     *   <li>按账本 ID（通过上下文自动获取）</li>
     * </ul>
     * </p>
     * <p>
     * 查询结果按发生时间倒序排列，支持分页
     * </p>
     *
     * @param userId  当前用户ID
     * @param request 查询条件（分页、筛选条件）
     * @return 分页后的交易记录列表
     */
    @Override
    public PageResult<TransactionVO> listTransactions(Long userId, TransactionQueryDTO request) {
        // 构建分页对象
        Page<FinTransaction> page =
                new Page<>(
                        request.getCurrent() != null ? request.getCurrent() : 1L,
                        request.getSize() != null ? request.getSize() : 20L);

        // 构建查询条件
        LambdaQueryWrapper<FinTransaction> wrapper =
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1);

        // 添加账本过滤（多账本支持）
        Long ledgerId = LedgerContextHolder.getLedgerId();
        if (ledgerId != null) {
            wrapper.eq(FinTransaction::getLedgerId, ledgerId);
        }

        // 添加筛选条件
        if (request.getType() != null && !request.getType().isEmpty()) {
            wrapper.eq(FinTransaction::getType, request.getType());
        }
        if (request.getAccountId() != null)
            wrapper.eq(FinTransaction::getAccountId, request.getAccountId());
        if (request.getCategoryId() != null)
            wrapper.eq(FinTransaction::getCategoryId, request.getCategoryId());

        // 日期范围筛选
        if (request.getStartDate() != null && request.getEndDate() != null) {
            wrapper.ge(
                            FinTransaction::getOccurredAt,
                            DateRangeUtils.startOfDay(request.getStartDate()))
                    .le(
                            FinTransaction::getOccurredAt,
                            DateRangeUtils.endOfDay(request.getEndDate()));
        }

        // 按发生时间倒序
        wrapper.orderByDesc(FinTransaction::getOccurredAt);

        // 执行查询
        IPage<FinTransaction> result = this.page(page, wrapper);

        // 转换为 VO 并返回分页结果
        return PageResult.of(
                result.getCurrent(),
                result.getSize(),
                result.getTotal(),
                dtoConverter.convertTransactionList(result.getRecords()));
    }

    /**
     * 获取单笔交易详情
     *
     * @param userId       当前用户ID
     * @param transactionId 交易记录ID
     * @return 交易记录详情（VO 格式）
     * @throws BusinessException 交易不存在、无权限或已删除
     */
    @Override
    public TransactionVO getTransaction(Long userId, Long transactionId) {
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null
                || !transaction.getUserId().equals(userId)
                || transaction.getStatus() != 1) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }
        return dtoConverter.convertTransaction(transaction);
    }

    /**
     * 根据 ID 查询交易实体（内部使用）
     *
     * @param transactionId 交易记录ID
     * @return 交易实体，找不到返回 null
     */
    @Override
    public FinTransaction findById(Long transactionId) {
        return this.getById(transactionId);
    }

    /**
     * 获取最近交易记录
     * <p>
     * 用于首页仪表盘展示最近 N 条交易
     * </p>
     *
     * @param userId    当前用户ID
     * @param accountId 可选的账户 ID 过滤
     * @param limit     返回记录数量限制
     * @return 最近的交易记录列表
     */
    @Override
    public List<TransactionVO> getRecentTransactions(Long userId, Long accountId, Integer limit) {
        LambdaQueryWrapper<FinTransaction> wrapper =
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .orderByDesc(FinTransaction::getOccurredAt)
                        .last("LIMIT " + (limit != null ? limit : 10));
        if (accountId != null) wrapper.eq(FinTransaction::getAccountId, accountId);
        return dtoConverter.convertTransactionList(this.list(wrapper));
    }

    // ==================== 创建方法 ====================

    /**
     * 创建交易记录
     * <p>
     * 创建流程：
     * <ol>
     *   <li>验证账户存在且属于当前用户</li>
     *   <li>验证分类存在且状态正常</li>
     *   <li>获取当前账本上下文（多账本支持）</li>
     *   <li>构建交易实体并保存</li>
     *   <li>更新账户余额（收入加、支出减）</li>
     *   <li>更新预算花费（如有关联预算）</li>
     * </ol>
     * </p>
     *
     * @param userId  当前用户ID
     * @param request 交易请求数据
     * @return 创建成功的交易记录ID
     * @throws BusinessException 账户不存在、分类不存在
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createTransaction(Long userId, TransactionDTO request) {
        // 验证账户和分类
        validateAccount(userId, request.getAccountId());
        validateCategory(request.getCategoryId());

        // 获取账本上下文（多账本支持）
        Long ledgerId = LedgerContextHolder.getLedgerId();

        // 构建交易实体
        FinTransaction transaction =
                FinTransaction.builder()
                        .userId(userId)
                        .ledgerId(ledgerId)
                        .accountId(request.getAccountId())
                        .categoryId(request.getCategoryId())
                        .budgetId(request.getBudgetId())
                        .refundId(request.getRefundId())
                        .type(request.getType())
                        .amount(request.getAmount())
                        .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
                        .occurredAt(
                                request.getOccurredAt() != null
                                        ? request.getOccurredAt()
                                        : LocalDateTime.now())
                        .note(request.getNote())
                        .status(1) // 状态为1表示正常
                        .build();

        // 保存交易
        this.save(transaction);

        // 更新账户余额
        applyBalanceChange(request.getAccountId(), request.getType(), request.getAmount(), true);

        // 更新预算花费
        handleBudgetUpdate(request, transaction);

        // 记录操作日志
        log.info(
                "交易创建成功: userId={}, type={}, amount={}",
                userId,
                request.getType(),
                request.getAmount());
        return transaction.getTransactionId();
    }

    // ==================== 更新方法 ====================

    /**
     * 更新交易记录
     * <p>
     * 更新规则：
     * <ul>
     *   <li>如果账户变更：先恢复原账户余额，再增加新账户余额</li>
     *   <li>如果金额或类型变更：计算差额并调整余额</li>
     *   <li>其他字段直接更新</li>
     * </ul>
     * </p>
     * <p>
     * 预算关联：
     * <ul>
     *   <li>删除旧预算关联的花费计算</li>
     *   <li>添加新预算关联的花费计算</li>
     * </ul>
     * </p>
     *
     * @param userId       当前用户ID
     * @param transactionId 要更新的交易ID
     * @param request       新的交易数据
     * @throws BusinessException 交易不存在、无权限
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateTransaction(Long userId, Long transactionId, TransactionDTO request) {
        // 验证交易存在且属于当前用户
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // 处理账户变更
        if (!transaction.getAccountId().equals(request.getAccountId())) {
            // 恢复原账户余额（撤销原交易影响）
            applyBalanceChange(
                    transaction.getAccountId(),
                    transaction.getType(),
                    transaction.getAmount(),
                    false);
            // 增加新账户余额（应用新交易影响）
            applyBalanceChange(
                    request.getAccountId(), request.getType(), request.getAmount(), true);
        } else if (!transaction.getAmount().equals(request.getAmount())
                || !transaction.getType().equals(request.getType())) {
            // 金额或类型变更：计算差额调整
            BigDecimal oldChange =
                    strategyFactory
                            .getStrategy(transaction.getType())
                            .calculateBalanceChange(transaction.getAmount());
            BigDecimal newChange =
                    strategyFactory
                            .getStrategy(request.getType())
                            .calculateBalanceChange(request.getAmount());
            accountService.updateBalance(request.getAccountId(), newChange.subtract(oldChange));
        }

        // 处理预算更新
        handleBudgetUpdateOnDelete(transaction);
        handleBudgetUpdate(request, transaction);

        // 更新交易字段
        this.update(
                new LambdaUpdateWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, transactionId)
                        .set(FinTransaction::getAccountId, request.getAccountId())
                        .set(FinTransaction::getCategoryId, request.getCategoryId())
                        .set(FinTransaction::getBudgetId, request.getBudgetId())
                        .set(FinTransaction::getType, request.getType())
                        .set(FinTransaction::getAmount, request.getAmount())
                        .set(
                                request.getOccurredAt() != null,
                                FinTransaction::getOccurredAt,
                                request.getOccurredAt())
                        .set(FinTransaction::getNote, request.getNote()));

        log.info("交易已更新: transactionId={}", transactionId);
    }

    // ==================== 删除方法 ====================

    /**
     * 删除交易记录（软删除）
     * <p>
     * 删除流程：
     * <ol>
     *   <li>验证交易存在且属于当前用户</li>
     *   <li>恢复账户余额（撤销交易影响）</li>
     *   <li>更新预算花费（移除该交易的花费）</li>
     *   <li>软删除：更新状态为 0</li>
     * </ol>
     * </p>
     *
     * @param userId       当前用户ID
     * @param transactionId 要删除的交易ID
     * @throws BusinessException 交易不存在或无权限
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTransaction(Long userId, Long transactionId) {
        // 验证交易存在且属于当前用户
        FinTransaction transaction = this.getById(transactionId);
        if (transaction == null || !transaction.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.TRANSACTION_NOT_FOUND);
        }

        // 恢复账户余额（撤销交易影响）
        applyBalanceChange(
                transaction.getAccountId(), transaction.getType(), transaction.getAmount(), false);

        // 更新预算花费
        if (transaction.getBudgetId() != null)
            budgetService.recalculateSpent(transaction.getBudgetId());

        // 软删除：更新状态为 0
        this.update(
                new LambdaUpdateWrapper<FinTransaction>()
                        .eq(FinTransaction::getTransactionId, transactionId)
                        .set(FinTransaction::getStatus, 0));

        log.info("交易已删除: transactionId={}", transactionId);
    }

    // ==================== 导入导出方法 ====================

    /**
     * 导出交易记录为 CSV 格式
     * <p>
     * CSV 格式：日期,类型,金额,分类,账户,备注
     * 类型显示为中文：收入/支出
     * </p>
     *
     * @param userId   当前用户ID
     * @param startDate 可选的开始日期（yyyy-MM-dd）
     * @param endDate   可选的结束日期（yyyy-MM-dd）
     * @param type      可选的交易类型过滤
     * @return CSV 格式的交易数据字符串
     */
    @Override
    public String exportTransactions(Long userId, String startDate, String endDate, String type) {
        // 构建查询条件
        LambdaQueryWrapper<FinTransaction> wrapper =
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1);

        // 日期范围筛选
        if (startDate != null && !startDate.isEmpty()) {
            wrapper.ge(
                    FinTransaction::getOccurredAt,
                    DateRangeUtils.startOfDay(java.time.LocalDate.parse(startDate)));
        }
        if (endDate != null && !endDate.isEmpty()) {
            wrapper.le(
                    FinTransaction::getOccurredAt,
                    DateRangeUtils.endOfDay(java.time.LocalDate.parse(endDate)));
        }
        if (type != null && !type.isEmpty()) wrapper.eq(FinTransaction::getType, type);
        wrapper.orderByDesc(FinTransaction::getOccurredAt);

        // 查询交易
        List<FinTransaction> transactions = this.list(wrapper);

        // 构建 CSV 内容
        StringBuilder csv = new StringBuilder("日期,类型,金额,分类,账户,备注\n");
        transactions.forEach(
                tx ->
                        csv.append(tx.getOccurredAt().toLocalDate())
                                .append(",")
                                .append("income".equals(tx.getType()) ? "收入" : "支出")
                                .append(",")
                                .append(tx.getAmount())
                                .append(",")
                                .append(tx.getCategoryId())
                                .append(",")
                                .append(tx.getAccountId())
                                .append(",")
                                .append(tx.getNote() != null ? tx.getNote() : "")
                                .append("\n"));
        return csv.toString();
    }

    /**
     * 预览导入数据
     * <p>
     * 在正式导入前，对数据进行预处理：
     * <ul>
     *   <li>设置默认货币（CNY）</li>
     *   <li>设置默认发生时间（当前时间）</li>
     * </ul>
     * </p>
     *
     * @param userId      当前用户ID
     * @param transactions 要导入的交易数据列表
     * @return 预处理后的交易数据列表
     */
    @Override
    public List<TransactionDTO> previewImport(Long userId, List<TransactionDTO> transactions) {
        return transactions.stream()
                .peek(
                        tx -> {
                            if (tx.getCurrency() == null) tx.setCurrency("CNY");
                            if (tx.getOccurredAt() == null) tx.setOccurredAt(LocalDateTime.now());
                        })
                .toList();
    }

    /**
     * 正式导入交易数据
     * <p>
     * 只有经过预览确认的数据才能导入
     * </p>
     *
     * @param userId      当前用户ID
     * @param transactions 已预览确认的交易数据列表
     * @return 成功导入的交易记录ID列表
     */
    @Override
    public List<Long> importTransactions(Long userId, List<TransactionDTO> transactions) {
        return transactions.stream().map(tx -> createTransaction(userId, tx)).toList();
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 验证账户存在且属于当前用户
     *
     * @param userId    当前用户ID
     * @param accountId 要验证的账户ID
     * @throws BusinessException 账户不存在
     */
    private void validateAccount(Long userId, Long accountId) {
        if (accountService.listAccounts(userId).stream()
                .noneMatch(a -> a.getAccountId().equals(accountId))) {
            throw new BusinessException(ResultCode.ACCOUNT_NOT_FOUND);
        }
    }

    /**
     * 验证分类存在且状态正常
     *
     * @param categoryId 要验证的分类ID
     * @throws BusinessException 分类不存在或已禁用
     */
    private void validateCategory(Long categoryId) {
        FinCategory category = categoryMapper.selectById(categoryId);
        if (category == null || category.getStatus() != 1) {
            throw new BusinessException(ResultCode.CATEGORY_NOT_FOUND);
        }
    }

    /**
     * 应用余额变更
     * <p>
     * 根据交易类型计算正确的余额变化方向：
     * <ul>
     *   <li>收入：增加余额</li>
     *   <li>支出：减少余额</li>
     *   <li>退款：增加余额（与支出相反）</li>
     * </ul>
     * </p>
     *
     * @param accountId  账户ID
     * @param type       交易类型
     * @param amount     交易金额
     * @param isPositive true=应用变更，false=撤销变更
     */
    private void applyBalanceChange(
            Long accountId, String type, BigDecimal amount, boolean isPositive) {
        TransactionTypeStrategy strategy = strategyFactory.getStrategy(type);
        BigDecimal change = strategy.calculateBalanceChange(amount);
        accountService.updateBalance(accountId, isPositive ? change : change.negate());
    }

    /**
     * 处理预算花费更新（创建/更新时）
     *
     * @param request    交易请求数据
     * @param transaction 已保存的交易实体
     */
    private void handleBudgetUpdate(TransactionDTO request, FinTransaction transaction) {
        TransactionTypeStrategy strategy = strategyFactory.getStrategy(request.getType());
        // 如果是支出类型且有关联预算，重新计算花费
        if (strategy.affectsBudget() && request.getBudgetId() != null) {
            budgetService.recalculateSpent(request.getBudgetId());
        }
        // 如果是退款且有关联原交易，也更新原交易的预算花费
        if ("refund".equals(request.getType()) && request.getRefundId() != null) {
            FinTransaction original = this.getById(request.getRefundId());
            if (original != null && original.getBudgetId() != null) {
                budgetService.recalculateSpent(original.getBudgetId());
            }
        }
    }

    /**
     * 处理预算花费更新（删除时）
     *
     * @param transaction 要删除的交易实体
     */
    private void handleBudgetUpdateOnDelete(FinTransaction transaction) {
        TransactionTypeStrategy strategy = strategyFactory.getStrategy(transaction.getType());
        if (strategy.affectsBudget() && transaction.getBudgetId() != null) {
            budgetService.recalculateSpent(transaction.getBudgetId());
        }
    }
}
