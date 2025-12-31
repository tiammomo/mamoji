package logger

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger struct {
	sugar *zap.SugaredLogger
}

var globalLogger *Logger

// ZapLogger zaplog 实现
type ZapLogger struct {
	logger *zap.Logger
}

var _ LoggerInterface = (*ZapLogger)(nil)

// LoggerInterface 日志接口
type LoggerInterface interface {
	Debugw(msg string, keysAndValues ...interface{})
	Infow(msg string, keysAndValues ...interface{})
	Warnw(msg string, keysAndValues ...interface{})
	Errorw(msg string, keysAndValues ...interface{})
	Fatalw(msg string, keysAndValues ...interface{})
	Infoc(ctx context.Context, msg string, keysAndValues map[string]interface{})
	Debugc(ctx context.Context, msg string, keysAndValues map[string]interface{})
	Warnc(ctx context.Context, msg string, keysAndValues map[string]interface{})
	Errorc(ctx context.Context, msg string, keysAndValues map[string]interface{})
	Fatalc(ctx context.Context, msg string, keysAndValues map[string]interface{})
	Close()
}

// ZapConfig Logger 配置
type ZapConfig struct {
	Level      string
	Format     string
	OutputPath string
	ErrorPath  string
}

// New 创建 Logger
func New() *Logger {
	config := ZapConfig{
		Level:      "info",
		Format:     "json",
		OutputPath: "logs/app.log",
		ErrorPath:  "logs/error.log",
	}

	return NewWithConfig(config)
}

// NewWithConfig 使用配置创建 Logger
func NewWithConfig(config ZapConfig) *Logger {
	var level zapcore.Level
	switch strings.ToLower(config.Level) {
	case "debug":
		level = zapcore.DebugLevel
	case "info":
		level = zapcore.InfoLevel
	case "warn", "warning":
		level = zapcore.WarnLevel
	case "error":
		level = zapcore.ErrorLevel
	case "fatal":
		level = zapcore.FatalLevel
	default:
		level = zapcore.InfoLevel
	}

	// 确保日志目录存在
	os.MkdirAll("logs", 0755)

	// 配置日志输出
	zapConfig := zap.Config{
		Level:            zap.NewAtomicLevelAt(level),
		Development:      false,
		Encoding:         config.Format,
		EncoderConfig:    zap.NewProductionEncoderConfig(),
		OutputPaths:      []string{config.OutputPath},
		ErrorOutputPaths: []string{config.ErrorPath},
	}

	logger, err := zapConfig.Build()
	if err != nil {
		log.Fatalf("Failed to build logger: %v", err)
	}

	globalLogger = &Logger{
		sugar: logger.Sugar(),
	}

	return globalLogger
}

// SetupFromEnv 从环境变量配置日志级别
func (l *Logger) SetupFromEnv(prefix string) {
	levelStr := os.Getenv(prefix + "LEVEL")
	if levelStr != "" {
		var level zapcore.Level
		switch strings.ToLower(levelStr) {
		case "debug":
			level = zapcore.DebugLevel
		case "info":
			level = zapcore.InfoLevel
		case "warn", "warning":
			level = zapcore.WarnLevel
		case "error":
			level = zapcore.ErrorLevel
		default:
			level = zapcore.InfoLevel
		}
		l.sugar.Desugar().Core().(zapcore.Core).Enabled(level)
	}
}

// Get 获取全局 Logger 实例
func Get() *Logger {
	if globalLogger == nil {
		globalLogger = New()
	}
	return globalLogger
}

// Debugw 调试日志
func (l *Logger) Debugw(msg string, keysAndValues ...interface{}) {
	l.sugar.Debugw(msg, keysAndValues...)
}

// Infow 信息日志
func (l *Logger) Infow(msg string, keysAndValues ...interface{}) {
	l.sugar.Infow(msg, keysAndValues...)
}

// Warnw 警告日志
func (l *Logger) Warnw(msg string, keysAndValues ...interface{}) {
	l.sugar.Warnw(msg, keysAndValues...)
}

// Errorw 错误日志
func (l *Logger) Errorw(msg string, keysAndValues ...interface{}) {
	l.sugar.Errorw(msg, keysAndValues...)
}

// Fatalw 致命错误日志
func (l *Logger) Fatalw(msg string, keysAndValues ...interface{}) {
	l.sugar.Fatalw(msg, keysAndValues...)
}

// Infoc 信息日志（带上下文）
func (l *Logger) Infoc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.sugar.Infow(msg, toSlice(keysAndValues)...)
}

