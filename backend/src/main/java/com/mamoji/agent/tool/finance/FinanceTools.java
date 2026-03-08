package com.mamoji.agent.tool.finance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamoji.agent.tool.BaseTool;
import com.mamoji.repository.CategoryRepository;
import com.mamoji.repository.TransactionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    public String queryIncomeExpense(Long userId, String startDate, String endDate) {
        if (userId == null) {
            return buildError("userId is required");
        }

        try {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : currentMonth.atDay(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();

            BigDecimal totalIncome = transactionRepository.sumByUserIdAndTypeAndDateBetween(userId, 1, start, end);
            totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;

            BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(userId, 2, start, end);
            totalExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;

            BigDecimal balance = totalIncome.subtract(totalExpense);

            var incomePage = transactionRepository.findByUserIdAndTypeAndDateBetweenOrderByDateDesc(userId, 1, start, end, null);
            var expensePage = transactionRepository.findByUserIdAndTypeAndDateBetweenOrderByDateDesc(userId, 2, start, end, null);
            long incomeCount = incomePage != null ? incomePage.getTotalElements() : 0;
            long expenseCount = expensePage != null ? expensePage.getTotalElements() : 0;

            Map<String, Object> result = new HashMap<>();
            result.put("period", start + " to " + end);
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

    public String queryTransactions(Long userId, String startDate, String endDate, Long categoryId, Integer type) {
        if (userId == null) {
            return buildError("userId is required");
        }

        try {
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().minusMonths(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();

            List<Map<String, Object>> transactions = transactionRepository
                .findByUserIdAndDateBetween(userId, start, end)
                .stream()
                .map(tx -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("date", tx.getDate());
                    item.put("type", tx.getType() == 1 ? "income" : "expense");
                    item.put("categoryId", tx.getCategoryId());
                    categoryRepository.findById(tx.getCategoryId()).ifPresent(c -> item.put("category", c.getName()));
                    item.put("amount", tx.getAmount());
                    item.put("remark", tx.getRemark());
                    return item;
                })
                .collect(Collectors.toList());

            if (categoryId != null) {
                transactions = transactions.stream()
                    .filter(tx -> tx.get("categoryId") != null && ((Number) tx.get("categoryId")).longValue() == categoryId)
                    .collect(Collectors.toList());
            }
            if (type != null) {
                final Integer finalType = type;
                transactions = transactions.stream()
                    .filter(tx -> "income".equals(tx.get("type")) == (finalType == 1))
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

    public String queryBudget(Long userId, Long budgetId) {
        if (userId == null) {
            return buildError("userId is required");
        }

        try {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = currentMonth.atDay(1);
            LocalDate end = currentMonth.atEndOfMonth();

            BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(userId, 2, start, end);
            totalExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;

            BigDecimal budgetAmount = new BigDecimal("5000");
            BigDecimal remaining = budgetAmount.subtract(totalExpense);
            double usageRate = budgetAmount.compareTo(BigDecimal.ZERO) > 0
                ? totalExpense.multiply(new BigDecimal("100")).divide(budgetAmount, 2, java.math.RoundingMode.HALF_UP).doubleValue()
                : 0;

            String status = usageRate >= 100 ? "over" : (usageRate >= 85 ? "warning" : "normal");

            Map<String, Object> result = new HashMap<>();
            result.put("name", currentMonth.getYear() + "-" + currentMonth.getMonthValue() + " budget");
            result.put("budgetAmount", budgetAmount);
            result.put("spent", totalExpense);
            result.put("remaining", remaining);
            result.put("usageRate", usageRate);
            result.put("status", status);
            result.put("period", start + " to " + end);
            result.put("budgetId", budgetId);
            return toJson(result);
        } catch (Exception e) {
            return handleError(e, "query_budget");
        }
    }

    public String queryCategoryStats(Long userId, String startDate, String endDate, Integer type) {
        if (userId == null) {
            return buildError("userId is required");
        }

        try {
            YearMonth currentMonth = YearMonth.now();
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : currentMonth.atDay(1);
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
            int queryType = type != null ? type : 2;

            BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(userId, queryType, start, end);
            final BigDecimal total = totalExpense != null ? totalExpense : BigDecimal.ZERO;

            List<Object[]> categoryData = transactionRepository.sumByCategoryAndType(userId, queryType, start, end);

            List<Map<String, Object>> categories = categoryData.stream()
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    Long categoryId = (Long) row[0];
                    BigDecimal amount = (BigDecimal) row[1];

                    categoryRepository.findById(categoryId).ifPresent(c -> item.put("categoryName", c.getName()));
                    item.put("amount", amount);
                    item.put("percentage", total.compareTo(BigDecimal.ZERO) > 0
                        ? amount.multiply(new BigDecimal("100")).divide(total, 2, java.math.RoundingMode.HALF_UP).doubleValue()
                        : 0);
                    return item;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("amount")).compareTo((BigDecimal) a.get("amount")))
                .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("period", start + " to " + end);
            result.put("total", total);
            result.put("categories", categories);
            return toJson(result);
        } catch (Exception e) {
            return handleError(e, "query_category_stats");
        }
    }
}
