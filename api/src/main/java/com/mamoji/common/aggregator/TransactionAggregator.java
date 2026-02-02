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
 * 交易聚合工具类
 * 用于报表生成时的数据聚合，提取 ReportServiceImpl 中的通用聚合逻辑
 */
public final class TransactionAggregator {

    /** 私有构造方法，防止实例化 */
    private TransactionAggregator() {}

    /**
     * 按分类聚合交易数据
     * 计算每个分类的收入合计、支出合计和交易笔数
     *
     * @param transactions 待聚合的交易列表
     * @param categoryMapper 分类 Mapper，用于获取分类名称
     * @return 分类报表 VO 列表
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

        // 计算占比
        for (CategoryReportVO vo : categoryMap.values()) {
            BigDecimal total = "INCOME".equalsIgnoreCase(vo.getType()) ? totalIncome : totalExpense;
            vo.setPercentage(calculatePercentage(vo.getAmount(), total));
        }

        return new ArrayList<>(categoryMap.values());
    }

    /**
     * 按天聚合交易数据
     * 生成指定时间范围内每天的收支汇总
     *
     * @param transactions 待聚合的交易列表
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 包含每日数据列表和汇总信息的 Map
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

        // 构建每日数据列表
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
     * 按周期聚合交易数据
     * 支持按日、周、月进行聚合
     *
     * @param transactions 待聚合的交易列表
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param period 周期类型，支持 daily、weekly、monthly
     * @return 以周期为键的分组 Map
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
                        default -> tx.getOccurredAt().toLocalDate().toString();
                    };

            periodMap.computeIfAbsent(periodKey, k -> new ArrayList<>()).add(tx);
        }

        return periodMap;
    }

    /**
     * 计算金额占总金额的百分比
     *
     * @param amount 金额
     * @param total 总金额
     * @return 百分比数值
     */
    public static Double calculatePercentage(BigDecimal amount, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        return amount.multiply(BigDecimal.valueOf(100))
                .divide(total, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    /** 创建默认的每日数据 Map，收入和支出都为 0 */
    private static Map<String, BigDecimal> createDefaultDayData() {
        Map<String, BigDecimal> dayData = new HashMap<>();
        dayData.put("income", BigDecimal.ZERO);
        dayData.put("expense", BigDecimal.ZERO);
        return dayData;
    }

    /** 创建单日数据项 */
    private static Map<String, Object> createDayItem(int day, Map<String, BigDecimal> dayData) {
        Map<String, Object> dayItem = new HashMap<>();
        dayItem.put("day", day);
        dayItem.put("income", dayData.getOrDefault("income", BigDecimal.ZERO));
        dayItem.put("expense", dayData.getOrDefault("expense", BigDecimal.ZERO));
        return dayItem;
    }

    /** 从日期时间获取年内周数 */
    private static int getWeekOfYear(java.time.LocalDateTime dateTime) {
        return dateTime.getDayOfYear() / 7 + 1;
    }

    /**
     * 计算交易列表的汇总数据
     *
     * @param transactions 交易列表
     * @return 包含收入、支出、净收入的 Map
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
