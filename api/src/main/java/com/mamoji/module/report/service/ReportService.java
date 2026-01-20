package com.mamoji.module.report.service;

import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;

import java.util.List;
import java.util.Map;

/**
 * Report Service Interface
 */
public interface ReportService {

    /**
     * Get summary report
     */
    SummaryVO getSummary(Long userId, ReportQueryDTO request);

    /**
     * Get income/expense by category
     */
    List<CategoryReportVO> getIncomeExpenseReport(Long userId, ReportQueryDTO request);

    /**
     * Get monthly trend report
     */
    Map<String, Object> getMonthlyTrend(Long userId, Integer year, Integer month);

    /**
     * Get balance sheet
     */
    Map<String, Object> getBalanceSheet(Long userId);
}
