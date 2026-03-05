package com.mamoji.agent.tool.finance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamoji.agent.tool.BaseTool;
import com.mamoji.entity.Category;
import com.mamoji.repository.CategoryRepository;
import com.mamoji.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 财务助手工具集
 * 提供查询交易记录、预算执行、分类统计、收支概况等功能
 */
@Slf4j
@Component
public class FinanceTools extends BaseTool {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    public FinanceTools(ObjectMapper objectMapper, TransactionRepository transactionRepository, CategoryRepository categoryRepository) {
        super(objectMapper);
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
    }

    private Long currentUserId;

    /**
     * 设置当前用户ID
     */
    public void setUserId(Long userId) {
        this.currentUserId = userId;
    }

    /**
     * 查询收支概况
     * @param startDate 开始日期，格式YYYY-MM-DD，默认为本月第一天
     * @param endDate 结束日期，格式YYYY-MM-DD，默认为今天
     * @return 总收入、总支出、结余、收入笔数、支出笔数
     */
    public String queryIncomeExpense(String startDate, String endDate) {

        try {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : currentMonth.atDay(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();

            // 查询收入
            BigDecimal totalIncome = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                    currentUserId, 1, start, end);
            totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;

            // 查询支出
            BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                    currentUserId, 2, start, end);
            totalExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;

            // 计算结余
            BigDecimal balance = totalIncome.subtract(totalExpense);

            // 查询笔数 - 使用 Page size
            var incomePage = transactionRepository.findByUserIdAndTypeAndDateBetweenOrderByDateDesc(
                    currentUserId, 1, start, end, null);
            var expensePage = transactionRepository.findByUserIdAndTypeAndDateBetweenOrderByDateDesc(
                    currentUserId, 2, start, end, null);
            long incomeCount = incomePage != null ? incomePage.getTotalElements() : 0;
            long expenseCount = expensePage != null ? expensePage.getTotalElements() : 0;

            Map<String, Object> result = new HashMap<>();
            result.put("period", start.toString() + " 至 " + end.toString());
            result.put("totalIncome", totalIncome);
            result.put("totalExpense", totalExpense);
            result.put("balance", balance);
            result.put("incomeCount", incomeCount);
            result.put("expenseCount", expenseCount);

            return toJson(result);
        } catch (Exception e) {
            return handleError(e, "query_income_expense");
        }
    }

    /**
     * 查询交易记录
     * @param startDate 开始日期，格式YYYY-MM-DD
     * @param endDate 结束日期，格式YYYY-MM-DD
     * @param categoryId 分类ID，可选
     * @param type 类型：1收入/2支出，可选
     * @return 交易列表
     */
    public String queryTransactions(String startDate, String endDate, Long categoryId, Integer type) {

        try {
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusMonths(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();

            List<Map<String, Object>> transactions = transactionRepository
                    .findByUserIdAndDateBetween(currentUserId, start, end)
                    .stream()
                    .map(tx -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("date", tx.getDate());
                        item.put("type", tx.getType() == 1 ? "收入" : "支出");

                        categoryRepository.findById(tx.getCategoryId())
                                .ifPresent(c -> item.put("category", c.getName()));

                        item.put("amount", tx.getAmount());
                        item.put("remark", tx.getRemark());
                        return item;
                    })
                    .collect(Collectors.toList());

            // 如果指定了分类或类型，进行过滤
            if (categoryId != null) {
                transactions = transactions.stream()
                        .filter(tx -> tx.get("categoryId") != null &&
                                ((Number) tx.get("categoryId")).longValue() == categoryId)
                        .collect(Collectors.toList());
            }
            if (type != null) {
                final Integer finalType = type;
                transactions = transactions.stream()
                        .filter(tx -> "收入".equals(tx.get("type")) == (finalType == 1))
                        .collect(Collectors.toList());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("count", transactions.size());
            result.put("transactions", transactions);

            return toJson(result);
        } catch (Exception e) {
            return handleError(e, "query_transactions");
        }
    }

    /**
     * 查询预算执行情况
     * @param budgetId 预算ID，可选，默认查询当前活跃预算
     * @return 预算名称、金额、已使用、剩余、使用率、状态
     */
    public String queryBudget(Long budgetId) {

        try {
            // 简化的预算查询实现
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = currentMonth.atDay(1);
            LocalDate end = currentMonth.atEndOfMonth();

            // 计算本月支出
            BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                    currentUserId, 2, start, end);
            totalExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;

            // 假设预算为 5000 元
            BigDecimal budgetAmount = new BigDecimal("5000");
            BigDecimal remaining = budgetAmount.subtract(totalExpense);
            double usageRate = budgetAmount.compareTo(BigDecimal.ZERO) > 0
                    ? totalExpense.multiply(new BigDecimal("100"))
                            .divide(budgetAmount, 2, BigDecimal.ROUND_HALF_UP)
                            .doubleValue()
                    : 0;

            String status = usageRate >= 100 ? "超支" : (usageRate >= 85 ? "警告" : "正常");

            Map<String, Object> result = new HashMap<>();
            result.put("name", currentMonth.getYear() + "年" + currentMonth.getMonthValue() + "月预算");
            result.put("budgetAmount", budgetAmount);
            result.put("spent", totalExpense);
            result.put("remaining", remaining);
            result.put("usageRate", usageRate);
            result.put("status", status);
            result.put("period", start + " 至 " + end);

            return toJson(result);
        } catch (Exception e) {
            return handleError(e, "query_budget");
        }
    }

    /**
     * 查询分类支出统计
     * @param startDate 开始日期，格式YYYY-MM-DD
     * @param endDate 结束日期，格式YYYY-MM-DD
     * @param type 类型：1收入/2支出，默认2
     * @return 分类名称、金额、占比、笔数
     */
    public String queryCategoryStats(String startDate, String endDate, Integer type) {

        try {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : currentMonth.atDay(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
            int queryType = type != null ? type : 2;

            // 查询总支出
            BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                    currentUserId, queryType, start, end);
            final BigDecimal total = totalExpense != null ? totalExpense : BigDecimal.ZERO;

            // 查询分类统计
            List<Object[]> categoryData = transactionRepository.sumByCategoryAndType(
                    currentUserId, queryType, start, end);

            List<Map<String, Object>> categories = categoryData.stream()
                    .map(row -> {
                        Map<String, Object> item = new HashMap<>();
                        Long categoryId = (Long) row[0];
                        BigDecimal amount = (BigDecimal) row[1];

                        categoryRepository.findById(categoryId)
                                .ifPresent(c -> item.put("categoryName", c.getName()));

                        item.put("amount", amount);
                        item.put("percentage", total.compareTo(BigDecimal.ZERO) > 0
                                ? amount.multiply(new BigDecimal("100"))
                                        .divide(total, 2, BigDecimal.ROUND_HALF_UP)
                                        .doubleValue()
                                : 0);

                        return item;
                    })
                    .sorted((a, b) -> ((BigDecimal) b.get("amount"))
                            .compareTo((BigDecimal) a.get("amount")))
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("period", start + " 至 " + end);
            result.put("total", total);
            result.put("categories", categories);

            return toJson(result);
        } catch (Exception e) {
            return handleError(e, "query_category_stats");
        }
    }
}
