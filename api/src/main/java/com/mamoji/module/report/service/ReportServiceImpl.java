package com.mamoji.module.report.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.dto.TrendVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
        LocalDate startDate =
                request.getStartDate() != null
                        ? request.getStartDate()
                        : LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        // Calculate total income using custom query
        BigDecimal totalIncome =
                transactionMapper.sumAmountByUserTypeAndDateRange(
                        userId, "income", startDate.atStartOfDay(), endDate.atTime(23, 59, 59));
        if (totalIncome == null) {
            totalIncome = BigDecimal.ZERO;
        }

        // Calculate total expense using custom query
        BigDecimal totalExpense =
                transactionMapper.sumAmountByUserTypeAndDateRange(
                        userId, "expense", startDate.atStartOfDay(), endDate.atTime(23, 59, 59));
        if (totalExpense == null) {
            totalExpense = BigDecimal.ZERO;
        }

        // Get transaction count
        Long transactionCount =
                transactionMapper.selectCount(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, userId)
                                .eq(FinTransaction::getStatus, 1)
                                .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                                .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59)));

        // Get account count
        Long accountCount =
                accountMapper.selectCount(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1));

        return SummaryVO.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netIncome(totalIncome.subtract(totalExpense))
                .transactionCount(transactionCount != null ? transactionCount.intValue() : 0)
                .accountCount(accountCount != null ? accountCount.intValue() : 0)
                .build();
    }

    @Override
    public List<CategoryReportVO> getIncomeExpenseReport(Long userId, ReportQueryDTO request) {
        LocalDate startDate =
                request.getStartDate() != null
                        ? request.getStartDate()
                        : LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        // Get all transactions in the period
        List<FinTransaction> transactions =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, userId)
                                .eq(FinTransaction::getStatus, 1)
                                .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                                .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59)));

        // Group by category
        Map<Long, CategoryReportVO> categoryMap = new LinkedHashMap<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (FinTransaction tx : transactions) {
            Long categoryId = tx.getCategoryId();
            if (categoryId == null) {
                continue;
            }

            BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;

            CategoryReportVO vo =
                    categoryMap.computeIfAbsent(
                            categoryId,
                            k -> {
                                FinCategory category = categoryMapper.selectById(k);
                                return CategoryReportVO.builder()
                                        .categoryId(k)
                                        .categoryName(category != null ? category.getName() : "未知")
                                        .type(tx.getType())
                                        .amount(BigDecimal.ZERO)
                                        .count(0)
                                        .build();
                            });

            vo.setAmount(vo.getAmount().add(amount));
            vo.setCount(vo.getCount() + 1);

            if ("income".equals(tx.getType())) {
                totalIncome = totalIncome.add(amount);
            } else {
                totalExpense = totalExpense.add(amount);
            }
        }

        // Calculate percentage
        for (CategoryReportVO vo : categoryMap.values()) {
            BigDecimal total = "income".equals(vo.getType()) ? totalIncome : totalExpense;
            if (total.compareTo(BigDecimal.ZERO) > 0) {
                Double percentage =
                        vo.getAmount()
                                .multiply(BigDecimal.valueOf(100))
                                .divide(total, 2, RoundingMode.HALF_UP)
                                .doubleValue();
                vo.setPercentage(percentage);
            } else {
                vo.setPercentage(0.0);
            }
        }

        return new ArrayList<>(categoryMap.values());
    }

    @Override
    public Map<String, Object> getMonthlyTrend(Long userId, Integer year, Integer month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        List<FinTransaction> transactions =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, userId)
                                .eq(FinTransaction::getStatus, 1)
                                .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                                .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59)));

        // Group by day
        Map<Integer, Map<String, BigDecimal>> dailyMap = new LinkedHashMap<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (FinTransaction tx : transactions) {
            int day = tx.getOccurredAt().getDayOfMonth();
            BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;

            dailyMap.computeIfAbsent(day, k -> new HashMap<>())
                    .merge(tx.getType(), amount, BigDecimal::add);

            if ("income".equals(tx.getType())) {
                totalIncome = totalIncome.add(amount);
            } else {
                totalExpense = totalExpense.add(amount);
            }
        }

        // Build result
        List<Map<String, Object>> dailyData = new ArrayList<>();
        for (int day = 1; day <= endDate.getDayOfMonth(); day++) {
            Map<String, BigDecimal> dayData =
                    dailyMap.getOrDefault(
                            day, Map.of("income", BigDecimal.ZERO, "expense", BigDecimal.ZERO));
            dailyData.add(
                    Map.of(
                            "day", day,
                            "income", dayData.getOrDefault("income", BigDecimal.ZERO),
                            "expense", dayData.getOrDefault("expense", BigDecimal.ZERO)));
        }

        return Map.of(
                "year", year,
                "month", month,
                "totalIncome", totalIncome,
                "totalExpense", totalExpense,
                "netIncome", totalIncome.subtract(totalExpense),
                "dailyData", dailyData);
    }

    @Override
    public Map<String, Object> getBalanceSheet(Long userId) {
        List<FinAccount> accounts =
                accountMapper.selectList(
                        new LambdaQueryWrapper<FinAccount>()
                                .eq(FinAccount::getUserId, userId)
                                .eq(FinAccount::getStatus, 1));

        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;

        List<Map<String, Object>> assetList = new ArrayList<>();
        List<Map<String, Object>> liabilityList = new ArrayList<>();

        for (FinAccount account : accounts) {
            BigDecimal balance =
                    account.getBalance() != null ? account.getBalance().abs() : BigDecimal.ZERO;
            Integer includeInTotal =
                    account.getIncludeInTotal() != null ? account.getIncludeInTotal() : 1;

            if (includeInTotal == 0) {
                continue;
            }

            String type = account.getAccountType();
            Map<String, Object> item =
                    Map.of(
                            "accountId",
                            account.getAccountId(),
                            "name",
                            account.getName(),
                            "type",
                            type,
                            "subType",
                            account.getAccountSubType() != null ? account.getAccountSubType() : "",
                            "balance",
                            balance);

            if ("credit".equals(type) || "debt".equals(type)) {
                totalLiabilities = totalLiabilities.add(balance);
                liabilityList.add(item);
            } else {
                totalAssets = totalAssets.add(balance);
                assetList.add(item);
            }
        }

        return Map.of(
                "totalAssets", totalAssets,
                "totalLiabilities", totalLiabilities,
                "netAssets", totalAssets.subtract(totalLiabilities),
                "assets", assetList,
                "liabilities", liabilityList);
    }

    @Override
    public List<TrendVO> getTrendReport(
            Long userId, LocalDate startDate, LocalDate endDate, String period) {
        List<FinTransaction> transactions =
                transactionMapper.selectList(
                        new LambdaQueryWrapper<FinTransaction>()
                                .eq(FinTransaction::getUserId, userId)
                                .eq(FinTransaction::getStatus, 1)
                                .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                                .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59)));

        // Group transactions by period
        Map<String, List<FinTransaction>> grouped = new LinkedHashMap<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            String key;
            LocalDate periodStart;
            LocalDate periodEnd;

            switch (period.toLowerCase()) {
                case "weekly":
                    // Week starts on Monday
                    LocalDate weekStart = current.minusDays(current.getDayOfWeek().getValue() - 1);
                    periodStart = weekStart;
                    periodEnd = weekStart.plusDays(6);
                    key = weekStart.toString();
                    current = periodEnd.plusDays(1);
                    break;
                case "monthly":
                    periodStart = current.withDayOfMonth(1);
                    periodEnd = current.withDayOfMonth(current.lengthOfMonth());
                    key = current.getYear() + "-" + String.format("%02d", current.getMonthValue());
                    current = periodEnd.plusDays(1);
                    break;
                default: // daily
                    periodStart = current;
                    periodEnd = current;
                    key = current.toString();
                    current = current.plusDays(1);
            }

            if (periodEnd.isAfter(endDate)) {
                periodEnd = endDate;
            }

            if (!periodStart.isAfter(endDate)) {
                final LocalDate ps = periodStart;
                final LocalDate pe = periodEnd;
                List<FinTransaction> periodTransactions =
                        transactions.stream()
                                .filter(
                                        t -> {
                                            LocalDate txDate = t.getOccurredAt().toLocalDate();
                                            return !txDate.isBefore(ps) && !txDate.isAfter(pe);
                                        })
                                .toList();
                grouped.put(key, periodTransactions);
            }
        }

        // Build trend data
        List<TrendVO> trendList = new ArrayList<>();
        List<TrendVO> previousList = new ArrayList<>();

        for (Map.Entry<String, List<FinTransaction>> entry : grouped.entrySet()) {
            BigDecimal income = BigDecimal.ZERO;
            BigDecimal expense = BigDecimal.ZERO;

            for (FinTransaction tx : entry.getValue()) {
                BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
                if ("income".equals(tx.getType())) {
                    income = income.add(amount);
                } else {
                    expense = expense.add(amount);
                }
            }

            TrendVO vo =
                    TrendVO.builder()
                            .period(entry.getKey())
                            .income(income)
                            .expense(expense)
                            .netIncome(income.subtract(expense))
                            .transactionCount(entry.getValue().size())
                            .build();

            previousList.add(vo);
            trendList.add(vo);
        }

        // Calculate change percentages
        for (int i = 0; i < trendList.size(); i++) {
            TrendVO trendVO = trendList.get(i);
            if (i > 0 && !previousList.isEmpty()) {
                TrendVO previous = previousList.get(i - 1);
                trendVO.setIncomeChangePercent(
                        calculateChangePercent(trendVO.getIncome(), previous.getIncome()));
                trendVO.setExpenseChangePercent(
                        calculateChangePercent(trendVO.getExpense(), previous.getExpense()));
                trendVO.setNetIncomeChangePercent(
                        calculateChangePercent(trendVO.getNetIncome(), previous.getNetIncome()));
            } else {
                trendVO.setIncomeChangePercent(0.0);
                trendVO.setExpenseChangePercent(0.0);
                trendVO.setNetIncomeChangePercent(0.0);
            }
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
