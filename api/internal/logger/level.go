package logger

import "strings"

// LogLevel 日志级别
type LogLevel int8

const (
	// DEBUG 调试级别，最详细
	DEBUG LogLevel = iota - 1
	// INFO 信息级别，默认级别
	INFO
	// WARN 警告级别
	WARN
	// ERROR 错误级别
	ERROR
	// FATAL 致命级别
	FATAL
	// PANIC 恐慌级别
	PANIC
)

func (l LogLevel) String() string {
	switch l {
	case DEBUG:
		return "DEBUG"
	case INFO:
		return "INFO"
	case WARN:
		return "WARN"
	case ERROR:
		return "ERROR"
	case FATAL:
		return "FATAL"
	case PANIC:
		return "PANIC"
	default:
		return "UNKNOWN"
	}
}

// ParseLevel 解析日志级别字符串
func ParseLevel(level string) LogLevel {
	level = strings.ToUpper(strings.TrimSpace(level))
	switch level {
	case "DEBUG":
		return DEBUG
	case "INFO":
		return INFO
	case "WARN", "WARNING":
		return WARN
	case "ERROR":
		return ERROR
	case "FATAL":
		return FATAL
	case "PANIC":
		return PANIC
	default:
		return INFO
	}
}

// Enabled 检查是否启用该级别
func (l LogLevel) Enabled(level LogLevel) bool {
	return l <= level
}
