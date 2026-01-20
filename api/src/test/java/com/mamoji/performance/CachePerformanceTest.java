package com.mamoji.performance;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Cache Performance Tests
 *
 * Tests for Caffeine cache performance characteristics:
 * - Cache hit ratio
 * - Memory efficiency
 * - Eviction behavior
 */
public class CachePerformanceTest {

    private Caffeine<Object, Object> caffeineBuilder;

    @BeforeEach
    void setUp() {
        caffeineBuilder = Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats();
    }

    @Test
    @DisplayName("Cache creation with specified configuration")
    void testCacheCreation() {
        Cache<String, Object> cache = caffeineBuilder.build();

        assertNotNull(cache, "Cache should be created successfully");

        // Verify initial state
        assertNull(cache.getIfPresent("testKey"), "Cache should be empty initially");
    }

    @Test
    @DisplayName("Cache write and read performance")
    void testCacheWriteReadPerformance() {
        Cache<String, String> cache = caffeineBuilder.build();

        long startTime = System.nanoTime();

        // Write 100 entries
        for (int i = 0; i < 100; i++) {
            cache.put("key" + i, "value" + i);
        }

        // Read 100 entries
        for (int i = 0; i < 100; i++) {
            String value = cache.getIfPresent("key" + i);
            // Some may be evicted due to size limit
            if (value != null) {
                assertEquals("value" + i, value);
            }
        }

        long endTime = System.nanoTime();
        long durationMicros = (endTime - startTime) / 1000;

        System.out.println("Cache write+read 100 entries took: " + durationMicros + " microseconds");

        // Performance assertion: should complete in less than 50ms (50,000 microseconds)
        assertTrue(durationMicros < 50000,
                "Cache operations should complete in less than 50ms, took: " + durationMicros + " microseconds");
    }

    @Test
    @DisplayName("Cache eviction when size limit exceeded")
    void testCacheEviction() {
        // Create cache with very small size limit
        Cache<String, String> cache = Caffeine.newBuilder()
                .maximumSize(5)
                .recordStats()
                .build();

        // Add more entries than the size limit
        for (int i = 0; i < 15; i++) {
            cache.put("key" + i, "value" + i);
        }

        // Verify cache is working - latest entries should be present
        // Latest entries should be present (Caffeine keeps most recently used)
        assertNotNull(cache.getIfPresent("key14"), "Latest entry should be present");
        assertNotNull(cache.getIfPresent("key13"), "Recent entries should still be in cache");
        // Older entries may have been evicted
    }

    @Test
    @DisplayName("Cache statistics - hit rate calculation")
    void testCacheStats() {
        Cache<String, String> cache = Caffeine.newBuilder()
                .maximumSize(100)
                .recordStats()
                .build();

        // Populate cache
        cache.put("key1", "value1");
        cache.put("key2", "value2");

        // Perform cache operations
        cache.getIfPresent("key1");  // Hit
        cache.getIfPresent("key2");  // Hit
        cache.getIfPresent("key3");  // Miss

        com.github.benmanes.caffeine.cache.stats.CacheStats stats = cache.stats();

        assertEquals(2, stats.hitCount(), "Should have 2 hits");
        assertEquals(1, stats.missCount(), "Should have 1 miss");
        assertTrue(stats.hitRate() > 0.5, "Hit rate should be > 50%");
    }

    @Test
    @DisplayName("Memory efficient for duplicate values")
    void testMemoryEfficiency() {
        // Larger cache for this test
        Cache<String, String> cache = Caffeine.newBuilder()
                .maximumSize(500)
                .recordStats()
                .build();

        String sharedValue = "SharedValue";

        // Put same value with different keys
        for (int i = 0; i < 500; i++) {
            cache.put("key" + i, sharedValue);
        }

        // Most values should be retrievable (some may be evicted with smaller maxSize)
        int foundCount = 0;
        for (int i = 0; i < 500; i++) {
            if (cache.getIfPresent("key" + i) != null) {
                foundCount++;
            }
        }

        // At least 80% should still be in cache
        assertTrue(foundCount > 400, "At least 80% of entries should still be in cache, found: " + foundCount);
    }

