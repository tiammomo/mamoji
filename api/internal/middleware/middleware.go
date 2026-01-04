package middleware

import (
	"context"
	"strings"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/golang-jwt/jwt/v5"
	"mamoji/api/internal/config"
	"mamoji/api/internal/logger"
)

// App 全局应用配置
var App struct {
	Env string
}

// Register 注册中间件
func Register(h *server.Hertz) {
	// 初始化应用配置
	cfg, err := config.Load()
	if err == nil {
		App.Env = cfg.App.Env
	}
	// 跨域中间件
	h.Use(CORS())

	// 日志中间件
	h.Use(Logger())

	// 认证中间件
	h.Use(Auth())

	// 限流中间件
	h.Use(RateLimit())
}

// CORS 跨域中间件
func CORS() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		// 允许所有来源（生产环境建议改为具体域名）
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Range")
		c.Header("Access-Control-Max-Age", "86400")

		// 允许携带认证信息（Cookie/Token）
		c.Header("Access-Control-Allow-Credentials", "true")

		if string(c.Request.Method()) == "OPTIONS" {
			c.AbortWithStatus(consts.StatusOK)
			return
		}

		c.Next(ctx)
	}
}

// Logger 日志中间件
func Logger() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		start := time.Now()
		path := string(c.Request.URI().Path())
		query := string(c.Request.URI().QueryString())
		requestID := string(c.GetHeader("X-Request-ID"))
		if requestID == "" {
			requestID = "unknown"
		}

		log := logger.Get()

		// 记录请求开始
		log.InfoMap("HTTP请求开始",
			map[string]interface{}{
				"method":     string(c.Request.Method()),
				"path":       path,
				"query":      query,
				"request_id": requestID,
				"user_agent": string(c.Request.Header.Get("User-Agent")),
				"ip":         string(c.ClientIP()),
			},
		)

		c.Next(ctx)

		latency := time.Since(start)
		status := c.Response.StatusCode()

		// 记录请求完成
		log.Infow("HTTP请求完成",
			"request_id", requestID,
			"method", string(c.Request.Method()),
			"path", path,
			"status_code", status,
			"duration_ms", latency.Milliseconds(),
		)
	}
}

// Auth 认证中间件
func Auth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		log := logger.Get()
		requestID := string(c.GetHeader("X-Request-ID"))
		if requestID == "" {
			requestID = "unknown"
		}
		path := string(c.Request.URI().Path())

		// 公开路由（使用更精确的匹配）
		publicPaths := []string{
			"/api/v1/auth/login",
			"/api/v1/auth/register",
			"/health",
		}

		// Swagger 路径（任何 /swagger 开头的路径和 doc.json）
		if strings.HasPrefix(path, "/swagger") || strings.HasSuffix(path, "/doc.json") {
			c.Next(ctx)
			return
		}

		for _, p := range publicPaths {
			if strings.HasPrefix(path, p) {
				log.InfoMap("Auth: 公开路由，放行",
					map[string]interface{}{
						"request_id": requestID,
						"path":       path,
					},
				)
				c.Next(ctx)
				return
			}
		}

		// 获取Token
		auth := string(c.Request.Header.Get("Authorization"))
		if auth == "" {
			auth = c.Query("token")
		}

		if auth == "" {
			log.Warnw("Auth: 未提供Token",
				"request_id", requestID,
				"path", path,
				"ip", string(c.ClientIP()),
			)
			c.JSON(consts.StatusUnauthorized, utils.H{
				"code":    401,
				"message": "未登录",
			})
			c.Abort()
			return
		}

		// 验证Token
		tokenString := strings.TrimPrefix(auth, "Bearer ")

		// 开发模式：支持 mock token（以 mock_ 开头），仅在开发环境有效
		if App.Env == "development" && strings.HasPrefix(tokenString, "mock_") {
			log.InfoMap("Auth: 开发模式，使用模拟用户",
				map[string]interface{}{
					"request_id": requestID,
					"path":       path,
					"token_type": "mock",
				},
			)
			// 设置模拟用户信息
			c.Set("userId", int64(1))
			c.Set("enterpriseId", int64(1))
			c.Set("role", "super_admin")
			c.Next(ctx)
			return
		}

		claims, err := ParseToken(tokenString)
		if err != nil {
			log.Warnw("Auth: 无效的Token",
				"request_id", requestID,
				"path", path,
				"error", err.Error(),
			)
			c.JSON(consts.StatusUnauthorized, utils.H{
				"code":    401,
				"message": "无效的Token",
			})
			c.Abort()
			return
		}

		log.InfoMap("Auth: 认证成功",
			map[string]interface{}{
				"request_id":    requestID,
				"path":          path,
				"user_id":       claims.UserId,
				"enterprise_id": claims.EnterpriseId,
			},
		)

		// 将用户信息存入上下文
		c.Set("userId", claims.UserId)
		c.Set("enterpriseId", claims.EnterpriseId)
		c.Set("role", claims.Role)

		c.Next(ctx)
	}
}

// RateLimit 限流中间件
func RateLimit() app.HandlerFunc {
	// 简单实现：基于IP的限流
	type clientInfo struct {
		count   int
		lastReq time.Time
	}

	clients := make(map[string]*clientInfo)

	return func(ctx context.Context, c *app.RequestContext) {
		ip := string(c.ClientIP())
		now := time.Now()

		info, ok := clients[ip]
		if !ok {
			clients[ip] = &clientInfo{count: 1, lastReq: now}
			c.Next(ctx)
			return
		}

		// 重置计数器（每分钟）
		if now.Sub(info.lastReq) > time.Minute {
			info.count = 0
			info.lastReq = now
		}

		info.count++

		// 每分钟限制100次请求
		if info.count > 100 {
			c.JSON(consts.StatusTooManyRequests, utils.H{
				"code":    429,
				"message": "请求过于频繁，请稍后再试",
			})
			c.Abort()
			return
		}

		c.Next(ctx)
	}
}

// JWT Claims
type JWTClaims struct {
	UserId       int64  `json:"userId"`
	Username     string `json:"username"`
	EnterpriseId int64  `json:"enterpriseId"`
	Role         string `json:"role"`
	jwt.RegisteredClaims
}

// ParseToken 解析Token
func ParseToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWT_SECRET), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, err
}

// GenerateToken 生成Token
func GenerateToken(userId, enterpriseId int64, username, role string) (string, error) {
	claims := &JWTClaims{
		UserId:       userId,
		Username:     username,
		EnterpriseId: enterpriseId,
		Role:         role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.JWT_SECRET))
}
