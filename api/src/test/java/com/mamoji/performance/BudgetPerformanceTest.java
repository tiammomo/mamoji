package com.mamoji.performance;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.mamoji.config.TestSecurityConfig;
import com.mamoji.module.budget.dto.BudgetDTO;
import com.mamoji.module.budget.dto.BudgetVO;
import com.mamoji.module.budget.service.BudgetService;

/**
 * 预算服务性能测试
 *
 * <p>测试核心预算操作性能：
 * <ul>
 *   <li>getBudget() - 获取预算</li>
 *   <li>listBudgets() - 列出预算</li>
 *   <li>listActiveBudgets() - 列出激活的预算</li>
 *   <li>createBudget() - 创建预算</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class BudgetPerformanceTest {

    @Autowired private BudgetService budgetService;

    private final Long testUserId = 999L;
    private static Long createdBudgetId;

    @BeforeEach
    void setUp() {
        // Create a budget for testing if not exists
        if (createdBudgetId == null) {
            BudgetDTO budget = new BudgetDTO();
            budget.setName("Performance Test Budget");
            budget.setAmount(new BigDecimal("5000.00"));
            budget.setStartDate(LocalDate.now().withDayOfMonth(1));
            budget.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1));
            createdBudgetId = budgetService.createBudget(testUserId, budget);
        }
    }

    @AfterAll
    static void tearDownAll(@Autowired BudgetService budgetService) {
        if (createdBudgetId != null) {
            try {
                budgetService.deleteBudget(999L, createdBudgetId);
            } catch (Exception e) {
                // Ignore cleanup errors
            }
        }
    }

    @Test
    @Order(1)
    @DisplayName("getBudget() - Should complete in under 50ms")
    void testGetBudgetPerformance() {
        long startTime = System.nanoTime();
        BudgetVO budget = budgetService.getBudget(testUserId, createdBudgetId);
        long endTime = System.nanoTime();

        long durationMicros = (endTime - startTime) / 1000;
        long durationMs = (endTime - startTime) / 1_000_000;

        System.out.println(
                "getBudget() took: " + durationMs + "ms (" + durationMicros + " microseconds)");

        assertNotNull(budget, "Budget should not be null");
        assertEquals(createdBudgetId, budget.getBudgetId(), "Budget ID should match");

        // Performance assertion
        assertTrue(
                durationMs < 50,
                "getBudget() should complete in under 50ms, took: " + durationMs + "ms");
    }

    @Test
    @Order(2)
    @DisplayName("listBudgets() - Should complete in under 100ms")
    void testListBudgetsPerformance() {
        long startTime = System.nanoTime();
        var budgets = budgetService.listBudgets(testUserId);
        long endTime = System.nanoTime();

        long durationMicros = (endTime - startTime) / 1000;
        long durationMs = (endTime - startTime) / 1_000_000;

        System.out.println(
                "listBudgets() took: " + durationMs + "ms (" + durationMicros + " microseconds)");

        assertNotNull(budgets, "Budgets list should not be null");

        // Performance assertion
        assertTrue(
                durationMs < 100,
                "listBudgets() should complete in under 100ms, took: " + durationMs + "ms");
    }

    @Test
    @Order(3)
    @DisplayName("listActiveBudgets() - Should complete in under 100ms")
    void testListActiveBudgetsPerformance() {
        long startTime = System.nanoTime();
        var budgets = budgetService.listActiveBudgets(testUserId);
        long endTime = System.nanoTime();

        long durationMicros = (endTime - startTime) / 1000;
        long durationMs = (endTime - startTime) / 1_000_000;

        System.out.println(
                "listActiveBudgets() took: "
                        + durationMs
                        + "ms ("
                        + durationMicros
                        + " microseconds)");

        assertNotNull(budgets, "Active budgets list should not be null");

        // Performance assertion
        assertTrue(
                durationMs < 100,
                "listActiveBudgets() should complete in under 100ms, took: " + durationMs + "ms");
    }

    @Test
    @Order(4)
    @DisplayName("createBudget() - Should complete in under 500ms")
    void testCreateBudgetPerformance() {
        BudgetDTO budget = new BudgetDTO();
        budget.setName("Performance Test Budget " + System.currentTimeMillis());
        budget.setAmount(new BigDecimal("1000.00"));
        budget.setStartDate(LocalDate.now().withDayOfMonth(1));
        budget.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1));

        long startTime = System.nanoTime();
        Long budgetId = budgetService.createBudget(testUserId, budget);
        long endTime = System.nanoTime();

        long durationMicros = (endTime - startTime) / 1000;
        long durationMs = (endTime - startTime) / 1_000_000;

        System.out.println(
                "createBudget() took: " + durationMs + "ms (" + durationMicros + " microseconds)");

        assertNotNull(budgetId, "Created budget ID should not be null");

        // Performance assertion - relaxed for test environment
        assertTrue(
                durationMs < 500,
                "createBudget() should complete in under 500ms, took: " + durationMs + "ms");

        // Clean up
        budgetService.deleteBudget(testUserId, budgetId);
    }

    @Test
    @Order(5)
    @DisplayName("deleteBudget() - Should complete in under 300ms")
    void testDeleteBudgetPerformance() {
        // Create a budget to delete
        BudgetDTO budget = new BudgetDTO();
        budget.setName("Delete Performance Test " + System.currentTimeMillis());
        budget.setAmount(new BigDecimal("500.00"));
        budget.setStartDate(LocalDate.now().withDayOfMonth(1));
        budget.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1));
        Long budgetId = budgetService.createBudget(testUserId, budget);

        long startTime = System.nanoTime();
        budgetService.deleteBudget(testUserId, budgetId);
        long endTime = System.nanoTime();

        long durationMicros = (endTime - startTime) / 1000;
        long durationMs = (endTime - startTime) / 1_000_000;

        System.out.println(
                "deleteBudget() took: " + durationMs + "ms (" + durationMicros + " microseconds)");

        // Performance assertion - relaxed for test environment
        assertTrue(
                durationMs < 300,
                "deleteBudget() should complete in under 300ms, took: " + durationMs + "ms");
    }

    @Test
    @Order(6)
    @DisplayName("Multiple operations throughput test")
    void testThroughput() throws InterruptedException {
        int operations = 20;
        long[] times = new long[operations];

        for (int i = 0; i < operations; i++) {
            long start = System.nanoTime();
            try {
                budgetService.getBudget(testUserId, createdBudgetId);
            } catch (Exception e) {
                // Ignore
            }
            times[i] = System.nanoTime() - start;
        }

        // Calculate statistics
        double totalMs = 0;
        double totalSqMs = 0;
        double minMs = Double.MAX_VALUE;
        double maxMs = 0;

        for (long time : times) {
            double ms = time / 1_000_000.0;
            totalMs += ms;
            totalSqMs += ms * ms;
            minMs = Math.min(minMs, ms);
            maxMs = Math.max(maxMs, ms);
        }

        double avgMs = totalMs / operations;
        double variance = (totalSqMs / operations) - (avgMs * avgMs);
        double stdDev = Math.sqrt(variance);
        double throughput = 1000.0 / avgMs;

        System.out.println("Throughput test results (" + operations + " operations):");
        System.out.printf("  Average: %.2f ms (%.2f ops/sec)%n", avgMs, throughput);
        System.out.printf("  Min: %.2f ms, Max: %.2f ms%n", minMs, maxMs);
        System.out.printf("  Std Dev: %.2f ms%n", stdDev);

        // Assertions
        assertTrue(avgMs < 100, "Average should be under 100ms");
        assertTrue(throughput > 10, "Throughput should be greater than 10 ops/sec");
    }

    @Test
    @Order(7)
    @DisplayName("Concurrent access test")
    void testConcurrentAccess() throws InterruptedException {
        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        long startTime = System.nanoTime();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(
                    () -> {
                        try {
                            for (int j = 0; j < 10; j++) {
                                budgetService.getBudget(testUserId, createdBudgetId);
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        } finally {
                            latch.countDown();
                        }
                    });
        }

        latch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;
        double throughput = (threadCount * 10) / (durationMs / 1000.0);

        System.out.println("Concurrent access test (" + threadCount + " threads x 10 reads):");
        System.out.println("  Total time: " + durationMs + "ms");
        System.out.printf("  Throughput: %.2f ops/sec%n", throughput);

        // Assertions
        assertTrue(durationMs < 10000, "Should complete in under 10 seconds");
        assertTrue(throughput > 5, "Throughput should be greater than 5 ops/sec");
    }
}
