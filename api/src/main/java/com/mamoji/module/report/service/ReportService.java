package com.mamoji.module.report.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.dto.TrendVO;

/**
 * 报表服务接口
 * 定义财务报表查询相关的业务操作
 */
public interface ReportService {

    /**
     * 获取收支汇总报表
     * @param userId 用户ID
     * @param request 查询条件
     * @return 汇总信息
     */
    SummaryVO getSummary(Long userId, ReportQueryDTO request);

    /**
     * 获取分类收支报表
     * @param userId 用户ID
     * @param request 查询条件
     * @return 按分类分组的收支统计
     */
    List<CategoryReportVO> getIncomeExpenseReport(Long userId, ReportQueryDTO request);

    /**
     * 获取月度趋势报表
     * @param userId 用户ID
     * @param year 年份
     * @param month 月份
     * @return 月度趋势数据
     */
    Map<String, Object> getMonthlyTrend(Long userId, Integer year, Integer month);

    /**
     * 获取资产负债表
     * @param userId 用户ID
     * @return 资产和负债汇总
     */
    Map<String, Object> getBalanceSheet(Long userId);

    /**
     * 获取收支趋势报表
     * @param userId 用户ID
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param period 周期类型
     * @return 趋势数据列表
     */
    List<TrendVO> getTrendReport(
            Long userId, LocalDate startDate, LocalDate endDate, String period);

    /**
     * 获取指定日期范围的每日数据
     * @param userId 用户ID
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 每日收支数据
     */
    Map<String, Object> getDailyDataByDateRange(
            Long userId, LocalDate startDate, LocalDate endDate);
}
