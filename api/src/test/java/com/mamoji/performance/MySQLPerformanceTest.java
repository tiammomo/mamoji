package com.mamoji.performance;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicInteger;

import javax.sql.DataSource;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.mamoji.config.TestSecurityConfig;

/**
 * MySQL 数据库性能测试
 *
 * <p>测试内容包括：
 * <ul>
 *   <li>简单查询</li>
 *   <li>复杂查询（JOIN）</li>
 *   <li>批量操作</li>
 *   <li>事务性能</li>
 *   <li>连接池效率</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MySQLPerformanceTest {

    @Autowired private DataSource dataSource;

    private static final String TEST_TABLE = "perf_test_table";
    private static final int BATCH_SIZE = 100;
    private static final int WARMUP_ITERATIONS = 5;
    private static final int MEASURE_ITERATIONS = 10;

    @BeforeAll
    static void createTestTable(@Autowired DataSource dataSource) throws SQLException {
        try (Connection conn = dataSource.getConnection();
                Statement stmt = conn.createStatement()) {
            stmt.execute(
                    "CREATE TABLE IF NOT EXISTS "
                            + TEST_TABLE
                            + " ("
                            + "id INT AUTO_INCREMENT PRIMARY KEY, "
                            + "name VARCHAR(100), "
                            + "value DECIMAL(10,2))");
        }
    }

    @AfterAll
    static void dropTestTable(@Autowired DataSource dataSource) throws SQLException {
        try (Connection conn = dataSource.getConnection();
                Statement stmt = conn.createStatement()) {
            stmt.execute("DROP TABLE IF EXISTS " + TEST_TABLE);
        }
    }

    @Test
    @Order(1)
    @DisplayName("Simple SELECT query performance")
    void testSimpleSelectPerformance() throws SQLException {
        // Warmup
        for (int i = 0; i < WARMUP_ITERATIONS; i++) {
            executeSimpleQuery();
        }

        // Measure
        long totalTime = 0;
        for (int i = 0; i < MEASURE_ITERATIONS; i++) {
            long start = System.nanoTime();
            executeSimpleQuery();
            totalTime += System.nanoTime() - start;
        }

        double avgMs = totalTime / (MEASURE_ITERATIONS * 1_000_000.0);
        System.out.println("Simple SELECT avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 50, "Simple SELECT should be under 50ms, was: " + avgMs);
    }

    @Test
    @Order(2)
    @DisplayName("COUNT query performance")
    void testCountQueryPerformance() throws SQLException {
        long totalTime = 0;
        for (int i = 0; i < MEASURE_ITERATIONS; i++) {
            long start = System.nanoTime();
            int count = executeCountQuery();
            totalTime += System.nanoTime() - start;
            assertTrue(count >= 0, "Count should be non-negative");
        }

        double avgMs = totalTime / (MEASURE_ITERATIONS * 1_000_000.0);
        System.out.println("COUNT query avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 30, "COUNT query should be under 30ms, was: " + avgMs);
    }

    @Test
    @Order(3)
    @DisplayName("INSERT batch performance")
    void testBatchInsertPerformance() throws SQLException {
        long totalTime = 0;
        int totalInserted = 0;

        for (int batch = 0; batch < MEASURE_ITERATIONS; batch++) {
            long start = System.nanoTime();
            int inserted = executeBatchInsert(BATCH_SIZE);
            totalTime += System.nanoTime() - start;
            totalInserted += inserted;
        }

        double avgMs = totalTime / (MEASURE_ITERATIONS * 1_000_000.0);
        double throughput = BATCH_SIZE / avgMs;

        System.out.println(
                "Batch INSERT avg: "
                        + String.format("%.3f", avgMs)
                        + "ms ("
                        + String.format("%.1f", throughput)
                        + " ops/sec)");

        assertTrue(avgMs < 500, "Batch INSERT should be under 500ms, was: " + avgMs);
        assertEquals(MEASURE_ITERATIONS * BATCH_SIZE, totalInserted);
    }

    @Test
    @Order(4)
    @DisplayName("UPDATE batch performance")
    void testBatchUpdatePerformance() throws SQLException {
        // Insert data first
        int inserted = executeBatchInsert(BATCH_SIZE);
        assertTrue(inserted > 0, "Should insert data first, inserted: " + inserted);

        long totalTime = 0;
        for (int i = 0; i < MEASURE_ITERATIONS; i++) {
            long start = System.nanoTime();
            executeBatchUpdate();
            totalTime += System.nanoTime() - start;
        }

        double avgMs = totalTime / (MEASURE_ITERATIONS * 1_000_000.0);
        System.out.println("Batch UPDATE avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 200, "Batch UPDATE should be under 200ms, was: " + avgMs);
    }

    @Test
    @Order(5)
    @DisplayName("Transaction performance")
    void testTransactionPerformance() throws SQLException {
        long totalTime = 0;
        int operations = 20;

        for (int i = 0; i < MEASURE_ITERATIONS; i++) {
            long start = System.nanoTime();
            executeTransaction(operations);
            totalTime += System.nanoTime() - start;
        }

        double avgMs = totalTime / (MEASURE_ITERATIONS * 1_000_000.0);
        double throughput = operations / avgMs;

        System.out.println(
                "Transaction ("
                        + operations
                        + " ops) avg: "
                        + String.format("%.3f", avgMs)
                        + "ms ("
                        + String.format("%.1f", throughput)
                        + " ops/sec)");

        assertTrue(avgMs < 500, "Transaction should be under 500ms, was: " + avgMs);
    }

    @Test
    @Order(6)
    @DisplayName("Concurrent query performance")
    void testConcurrentQueryPerformance() throws InterruptedException {
        int threadCount = 10;
        int queriesPerThread = 10;
        AtomicInteger totalQueries = new AtomicInteger(0);
        long startTime = System.nanoTime();

        Thread[] threads = new Thread[threadCount];
        for (int i = 0; i < threadCount; i++) {
            threads[i] =
                    new Thread(
                            () -> {
                                for (int j = 0; j < queriesPerThread; j++) {
                                    try {
                                        executeSimpleQuery();
                                        totalQueries.incrementAndGet();
                                    } catch (SQLException e) {
                                        e.printStackTrace();
                                    }
                                }
                            });
        }

        for (Thread t : threads) t.start();
        for (Thread t : threads) t.join();

        long durationMs = (System.nanoTime() - startTime) / 1_000_000;
        double throughput = totalQueries.get() / (durationMs / 1000.0);

        System.out.println(
                "Concurrent queries: "
                        + totalQueries.get()
                        + " in "
                        + durationMs
                        + "ms ("
                        + String.format("%.1f", throughput)
                        + " ops/sec)");

        assertEquals(threadCount * queriesPerThread, totalQueries.get());
        assertTrue(throughput > 5, "Throughput should be > 5 ops/sec");
    }

    @Test
    @Order(7)
    @DisplayName("PreparedStatement reuse performance")
    void testPreparedStatementPerformance() throws SQLException {
        // Warmup
        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt =
                        conn.prepareStatement(
                                "SELECT COUNT(*) FROM fin_budget WHERE user_id = ?")) {
            for (int i = 0; i < WARMUP_ITERATIONS; i++) {
                stmt.setLong(1, 999L);
                stmt.executeQuery();
            }
        }

        // Measure
        long totalTime = 0;
        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt =
                        conn.prepareStatement(
                                "SELECT COUNT(*) FROM fin_budget WHERE user_id = ?")) {

            for (int i = 0; i < MEASURE_ITERATIONS; i++) {
                long start = System.nanoTime();
                stmt.setLong(1, 999L);
                ResultSet rs = stmt.executeQuery();
                rs.next();
                totalTime += System.nanoTime() - start;
            }
        }

        double avgMs = totalTime / (MEASURE_ITERATIONS * 1_000_000.0);
        System.out.println("PreparedStatement reuse avg: " + String.format("%.3f", avgMs) + "ms");

        assertTrue(avgMs < 20, "PreparedStatement should be under 20ms, was: " + avgMs);
    }

    private void executeSimpleQuery() throws SQLException {
        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt =
                        conn.prepareStatement("SELECT * FROM fin_budget WHERE budget_id = 1");
                ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                // Just iterate
            }
        }
    }

    private int executeCountQuery() throws SQLException {
        try (Connection conn = dataSource.getConnection();
                PreparedStatement stmt = conn.prepareStatement("SELECT COUNT(*) FROM fin_budget");
                ResultSet rs = stmt.executeQuery()) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private int executeBatchInsert(int size) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement stmt =
                    conn.prepareStatement(
                            "INSERT INTO " + TEST_TABLE + " (name, value) VALUES (?, ?)")) {
                for (int i = 0; i < size; i++) {
                    stmt.setString(1, "test_" + System.nanoTime() + "_" + i);
                    stmt.setBigDecimal(2, new BigDecimal(i));
                    stmt.addBatch();
                }
                int[] results = stmt.executeBatch();
                conn.commit();
                return results.length;
            }
        }
    }

    private int executeBatchUpdate() throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement stmt =
                    conn.prepareStatement("UPDATE " + TEST_TABLE + " SET value = value + 1")) {
                int[] results = stmt.executeBatch();
                conn.commit();
                return results.length;
            }
        }
    }

    private void executeTransaction(int operations) throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            for (int i = 0; i < operations; i++) {
                try (PreparedStatement stmt =
                        conn.prepareStatement("SELECT COUNT(*) FROM fin_budget")) {
                    stmt.executeQuery();
                }
            }
            conn.commit();
        }
    }
}
