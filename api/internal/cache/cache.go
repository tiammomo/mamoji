package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"mamoji/api/internal/config"
)

var (
	client *redis.Client
	ctx    = context.Background()
)

// CacheKeyPrefix cache key 前缀
const (
	BudgetKeyPrefix     = "budget:"
	BudgetListPrefix    = "budget:list:"
	BudgetUsagePrefix   = "budget:usage:"
	EnterpriseKeyPrefix = "enterprise:"
)

// Init 初始化Redis客户端
func Init(cfg *config.Config) error {
	client = redis.NewClient(&redis.Options{
		Addr:     cfg.Addr(),
		Username: cfg.Redis.Username,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
		PoolSize: cfg.Redis.PoolSize,
	})

	// 测试连接
	if err := client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return nil
}

// Close 关闭Redis连接
func Close() error {
	if client != nil {
		return client.Close()
	}
	return nil
}

// GetClient 获取Redis客户端（用于测试）
func GetClient() *redis.Client {
	return client
}

// Get 获取缓存值
func Get(key string) (string, error) {
	if client == nil {
		return "", fmt.Errorf("Redis client not initialized")
	}
	return client.Get(ctx, key).Result()
}

// Set 设置缓存值
func Set(key string, value interface{}, expiration time.Duration) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	var data []byte
	var err error

	switch v := value.(type) {
	case string:
		data = []byte(v)
	case []byte:
		data = v
	default:
		data, err = json.Marshal(value)
		if err != nil {
			return fmt.Errorf("failed to marshal value: %w", err)
		}
	}

	return client.Set(ctx, key, data, expiration).Err()
}

// Delete 删除缓存
func Delete(key string) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	return client.Del(ctx, key).Err()
}

// Exists 检查键是否存在
func Exists(key string) (bool, error) {
	if client == nil {
		return false, fmt.Errorf("Redis client not initialized")
	}
	result, err := client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

// GetJSON 获取JSON缓存值
func GetJSON(key string, dest interface{}) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	data, err := client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}

	return json.Unmarshal(data, dest)
}

// SetJSON 设置JSON缓存值
func SetJSON(key string, value interface{}, expiration time.Duration) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	return client.Set(ctx, key, data, expiration).Err()
}

// DeletePattern 删除匹配的所有键
func DeletePattern(pattern string) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}

	keys, err := client.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}

	if len(keys) > 0 {
		return client.Del(ctx, keys...).Err()
	}

	return nil
}

// Increment 增加计数器
func Increment(key string) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	return client.Incr(ctx, key).Err()
}

// Decrement 减少计数器
func Decrement(key string) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	return client.Decr(ctx, key).Err()
}

// SetExpire 设置过期时间
func SetExpire(key string, expiration time.Duration) error {
	if client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	return client.Expire(ctx, key, expiration).Err()
}

// DefaultExpiration 默认缓存过期时间
const (
	DefaultExpiration = 5 * time.Minute  // 默认5分钟
	ShortExpiration   = 1 * time.Minute  // 短过期时间
	LongExpiration    = 30 * time.Minute // 长过期时间
)
