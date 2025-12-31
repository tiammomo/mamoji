package logger

import (
	"encoding/json"
	"fmt"
	"runtime"
	"strings"
	"time"
)

// Entry 日志条目
type Entry struct {
	// 基础信息
	Timestamp   string                 `json:"timestamp"`   // 时间戳
	Level       string                 `json:"level"`       // 日志级别
	Message     string                 `json:"message"`     // 日志消息
	Logger      string                 `json:"logger"`      // 日志名称

	// 位置信息
	File        string                 `json:"file"`        // 文件名
	Line        int                    `json:"line"`        // 行号
	Function    string                 `json:"function"`    // 函数名

	// 上下文信息
	RequestID   string                 `json:"request_id,omitempty"`   // 请求ID
	UserID      int                    `json:"user_id,omitempty"`      // 用户ID
	TraceID     string                 `json:"trace_id,omitempty"`     // 链路追踪ID

	// 性能信息
	Duration    time.Duration          `json:"duration,omitempty"`     // 执行耗时
	Caller      string                 `json:"caller,omitempty"`       // 调用者信息

	// 自定义字段
	Fields      map[string]interface{} `json:"fields,omitempty"`       // 附加字段
	Context     map[string]interface{} `json:"context,omitempty"`      // 上下文数据

	// 错误信息
	Error       string                 `json:"error,omitempty"`        // 错误信息
	ErrorStack  string                 `json:"error_stack,omitempty"`  // 错误堆栈
}

// NewEntry 创建新的日志条目
func NewEntry(level LogLevel, message string) *Entry {
	return &Entry{
		Timestamp: time.Now().Format(time.RFC3339Nano),
		Level:     level.String(),
		Message:   message,
		Fields:    make(map[string]interface{}),
		Context:   make(map[string]interface{}),
	}
}

// WithField 添加单个字段
func (e *Entry) WithField(key string, value interface{}) *Entry {
	e.Fields[key] = value
	return e
}

// WithFields 添加多个字段
func (e *Entry) WithFields(fields map[string]interface{}) *Entry {
	for k, v := range fields {
		e.Fields[k] = v
	}
	return e
}

// WithError 添加错误信息
func (e *Entry) WithError(err error) *Entry {
	if err != nil {
		e.Error = err.Error()
		// 获取堆栈信息
		if stack := getStackTrace(); stack != "" {
			e.ErrorStack = stack
		}
	}
	return e
}

// WithRequest 添加请求上下文
func (e *Entry) WithRequest(requestID string) *Entry {
	e.RequestID = requestID
	return e
}

// WithUser 添加用户上下文
func (e *Entry) WithUser(userID int) *Entry {
	e.UserID = userID
	return e
}

// WithTrace 添加链路追踪ID
func (e *Entry) WithTrace(traceID string) *Entry {
	e.TraceID = traceID
	return e
}

// WithDuration 添加执行耗时
func (e *Entry) WithDuration(d time.Duration) *Entry {
	e.Duration = d
	return e
}

// WithContext 添加上下文数据
func (e *Entry) WithContext(ctx map[string]interface{}) *Entry {
	for k, v := range ctx {
		e.Context[k] = v
	}
	return e
}

// SetCaller 设置调用者信息
func (e *Entry) SetCaller() {
	// 获取调用者信息
	if pc, file, line, ok := runtime.Caller(2); ok {
		e.File = file
		e.Line = line
		e.Function = runtime.FuncForPC(pc).Name()
		// 简化函数名
		if idx := strings.LastIndex(e.Function, "/"); idx >= 0 {
			e.Function = e.Function[idx+1:]
		}
		if idx := strings.Index(e.Function, "."); idx >= 0 {
			e.Function = e.Function[idx+1:]
		}
	}
}

// ToJSON 序列化为JSON
func (e *Entry) ToJSON() (string, error) {
	data, err := json.Marshal(e)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// ToPrettyJSON 格式化JSON输出
func (e *Entry) ToPrettyJSON() (string, error) {
	data, err := json.MarshalIndent(e, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// String 实现Stringer接口
func (e *Entry) String() string {
	return fmt.Sprintf("[%s] %s %s",
		e.Timestamp,
		strings.ToUpper(e.Level[:1]),
		e.Message,
	)
}

// Format 格式化输出
func (e *Entry) Format(format string) string {
	switch format {
	case "json":
		if s, err := e.ToJSON(); err == nil {
			return s
		}
	case "pretty":
		if s, err := e.ToPrettyJSON(); err == nil {
			return s
		}
	case "text":
		return e.formatText()
	}
	return e.formatText()
}

// formatText 文本格式
func (e *Entry) formatText() string {
	var parts []string

	// 时间戳和级别
	parts = append(parts, fmt.Sprintf("[%s]", e.Timestamp))
	parts = append(parts, fmt.Sprintf("[%s]", strings.ToUpper(e.Level[:1])))

	// 调用位置
	if e.File != "" {
		parts = append(parts, fmt.Sprintf("[%s:%d]", e.File, e.Line))
	}

	// 消息
	parts = append(parts, e.Message)

	// 字段
	if len(e.Fields) > 0 {
		fieldStr := formatFields(e.Fields)
		parts = append(parts, fieldStr)
	}

	// 错误
	if e.Error != "" {
		parts = append(parts, fmt.Sprintf("error=%s", e.Error))
	}

	return strings.Join(parts, " ")
}

// formatFields 格式化字段
func formatFields(fields map[string]interface{}) string {
	var parts []string
	for k, v := range fields {
		parts = append(parts, fmt.Sprintf("%s=%v", k, formatValue(v)))
	}
	return "[" + strings.Join(parts, " ") + "]"
}

// formatValue 格式化值
func formatValue(v interface{}) string {
	switch val := v.(type) {
	case string:
		if strings.Contains(val, " ") || strings.Contains(val, "\"") {
			return fmt.Sprintf(`"%s"`, strings.ReplaceAll(val, `"`, `\"`))
		}
		return val
	case time.Duration:
		return val.String()
	default:
		return fmt.Sprintf("%v", val)
	}
}

// getStackTrace 获取堆栈信息
func getStackTrace() string {
	const depth = 32
	var pcs [depth]uintptr
	n := runtime.Callers(3, pcs[:])
	frames := runtime.CallersFrames(pcs[:n])

	var builder strings.Builder
	for {
		frame, ok := frames.Next()
		if !ok {
			break
		}
		// 跳过日志包自身的调用
		if strings.Contains(frame.File, "logger/logger.go") ||
			strings.Contains(frame.File, "logger/entry.go") {
			continue
		}
		builder.WriteString(fmt.Sprintf("\n\t%s:%d %s",
			frame.File, frame.Line, frame.Function))
	}
	return builder.String()
}
