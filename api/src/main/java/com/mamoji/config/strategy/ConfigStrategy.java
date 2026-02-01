package com.mamoji.config.strategy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration strategy using Strategy Pattern. Provides different configurations based on
 * environment.
 */
@Configuration
public class ConfigStrategy {

    @Value("${spring.profiles.active:dev}")
    private String activeProfile;

    /**
     * Primary data source configuration based on environment.
     */
    @Bean
    @Primary
    public DataSourceConfigStrategy dataSourceConfigStrategy() {
        return switch (activeProfile) {
            case "prod", "production" -> new ProductionDataSourceConfig();
            case "test" -> new TestDataSourceConfig();
            default -> new DevelopmentDataSourceConfig();
        };
    }

    /**
     * Primary Redis configuration based on environment.
     */
    @Bean
    @Primary
    public RedisConfigStrategy redisConfigStrategy() {
        return switch (activeProfile) {
            case "prod", "production" -> new ProductionRedisConfig();
            case "test" -> new TestRedisConfig();
            default -> new DevelopmentRedisConfig();
        };
    }

    // ==================== Data Source Strategy ====================

    public interface DataSourceConfigStrategy {
        String getJdbcUrl();
        String getDriverClassName();
        String getUsername();
        String getPassword();
        int getMaximumPoolSize();
        int getMinimumIdle();
        long getConnectionTimeout();
    }

    private static class DevelopmentDataSourceConfig implements DataSourceConfigStrategy {
        @Override
        public String getJdbcUrl() {
            return "jdbc:mysql://localhost:3306/mamoji?useSSL=false&serverTimezone=UTC";
        }

        @Override
        public String getDriverClassName() {
            return "com.mysql.cj.jdbc.Driver";
        }

        @Override
        public String getUsername() {
            return "root";
        }

        @Override
        public String getPassword() {
            return "rootpassword";
        }

        @Override
        public int getMaximumPoolSize() {
            return 10;
        }

        @Override
        public int getMinimumIdle() {
            return 5;
        }

        @Override
        public long getConnectionTimeout() {
            return 30000;
        }
    }

    private static class TestDataSourceConfig implements DataSourceConfigStrategy {
        @Override
        public String getJdbcUrl() {
            return "jdbc:mysql://localhost:3306/mamoji_test?useSSL=false&serverTimezone=UTC";
        }

        @Override
        public String getDriverClassName() {
            return "com.mysql.cj.jdbc.Driver";
        }

        @Override
        public String getUsername() {
            return "root";
        }

        @Override
        public String getPassword() {
            return "rootpassword";
        }

        @Override
        public int getMaximumPoolSize() {
            return 5;
        }

        @Override
        public int getMinimumIdle() {
            return 2;
        }

        @Override
        public long getConnectionTimeout() {
            return 60000;
        }
    }

    private static class ProductionDataSourceConfig implements DataSourceConfigStrategy {
        @Override
        public String getJdbcUrl() {
            return System.getenv("DB_URL");
        }

        @Override
        public String getDriverClassName() {
            return "com.mysql.cj.jdbc.Driver";
        }

        @Override
        public String getUsername() {
            return System.getenv("DB_USERNAME");
        }

        @Override
        public String getPassword() {
            return System.getenv("DB_PASSWORD");
        }

        @Override
        public int getMaximumPoolSize() {
            return 20;
        }

        @Override
        public int getMinimumIdle() {
            return 5;
        }

        @Override
        public long getConnectionTimeout() {
            return 60000;
        }
    }

    // ==================== Redis Strategy ====================

    public interface RedisConfigStrategy {
        String getHost();
        int getPort();
        int getDatabase();
        long getTimeout();
        int getMaxActive();
        int getMaxIdle();
        int getMinIdle();
    }

    private static class DevelopmentRedisConfig implements RedisConfigStrategy {
        @Override
        public String getHost() {
            return "localhost";
        }

        @Override
        public int getPort() {
            return 6379;
        }

        @Override
        public int getDatabase() {
            return 0;
        }

        @Override
        public long getTimeout() {
            return 5000;
        }

        @Override
        public int getMaxActive() {
            return 10;
        }

        @Override
        public int getMaxIdle() {
            return 5;
        }

        @Override
        public int getMinIdle() {
            return 2;
        }
    }

    private static class TestRedisConfig implements RedisConfigStrategy {
        @Override
        public String getHost() {
            return "localhost";
        }

        @Override
        public int getPort() {
            return 6379;
        }

        @Override
        public int getDatabase() {
            return 1;
        }

        @Override
        public long getTimeout() {
            return 3000;
        }

        @Override
        public int getMaxActive() {
            return 5;
        }

        @Override
        public int getMaxIdle() {
            return 2;
        }

        @Override
        public int getMinIdle() {
            return 1;
        }
    }

    private static class ProductionRedisConfig implements RedisConfigStrategy {
        @Override
        public String getHost() {
            return System.getenv("REDIS_HOST");
        }

        @Override
        public int getPort() {
            return Integer.parseInt(System.getenv("REDIS_PORT"));
        }

        @Override
        public int getDatabase() {
            return 0;
        }

        @Override
        public long getTimeout() {
            return 10000;
        }

        @Override
        public int getMaxActive() {
            return 50;
        }

        @Override
        public int getMaxIdle() {
            return 20;
        }

        @Override
        public int getMinIdle() {
            return 5;
        }
    }

    // ==================== Utility Methods ====================

    public String getActiveProfile() {
        return activeProfile;
    }

    public boolean isDevelopment() {
        return "dev".equals(activeProfile);
    }

    public boolean isTest() {
        return "test".equals(activeProfile);
    }

    public boolean isProduction() {
        return "prod".equals(activeProfile) || "production".equals(activeProfile);
    }
}
