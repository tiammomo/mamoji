package com.mamoji.module.report.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.dto.TrendVO;

/** Report Service Interface */
public interface ReportService {

    /** Get summary report */
    SummaryVO getSummary(Long userId, ReportQueryDTO request);

    /** Get income/expense by category */
    List<CategoryReportVO> getIncomeExpenseReport(Long userId, ReportQueryDTO request);

    /** Get monthly trend report */
    Map<String, Object> getMonthlyTrend(Long userId, Integer year, Integer month);

    /** Get balance sheet */
    Map<String, Object> getBalanceSheet(Long userId);

    /** Get trend report */
    List<TrendVO> getTrendReport(
            Long userId, LocalDate startDate, LocalDate endDate, String period);

    /** Get daily data by date range */
    Map<String, Object> getDailyDataByDateRange(
            Long userId, LocalDate startDate, LocalDate endDate);
}
