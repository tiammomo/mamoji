package logger

import (
	"errors"
	"time"
)

// Example_basic 基本使用示例
func Example_basic() {
	// 创建日志器
	log := New()

	// 初始化（从环境变量）
	if err := log.SetupFromEnv("APP_LOG_"); err != nil {
		panic(err)
	}
	defer log.Close()

	// 基本日志
	log.Info("应用程序启动")
	log.Debugf("调试信息: %s", "test")
	log.Warn("警告信息")
	log.Error("错误信息")

	// 带字段的日志
	log.Infow("用户登录成功", "user_id", 1001, "username", "admin")
	log.Errorw("请求处理失败", errors.New("数据库连接超时"), "request_id", "req-123")

	// 性能追踪
	start := time.Now()
	defer log.Infox("数据库查询完成", start, "table", "users")

	// 模拟耗时操作
	time.Sleep(100 * time.Millisecond)
}

// Example_withConfig 配置文件使用示例
func Example_withConfig() {
	// 使用配置文件初始化
	log := New()
	if err := log.SetupFromConfig("config/logger.yaml"); err != nil {
		panic(err)
	}
	defer log.Close()

	log.Info("从配置文件初始化完成")
}

// Example_withRequest 请求追踪示例
func Example_withRequest() {
	log := New()
	log.SetupFromEnv("")

	requestID := "req-abc-123"

	// 带请求上下文的日志
	log.WithRequest(requestID).Info("收到请求")

	// 模拟处理
	log.WithRequest(requestID).Debugc("开始处理请求")

	time.Sleep(50 * time.Millisecond)

	log.WithRequest(requestID).Infox("请求处理完成", time.Now(), "duration_ms", 50)
}

// Example_业务方法追踪 业务方法进入/退出追踪
func Example_业务方法追踪() {
	log := New()
	log.SetupFromEnv("")

	// 在方法开始时调用
	log.Infoc("UserService.CreateUser 开始执行", map[string]interface{}{
		"username": "test_user",
		"email":    "test@example.com",
	})

	start := time.Now()

	// 业务逻辑...
	time.Sleep(100 * time.Millisecond)

	// 在方法结束时调用
	log.Infox("UserService.CreateUser 执行完成", start, map[string]interface{}{
		"user_id":  1001,
		"duration": time.Since(start).String(),
	})
}

// Example_错误堆栈 记录错误和堆栈信息
func Example_错误堆栈() {
	log := New()
	log.SetupFromEnv("")

	// 模拟一个错误
	err := errors.New("数据库查询失败: connection refused")

	// 记录错误及堆栈
	log.Errorw("数据库操作失败", err,
		"sql",      "SELECT * FROM users WHERE id = ?",
		"params",   []interface{}{1001},
		"retry_count", 3,
	)
}

// Example_结构化日志 结构化日志输出示例
func Example_结构化日志() {
	log := New()
	log.SetupFromEnv("")

	// JSON格式输出
	log.Infow("订单创建",
		"order_id", "ORD-2024-001",
		"user_id", 1001,
		"amount", 299.00,
		"items_count", 3,
		"payment_method", "wechat",
	)

	// 多级嵌套
	log.Infow("用户行为",
		"event", "page_view",
		"page", "/products/123",
		"user_agent", "Mozilla/5.0",
		"referrer", "https://google.com",
	)
}

// Example_动态调整级别 动态调整日志级别示例
func Example_动态调整级别() {
	log := New()
	log.SetupFromEnv("")

	// 正常运行时使用INFO级别
	log.SetLevel(INFO)

	// 当需要调试时，动态调整为DEBUG级别
	log.SetLevel(DEBUG)
	log.Debug("调试信息已启用")

	// 调试完成后恢复INFO级别
	log.SetLevel(INFO)
}

// Example_性能追踪 性能追踪示例
func Example_性能追踪() {
	log := New()
	log.SetupFromEnv("")

	// 追踪API调用
	start := time.Now()
	log.Infoc("调用外部API", map[string]interface{}{
		"url": "https://api.example.com/data",
	})

	// 模拟API调用
	time.Sleep(200 * time.Millisecond)

	log.Infox("外部API调用完成", start, map[string]interface{}{
		"status_code": 200,
		"response_ms": 200,
	})

	// 追踪数据库查询
	start = time.Now()
	log.Infoc("执行数据库查询", map[string]interface{}{
		"sql": "SELECT * FROM orders WHERE user_id = ?",
	})

	time.Sleep(50 * time.Millisecond)

	log.Infox("数据库查询完成", start, map[string]interface{}{
		"rows_affected": 5,
		"query_ms":      50,
	})
}

// Example_链路追踪 分布式链路追踪示例
func Example_链路追踪() {
	log := New()
	log.SetupFromEnv("")

	traceID := "trace-abc-123-span-456"
	spanID := "span-789"

	// 记录链路信息
	log.WithTrace(traceID).Infow("开始处理span",
		"span_id", spanID,
		"parent_span_id", "",
		"span_name", "user_service.GetUser",
	)

	// 记录子span
	log.WithTrace(traceID).Infoc("查询数据库", map[string]interface{}{
		"span_id", "span-db-001",
		"sql", "SELECT * FROM users WHERE id = ?",
	})

	time.Sleep(30 * time.Millisecond)

	log.WithTrace(traceID).Infox("数据库查询完成", time.Now(), map[string]interface{}{
		"span_id",   "span-db-001",
		"rows",      1,
		"cache_hit", false,
	})

	// 完成span
	log.WithTrace(traceID).Infox("处理完成", time.Now(), map[string]interface{}{
		"span_id",     spanID,
		"total_ms":    150,
		"status_code": 200,
	})
}
