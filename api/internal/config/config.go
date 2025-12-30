package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config 应用配置
type Config struct {
	// 应用配置
	App struct {
		Name  string `mapstructure:"name"`
		Host  string `mapstructure:"host"`
		Port  int    `mapstructure:"port"`
		Env   string `mapstructure:"env"`
		Debug bool   `mapstructure:"debug"`
	}

	// 数据库配置
	Database struct {
		Host            string        `mapstructure:"host"`
		Port            int           `mapstructure:"port"`
		Username        string        `mapstructure:"username"`
		Password        string        `mapstructure:"password"`
		Name            string        `mapstructure:"name"`
		MaxOpenConns    int           `mapstructure:"max_open_conns"`
		MaxIdleConns    int           `mapstructure:"max_idle_conns"`
		ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	}

	// Redis配置
	Redis struct {
		Host     string `mapstructure:"host"`
		Port     int    `mapstructure:"port"`
		Username string `mapstructure:"username"`
		Password string `mapstructure:"password"`
		DB       int    `mapstructure:"db"`
		PoolSize int    `mapstructure:"pool_size"`
	}

	// JWT配置
	JWT struct {
		SecretKey  string        `mapstructure:"secret_key"`
		ExpireTime time.Duration `mapstructure:"expire_time"`
	}
}

// Load 加载配置
func Load() (*Config, error) {
	v := viper.New()

	// 设置默认值
	v.SetDefault("app.name", "mamoji")
	v.SetDefault("app.host", "0.0.0.0")
	v.SetDefault("app.port", 8888)
	v.SetDefault("app.env", "development")
	v.SetDefault("app.debug", true)

	v.SetDefault("database.host", "localhost")
	v.SetDefault("database.port", 3306)
	v.SetDefault("database.max_open_conns", 100)
	v.SetDefault("database.max_idle_conns", 10)
	v.SetDefault("database.conn_max_lifetime", time.Hour)

	v.SetDefault("redis.host", "localhost")
	v.SetDefault("redis.port", 6379)
	v.SetDefault("redis.db", 0)
	v.SetDefault("redis.pool_size", 100)

	v.SetDefault("jwt.expire_time", 24*time.Hour)

	// 从配置文件读取
	configPath := "config"
	configName := "config"
	v.AddConfigPath(configPath)
	v.SetConfigName(configName)
	v.SetConfigType("yaml")

	// 环境变量覆盖
	v.SetEnvPrefix("MAMOJI")
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}

// DSN 获取MySQL DSN
func (c *Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.Database.Username,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
	)
}

// Addr 获取Redis地址
func (c *Config) Addr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}
