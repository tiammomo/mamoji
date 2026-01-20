package com.mamoji.module.report.controller;

import com.mamoji.common.result.Result;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.service.ReportService;
import com.mamoji.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Report Controller
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Get summary report (total income, expense, net income)
     */
    @GetMapping("/summary")
    public Result<SummaryVO> getSummary(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        ReportQueryDTO request = ReportQueryDTO.builder()
                .startDate(startDate)
                .endDate(endDate != null ? endDate : LocalDate.now())
                .build();
        SummaryVO summary = reportService.getSummary(user.userId(), request);
        return Result.success(summary);
    }

    /**
     * Get income/expense by category
     */
    @GetMapping("/income-expense")
    public Result<List<CategoryReportVO>> getIncomeExpenseReport(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        ReportQueryDTO request = ReportQueryDTO.builder()
                .startDate(startDate != null ? startDate : LocalDate.now().withDayOfMonth(1))
                .endDate(endDate != null ? endDate : LocalDate.now())
                .build();
        List<CategoryReportVO> report = reportService.getIncomeExpenseReport(user.userId(), request);
        return Result.success(report);
    }

    /**
     * Get monthly trend report
     */
    @GetMapping("/monthly")
    public Result<Map<String, Object>> getMonthlyReport(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam Integer year,
            @RequestParam Integer month) {
        Map<String, Object> report = reportService.getMonthlyTrend(user.userId(), year, month);
        return Result.success(report);
    }

    /**
     * Get balance sheet (assets and liabilities)
     */
    @GetMapping("/balance-sheet")
    public Result<Map<String, Object>> getBalanceSheet(@AuthenticationPrincipal UserPrincipal user) {
        Map<String, Object> report = reportService.getBalanceSheet(user.userId());
        return Result.success(report);
    }
}
