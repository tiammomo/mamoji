package com.mamoji.module.report.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.report.service.ReportService;
import com.mamoji.security.UserPrincipal;

/** Report Controller Unit Tests */
@ExtendWith(MockitoExtension.class)
public class ReportControllerTest {

    private MockMvc mockMvc;

    @Mock private ReportService reportService;

    @InjectMocks private ReportController reportController;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        HandlerMethodArgumentResolver userPrincipalResolver =
                new HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(MethodParameter parameter) {
                        return parameter.getParameterType().equals(UserPrincipal.class);
                    }

                    @Override
                    public Object resolveArgument(
                            MethodParameter parameter,
                            ModelAndViewContainer mavContainer,
                            NativeWebRequest webRequest,
                            WebDataBinderFactory binderFactory) {
                        return new UserPrincipal(testUserId, "testuser");
                    }
                };

        mockMvc =
                MockMvcBuilders.standaloneSetup(reportController)
                        .setControllerAdvice(
                                new com.mamoji.common.exception.GlobalExceptionHandler())
                        .setCustomArgumentResolvers(userPrincipalResolver)
                        .build();
    }

    @Test
    @DisplayName("GET /api/v1/reports/summary - Get summary report")
    public void testGetSummary() throws Exception {
        SummaryVO summary =
                SummaryVO.builder()
                        .totalIncome(new BigDecimal("15000.00"))
                        .totalExpense(new BigDecimal("5000.00"))
                        .netIncome(new BigDecimal("10000.00"))
                        .transactionCount(50)
                        .accountCount(5)
                        .build();
        when(reportService.getSummary(eq(testUserId), any())).thenReturn(summary);

        mockMvc.perform(get("/api/v1/reports/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.totalIncome").value(15000))
                .andExpect(jsonPath("$.data.totalExpense").value(5000))
                .andExpect(jsonPath("$.data.netIncome").value(10000));
    }

    @Test
    @DisplayName("GET /api/v1/reports/summary with date range")
    public void testGetSummaryWithDateRange() throws Exception {
        SummaryVO summary =
                SummaryVO.builder()
                        .totalIncome(new BigDecimal("5000.00"))
                        .totalExpense(new BigDecimal("2000.00"))
                        .netIncome(new BigDecimal("3000.00"))
                        .transactionCount(20)
                        .accountCount(5)
                        .build();
        when(reportService.getSummary(eq(testUserId), any())).thenReturn(summary);

        mockMvc.perform(
                        get("/api/v1/reports/summary")
                                .param("startDate", "2024-01-01")
                                .param("endDate", "2024-01-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("GET /api/v1/reports/income-expense - Get income/expense report")
    public void testGetIncomeExpenseReport() throws Exception {
        when(reportService.getIncomeExpenseReport(eq(testUserId), any()))
                .thenReturn(
                        List.of(
                                com.mamoji.module.report.dto.CategoryReportVO.builder()
                                        .categoryId(1L)
                                        .categoryName("Salary")
                                        .type("income")
                                        .amount(new BigDecimal("15000.00"))
                                        .count(1)
                                        .percentage(100.0)
                                        .build()));

        mockMvc.perform(get("/api/v1/reports/income-expense"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/reports/monthly - Get monthly report")
    public void testGetMonthlyReport() throws Exception {
        when(reportService.getMonthlyTrend(eq(testUserId), eq(2024), eq(1)))
                .thenReturn(
                        Map.of(
                                "year",
                                2024,
                                "month",
                                1,
                                "totalIncome",
                                new BigDecimal("15000.00"),
                                "totalExpense",
                                new BigDecimal("5000.00"),
                                "netIncome",
                                new BigDecimal("10000.00"),
                                "dailyData",
                                List.of()));

        mockMvc.perform(get("/api/v1/reports/monthly").param("year", "2024").param("month", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.year").value(2024))
                .andExpect(jsonPath("$.data.month").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/reports/balance-sheet - Get balance sheet")
    public void testGetBalanceSheet() throws Exception {
        when(reportService.getBalanceSheet(testUserId))
                .thenReturn(
                        Map.of(
                                "totalAssets", new BigDecimal("50000.00"),
                                "totalLiabilities", new BigDecimal("5000.00"),
                                "netAssets", new BigDecimal("45000.00"),
                                "assets", List.of(),
                                "liabilities", List.of()));

        mockMvc.perform(get("/api/v1/reports/balance-sheet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.totalAssets").value(50000))
                .andExpect(jsonPath("$.data.netAssets").value(45000));
    }

    @Test
    @DisplayName("GET /api/v1/reports/trend - Get trend report")
    public void testGetTrendReport() throws Exception {
        when(reportService.getTrendReport(eq(testUserId), any(), any(), any()))
                .thenReturn(
                        List.of(
                                com.mamoji.module.report.dto.TrendVO.builder()
                                        .period("2024-01")
                                        .income(new BigDecimal("15000.00"))
                                        .expense(new BigDecimal("5000.00"))
                                        .netIncome(new BigDecimal("10000.00"))
                                        .transactionCount(50)
                                        .build()));

        mockMvc.perform(
                        get("/api/v1/reports/trend")
                                .param("startDate", "2024-01-01")
                                .param("endDate", "2024-01-31")
                                .param("period", "monthly"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].period").value("2024-01"));
    }
}
