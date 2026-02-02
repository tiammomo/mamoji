/**
 * 项目名称: Mamoji 记账系统
 * 文件名: ReportServiceImpl.java
 * 功能描述: 报表服务实现类，提供收支汇总、分类报表、趋势分析、资产负债表等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.report.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.common.aggregator.TransactionAggregator;
import com.mamoji.common.utils.DateRangeUtils;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.dto.TrendVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 报表服务实现类
 * 负责处理财务报表相关的业务逻辑，包括：
 * - 收支汇总统计（总收入、总支出、净收入）
 * - 分类报表（按分类汇总收支）
 * - 趋势分析（日/周/月/年趋势）
 * - 资产负债表（资产、负债、净资产）
 * - 环比增长率计算
 *
 * 报表数据来源：
 * - 交易记录表（fin_transaction）：计算收支汇总、分类报表、趋势数据
 * - 账户表（fin_account）：计算资产负债表
 * - 分类表（fin_category）：获取分类名称
 *
 * 报表类型说明：
 * - SummaryVO: 汇总报表（总收入、总支出、交易数、账户数）
 * - CategoryReportVO: 分类报表（按分类的收支明细）
 * - TrendVO: 趋势报表（含环比变化百分比）
 * - 资产负债表: 资产、负债、净资产汇总
 *
 * @see ReportService 报表服务接口
 * @see SummaryVO 汇总响应对象
 * @see CategoryReportVO 分类报表响应对象
 * @see TrendVO 趋势报表响应对象
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    /** 交易记录 Mapper，用于查询交易数据 */
    private final FinTransactionMapper transactionMapper;

    /** 账户 Mapper，用于查询账户数据 */
    private final FinAccountMapper accountMapper;

    /** 分类 Mapper，用于获取分类信息 */
    private final FinCategoryMapper categoryMapper;

    // ==================== 汇总报表方法 ====================

    /**
     * 获取收支汇总信息
     * 汇总指定时间范围内的收支情况，包括：
     * - totalIncome: 总收入
     * - totalExpense: 总支出
     * - netIncome: 净收入（收入 - 支出）
     * - transactionCount: 交易笔数
     * - accountCount: 账户数量
     *
     * 时间范围默认值：
     * - startDate: 当月第一天
     * - endDate: 当前日期
     *
     * @param userId  当前用户ID
     * @param request 报表查询条件（时间范围等）
     * @return 收支汇总信息（VO 格式）
     */
    @Override
    public SummaryVO getSummary(Long userId, ReportQueryDTO request) {
        LocalDate startDate = getStartDate(request);
        LocalDate endDate = getEndDate(request);

        BigDecimal totalIncome = getTotalByType(userId, startDate, endDate, "income");
        BigDecimal totalExpense = getTotalByType(userId, startDate, endDate, "expense");
        Long txCount = getTransactionCount(userId, startDate, endDate);
        Long accCount = getAccountCount(userId);

        return SummaryVO.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netIncome(totalIncome.subtract(totalExpense))
                .transactionCount(txCount != null ? txCount.intValue() : 0)
                .accountCount(accCount != null ? accCount.intValue() : 0)
                .build();
    }

    // ==================== 分类报表方法 ====================

    /**
     * 获取分类收支报表
     * 按分类汇总指定时间范围内的收支明细，
     * 返回每个分类的收入合计、支出合计以及交易笔数。
     *
     * 报表数据包括：
     * - 分类ID、分类名称
     * - 收入合计（该分类下的所有收入交易）
     * - 支出合计（该分类下的所有支出交易）
     * - 交易笔数
     *
     * @param userId  当前用户ID
     * @param request 报表查询条件（时间范围等）
     * @return 分类报表列表（按收支差值降序排列）
     */
    @Override
    public List<CategoryReportVO> getIncomeExpenseReport(Long userId, ReportQueryDTO request) {
        LocalDate startDate = getStartDate(request);
        LocalDate endDate = getEndDate(request);
        List<FinTransaction> transactions = getTransactions(userId, startDate, endDate);
        return TransactionAggregator.aggregateByCategory(transactions, categoryMapper);
    }

    // ==================== 趋势报表方法 ====================

    /**
     * 获取月度收支趋势
     * 按日汇总指定年月的每日收支数据，
     * 返回每天的收入、支出、净收入以及交易笔数。
     *
     * @param userId 当前用户ID
     * @param year   年份
     * @param month  月份（1-12）
     * @return 月度趋势数据 Map
     */
     * 返回数据结构：
     * <ul>
     *   <li>year: 年份</li>
     *   <li>month: 月份</li>
     *   <li>dailyData: 每日数据列表</li>
     *   <li>totalIncome: 当月总收入</li>
     *   <li>totalExpense: 当月总支出</li>
     *   <li>netIncome: 当月净收入</li>
     * </ul>
     * </p>
     *
     * @param userId 当前用户ID
     * @param year   年份
     * @param month  月份（1-12）
     * @return 月度趋势数据 Map
     */
    @Override
    public Map<String, Object> getMonthlyTrend(Long userId, Integer year, Integer month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);
        List<FinTransaction> transactions = getTransactions(userId, startDate, endDate);
        Map<String, Object> result =
                TransactionAggregator.aggregateByDay(transactions, startDate, endDate);
        result.put("year", year);
        result.put("month", month);
        return result;
    }

    /**
     * 获取自定义时间范围的趋势报表
     * 按指定周期（日/周/月/年）汇总交易数据，
     * 并计算相邻周期的环比变化百分比。
     *
     * 周期说明：
     * - daily: 按天汇总
     * - weekly: 按周汇总
     * - monthly: 按月汇总
     * - yearly: 按年汇总
     *
     * @param userId    当前用户ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @param period    周期类型（daily/weekly/monthly/yearly）
     * @return 趋势报表列表（按时间升序排列）
     */
    @Override
    public List<TrendVO> getTrendReport(
            Long userId, LocalDate startDate, LocalDate endDate, String period) {
        List<FinTransaction> transactions = getTransactions(userId, startDate, endDate);
        Map<String, List<FinTransaction>> grouped =
                TransactionAggregator.aggregateByPeriod(transactions, startDate, endDate, period);
        return buildTrendList(grouped);
    }

    /**
     * 获取指定日期范围内的每日数据
     * 按日汇总交易数据，返回每日汇总信息。
     *
     * @param userId    当前用户ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 每日数据 Map（包含 totalIncome, totalExpense, netIncome）
     */
    @Override
    public Map<String, Object> getDailyDataByDateRange(
            Long userId, LocalDate startDate, LocalDate endDate) {
        List<FinTransaction> transactions = getTransactions(userId, startDate, endDate);
        Map<String, Object> result =
                TransactionAggregator.aggregateByDay(transactions, startDate, endDate);
        result.put("totalIncome", result.remove("income"));
        result.put("totalExpense", result.remove("expense"));
        result.put("netIncome", result.remove("netIncome"));
        return result;
    }

    // ==================== 资产负债表方法 ====================

    /**
     * 获取资产负债表
     * 汇总用户所有账户的资产和负债情况：
     * - totalAssets: 总资产（现金、银行存款、投资等）
     * - totalLiabilities: 总负债（信用卡、贷款等）
     * - netAssets: 净资产（总资产 - 总负债）
     * - assets: 资产明细列表
     * - liabilities: 负债明细列表
     *
     * 账户类型说明：
     * - 资产类: bank, cash, alipay, wechat, stock, fund
     * - 负债类: credit, debt
     *
     * @param userId 当前用户ID
     * @return 资产负债表数据 Map
     */
    @Override
    public Map<String, Object> getBalanceSheet(Long userId) {
        List<FinAccount> accounts = getAccounts(userId);
        return buildBalanceSheet(accounts);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 获取查询开始日期
     * 如果请求中指定了开始日期则使用指定值，
     * 否则默认为当月第一天。
     *
     * @param request 报表查询条件
     * @return 开始日期
     */
    private LocalDate getStartDate(ReportQueryDTO request) {
        return request.getStartDate() != null
                ? request.getStartDate()
                : LocalDate.now().withDayOfMonth(1);
    }

    /**
     * 获取查询结束日期
     * 如果请求中指定了结束日期则使用指定值，
     * 否则默认为当前日期。
     *
     * @param request 报表查询条件
     * @return 结束日期
     */
    private LocalDate getEndDate(ReportQueryDTO request) {
        return request.getEndDate() != null ? request.getEndDate() : LocalDate.now();
    }

    /**
     * 按类型查询指定时间范围内的金额总和
     *
     * @param userId 当前用户ID
     * @param start  开始日期
     * @param end    结束日期
     * @param type   交易类型（income/expense）
     * @return 金额总和（如果无数据则返回 0）
     */
    private BigDecimal getTotalByType(Long userId, LocalDate start, LocalDate end, String type) {
        BigDecimal total =
                transactionMapper.sumAmountByUserTypeAndDateRange(
                        userId,
                        type,
                        DateRangeUtils.startOfDay(start),
                        DateRangeUtils.endOfDay(end));
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * 查询指定时间范围内的交易笔数
     *
     * @param userId 当前用户ID
     * @param start  开始日期
     * @param end    结束日期
     * @return 交易笔数
     */
    private Long getTransactionCount(Long userId, LocalDate start, LocalDate end) {
        return transactionMapper.selectCount(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, DateRangeUtils.startOfDay(start))
                        .le(FinTransaction::getOccurredAt, DateRangeUtils.endOfDay(end)));
    }

    /**
     * 查询用户有效账户数量
     *
     * @param userId 当前用户ID
     * @return 账户数量
     */
    private Long getAccountCount(Long userId) {
        return accountMapper.selectCount(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getStatus, 1));
    }

    /**
     * 查询指定时间范围内的交易记录
     *
     * @param userId 当前用户ID
     * @param start  开始日期
     * @param end    结束日期
     * @return 交易记录列表
     */
    private List<FinTransaction> getTransactions(Long userId, LocalDate start, LocalDate end) {
        return transactionMapper.selectList(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, DateRangeUtils.startOfDay(start))
                        .le(FinTransaction::getOccurredAt, DateRangeUtils.endOfDay(end)));
    }

    /**
     * 查询用户所有有效账户
     *
     * @param userId 当前用户ID
     * @return 账户列表
     */
    private List<FinAccount> getAccounts(Long userId) {
        return accountMapper.selectList(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getStatus, 1));
    }

    /**
     * 构建资产负债表
     * 将账户列表按资产和负债分类计算汇总值。
     *
     * @param accounts 账户列表
     * @return 资产负债表 Map
     */
    private Map<String, Object> buildBalanceSheet(List<FinAccount> accounts) {
        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;
        List<Map<String, Object>> assetList = new ArrayList<>();
        List<Map<String, Object>> liabilityList = new ArrayList<>();

        for (FinAccount account : accounts) {
            // 排除不计入净资产的账户
            if (account.getIncludeInTotal() != null && account.getIncludeInTotal() == 0) {
                continue;
            }
            BigDecimal balance =
                    account.getBalance() != null ? account.getBalance().abs() : BigDecimal.ZERO;
            Map<String, Object> item =
                    Map.of(
                            "accountId", account.getAccountId(),
                            "name", account.getName(),
                            "type", account.getAccountType(),
                            "subType",
                                    account.getAccountSubType() != null
                                            ? account.getAccountSubType()
                                            : "",
                            "balance", balance);

            // 区分资产和负债
            if ("credit".equals(account.getAccountType())
                    || "debt".equals(account.getAccountType())) {
                totalLiabilities = totalLiabilities.add(balance);
                liabilityList.add(item);
            } else {
                totalAssets = totalAssets.add(balance);
                assetList.add(item);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalAssets", totalAssets);
        result.put("totalLiabilities", totalLiabilities);
        result.put("netAssets", totalAssets.subtract(totalLiabilities));
        result.put("assets", assetList);
        result.put("liabilities", liabilityList);
        return result;
    }

    /**
     * 构建趋势报表列表
     * 将分组后的交易数据转换为趋势 VO 列表，
     * 并计算每个周期与前一周期的环比变化百分比。
     *
     * @param grouped 按周期分组的交易数据
     * @return 趋势报表列表
     */
    private List<TrendVO> buildTrendList(Map<String, List<FinTransaction>> grouped) {
        List<TrendVO> trendList = new ArrayList<>();
        TrendVO previous = null;

        for (List<FinTransaction> txs : grouped.values()) {
            Map<String, BigDecimal> totals = TransactionAggregator.calculateTotals(txs);
            TrendVO vo =
                    TrendVO.builder()
                            .period(
                                    grouped.entrySet().stream()
                                            .filter(e -> e.getValue() == txs)
                                            .map(Map.Entry::getKey)
                                            .findFirst()
                                            .orElse(""))
                            .income(totals.get("income"))
                            .expense(totals.get("expense"))
                            .netIncome(totals.get("netIncome"))
                            .transactionCount(txs.size())
                            .build();

            // 计算环比变化百分比
            if (previous != null) {
                vo.setIncomeChangePercent(
                        calculateChangePercent(vo.getIncome(), previous.getIncome()));
                vo.setExpenseChangePercent(
                        calculateChangePercent(vo.getExpense(), previous.getExpense()));
                vo.setNetIncomeChangePercent(
                        calculateChangePercent(vo.getNetIncome(), previous.getNetIncome()));
            } else {
                vo.setIncomeChangePercent(0.0);
                vo.setExpenseChangePercent(0.0);
                vo.setNetIncomeChangePercent(0.0);
            }
            previous = vo;
            trendList.add(vo);
        }
        return trendList;
    }

    /**
     * 计算环比变化百分比
     * <p>
     * 公式：(当前值 - 上期值) / 上期值 * 100
     * </p>
     * <p>
     *特殊情况处理：
     * <ul>
     *   <li>上期值为 0，当前值也为 0：返回 0%</li>
     *   <li>上期值为 0，当前值不为 0：返回 100%</li>
     * </ul>
     * </p>
     *
     * @param current 当前值
     * @param previous 上期值
     * @return 变化百分比（保留 2 位小数）
     */
    private Double calculateChangePercent(BigDecimal current, BigDecimal previous) {
        // 处理边界情况
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) == 0 ? 0.0 : 100.0;
        }
        // 计算变化百分比
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
