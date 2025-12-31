package logger

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// RequestLogger 请求日志中间件
func RequestLogger(log *Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestID := r.Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = uuid.New().String()
			}
			r.Header.Set("X-Request-ID", requestID)

			start := time.Now()

			// 记录请求开始
			log.Infow("HTTP请求开始",
				"method", r.Method,
				"path", r.URL.Path,
				"query", r.URL.RawQuery,
				"request_id", requestID,
				"user_agent", r.Header.Get("User-Agent"),
				"ip", getClientIP(r),
			)

			// 包装ResponseWriter以获取状态码
			wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}

			// 执行请求
			next.ServeHTTP(wrapped, r)

			// 记录请求完成
			duration := time.Since(start)
			log.Infow("HTTP请求完成",
				"request_id", requestID,
				"method", r.Method,
				"path", r.URL.Path,
				"status_code", wrapped.statusCode,
				"duration_ms", duration.Milliseconds(),
			)
		})
	}
}

// responseWriter 包装http.ResponseWriter
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// RecoveryPanics 恐慌恢复中间件
func RecoveryPanics(log *Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					requestID := r.Header.Get("X-Request-ID")
					if requestID == "" {
						requestID = "unknown"
					}

					log.Errorw("发生panic",
						&panicError{msg: err},
						"request_id", requestID,
						"path", r.URL.Path,
						"method", r.Method,
					)

					w.WriteHeader(http.StatusInternalServerError)
					w.Write([]byte("内部服务器错误"))
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}

// panicError 包装panic错误
type panicError struct {
	msg interface{}
}

func (e *panicError) Error() string {
	return strings.TrimSpace(fmt.Sprintf("%v", e.msg))
}

// getClientIP 获取客户端IP
func getClientIP(r *http.Request) string {
	// 检查X-Forwarded-For头
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		// 取第一个IP
		if idx := strings.Index(forwarded, ","); idx >= 0 {
			return forwarded[:idx]
		}
		return forwarded
	}

	// 检查X-Real-IP头
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}

	// 返回RemoteAddr
	return r.RemoteAddr
}
