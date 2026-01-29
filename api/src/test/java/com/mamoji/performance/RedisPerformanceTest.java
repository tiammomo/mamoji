package com.mamoji.performance;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * Redis Cache Performance Tests
 *
 * <p>Tests for Redis operations performance: - Basic operations (GET/SET) - Hash operations - List
 * operations - Set operations - TTL operations - Concurrent access
 */
@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RedisPerformanceTest {

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String KEY_PREFIX = "perf:test:";
    private static final int BATCH_SIZE = 100;
    private static final int WARMUP = 5;
    private static final int MEASURE = 10;

    @BeforeEach
    void setUp() {
        if (redisTemplate == null) {
            System.out.println("Redis not available, skipping tests");
            return;
        }
        // Clean up test keys
        Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    @AfterEach
    void tearDown() {
        if (redisTemplate == null) return;
        // Clean up test keys
        Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    @Test
    @Order(1)
    @DisplayName("Redis connection test")
    void testRedisConnection() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping connection test");
            return;
        }

        String testKey = KEY_PREFIX + "connection";
        redisTemplate.opsForValue().set(testKey, "test_value", 10, TimeUnit.SECONDS);

        Object value = redisTemplate.opsForValue().get(testKey);
        assertNotNull(value, "Value should not be null");
        assertEquals("test_value", value, "Value should match");

        System.out.println("Redis connection: OK");
    }

    @Test
    @Order(2)
    @DisplayName("SET operation performance")
    void testSetPerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping SET test");
            return;
        }

        // Warmup
        for (int i = 0; i < WARMUP; i++) {
            String key = KEY_PREFIX + "set_warmup_" + i;
            redisTemplate.opsForValue().set(key, "value" + i, 1, TimeUnit.MINUTES);
        }

        // Measure
        long totalTime = 0;
        for (int i = 0; i < MEASURE; i++) {
            String key = KEY_PREFIX + "set_" + i;
            long start = System.nanoTime();
            redisTemplate.opsForValue().set(key, "value" + i, 1, TimeUnit.MINUTES);
            totalTime += System.nanoTime() - start;
        }

        double avgMs = totalTime / (MEASURE * 1_000_000.0);
        System.out.println("Redis SET avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 50, "SET should be under 50ms, was: " + avgMs);
    }

    @Test
    @Order(3)
    @DisplayName("GET operation performance")
    void testGetPerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping GET test");
            return;
        }

        // Prepare data
        for (int i = 0; i < BATCH_SIZE; i++) {
            String key = KEY_PREFIX + "get_" + i;
            redisTemplate.opsForValue().set(key, "value" + i, 1, TimeUnit.MINUTES);
        }

        // Warmup
        for (int i = 0; i < WARMUP; i++) {
            redisTemplate.opsForValue().get(KEY_PREFIX + "get_" + i);
        }

        // Measure
        long totalTime = 0;
        for (int i = 0; i < MEASURE * 10; i++) {
            long start = System.nanoTime();
            redisTemplate.opsForValue().get(KEY_PREFIX + "get_" + (i % BATCH_SIZE));
            totalTime += System.nanoTime() - start;
        }

        double avgMs = totalTime / (MEASURE * 10 * 1_000_000.0);
        System.out.println("Redis GET avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 20, "GET should be under 20ms, was: " + avgMs);
    }

    @Test
    @Order(4)
    @DisplayName("Hash operations performance")
    void testHashOperationsPerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping Hash test");
            return;
        }

        String hashKey = KEY_PREFIX + "hash_perf";

        // Warmup
        for (int i = 0; i < WARMUP; i++) {
            redisTemplate.opsForHash().put(hashKey, "field" + i, "value" + i);
        }

        // Measure - HSET
        long setTime = 0;
        for (int i = 0; i < MEASURE; i++) {
            long start = System.nanoTime();
            redisTemplate.opsForHash().put(hashKey, "field_perf_" + i, "value" + i);
            setTime += System.nanoTime() - start;
        }

        // Measure - HGET
        long getTime = 0;
        for (int i = 0; i < MEASURE; i++) {
            long start = System.nanoTime();
            redisTemplate.opsForHash().get(hashKey, "field_perf_" + i);
            getTime += System.nanoTime() - start;
        }

        double setAvgMs = setTime / (MEASURE * 1_000_000.0);
        double getAvgMs = getTime / (MEASURE * 1_000_000.0);

        System.out.println("Redis HSET avg: " + String.format("%.3f", setAvgMs) + "ms");
        System.out.println("Redis HGET avg: " + String.format("%.3f", getAvgMs) + "ms");

        assertTrue(setAvgMs < 50, "HSET should be under 50ms, was: " + setAvgMs);
        assertTrue(getAvgMs < 20, "HGET should be under 20ms, was: " + getAvgMs);
    }

    @Test
    @Order(5)
    @DisplayName("TTL operations performance")
    void testTTLPerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping TTL test");
            return;
        }

        String key = KEY_PREFIX + "ttl_perf";

        // Set with TTL
        long setStart = System.nanoTime();
        redisTemplate.opsForValue().set(key, "value", 5, TimeUnit.MINUTES);
        long setTime = System.nanoTime() - setStart;

        // Get TTL
        long getTtlStart = System.nanoTime();
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        long getTtlTime = System.nanoTime() - getTtlStart;

        System.out.println("SET with TTL: " + (setTime / 1_000_000.0) + "ms");
        System.out.println("GET TTL: " + (getTtlTime / 1_000_000.0) + "ms");

        assertNotNull(ttl, "TTL should not be null");
        assertTrue(ttl > 0, "TTL should be positive");
    }

    @Test
    @Order(6)
    @DisplayName("Batch operations performance")
    void testBatchOperationsPerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping batch test");
            return;
        }

        // Warmup
        for (int i = 0; i < WARMUP; i++) {
            redisTemplate
                    .opsForValue()
                    .set(KEY_PREFIX + "batch_warmup_" + i, "value" + i, 1, TimeUnit.MINUTES);
        }

        // Measure batch SET
        long batchSetStart = System.nanoTime();
        for (int i = 0; i < BATCH_SIZE; i++) {
            redisTemplate
                    .opsForValue()
                    .set(KEY_PREFIX + "batch_" + i, "value" + i, 1, TimeUnit.MINUTES);
        }
        long batchSetTime = System.nanoTime() - batchSetStart;

        // Measure batch GET
        long batchGetStart = System.nanoTime();
        for (int i = 0; i < BATCH_SIZE; i++) {
            redisTemplate.opsForValue().get(KEY_PREFIX + "batch_" + i);
        }
        long batchGetTime = System.nanoTime() - batchGetStart;

        double setThroughput = BATCH_SIZE / (batchSetTime / 1_000_000_000.0);
        double getThroughput = BATCH_SIZE / (batchGetTime / 1_000_000_000.0);

        System.out.println(
                "Batch SET "
                        + BATCH_SIZE
                        + " ops: "
                        + (batchSetTime / 1_000_000.0)
                        + "ms ("
                        + String.format("%.0f", setThroughput)
                        + " ops/sec)");
        System.out.println(
                "Batch GET "
                        + BATCH_SIZE
                        + " ops: "
                        + (batchGetTime / 1_000_000.0)
                        + "ms ("
                        + String.format("%.0f", getThroughput)
                        + " ops/sec)");

        assertTrue(setThroughput > 50, "SET throughput should be > 50 ops/sec");
        assertTrue(getThroughput > 100, "GET throughput should be > 100 ops/sec");
    }

    @Test
    @Order(7)
    @DisplayName("Concurrent Redis access performance")
    void testConcurrentAccessPerformance() throws InterruptedException {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping concurrent test");
            return;
        }

        int threadCount = 10;
        int operationsPerThread = 20;
        AtomicInteger totalOps = new AtomicInteger(0);
        long startTime = System.nanoTime();

        Thread[] threads = new Thread[threadCount];
        for (int i = 0; i < threadCount; i++) {
            final int threadId = i;
            threads[i] =
                    new Thread(
                            () -> {
                                for (int j = 0; j < operationsPerThread; j++) {
                                    String key = KEY_PREFIX + "concurrent_" + threadId + "_" + j;
                                    redisTemplate
                                            .opsForValue()
                                            .set(key, "value", 1, TimeUnit.MINUTES);
                                    redisTemplate.opsForValue().get(key);
                                    totalOps.incrementAndGet();
                                }
                            });
        }

        for (Thread t : threads) t.start();
        for (Thread t : threads) t.join();

        long durationMs = (System.nanoTime() - startTime) / 1_000_000;
        double throughput = totalOps.get() / (durationMs / 1000.0);

        System.out.println(
                "Concurrent Redis access: "
                        + totalOps.get()
                        + " ops in "
                        + durationMs
                        + "ms ("
                        + String.format("%.1f", throughput)
                        + " ops/sec)");

        assertEquals(threadCount * operationsPerThread, totalOps.get());
        assertTrue(throughput > 20, "Throughput should be > 20 ops/sec");
    }

    @Test
    @Order(8)
    @DisplayName("DELETE operation performance")
    void testDeletePerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping DELETE test");
            return;
        }

        // Prepare data
        for (int i = 0; i < BATCH_SIZE; i++) {
            redisTemplate
                    .opsForValue()
                    .set(KEY_PREFIX + "delete_" + i, "value", 1, TimeUnit.MINUTES);
        }

        // Measure single DELETE
        long singleDelStart = System.nanoTime();
        redisTemplate.delete(KEY_PREFIX + "delete_0");
        long singleDelTime = System.nanoTime() - singleDelStart;

        // Measure batch DELETE
        Set<String> keysToDelete = new HashSet<>();
        for (int i = 1; i < BATCH_SIZE; i++) {
            keysToDelete.add(KEY_PREFIX + "delete_" + i);
        }
        long batchDelStart = System.nanoTime();
        redisTemplate.delete(keysToDelete);
        long batchDelTime = System.nanoTime() - batchDelStart;

        System.out.println("Single DELETE: " + (singleDelTime / 1_000_000.0) + "ms");
        System.out.println(
                "Batch DELETE "
                        + keysToDelete.size()
                        + " keys: "
                        + (batchDelTime / 1_000_000.0)
                        + "ms");

        assertTrue(singleDelTime / 1_000_000.0 < 50, "Single DELETE should be under 50ms");
        assertTrue(batchDelTime / 1_000_000.0 < 200, "Batch DELETE should be under 200ms");
    }

    @Test
    @Order(9)
    @DisplayName("EXISTS operation performance")
    void testExistsPerformance() {
        if (redisTemplate == null) {
            System.out.println("Redis not configured, skipping EXISTS test");
            return;
        }

        // Prepare data
        String key = KEY_PREFIX + "exists_test";
        redisTemplate.opsForValue().set(key, "value", 1, TimeUnit.MINUTES);

        // Measure
        long totalTime = 0;
        for (int i = 0; i < MEASURE * 10; i++) {
            long start = System.nanoTime();
            Boolean exists = redisTemplate.hasKey(key);
            totalTime += System.nanoTime() - start;
            assertTrue(exists, "Key should exist");
        }

        double avgMs = totalTime / (MEASURE * 10 * 1_000_000.0);
        System.out.println("EXISTS avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 10, "EXISTS should be under 10ms, was: " + avgMs);
    }
}
