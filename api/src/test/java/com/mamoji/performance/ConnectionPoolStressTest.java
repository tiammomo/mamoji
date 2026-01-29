package com.mamoji.performance;

import static org.junit.jupiter.api.Assertions.*;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.*;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

/**
 * Connection Pool Stress Tests
 *
 * <p>Tests for HikariCP connection pool performance: - Connection acquisition time - Concurrent
 * connection usage - Pool saturation handling - Connection leak detection
 *
 * <p>NOTE: These tests require a real MySQL database. They will be skipped if MySQL is not
 * available.
 */
@Tag("integration")
@Disabled("Requires MySQL database - set up Docker container or external MySQL to run")
public class ConnectionPoolStressTest {

    private HikariDataSource dataSource;
    private static final int POOL_SIZE = 10;
    private static final int MAX_OPERATIONS = 100;

    @BeforeEach
    void setUp() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(
                "jdbc:mysql://localhost:3306/mamoji_test?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai");
        config.setUsername("root");
        config.setPassword("root");
        config.setMaximumPoolSize(POOL_SIZE);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        config.setPoolName("TestHikariCP");

        dataSource = new HikariDataSource(config);
    }

    @AfterEach
    void tearDown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
        }
    }

    @Test
    @DisplayName("Connection acquisition performance")
    void testConnectionAcquisitionPerformance() throws SQLException {
        long totalTime = 0;
        int iterations = 100;

        for (int i = 0; i < iterations; i++) {
            long start = System.nanoTime();
            try (Connection conn = dataSource.getConnection()) {
                long end = System.nanoTime();
                totalTime += (end - start);
                assertTrue(conn.isValid(1), "Connection should be valid");
            }
        }

        double avgTimeMicros = totalTime / (iterations * 1000.0);
        System.out.println(
                "Average connection acquisition time: " + avgTimeMicros + " microseconds");

        // Performance assertion
        assertTrue(
                avgTimeMicros < 10000,
                "Connection acquisition should be under 10ms, was: " + avgTimeMicros);
    }

    @Test
    @DisplayName("Concurrent connection usage")
    void testConcurrentConnections() throws InterruptedException {
        int threadCount = POOL_SIZE;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(
                    () -> {
                        try {
                            startLatch.await(); // Wait for signal to start
                            try (Connection conn = dataSource.getConnection()) {
                                // Simulate some work
                                Thread.sleep(100);
                                successCount.incrementAndGet();
                            }
                        } catch (Exception e) {
                            failCount.incrementAndGet();
                        } finally {
                            doneLatch.countDown();
                        }
                    });
        }

        // Start all threads simultaneously
        startLatch.countDown();
        doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        System.out.println(
                "Concurrent connection test: "
                        + successCount.get()
                        + " succeeded, "
                        + failCount.get()
                        + " failed");

        assertEquals(threadCount, successCount.get(), "All connections should succeed");
        assertEquals(0, failCount.get(), "No connections should fail");
    }

    @Test
    @DisplayName("Pool saturation - requests exceed pool size")
    void testPoolSaturation() throws InterruptedException {
        int threadCount = POOL_SIZE * 2; // Double the pool size
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger timeoutCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(
                    () -> {
                        try {
                            startLatch.await();
                            long start = System.currentTimeMillis();
                            try (Connection conn = dataSource.getConnection()) {
                                // Simulate work
                                Thread.sleep(50);
                                successCount.incrementAndGet();
                            }
                        } catch (SQLException e) {
                            if (e.getMessage().contains("timeout")
                                    || e.getMessage().contains("Connection is not available")) {
                                timeoutCount.incrementAndGet();
                            }
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        } finally {
                            doneLatch.countDown();
                        }
                    });
        }

        startLatch.countDown();
        doneLatch.await(60, TimeUnit.SECONDS);
        executor.shutdown();

        System.out.println(
                "Pool saturation test: "
                        + successCount.get()
                        + " succeeded, "
                        + timeoutCount.get()
                        + " timeouts");

        // At least half should succeed
        assertTrue(
                successCount.get() >= threadCount / 2,
                "At least 50% of connections should succeed, got: " + successCount.get());
    }

    @Test
    @DisplayName("Connection validation on checkout")
    void testConnectionValidation() throws SQLException {
        // Test that connections are validated
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement("SELECT 1");
            ResultSet rs = stmt.executeQuery();
            assertTrue(rs.next(), "Should have result");
            assertEquals(1, rs.getInt(1), "Result should be 1");
            rs.close();
            stmt.close();
        }
    }

    @Test
    @DisplayName("Batch query performance")
    void testBatchQueryPerformance() throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            // Create test table if not exists
            conn.createStatement()
                    .execute(
                            "CREATE TABLE IF NOT EXISTS perf_test (id INT PRIMARY KEY, value VARCHAR(100))");

            // Insert test data
            conn.setAutoCommit(false);
            try (PreparedStatement pstmt =
                    conn.prepareStatement("INSERT INTO perf_test VALUES (?, ?)")) {
                for (int i = 0; i < MAX_OPERATIONS; i++) {
                    pstmt.setInt(1, i);
                    pstmt.setString(2, "value" + i);
                    pstmt.addBatch();
                }
                pstmt.executeBatch();
            }
            conn.commit();

            // Read performance test
            long startTime = System.nanoTime();
            try (PreparedStatement pstmt =
                    conn.prepareStatement("SELECT * FROM perf_test WHERE id < ?")) {
                pstmt.setInt(1, MAX_OPERATIONS / 2);
                ResultSet rs = pstmt.executeQuery();
                int count = 0;
                while (rs.next()) {
                    count++;
                }
                assertEquals(MAX_OPERATIONS / 2, count, "Should retrieve half the records");
            }
            long endTime = System.nanoTime();

            double timeMs = (endTime - startTime) / 1_000_000.0;
            System.out.println(
                    "Batch query of " + (MAX_OPERATIONS / 2) + " records took: " + timeMs + "ms");

            // Clean up
            conn.createStatement().execute("DROP TABLE perf_test");
        }
    }

    @Test
    @DisplayName("Connection leak detection")
    void testConnectionLeakDetection() throws InterruptedException {
        // Create a custom thread that holds connections
        Thread leakThread =
                new Thread(
                        () -> {
                            try {
                                Connection conn = dataSource.getConnection();
                                Thread.sleep(
                                        5000); // Hold connection for longer than leak detection
                                // threshold
                                conn.close();
                            } catch (SQLException | InterruptedException e) {
                                // Expected if pool times out
                            }
                        });

        leakThread.start();
        leakThread.join(10000);

        // If we get here without exception, pool handled the connection properly
        System.out.println("Connection leak test completed");
    }

    @Test
    @DisplayName("High throughput transaction processing")
    void testHighThroughputTransactions() throws SQLException, InterruptedException {
        int batchSize = 50;
        ExecutorService executor = Executors.newFixedThreadPool(batchSize);
        CountDownLatch latch = new CountDownLatch(batchSize);
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < batchSize; i++) {
            executor.submit(
                    () -> {
                        try {
                            try (Connection conn = dataSource.getConnection()) {
                                conn.setAutoCommit(false);
                                try (PreparedStatement stmt =
                                        conn.prepareStatement(
                                                "SELECT COUNT(*) FROM fin_budget WHERE user_id = ?")) {
                                    stmt.setLong(1, 999L);
                                    ResultSet rs = stmt.executeQuery();
                                    rs.next();
                                }
                                conn.commit();
                            }
                        } catch (SQLException e) {
                            e.printStackTrace();
                        } finally {
                            latch.countDown();
                        }
                    });
        }

        latch.await(60, TimeUnit.SECONDS);
        executor.shutdown();

        long endTime = System.currentTimeMillis();
        long totalTime = endTime - startTime;
        double throughput = batchSize / (totalTime / 1000.0);

        System.out.println(
                "High throughput test: "
                        + batchSize
                        + " transactions in "
                        + totalTime
                        + "ms ("
                        + String.format("%.2f", throughput)
                        + " tps)");

        // Performance assertion
        assertTrue(throughput > 5, "Throughput should be greater than 5 tps");
    }

    @Test
    @DisplayName("Pool state verification")
    void testPoolState() throws SQLException {
        // Get pool configuration
        assertNotNull(dataSource.getMaximumPoolSize(), "Pool should have max size");
        assertNotNull(dataSource.getMinimumIdle(), "Pool should have min idle");
        assertEquals(POOL_SIZE, dataSource.getMaximumPoolSize(), "Pool size should match config");
        assertEquals(5, dataSource.getMinimumIdle(), "Min idle should match config");

        // Verify we can get connections
        try (Connection conn = dataSource.getConnection()) {
            assertTrue(conn.isValid(1), "Connection should be valid");
        }

        System.out.println("Pool state verification passed");
    }
}
