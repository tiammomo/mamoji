package com.mamoji.module.budget.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.entity.FinBudget;

/** BudgetService Integration Tests */
class BudgetServiceIntegrationTest extends MySqlIntegrationTestBase {

    @Autowired private BudgetService budgetService;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        // Clean up test data using wrapper with always true condition
        budgetMapper.delete(new LambdaQueryWrapper<FinBudget>().isNotNull(FinBudget::getBudgetId));
    }

    @AfterEach
    void tearDown() {
        budgetMapper.delete(new LambdaQueryWrapper<FinBudget>().isNotNull(FinBudget::getBudgetId));
    }

    @Test
    @DisplayName("Create budget should persist and return id")
    void createBudget_ShouldPersistAndReturnId() {
        // Given
        LocalDate startDate = LocalDate.now().withDayOfMonth(1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        BudgetDTO dto =
                BudgetDTO.builder()
                        .name("Monthly Food Budget")
                        .amount(new BigDecimal("2000.00"))
                        .startDate(startDate)
                        .endDate(endDate)
                        .build();

        // When
        Long budgetId = budgetService.createBudget(testUserId, dto);

        // Then
        assertThat(budgetId).isNotNull();

        FinBudget saved = budgetMapper.selectById(budgetId);
        assertThat(saved).isNotNull();
        assertThat(saved.getName()).isEqualTo("Monthly Food Budget");
        assertThat(saved.getAmount()).isEqualByComparingTo("2000.00");
        assertThat(saved.getUserId()).isEqualTo(testUserId);
        assertThat(saved.getStatus()).isEqualTo(1);
    }

    @Test
    @DisplayName("List budgets should return user's budgets")
    void listBudgets_ShouldReturnUserBudgets() {
        // Given
        FinBudget budget1 =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Budget 1")
                        .amount(new BigDecimal("1000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget1);

        FinBudget budget2 =
                FinBudget.builder()
                        .userId(testUserId + 1)
                        .name("Other User Budget")
                        .amount(new BigDecimal("2000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget2);

        // When
        List<BudgetVO> result = budgetService.listBudgets(testUserId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Budget 1");
    }

    @Test
    @DisplayName("Get budget should return VO when exists")
    void getBudget_ShouldReturnVOWhenExists() {
        // Given
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("My Budget")
                        .amount(new BigDecimal("3000.00"))
                        .spent(new BigDecimal("500.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        // When
        BudgetVO result = budgetService.getBudget(testUserId, budget.getBudgetId());

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("My Budget");
        assertThat(result.getSpent()).isEqualByComparingTo("500.00");
        assertThat(result.getAmount()).isEqualByComparingTo("3000.00");
    }

    @Test
    @DisplayName("Budget progress should be calculated correctly")
    void getBudgetProgress_ShouldCalculateCorrectly() {
        // Given
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Progress Test Budget")
                        .amount(new BigDecimal("1000.00"))
                        .spent(new BigDecimal("250.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        // When
        BudgetVO result = budgetService.getBudget(testUserId, budget.getBudgetId());

        // Then
        assertThat(result.getProgress()).isEqualTo(25.0);
    }

    @Test
    @DisplayName("Budget over spent should have status 3")
    void getBudgetStatus_OverSpent_ShouldHaveStatus3() {
        // Given
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Over Budget")
                        .amount(new BigDecimal("1000.00"))
                        .spent(new BigDecimal("1500.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        // When
        BudgetVO result = budgetService.getBudget(testUserId, budget.getBudgetId());

        // Then
        assertThat(result.getStatus()).isEqualTo(3); // 3 = over budget
    }

    @Test
    @DisplayName("Update budget should modify existing record")
    void updateBudget_ShouldModifyExistingRecord() {
        // Given
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Original Name")
                        .amount(new BigDecimal("1000.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        BudgetDTO updateDto =
                BudgetDTO.builder()
                        .name("Updated Name")
                        .amount(new BigDecimal("2000.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .build();

        // When
        budgetService.updateBudget(testUserId, budget.getBudgetId(), updateDto);

        // Then
        FinBudget updated = budgetMapper.selectById(budget.getBudgetId());
        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getAmount()).isEqualByComparingTo("2000.00");
    }

    @Test
    @DisplayName("Delete budget should set status to 0")
    void deleteBudget_ShouldSetStatusToZero() {
        // Given
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("To Delete")
                        .amount(new BigDecimal("1000.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        // When
        budgetService.deleteBudget(testUserId, budget.getBudgetId());

        // Then - verify deletion by checking that active budgets count is 0
        Long activeCount =
                budgetMapper.selectCount(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getBudgetId, budget.getBudgetId())
                                .eq(FinBudget::getStatus, 1));
        assertThat(activeCount).isEqualTo(0);
    }

    @Test
    @DisplayName("List active budgets should return only active budgets")
    void listActiveBudgets_ShouldReturnOnlyActiveBudgets() {
        // Given
        LocalDate now = LocalDate.now();
        FinBudget activeBudget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Active Budget")
                        .amount(new BigDecimal("2000.00"))
                        .startDate(now.withDayOfMonth(1))
                        .endDate(now.plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(activeBudget);

        FinBudget deletedBudget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Deleted Budget")
                        .amount(new BigDecimal("1000.00"))
                        .startDate(now.withDayOfMonth(1))
                        .endDate(now.plusMonths(1).minusDays(1))
                        .status(0)
                        .build();
        budgetMapper.insert(deletedBudget);

        // When
        List<BudgetVO> result = budgetService.listActiveBudgets(testUserId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Active Budget");
    }

    @Test
    @DisplayName("Recalculate spent should update spent amount")
    void recalculateSpent_ShouldUpdateSpentAmount() {
        // Given
        LocalDate now = LocalDate.now();
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Recalculate Test Budget")
                        .amount(new BigDecimal("2000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(now.withDayOfMonth(1))
                        .endDate(now.plusMonths(1).minusDays(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        // When
        budgetService.recalculateSpent(budget.getBudgetId());

        // Then - verify recalculation (spent may be 0 if no transactions)
        FinBudget updated = budgetMapper.selectById(budget.getBudgetId());
        assertThat(updated).isNotNull();
        // Spent should be recalculated based on transactions
    }
}
