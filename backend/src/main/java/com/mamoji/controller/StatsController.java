package com.mamoji.controller;

import com.mamoji.entity.Category;
import com.mamoji.entity.Transaction;
import com.mamoji.entity.User;
import com.mamoji.repository.CategoryRepository;
import com.mamoji.repository.TransactionRepository;
import com.mamoji.security.AuthenticationUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(
            @AuthenticationUser User user,
            @RequestParam(required = false, defaultValue = "") String month) {

        YearMonth yearMonth;
        if (month == null || month.isEmpty()) {
            yearMonth = YearMonth.now();
        } else {
            // Handle both YYYY-MM and YYYY-MM-DD formats
            try {
                yearMonth = YearMonth.parse(month);
            } catch (Exception e) {
                yearMonth = YearMonth.from(LocalDate.parse(month));
            }
        }

        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByUserIdAndTypeAndDateBetween(
            user.getId(), 1, startDate, endDate);
        BigDecimal expense = transactionRepository.sumByUserIdAndTypeAndDateBetween(
            user.getId(), 2, startDate, endDate);

        if (income == null) income = BigDecimal.ZERO;
        if (expense == null) expense = BigDecimal.ZERO;

        Map<String, Object> data = new HashMap<>();
        data.put("income", income);
        data.put("expense", expense);
        data.put("balance", income.subtract(expense));
        data.put("incomeCount", 0);
        data.put("expenseCount", 0);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", data);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/trend")
    public ResponseEntity<Map<String, Object>> getTrend(
            @AuthenticationUser User user,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        // Default to current month if not provided
        YearMonth start;
        YearMonth end;
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            // Handle both YYYY-MM and YYYY-MM-DD formats
            try {
                start = YearMonth.parse(startDate);
            } catch (Exception e) {
                start = YearMonth.from(java.time.LocalDate.parse(startDate));
            }
            try {
                end = YearMonth.parse(endDate);
            } catch (Exception e) {
                end = YearMonth.from(java.time.LocalDate.parse(endDate));
            }
        } else {
            YearMonth current = YearMonth.now();
            start = YearMonth.of(current.getYear(), current.getMonthValue());
            end = start;
        }

        List<Map<String, Object>> trend = new ArrayList<>();

        YearMonth current = start;
        while (!current.isAfter(end)) {
            LocalDate startD = current.atDay(1);
            LocalDate endD = current.atEndOfMonth();

            BigDecimal income = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                user.getId(), 1, startD, endD);
            BigDecimal expense = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                user.getId(), 2, startD, endD);

            if (income == null) income = BigDecimal.ZERO;
            if (expense == null) expense = BigDecimal.ZERO;

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", current.toString());
            monthData.put("income", income);
            monthData.put("expense", expense);
            trend.add(monthData);

            current = current.plusMonths(1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", trend);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategoryStats(
            @AuthenticationUser User user,
            @RequestParam Integer type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        LocalDate start;
        LocalDate end;
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            start = LocalDate.parse(startDate);
            end = LocalDate.parse(endDate);
        } else {
            YearMonth yearMonth = YearMonth.now();
            start = yearMonth.atDay(1);
            end = yearMonth.atEndOfMonth();
        }

        List<Object[]> results = transactionRepository.sumByCategoryAndType(
            user.getId(), type, start, end);

        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
            .collect(Collectors.toMap(Category::getId, c -> c));

        BigDecimal total = results.stream()
            .map(r -> (BigDecimal) r[1])
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> stats = new ArrayList<>();

        for (Object[] row : results) {
            Long categoryId = (Long) row[0];
            BigDecimal amount = (BigDecimal) row[1];

            Category category = categoryMap.get(categoryId);

            Map<String, Object> stat = new HashMap<>();
            stat.put("categoryId", categoryId);
            stat.put("categoryName", category != null ? category.getName() : "未知");
            stat.put("categoryIcon", category != null ? category.getIcon() : "category");
            stat.put("amount", amount);
            stat.put("percentage", total.compareTo(BigDecimal.ZERO) > 0
                ? amount.multiply(BigDecimal.valueOf(100)).divide(total, 1, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO);

            stats.add(stat);
        }

        stats.sort((a, b) -> ((BigDecimal) b.get("amount")).compareTo((BigDecimal) a.get("amount")));

        Map<String, Object> result = new HashMap<>();
        result.put("code", 0);
        result.put("message", "success");
        result.put("data", stats);

        return ResponseEntity.ok(result);
    }
}
