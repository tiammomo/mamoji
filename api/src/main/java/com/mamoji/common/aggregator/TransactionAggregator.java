package com.mamoji.common.aggregator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.transaction.entity.FinTransaction;

/**
 * Transaction aggregation utilities for report generation. Extracts common aggregation patterns
 * from ReportServiceImpl.
 */
public final class TransactionAggregator {

    private TransactionAggregator() {
        // Utility class, no instantiation
    }

    /**
     * Aggregate transactions by category with income/expense totals.
     *
     * @param transactions the transactions to aggregate
     * @param categoryMapper the category mapper for category names
     * @return list of category reports
     */
    public static List<CategoryReportVO> aggregateByCategory(
            List<FinTransaction> transactions, FinCategoryMapper categoryMapper) {

        Map<Long, CategoryReportVO> categoryMap = new LinkedHashMap<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (FinTransaction tx : transactions) {
            Long categoryId = tx.getCategoryId();
            if (categoryId == null) {
                continue;
            }

            BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
            String type = tx.getType() != null ? tx.getType() : "expense";

            CategoryReportVO vo =
                    categoryMap.computeIfAbsent(
                            categoryId,
                            k -> {
                                String categoryName = "未知";
                                if (categoryMapper != null) {
                                    var category = categoryMapper.selectById(k);
                                    categoryName = category != null ? category.getName() : "未知";
                                }
                                return CategoryReportVO.builder()
                                        .categoryId(k)
                                        .categoryName(categoryName)
                                        .type(type)
                                        .amount(BigDecimal.ZERO)
                                        .count(0)
                                        .build();
                            });

            vo.setAmount(vo.getAmount().add(amount));
            vo.setCount(vo.getCount() + 1);

            if ("INCOME".equalsIgnoreCase(type)) {
                totalIncome = totalIncome.add(amount);
            } else {
                totalExpense = totalExpense.add(amount);
            }
        }

        // Calculate percentage
        for (CategoryReportVO vo : categoryMap.values()) {
            BigDecimal total = "INCOME".equalsIgnoreCase(vo.getType()) ? totalIncome : totalExpense;
            vo.setPercentage(calculatePercentage(vo.getAmount(), total));
        }

        return new ArrayList<>(categoryMap.values());
    }

    /**
     * Aggregate transactions by day for a month.
     *
     * @param transactions the transactions to aggregate
     * @param startDate the start date of the period
     * @param endDate the end date of the period
     * @return map containing dailyData list and totals
     */
    public static Map<String, Object> aggregateByDay(
            List<FinTransaction> transactions, LocalDate startDate, LocalDate endDate) {

        Map<Integer, Map<String, BigDecimal>> dailyMap = new LinkedHashMap<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (FinTransaction tx : transactions) {
            int day = tx.getOccurredAt().getDayOfMonth();
            BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
            String typeKey = "INCOME".equalsIgnoreCase(tx.getType()) ? "income" : "expense";

            dailyMap.computeIfAbsent(day, k -> createDefaultDayData())
                    .merge(typeKey, amount, BigDecimal::add);

            if ("INCOME".equalsIgnoreCase(tx.getType())) {
                totalIncome = totalIncome.add(amount);
            } else {
                totalExpense = totalExpense.add(amount);
            }
        }

        // Build daily data list
        List<Map<String, Object>> dailyData = new ArrayList<>();
        Map<String, BigDecimal> emptyDayData = createDefaultDayData();

        for (int day = 1; day <= endDate.getDayOfMonth(); day++) {
            Map<String, BigDecimal> dayData = dailyMap.getOrDefault(day, emptyDayData);
            dailyData.add(createDayItem(day, dayData));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate.toString());
        result.put("endDate", endDate.toString());
        result.put("totalIncome", totalIncome);
        result.put("totalExpense", totalExpense);
        result.put("netIncome", totalIncome.subtract(totalExpense));
        result.put("dailyData", dailyData);
        return result;
    }

    /**
     * Aggregate transactions by period (daily, weekly, monthly).
     *
     * @param transactions the transactions to aggregate
     * @param startDate the start date
     * @param endDate the end date
     * @param period the period type (daily, weekly, monthly)
     * @return map with period-keyed transaction lists
     */
    public static Map<String, List<FinTransaction>> aggregateByPeriod(
            List<FinTransaction> transactions,
            LocalDate startDate,
            LocalDate endDate,
            String period) {

        Map<String, List<FinTransaction>> periodMap = new LinkedHashMap<>();

        for (FinTransaction tx : transactions) {
            String periodKey =
                    switch (period.toLowerCase()) {
                        case "weekly" -> tx.getOccurredAt().getYear()
                                + "-W"
                                + String.format("%02d", getWeekOfYear(tx.getOccurredAt()));
                        case "monthly" -> tx.getOccurredAt().getYear()
                                + "-"
                                + String.format("%02d", tx.getOccurredAt().getMonthValue());
                        default -> tx.getOccurredAt().toLocalDate().toString(); // daily
                    };

            periodMap.computeIfAbsent(periodKey, k -> new ArrayList<>()).add(tx);
        }

        return periodMap;
    }

    /**
     * Calculate the percentage of amount relative to total.
     *
     * @param amount the amount
     * @param total the total
     * @return percentage as Double
     */
    public static Double calculatePercentage(BigDecimal amount, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        return amount.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /** Create default day data map with zero values. */
    private static Map<String, BigDecimal> createDefaultDayData() {
        Map<String, BigDecimal> dayData = new HashMap<>();
        dayData.put("income", BigDecimal.ZERO);
        dayData.put("expense", BigDecimal.ZERO);
        return dayData;
    }

    /** Create a day item for the daily data list. */
    private static Map<String, Object> createDayItem(int day, Map<String, BigDecimal> dayData) {
        Map<String, Object> dayItem = new HashMap<>();
        dayItem.put("day", day);
        dayItem.put("income", dayData.getOrDefault("income", BigDecimal.ZERO));
        dayItem.put("expense", dayData.getOrDefault("expense", BigDecimal.ZERO));
        return dayItem;
    }

    /** Get week of year from LocalDateTime. */
    private static int getWeekOfYear(java.time.LocalDateTime dateTime) {
        return dateTime.getDayOfYear() / 7 + 1;
    }

    /**
     * Calculate totals from transactions.
     *
     * @param transactions the transactions
     * @return map with income, expense, and netIncome
     */
    public static Map<String, BigDecimal> calculateTotals(List<FinTransaction> transactions) {
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (FinTransaction tx : transactions) {
            BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
            if ("INCOME".equalsIgnoreCase(tx.getType())) {
                totalIncome = totalIncome.add(amount);
            } else {
                totalExpense = totalExpense.add(amount);
            }
        }

        Map<String, BigDecimal> totals = new HashMap<>();
        totals.put("income", totalIncome);
        totals.put("expense", totalExpense);
        totals.put("netIncome", totalIncome.subtract(totalExpense));
        return totals;
    }
}
