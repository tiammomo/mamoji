/**
 * 项目名称: Mamoji 记账系统
 * 文件名: BudgetServiceImpl.java
 * 功能描述: 预算服务实现类，提供预算的 CRUD、进度跟踪、花费计算等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.budget.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.factory.DtoConverter;
import com.mamoji.common.result.ResultCode;
import com.mamoji.common.service.AbstractCrudService;
import com.mamoji.common.utils.DateRangeUtils;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.entity.FinBudget;
import com.mamoji.module.budget.mapper.FinBudgetMapper;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 预算服务实现类
 * 负责处理预算相关的业务逻辑，包括：
 * - 预算的增删改查（CRUD）
 * - 预算进度计算（已花费、剩余金额、进度百分比）
 * - 预算状态跟踪（进行中/已完成/超支）
 * - 实时花费重新计算（交易变更时触发）
 * - 活跃预算查询（仅查询状态为进行中的预算）
 *
 * 预算状态说明：
 * - 0: 已取消（用户主动停用）
 * - 1: 进行中（预算在有效期内，且未超支）
 * - 2: 已完成（预算期结束，未超支）
 * - 3: 超支（已花费超过预算金额）
 *
 * 预算使用场景：
 * - 餐饮预算：控制每月餐饮支出不超过指定金额
 * - 娱乐预算：限制娱乐消费在预算范围内
 * - 旅行预算：规划旅行总支出上限
 *
 * @see BudgetService 预算服务接口
 * @see FinBudget 预算实体
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetServiceImpl
        extends AbstractCrudService<FinBudgetMapper, FinBudget, BudgetVO>
        implements BudgetService {

    /** 交易 Mapper，用于查询关联的交易花费 */
    private final FinTransactionMapper transactionMapper;

    /** DTO 转换器，用于实体与 VO/DTO 之间的转换 */
    private final DtoConverter dtoConverter;

    // ==================== 抽象方法实现 ====================

    /**
     * 将预算实体转换为 VO 对象
     * <p>
     * 转换时自动计算：
     * <ul>
     *   <li>spent: 已花费金额（从实体获取或计算）</li>
     *   <li>remaining: 剩余金额（预算金额 - 已花费）</li>
     *   <li>progress: 进度百分比（已花费/预算金额）</li>
     *   <li>status: 预算状态（进行中/已完成/超支）</li>
     *   <li>statusText: 状态中文描述</li>
     * </ul>
     * </p>
     *
     * @param entity 预算实体
     * @return 预算响应 VO（包含计算后的进度信息）
     */
    @Override
    protected BudgetVO toVO(FinBudget entity) {
        BudgetVO vo = dtoConverter.convertBudget(entity);
        BigDecimal amount = entity.getAmount() != null ? entity.getAmount() : BigDecimal.ZERO;
        BigDecimal spent = entity.getSpent() != null ? entity.getSpent() : BigDecimal.ZERO;
        Integer status = determineStatus(spent, amount);

        vo.setSpent(spent);
        vo.setRemaining(amount.subtract(spent));
        vo.setProgress(
                amount.compareTo(BigDecimal.ZERO) == 0
                        ? 0.0
                        : spent.multiply(BigDecimal.valueOf(100))
                                .divide(amount, 2, RoundingMode.HALF_UP)
                                .doubleValue());
        vo.setStatus(status);
        vo.setStatusText(getStatusText(status));
        return vo;
    }

    /**
     * 验证预算归属权
     * <p>
     * 确保只有预算所有者才能对其进行操作
     * </p>
     *
     * @param userId 当前用户ID
     * @param entity 要验证的预算实体
     * @throws BusinessException 预算不属于当前用户
     */
    @Override
    protected void validateOwnership(Long userId, FinBudget entity) {
        if (!entity.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND);
        }
    }

    /**
     * 根据 ID 获取预算并验证归属权（忽略软删除）
     *
     * @param userId 当前用户ID
     * @param id     预算ID
     * @return 预算实体
     * @throws BusinessException 预算不存在或无权限
     */
    @Override
    protected FinBudget getByIdWithValidation(Long userId, Long id) {
        FinBudget entity = this.baseMapper.selectByIdIgnoreLogicDelete(id);
        if (entity == null) {
            throw new BusinessException(ResultCode.BUDGET_NOT_FOUND.getCode(), "预算不存在");
        }
        validateOwnership(userId, entity);
        return entity;
    }

    // ==================== 查询方法 ====================

    /**
     * 获取当前用户的所有预算列表
     * <p>
     * 返回状态不为"已取消"的预算，按创建时间倒序
     * </p>
     *
     * @param userId 当前用户ID
     * @return 预算列表（VO 格式，包含进度信息）
     */
    @Override
    public List<BudgetVO> listBudgets(Long userId) {
        return dtoConverter.convertBudgetList(
                this.list(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, userId)
                                .ne(FinBudget::getStatus, 0)
                                .orderByDesc(FinBudget::getCreatedAt)));
    }

    /**
     * 获取当前用户的所有进行中预算列表
     * <p>
     * 仅返回状态为"进行中"的预算，
     * 用于首页仪表盘展示当前生效的预算
     * </p>
     *
     * @param userId 当前用户ID
     * @return 进行中的预算列表（VO 格式）
     */
    @Override
    public List<BudgetVO> listActiveBudgets(Long userId) {
        return dtoConverter.convertBudgetList(
                this.list(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, userId)
                                .eq(FinBudget::getStatus, 1)
                                .orderByDesc(FinBudget::getCreatedAt)));
    }

    /**
     * 获取单个预算详情
     *
     * @param userId   当前用户ID
     * @param budgetId 预算ID
     * @return 预算详情（VO 格式，包含进度信息）
     * @throws BusinessException 预算不存在或无权限
     */
    @Override
    public BudgetVO getBudget(Long userId, Long budgetId) {
        FinBudget budget = getByIdWithValidation(userId, budgetId);
        return toVO(budget);
    }

    // ==================== 创建方法 ====================

    /**
     * 创建新预算
     *
     * 创建流程：
     * 1. 验证日期范围（结束日期不能早于开始日期）
     * 2. 构建预算实体（初始花费为 0）
     * 3. 保存到数据库
     * 4. 记录操作日志
     *
     * @param userId  当前用户ID
     * @param request 预算创建请求数据
     * @return 创建成功的预算ID
     * @throws BusinessException 日期范围无效
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createBudget(Long userId, BudgetDTO request) {
        // 验证日期范围
        validateDateRange(request.getStartDate(), request.getEndDate());

        // 构建预算实体
        FinBudget budget =
                FinBudget.builder()
                        .userId(userId)
                        .name(request.getName())
                        .amount(request.getAmount())
                        .spent(BigDecimal.ZERO) // 初始花费为 0
                        .startDate(request.getStartDate())
                        .endDate(request.getEndDate())
                        .status(1) // 状态为1表示进行中
                        .build();

        // 保存预算
        this.save(budget);
        log.info("预算创建成功: userId={}, name={}", userId, request.getName());
        return budget.getBudgetId();
    }

    // ==================== 更新方法 ====================

    /**
     * 更新预算信息
     * <p>
     * 可更新的字段：名称、预算金额、开始日期、结束日期
     * 更新时自动重新计算状态（根据新金额和已花费判断）
     * </p>
     *
     * @param userId   当前用户ID
     * @param budgetId 要更新的预算ID
     * @param request  新的预算信息
     * @throws BusinessException 预算不存在、无权限或日期范围无效
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateBudget(Long userId, Long budgetId, BudgetDTO request) {
        // 验证预算存在且属于当前用户
        FinBudget budget = getByIdWithValidation(userId, budgetId);

        // 验证日期范围（如果同时提供了开始和结束日期）
        if (request.getStartDate() != null && request.getEndDate() != null) {
            validateDateRange(request.getStartDate(), request.getEndDate());
        }

        // 计算新状态
        BigDecimal newAmount =
                request.getAmount() != null ? request.getAmount() : budget.getAmount();
        BigDecimal newSpent = budget.getSpent() != null ? budget.getSpent() : BigDecimal.ZERO;
        Integer newStatus = determineStatus(newSpent, newAmount);

        // 更新预算信息
        this.update(
                new LambdaUpdateWrapper<FinBudget>()
                        .eq(FinBudget::getBudgetId, budgetId)
                        .set(FinBudget::getName, request.getName())
                        .set(request.getAmount() != null, FinBudget::getAmount, request.getAmount())
                        .set(
                                request.getStartDate() != null,
                                FinBudget::getStartDate,
                                request.getStartDate())
                        .set(
                                request.getEndDate() != null,
                                FinBudget::getEndDate,
                                request.getEndDate())
                        .set(newStatus != null, FinBudget::getStatus, newStatus));

        log.info("预算已更新: budgetId={}", budgetId);
    }

    // ==================== 删除方法 ====================

    /**
     * 删除预算（硬删除）
     * <p>
     * 预算数据较为敏感，采用硬删除而非软删除
     * </p>
     *
     * @param userId   当前用户ID
     * @param budgetId 要删除的预算ID
     * @throws BusinessException 预算不存在或无权限
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteBudget(Long userId, Long budgetId) {
        // 验证预算存在且属于当前用户
        getByIdWithValidation(userId, budgetId);

        // 硬删除
        this.removeById(budgetId);
        log.info("预算已删除: budgetId={}", budgetId);
    }

    // ==================== 花销计算方法 ====================

    /**
     * 重新计算预算花费
     * <p>
     * 根据预算的时间范围，查询该期间内所有关联分类的支出交易，
     * 计算总花费并更新预算的 spent 字段和状态。
     * </p>
     * <p>
     * 调用场景：
     * <ul>
     *   <li>创建新交易且有关联预算时</li>
     *   <li>删除有关联预算的交易时</li>
     *   <li>取消退款时（需要重新计算原交易的预算花费）</li>
     * </ul>
     * </p>
     *
     * @param budgetId 预算ID
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recalculateSpent(Long budgetId) {
        // 查询预算
        FinBudget budget = this.baseMapper.selectById(budgetId);
        if (budget == null) return;

        // 查询预算时间范围内的支出总额
        BigDecimal spent =
                transactionMapper.sumExpenseByBudgetId(
                        budgetId,
                        DateRangeUtils.startOfDay(budget.getStartDate()),
                        DateRangeUtils.endOfDay(budget.getEndDate()));
        if (spent == null) spent = BigDecimal.ZERO;

        // 更新花费和状态
        this.update(
                new LambdaUpdateWrapper<FinBudget>()
                        .eq(FinBudget::getBudgetId, budgetId)
                        .set(FinBudget::getSpent, spent)
                        .set(FinBudget::getStatus, determineStatus(spent, budget.getAmount())));
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 验证日期范围有效性
     *
     * @param start 开始日期
     * @param end   结束日期
     * @throws BusinessException 结束日期早于开始日期
     */
    private void validateDateRange(java.time.LocalDate start, java.time.LocalDate end) {
        if (end.isBefore(start)) {
            throw new BusinessException(5001, "结束日期不能早于开始日期");
        }
    }

    /**
     * 根据已花费金额和预算金额确定预算状态
     * <p>
     * 状态判断逻辑：
     * <ul>
     *   <li>已花费 > 预算金额：超支（状态3）</li>
     *   <li>已花费 = 预算金额：已完成（状态2）</li>
     *   <li>已花费 < 预算金额：进行中（状态1）</li>
     * </ul>
     * </p>
     *
     * @param spent 已花费金额
     * @param amount 预算金额
     * @return 预算状态码
     */
    private Integer determineStatus(BigDecimal spent, BigDecimal amount) {
        int cmp = spent.compareTo(amount);
        return switch (cmp) {
            case 1 -> 3; // 超支
            case 0 -> 2; // 已完成
            default -> 1; // 进行中
        };
    }

    /**
     * 获取状态中文描述文本
     *
     * @param status 状态码
     * @return 状态中文描述
     */
    private String getStatusText(Integer status) {
        return switch (status) {
            case 0 -> "已取消";
            case 1 -> "进行中";
            case 2 -> "已完成";
            case 3 -> "超支";
            default -> "未知";
        };
    }
}
