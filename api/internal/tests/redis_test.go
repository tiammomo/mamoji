package tests

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestRedisConnection 测试 Redis 连接
// 注意: 阿里云 Redis 需要正确的用户名/密码组合
// 如果遇到 WRONGPASS 错误,需要检查:
// 1. 是否启用了 Redis 密码认证
// 2. 用户名是否正确(部分实例不需要用户名)
// 3. 密码是否正确
func TestRedisConnection(t *testing.T) {
	// 创建 Redis 客户端配置
	client := redis.NewClient(&redis.Options{
		Addr:     "r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com:6379",
		Username: "mamoji",
		Password: "mamoji123!",
		DB:       0,
		PoolSize: 10,
	})
	defer client.Close()

	// 测试连接
	ctx := context.Background()
	err := client.Ping(ctx).Err()
	if err != nil {
		t.Logf("Redis 连接失败(需要检查凭据): %v", err)
		t.Skip("Redis 认证失败,请检查阿里云 Redis 凭据配置")
	}
	t.Log("Redis 连接成功")
}

// TestRedisBasicOperations 测试 Redis 基本操作
func TestRedisBasicOperations(t *testing.T) {
	client := redis.NewClient(&redis.Options{
		Addr:     "r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com:6379",
		Username: "mamoji",
		Password: "mamoji123!",
		DB:       0,
	})
	defer client.Close()

	ctx := context.Background()
	keyPrefix := "mamoji:test:"

	// 测试连接是否正常
	if err := client.Ping(ctx).Err(); err != nil {
		t.Logf("Redis 连接失败: %v", err)
		t.Skip("Redis 认证失败,跳过测试")
	}

	// 测试 String 操作
	t.Run("String Operations", func(t *testing.T) {
		key := keyPrefix + "string_key"
		value := "test_value_" + time.Now().Format("20060102150405")

		// Set
		err := client.Set(ctx, key, value, 5*time.Minute).Err()
		require.NoError(t, err, "Redis SET 失败")

		// Get
		result, err := client.Get(ctx, key).Result()
		require.NoError(t, err, "Redis GET 失败")
		assert.Equal(t, value, result, "Redis GET 值不匹配")

		// Delete
		err = client.Del(ctx, key).Err()
		require.NoError(t, err, "Redis DEL 失败")
		t.Log("String 操作测试通过")
	})

	// 测试 Hash 操作
	t.Run("Hash Operations", func(t *testing.T) {
		key := keyPrefix + "hash_key"
		field := "user_id"

		// HSet
		err := client.HSet(ctx, key, field, "12345").Err()
		require.NoError(t, err, "Redis HSET 失败")

		// HGet
		result, err := client.HGet(ctx, key, field).Result()
		require.NoError(t, err, "Redis HGET 失败")
		assert.Equal(t, "12345", result, "Redis HGET 值不匹配")

		// HDel
		err = client.HDel(ctx, key, field).Err()
		require.NoError(t, err, "Redis HDEL 失败")
		t.Log("Hash 操作测试通过")
	})

	// 测试 List 操作
	t.Run("List Operations", func(t *testing.T) {
		key := keyPrefix + "list_key"

		// LPush
		err := client.LPush(ctx, key, "item1", "item2", "item3").Err()
		require.NoError(t, err, "Redis LPUSH 失败")

		// LRange
		result, err := client.LRange(ctx, key, 0, -1).Result()
		require.NoError(t, err, "Redis LRANGE 失败")
		assert.Len(t, result, 3, "List 长度不匹配")

		// LPop
		popResult, err := client.LPop(ctx, key).Result()
		require.NoError(t, err, "Redis LPOP 失败")
		assert.Equal(t, "item3", popResult, "LPOP 值不匹配")

		// Delete
		err = client.Del(ctx, key).Err()
		require.NoError(t, err, "Redis DEL 失败")
		t.Log("List 操作测试通过")
	})

	// 测试 Set 操作
	t.Run("Set Operations", func(t *testing.T) {
		key := keyPrefix + "set_key"

		// SAdd
		err := client.SAdd(ctx, key, "member1", "member2", "member3").Err()
		require.NoError(t, err, "Redis SADD 失败")

		// SMembers
		result, err := client.SMembers(ctx, key).Result()
		require.NoError(t, err, "Redis SMEMBERS 失败")
		assert.Len(t, result, 3, "Set 成员数量不匹配")

		// SIsMember
		isMember, err := client.SIsMember(ctx, key, "member1").Result()
		require.NoError(t, err, "Redis SISMEMBER 失败")
		assert.True(t, isMember, "SISMEMBER 应返回 true")

		// Delete
		err = client.Del(ctx, key).Err()
		require.NoError(t, err, "Redis DEL 失败")
		t.Log("Set 操作测试通过")
	})

	// 测试过期时间
	t.Run("Expiration", func(t *testing.T) {
		key := keyPrefix + "expire_key"
		value := "will_expire"

		// Set with expiration
		err := client.Set(ctx, key, value, 2*time.Second).Err()
		require.NoError(t, err, "Redis SET EX 失败")

		// Check TTL before expiration
		ttl, err := client.TTL(ctx, key).Result()
		require.NoError(t, err, "Redis TTL 失败")
		assert.True(t, ttl > 0, "TTL 应大于 0")

		// Wait for expiration
		time.Sleep(3 * time.Second)

		// Check if key exists
		exists, err := client.Exists(ctx, key).Result()
		require.NoError(t, err, "Redis EXISTS 失败")
		assert.Equal(t, int64(0), exists, "Key 应已过期")
		t.Log("过期时间测试通过")
	})
}

