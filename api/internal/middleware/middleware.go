package middleware

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/bytebufferpool"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/golang-jwt/jwt/v5"
)

// Register 注册中间件
func Register(h *server.Hertz) {
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
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

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

		c.Next(ctx)

		latency := time.Since(start)
		status := c.Response.StatusCode()

		log.Printf("[%s] %s %s | %d | %v | %s",
			time.Now().Format("2006-01-02 15:04:05"),
			c.Request.Method(),
			path+"?"+query,
			status,
			latency,
			c.ClientIP(),
		)
	}
}

// Auth 认证中间件
func Auth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		// 公开路由
		publicPaths := []string{"/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/health"}
		path := string(c.Request.URI().Path())

		for _, p := range publicPaths {
			if strings.HasPrefix(path, p) {
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
			c.JSON(consts.StatusUnauthorized, utils.H{
				"code":    401,
				"message": "未登录",
			})
			c.Abort()
			return
		}

		// 验证Token
		tokenString := strings.TrimPrefix(auth, "Bearer ")
		claims, err := ParseToken(tokenString)
		if err != nil {
			c.JSON(consts.StatusUnauthorized, utils.H{
				"code":    401,
				"message": "无效的Token",
			})
			c.Abort()
			return
		}

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
	UserId        int64  `json:"userId"`
	Username      string `json:"username"`
	EnterpriseId  int64  `json:"enterpriseId"`
	Role          string `json:"role"`
	jwt.RegisteredClaims
}

// ParseToken 解析Token
func ParseToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte("your-secret-key"), nil // 应该从配置读取
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
	return token.SignedString([]byte("your-secret-key"))
}
