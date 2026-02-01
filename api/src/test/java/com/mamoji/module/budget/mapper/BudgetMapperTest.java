package com.mamoji.module.budget.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.MySqlIntegrationTestBase;
import com.mamoji.config.TestSecurityConfig;
import com.mamoji.module.budget.entity.FinBudget;

/** Budget Mapper Integration Tests */
@Import(TestSecurityConfig.class)
class BudgetMapperTest extends MySqlIntegrationTestBase {

    @Autowired private FinBudgetMapper budgetMapper;

    private final Long testUserId = 999L;

    @BeforeEach
    void setUp() {
        budgetMapper.delete(new LambdaQueryWrapper<FinBudget>().isNotNull(FinBudget::getBudgetId));
    }

    @AfterEach
    void tearDown() {
        budgetMapper.delete(new LambdaQueryWrapper<FinBudget>().isNotNull(FinBudget::getBudgetId));
    }

    @Test
    @DisplayName("Insert budget should persist and return generated ID")
    void insert_ShouldPersistAndReturnGeneratedId() {
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Test Budget")
                        .amount(new BigDecimal("5000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();

        int result = budgetMapper.insert(budget);

        assertThat(result).isGreaterThan(0);
        assertThat(budget.getBudgetId()).isNotNull();
    }

    @Test
    @DisplayName("Select by ID should return budget when exists")
    void selectById_ShouldReturnBudgetWhenExists() {
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Find Me Budget")
                        .amount(new BigDecimal("3000.00"))
                        .spent(new BigDecimal("500.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        FinBudget found = budgetMapper.selectById(budget.getBudgetId());

        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("Find Me Budget");
    }

    @Test
    @DisplayName("Select with status filter should return only active budgets")
    void selectList_WithStatusFilter_ShouldReturnOnlyActiveBudgets() {
        FinBudget activeBudget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Active Budget")
                        .amount(new BigDecimal("1000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();
        budgetMapper.insert(activeBudget);

        FinBudget completedBudget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Completed Budget")
                        .amount(new BigDecimal("2000.00"))
                        .spent(new BigDecimal("2000.00"))
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1))
                        .status(2)
                        .build();
        budgetMapper.insert(completedBudget);

        List<FinBudget> activeResults =
                budgetMapper.selectList(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, testUserId)
                                .eq(FinBudget::getStatus, 1));

        assertThat(activeResults).hasSize(1);
        assertThat(activeResults.get(0).getName()).isEqualTo("Active Budget");
    }

    @Test
    @DisplayName("Update by ID should modify existing budget")
    void updateById_ShouldModifyExistingBudget() {
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Original Name")
                        .amount(new BigDecimal("1000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        budget.setName("Updated Name");
        budget.setSpent(new BigDecimal("200.00"));
        budget.setStatus(1);
        int result = budgetMapper.updateById(budget);

        assertThat(result).isGreaterThan(0);

        FinBudget updated = budgetMapper.selectById(budget.getBudgetId());
        assertThat(updated.getName()).isEqualTo("Updated Name");
        assertThat(updated.getSpent()).isEqualByComparingTo("200.00");
    }

    @Test
    @DisplayName("Delete by ID should remove budget")
    void deleteById_ShouldRemoveBudget() {
        FinBudget budget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("To Delete")
                        .amount(new BigDecimal("500.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(LocalDate.now().withDayOfMonth(1))
                        .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();
        budgetMapper.insert(budget);

        int result = budgetMapper.deleteById(budget.getBudgetId());

        assertThat(result).isGreaterThan(0);

        FinBudget deleted = budgetMapper.selectById(budget.getBudgetId());
        assertThat(deleted).isNull();
    }

    @Test
    @DisplayName("Select with date range should return budgets within range")
    void selectList_WithDateRange_ShouldReturnBudgetsWithinRange() {
        LocalDate now = LocalDate.now();
        FinBudget currentMonthBudget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Current Month")
                        .amount(new BigDecimal("1000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(now.withDayOfMonth(1))
                        .endDate(now.withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();
        budgetMapper.insert(currentMonthBudget);

        FinBudget lastMonthBudget =
                FinBudget.builder()
                        .userId(testUserId)
                        .name("Last Month")
                        .amount(new BigDecimal("2000.00"))
                        .spent(BigDecimal.ZERO)
                        .startDate(now.minusMonths(1).withDayOfMonth(1))
                        .endDate(now.minusMonths(1).withDayOfMonth(1).plusMonths(1))
                        .status(1)
                        .build();
        budgetMapper.insert(lastMonthBudget);

        List<FinBudget> results =
                budgetMapper.selectList(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, testUserId)
                                .ge(FinBudget::getStartDate, now.withDayOfMonth(1)));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Current Month");
    }

    @Test
    @DisplayName("Select with order should return sorted results")
    void selectList_WithOrder_ShouldReturnSortedResults() {
        LocalDate now = LocalDate.now();
        for (int i = 1; i <= 3; i++) {
            FinBudget budget =
                    FinBudget.builder()
                            .userId(testUserId)
                            .name("Budget " + i)
                            .amount(new BigDecimal("1000.00"))
                            .spent(BigDecimal.ZERO)
                            .startDate(now.plusDays(i))
                            .endDate(now.plusDays(i + 30))
                            .status(1)
                            .build();
            budgetMapper.insert(budget);
        }

        List<FinBudget> results =
                budgetMapper.selectList(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, testUserId)
                                .orderByDesc(FinBudget::getBudgetId));

        assertThat(results).hasSize(3);
        // Most recently inserted (highest ID) should be first
        assertThat(results.get(0).getName()).isEqualTo("Budget 3");
    }

    @Test
    @DisplayName("Select count should return correct count")
    void selectCount_ShouldReturnCorrectCount() {
        LocalDate now = LocalDate.now();
        for (int i = 1; i <= 4; i++) {
            FinBudget budget =
                    FinBudget.builder()
                            .userId(testUserId)
                            .name("Budget " + i)
                            .amount(new BigDecimal("1000.00"))
                            .spent(BigDecimal.ZERO)
                            .startDate(now.plusDays(i))
                            .endDate(now.plusDays(i + 30))
                            .status(1)
                            .build();
            budgetMapper.insert(budget);
        }

        Long count =
                budgetMapper.selectCount(
                        new LambdaQueryWrapper<FinBudget>()
                                .eq(FinBudget::getUserId, testUserId)
                                .eq(FinBudget::getStatus, 1));

        assertThat(count).isEqualTo(4L);
    }
}
