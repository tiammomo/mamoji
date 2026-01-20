package com.mamoji.module.report.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * Report Service Implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final FinTransactionMapper transactionMapper;
    private final FinAccountMapper accountMapper;
    private final FinCategoryMapper categoryMapper;

    @Override
    public SummaryVO getSummary(Long userId, ReportQueryDTO request) {
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        // Calculate total income using custom query
        BigDecimal totalIncome = transactionMapper.sumAmountByUserTypeAndDateRange(
                userId, "income", startDate.atStartOfDay(), endDate.atTime(23, 59, 59)
        );
        if (totalIncome == null) {
            totalIncome = BigDecimal.ZERO;
        }

        // Calculate total expense using custom query
        BigDecimal totalExpense = transactionMapper.sumAmountByUserTypeAndDateRange(
                userId, "expense", startDate.atStartOfDay(), endDate.atTime(23, 59, 59)
        );
        if (totalExpense == null) {
            totalExpense = BigDecimal.ZERO;
        }

        // Get transaction count
        Long transactionCount = transactionMapper.selectCount(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                        .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59))
        );

        // Get account count
        Long accountCount = accountMapper.selectCount(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getStatus, 1)
        );

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
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : LocalDate.now();

        // Get all transactions in the period
        List<FinTransaction> transactions = transactionMapper.selectList(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                        .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59))
        );

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

            CategoryReportVO vo = categoryMap.computeIfAbsent(categoryId, k -> {
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
                Double percentage = vo.getAmount()
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

        List<FinTransaction> transactions = transactionMapper.selectList(
                new LambdaQueryWrapper<FinTransaction>()
                        .eq(FinTransaction::getUserId, userId)
                        .eq(FinTransaction::getStatus, 1)
                        .ge(FinTransaction::getOccurredAt, startDate.atStartOfDay())
                        .le(FinTransaction::getOccurredAt, endDate.atTime(23, 59, 59))
        );

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
            Map<String, BigDecimal> dayData = dailyMap.getOrDefault(day, Map.of("income", BigDecimal.ZERO, "expense", BigDecimal.ZERO));
            dailyData.add(Map.of(
                    "day", day,
                    "income", dayData.getOrDefault("income", BigDecimal.ZERO),
                    "expense", dayData.getOrDefault("expense", BigDecimal.ZERO)
            ));
        }

        return Map.of(
                "year", year,
                "month", month,
                "totalIncome", totalIncome,
                "totalExpense", totalExpense,
                "netIncome", totalIncome.subtract(totalExpense),
                "dailyData", dailyData
        );
    }

    @Override
    public Map<String, Object> getBalanceSheet(Long userId) {
        List<FinAccount> accounts = accountMapper.selectList(
                new LambdaQueryWrapper<FinAccount>()
                        .eq(FinAccount::getUserId, userId)
                        .eq(FinAccount::getStatus, 1)
        );

        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;

        List<Map<String, Object>> assetList = new ArrayList<>();
        List<Map<String, Object>> liabilityList = new ArrayList<>();

        for (FinAccount account : accounts) {
            BigDecimal balance = account.getBalance() != null ? account.getBalance().abs() : BigDecimal.ZERO;
            Integer includeInTotal = account.getIncludeInTotal() != null ? account.getIncludeInTotal() : 1;

            if (includeInTotal == 0) {
                continue;
            }

            String type = account.getAccountType();
            Map<String, Object> item = Map.of(
                    "accountId", account.getAccountId(),
                    "name", account.getName(),
                    "type", type,
                    "subType", account.getAccountSubType() != null ? account.getAccountSubType() : "",
                    "balance", balance
            );

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
                "liabilities", liabilityList
        );
    }
}
