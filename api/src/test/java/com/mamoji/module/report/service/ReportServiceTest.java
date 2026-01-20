package com.mamoji.module.report.service;

import com.mamoji.module.account.entity.FinAccount;
import com.mamoji.module.account.mapper.FinAccountMapper;
import com.mamoji.module.category.entity.FinCategory;
import com.mamoji.module.category.mapper.FinCategoryMapper;
import com.mamoji.module.report.dto.CategoryReportVO;
import com.mamoji.module.report.dto.ReportQueryDTO;
import com.mamoji.module.report.dto.SummaryVO;
import com.mamoji.module.transaction.entity.FinTransaction;
import com.mamoji.module.transaction.mapper.FinTransactionMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * ReportService Unit Tests
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReportServiceTest {

    @Mock
    private FinTransactionMapper transactionMapper;

    @Mock
    private FinAccountMapper accountMapper;

    @Mock
    private FinCategoryMapper categoryMapper;

    private ReportServiceImpl reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportServiceImpl(transactionMapper, accountMapper, categoryMapper);
    }

    @Test
    @DisplayName("Get summary should return correct totals")
    void getSummary_WithValidUser_ReturnsCorrectTotals() {
        // Given
        ReportQueryDTO request = ReportQueryDTO.builder()
                .startDate(LocalDate.now().withDayOfMonth(1))
                .endDate(LocalDate.now())
                .build();

        when(transactionMapper.sumAmountByUserTypeAndDateRange(
                eq(1L), eq("income"), any(), any()
        )).thenReturn(new BigDecimal("10000.00"));

        when(transactionMapper.sumAmountByUserTypeAndDateRange(
                eq(1L), eq("expense"), any(), any()
        )).thenReturn(new BigDecimal("4000.00"));

        when(transactionMapper.selectCount(any())).thenReturn(20L);
        when(accountMapper.selectCount(any())).thenReturn(3L);

        // When
        SummaryVO result = reportService.getSummary(1L, request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTotalIncome()).isEqualByComparingTo("10000.00");
        assertThat(result.getTotalExpense()).isEqualByComparingTo("4000.00");
        assertThat(result.getNetIncome()).isEqualByComparingTo("6000.00");
        assertThat(result.getTransactionCount()).isEqualTo(20);
        assertThat(result.getAccountCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("Get income expense report should group by category")
    void getIncomeExpenseReport_WithValidUser_ReturnsGroupedByCategory() {
        // Given
        ReportQueryDTO request = ReportQueryDTO.builder()
                .startDate(LocalDate.now().withDayOfMonth(1))
                .endDate(LocalDate.now())
                .build();

        FinTransaction incomeTx = FinTransaction.builder()
                .transactionId(1L)
                .userId(1L)
                .categoryId(1L)
                .type("income")
                .amount(new BigDecimal("5000.00"))
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();

        FinTransaction expenseTx = FinTransaction.builder()
                .transactionId(2L)
                .userId(1L)
                .categoryId(2L)
                .type("expense")
                .amount(new BigDecimal("2000.00"))
                .occurredAt(LocalDateTime.now())
                .status(1)
                .build();

        FinCategory category1 = FinCategory.builder()
                .categoryId(1L)
                .name("Salary")
                .build();

        FinCategory category2 = FinCategory.builder()
                .categoryId(2L)
                .name("Food")
                .build();

        when(transactionMapper.selectList(any())).thenReturn(Arrays.asList(incomeTx, expenseTx));
        when(categoryMapper.selectById(1L)).thenReturn(category1);
        when(categoryMapper.selectById(2L)).thenReturn(category2);

        // When
        List<CategoryReportVO> result = reportService.getIncomeExpenseReport(1L, request);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).anyMatch(vo ->
            vo.getCategoryName().equals("Salary") && vo.getAmount().compareTo(new BigDecimal("5000.00")) == 0
        );
        assertThat(result).anyMatch(vo ->
            vo.getCategoryName().equals("Food") && vo.getAmount().compareTo(new BigDecimal("2000.00")) == 0
        );
    }

    @Test
    @DisplayName("Get monthly trend should return daily data")
    void getMonthlyTrend_WithValidUser_ReturnsDailyData() {
        // Given
        FinTransaction tx1 = FinTransaction.builder()
                .transactionId(1L)
                .userId(1L)
                .categoryId(1L)
                .type("income")
                .amount(new BigDecimal("1000.00"))
                .occurredAt(LocalDateTime.of(2024, 1, 15, 10, 0))
                .status(1)
                .build();

        FinTransaction tx2 = FinTransaction.builder()
                .transactionId(2L)
                .userId(1L)
                .categoryId(2L)
                .type("expense")
                .amount(new BigDecimal("500.00"))
                .occurredAt(LocalDateTime.of(2024, 1, 20, 14, 0))
                .status(1)
                .build();

        when(transactionMapper.selectList(any())).thenReturn(Arrays.asList(tx1, tx2));

        // When
        Map<String, Object> result = reportService.getMonthlyTrend(1L, 2024, 1);

        // Then
        assertThat(result).containsKey("year");
        assertThat(result).containsKey("month");
        assertThat(result).containsKey("totalIncome");
        assertThat(result).containsKey("totalExpense");
        assertThat(result).containsKey("dailyData");
        assertThat(result.get("year")).isEqualTo(2024);
        assertThat(result.get("month")).isEqualTo(1);
    }

    @Test
    @DisplayName("Get balance sheet should separate assets and liabilities")
    void getBalanceSheet_WithValidUser_ReturnsAssetsAndLiabilities() {
        // Given
        FinAccount bankAccount = FinAccount.builder()
                .accountId(1L)
                .userId(1L)
                .name("Savings")
                .accountType("bank")
                .balance(new BigDecimal("50000.00"))
                .includeInTotal(1)
                .status(1)
                .build();

        FinAccount creditCard = FinAccount.builder()
                .accountId(2L)
                .userId(1L)
                .name("Credit Card")
                .accountType("credit")
                .balance(new BigDecimal("-5000.00"))
                .includeInTotal(1)
                .status(1)
                .build();

        when(accountMapper.selectList(any())).thenReturn(Arrays.asList(bankAccount, creditCard));

        // When
        Map<String, Object> result = reportService.getBalanceSheet(1L);

        // Then
        assertThat(result).containsKey("totalAssets");
        assertThat(result).containsKey("totalLiabilities");
        assertThat(result).containsKey("netAssets");
        assertThat(result).containsKey("assets");
        assertThat(result).containsKey("liabilities");

        assertThat((BigDecimal)result.get("totalAssets")).isEqualByComparingTo("50000.00");
        assertThat((BigDecimal)result.get("totalLiabilities")).isEqualByComparingTo("5000.00");
        assertThat((BigDecimal)result.get("netAssets")).isEqualByComparingTo("45000.00");
    }
}