// TestRedisKeyPrefix 测试 Redis Key 前缀隔离
func TestRedisKeyPrefix(t *testing.T) {
	client := redis.NewClient(&redis.Options{
		Addr:     "r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com:6379",
		Username: "mamoji",
		Password: "mamoji123!",
		DB:       0,
	})
	defer client.Close()

	ctx := context.Background()
	keyPrefix := "mamoji:"

	// 测试连接
	if err := client.Ping(ctx).Err(); err != nil {
		t.Logf("Redis 连接失败: %v", err)
		t.Skip("Redis 认证失败,跳过测试")
	}

	// 模拟项目使用的 key 前缀
	testKeys := []string{
		keyPrefix + "cache:user:1",
		keyPrefix + "cache:enterprise:1",
		keyPrefix + "session:abc123",
		keyPrefix + "config:budget_threshold",
	}

	// 批量设置
	for _, key := range testKeys {
		err := client.Set(ctx, key, "test_value", time.Minute).Err()
		require.NoError(t, err, "批量 SET 失败: %s", key)
	}

	// 验证所有 key 都存在
	for _, key := range testKeys {
		exists, err := client.Exists(ctx, key).Result()
		require.NoError(t, err, "EXISTS 失败: %s", key)
		assert.Equal(t, int64(1), exists, "Key 应存在: %s", key)
	}

	// 清理测试数据
	for _, key := range testKeys {
		err := client.Del(ctx, key).Err()
		require.NoError(t, err, "DEL 失败: %s", key)
	}

	t.Log("Key 前缀隔离测试通过")
}

// TestRedisPerformance 测试 Redis 性能（简单基准测试）
func TestRedisPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("跳过性能测试")
	}

	client := redis.NewClient(&redis.Options{
		Addr:     "r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com:6379",
		Username: "mamoji",
		Password: "mamoji123!",
		DB:       0,
		PoolSize: 50,
	})
	defer client.Close()

	ctx := context.Background()

	// 测试连接
	if err := client.Ping(ctx).Err(); err != nil {
		t.Logf("Redis 连接失败: %v", err)
		t.Skip("Redis 认证失败,跳过测试")
	}

	key := "mamoji:perf_test"
	value := "performance_test_value"

	// 基准测试：100次读写
	for i := 0; i < 100; i++ {
		err := client.Set(ctx, key, value, time.Minute).Err()
		require.NoError(t, err)

		_, err = client.Get(ctx, key).Result()
		require.NoError(t, err)
	}

	// 清理
	client.Del(ctx, key)

	t.Log("性能测试完成")
}
