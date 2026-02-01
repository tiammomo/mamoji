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


/** Report Service Implementation */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final FinTransactionMapper transactionMapper;
    private final FinAccountMapper accountMapper;
    private final FinCategoryMapper categoryMapper;

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

    @Override
    public List<CategoryReportVO> getIncomeExpenseReport(Long userId, ReportQueryDTO request) {
        LocalDate startDate = getStartDate(request);
        LocalDate endDate = getEndDate(request);
        List<FinTransaction> transactions = getTransactions(userId, startDate, endDate);
        return TransactionAggregator.aggregateByCategory(transactions, categoryMapper);
    }

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

    @Override
    public Map<String, Object> getBalanceSheet(Long userId) {
        List<FinAccount> accounts = getAccounts(userId);
        return buildBalanceSheet(accounts);
    }

    @Override
    public List<TrendVO> getTrendReport(
            Long userId, LocalDate startDate, LocalDate endDate, String period) {
        List<FinTransaction> transactions = getTransactions(userId, startDate, endDate);
        Map<String, List<FinTransaction>> grouped =
                TransactionAggregator.aggregateByPeriod(transactions, startDate, endDate, period);
        return buildTrendList(grouped);
    }

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

    // ==================== Private Helper Methods ====================

    private LocalDate getStartDate(ReportQueryDTO request) {
        return request.getStartDate() != null
                ? request.getStartDate()
                : LocalDate.now().withDayOfMonth(1);
    }

    private LocalDate getEndDate(ReportQueryDTO request) {
        return request.getEndDate() != null ? request.getEndDate() : LocalDate.now();
    }

    private BigDecimal getTotalByType(Long userId, LocalDate start, LocalDate end, String type) {
        BigDecimal total =
                transactionMapper.sumAmountByUserTypeAndDateRange(
                        userId,
                        type,
                        DateRangeUtils.startOfDay(start),
                        DateRangeUtils.endOfDay(end));
        return total != null ? total : BigDecimal.ZERO;
    }

    private Long getTransactionCount(Long userId, LocalDate start, LocalDate end) {
        return transactionMapper.selectCount(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, DateRangeUtils.startOfDay(start))
                        .le(FinTransaction::getOccurredAt, DateRangeUtils.endOfDay(end)));
    }

    private Long getAccountCount(Long userId) {
        return accountMapper.selectCount(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getStatus, 1));
    }

    private List<FinTransaction> getTransactions(Long userId, LocalDate start, LocalDate end) {
        return transactionMapper.selectList(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, DateRangeUtils.startOfDay(start))
                        .le(FinTransaction::getOccurredAt, DateRangeUtils.endOfDay(end)));
    }

    private List<FinAccount> getAccounts(Long userId) {
        return accountMapper.selectList(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getStatus, 1));
    }

    private Map<String, Object> buildBalanceSheet(List<FinAccount> accounts) {
        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;
        List<Map<String, Object>> assetList = new ArrayList<>();
        List<Map<String, Object>> liabilityList = new ArrayList<>();

        for (FinAccount account : accounts) {
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

    private Double calculateChangePercent(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) == 0 ? 0.0 : 100.0;
        }
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