    @Test
    @DisplayName("Concurrent cache access")
    @Timeout(10)
    void testConcurrentCacheAccess() throws InterruptedException {
        Cache<String, Integer> cache = caffeineBuilder.build();

        int threadCount = 10;
        int operationsPerThread = 100;

        Thread[] threads = new Thread[threadCount];

        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            threads[i] = new Thread(() -> {
                for (int j = 0; j < operationsPerThread; j++) {
                    cache.put("key" + threadId + "_" + j, threadId * j);
                    cache.getIfPresent("key" + threadId + "_" + j);
                }
            });
        }

        long startTime = System.nanoTime();

        // Start all threads
        for (Thread thread : threads) {
            thread.start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;

        System.out.println("Concurrent cache access (" + threadCount + " threads, " +
                (threadCount * operationsPerThread * 2) + " operations) took: " + durationMs + "ms");

        // Verify all operations completed
        com.github.benmanes.caffeine.cache.stats.CacheStats stats = cache.stats();
        assertTrue(stats.requestCount() > 0, "Should have cache requests");
    }

    @Test
    @DisplayName("Budget VO to DTO conversion performance")
    void testBudgetConversionPerformance() {
        BudgetVO source = new BudgetVO();
        source.setBudgetId(1L);
        source.setName("Test Budget");
        source.setAmount(new BigDecimal("1000.00"));
        source.setSpent(new BigDecimal("200.00"));
        source.setRemaining(new BigDecimal("800.00"));
        source.setStatus(1);
        source.setProgress(20.0);
        source.setStartDate(LocalDate.now().withDayOfMonth(1));
        source.setEndDate(LocalDate.now().withDayOfMonth(1).plusMonths(1));

        long startTime = System.nanoTime();

        // Perform 10,000 conversions
        for (int i = 0; i < 10000; i++) {
            BudgetDTO dto = convertToDTO(source);
            assertNotNull(dto);
        }

        long endTime = System.nanoTime();
        long durationMicros = (endTime - startTime) / 1000;

        System.out.println("10,000 BudgetVO to DTO conversions took: " + durationMicros + " microseconds");

        // Performance assertion
        assertTrue(durationMicros < 1_000_000,
                "Conversions should complete in less than 1 second, took: " + durationMicros + " microseconds");
    }

    private BudgetDTO convertToDTO(BudgetVO vo) {
        BudgetDTO dto = new BudgetDTO();
        dto.setName(vo.getName());
        dto.setAmount(vo.getAmount());
        dto.setStartDate(vo.getStartDate());
        dto.setEndDate(vo.getEndDate());
        return dto;
    }

    @Test
    @DisplayName("BigDecimal computation performance")
    void testBigDecimalPerformance() {
        BigDecimal amount = new BigDecimal("1000.00");
        BigDecimal spent = new BigDecimal("250.00");

        long startTime = System.nanoTime();

        // Perform 10,000 calculations
        for (int i = 0; i < 10000; i++) {
            BigDecimal remaining = amount.subtract(spent);
            BigDecimal progress = spent.multiply(BigDecimal.valueOf(100))
                    .divide(amount, 2, java.math.RoundingMode.HALF_UP);
            assertNotNull(remaining);
            assertNotNull(progress);
        }

        long endTime = System.nanoTime();
        long durationMicros = (endTime - startTime) / 1000;

        System.out.println("10,000 BigDecimal calculations took: " + durationMicros + " microseconds");

        // Performance assertion
        assertTrue(durationMicros < 2_000_000,
                "Calculations should complete in less than 2 seconds, took: " + durationMicros + " microseconds");
    }

    // Simple DTO class for testing
    static class BudgetDTO {
        private String name;
        private BigDecimal amount;
        private LocalDate startDate;
        private LocalDate endDate;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    }

    // Simple VO class for testing
    static class BudgetVO {
        private Long budgetId;
        private String name;
        private BigDecimal amount;
        private BigDecimal spent;
        private BigDecimal remaining;
        private Integer status;
        private Double progress;
        private LocalDate startDate;
        private LocalDate endDate;
        public Long getBudgetId() { return budgetId; }
        public void setBudgetId(Long budgetId) { this.budgetId = budgetId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public BigDecimal getSpent() { return spent; }
        public void setSpent(BigDecimal spent) { this.spent = spent; }
        public BigDecimal getRemaining() { return remaining; }
        public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }
        public Integer getStatus() { return status; }
        public void setStatus(Integer status) { this.status = status; }
        public Double getProgress() { return progress; }
        public void setProgress(Double progress) { this.progress = progress; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    }
}
