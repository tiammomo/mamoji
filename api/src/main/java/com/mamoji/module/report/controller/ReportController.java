package com.mamoji.module.report.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.mamoji.common.result.Result;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.dto.TrendVO;
import com.mamoji.module.report.service.ReportService;
import com.mamoji.security.UserPrincipal;

import lombok.RequiredArgsConstructor;
import lombok.RequiredArgsConstructor;

import lombok.RequiredArgsConstructor;

/**
 * 报表控制器
 * 提供财务报表查询的 REST API 接口，包括收支汇总、分类报表、趋势分析等
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * 获取收支汇总报表
     * @param user 当前登录用户
     * @param startDate 可选的查询开始日期
     * @param endDate 可选的查询结束日期
     * @return 汇总信息（总收入、总支出、净收入）
     */
    @GetMapping("/summary")
    public Result<SummaryVO> getSummary(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        ReportQueryDTO request =
                ReportQueryDTO.builder()
                        .startDate(startDate)
                        .endDate(endDate != null ? endDate : LocalDate.now())
                        .build();
        SummaryVO summary = reportService.getSummary(user.userId(), request);
        return Result.success(summary);
    }

    /**
     * 获取分类收支报表
     * @param user 当前登录用户
     * @param startDate 可选的查询开始日期
     * @param endDate 可选的查询结束日期
     * @return 按分类分组的收支统计列表
     */
    @GetMapping("/income-expense")
    public Result<List<CategoryReportVO>> getIncomeExpenseReport(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        ReportQueryDTO request =
                ReportQueryDTO.builder()
                        .startDate(
                                startDate != null ? startDate : LocalDate.now().withDayOfMonth(1))
                        .endDate(endDate != null ? endDate : LocalDate.now())
                        .build();
        List<CategoryReportVO> report =
                reportService.getIncomeExpenseReport(user.userId(), request);
        return Result.success(report);
    }

    /**
     * 获取月度趋势报表
     * @param user 当前登录用户
     * @param year 年份
     * @param month 月份
     * @return 指定年月的收支趋势数据
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
     * 获取资产负债表
     * @param user 当前登录用户
     * @return 资产和负债汇总信息
     */
    @GetMapping("/balance-sheet")
    public Result<Map<String, Object>> getBalanceSheet(
            @AuthenticationPrincipal UserPrincipal user) {
        Map<String, Object> report = reportService.getBalanceSheet(user.userId());
        return Result.success(report);
    }

    /**
     * 获取收支趋势报表
     * @param user 当前登录用户
     * @param startDate 查询开始日期
     * @param endDate 查询结束日期
     * @param period 周期类型：daily（按日）、weekly（按周）、monthly（按月）
     * @return 按时间周期的收支趋势列表
     */
    @GetMapping("/trend")
    public Result<List<TrendVO>> getTrendReport(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(defaultValue = "daily") String period) {
        List<TrendVO> report =
                reportService.getTrendReport(user.userId(), startDate, endDate, period);
        return Result.success(report);
    }

    /**
     * 获取指定日期范围的每日数据
     * @param user 当前登录用户
     * @param startDate 查询开始日期
     * @param endDate 查询结束日期
     * @return 每日收支明细数据
     */
    @GetMapping("/daily")
    public Result<Map<String, Object>> getDailyDataByDateRange(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        Map<String, Object> report =
                reportService.getDailyDataByDateRange(user.userId(), startDate, endDate);
        return Result.success(report);
    }
}