// InfoMap 信息日志（map参数）
func (l *Logger) InfoMap(msg string, keysAndValues map[string]interface{}) {
	l.sugar.Infow(msg, toSlice(keysAndValues)...)
}

// Debugf 格式化调试日志
func (l *Logger) Debugf(format string, args ...interface{}) {
	l.sugar.Debugf(format, args...)
}

// Fatalf 格式化致命错误日志
func (l *Logger) Fatalf(format string, args ...interface{}) {
	l.sugar.Fatalf(format, args...)
}

// Warnc 警告日志（带上下文）
func (l *Logger) Warnc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.sugar.Warnw(msg, toSlice(keysAndValues)...)
}

// Errorc 错误日志（带上下文）
func (l *Logger) Errorc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.sugar.Errorw(msg, toSlice(keysAndValues)...)
}

// Fatalc 致命错误日志（带上下文）
func (l *Logger) Fatalc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.sugar.Fatalw(msg, toSlice(keysAndValues)...)
}

// Close 关闭日志
func (l *Logger) Close() {
	if l.sugar != nil {
		l.sugar.Sync()
	}
}

// toSlice 将 map 转换为 slice
func toSlice(m map[string]interface{}) []interface{} {
	var s []interface{}
	for k, v := range m {
		s = append(s, k, v)
	}
	return s
}

// FormatDate 格式化日期
func FormatDate(date time.Time) string {
	return date.Format("2006-01-02")
}

// FormatDateTime 格式化日期时间
func FormatDateTime(date time.Time) string {
	return date.Format("2006-01-02 15:04:05")
}

// FormatTimeOnly 格式化时间
func FormatTimeOnly(date time.Time) string {
	return date.Format("15:04:05")
}

// NewZapLogger 创建新的 zap logger 实例
func NewZapLogger() *ZapLogger {
	logger, _ := zap.NewProduction()
	return &ZapLogger{logger: logger}
}

// Debug 实现 LoggerInterface
func (l *ZapLogger) Debugw(msg string, keysAndValues ...interface{}) {
	l.logger.Debug(fmt.Sprint(keysAndValues...))
}

// Infow 实现 LoggerInterface
func (l *ZapLogger) Infow(msg string, keysAndValues ...interface{}) {
	l.logger.Info(msg, toZapFields(keysAndValues)...)
}

// Warnw 实现 LoggerInterface
func (l *ZapLogger) Warnw(msg string, keysAndValues ...interface{}) {
	l.logger.Warn(msg, toZapFields(keysAndValues)...)
}

// Errorw 实现 LoggerInterface
func (l *ZapLogger) Errorw(msg string, keysAndValues ...interface{}) {
	l.logger.Error(msg, toZapFields(keysAndValues)...)
}

// Fatalw 实现 LoggerInterface
func (l *ZapLogger) Fatalw(msg string, keysAndValues ...interface{}) {
	l.logger.Fatal(msg, toZapFields(keysAndValues)...)
}

// Debugc 实现 LoggerInterface
func (l *ZapLogger) Debugc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.logger.Debug(msg, toZapMapFields(keysAndValues)...)
}

// Infoc 实现 LoggerInterface
func (l *ZapLogger) Infoc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.logger.Info(msg, toZapMapFields(keysAndValues)...)
}

// Warnc 实现 LoggerInterface
func (l *ZapLogger) Warnc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.logger.Warn(msg, toZapMapFields(keysAndValues)...)
}

// Errorc 实现 LoggerInterface
func (l *ZapLogger) Errorc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.logger.Error(msg, toZapMapFields(keysAndValues)...)
}

// Fatalc 实现 LoggerInterface
func (l *ZapLogger) Fatalc(ctx context.Context, msg string, keysAndValues map[string]interface{}) {
	l.logger.Fatal(msg, toZapMapFields(keysAndValues)...)
}

// Close 实现 LoggerInterface
func (l *ZapLogger) Close() {
	l.logger.Sync()
}

// toZapFields 将 key-value 对转换为 zap.Field 切片
func toZapFields(keysAndValues []interface{}) []zap.Field {
	var fields []zap.Field
	for i := 0; i < len(keysAndValues)-1; i += 2 {
		key, ok := keysAndValues[i].(string)
		if !ok {
			continue
		}
		fields = append(fields, zap.Any(key, keysAndValues[i+1]))
	}
	return fields
}

// toZapMapFields 将 map 转换为 zap.Field 切片
func toZapMapFields(m map[string]interface{}) []zap.Field {
	var fields []zap.Field
	for k, v := range m {
		fields = append(fields, zap.Any(k, v))
	}
	return fields
}
