package errors

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
)

// AppError 应用错误
type AppError struct {
	Code       ErrorCode `json:"code"`
	Message    string    `json:"message"`
	Details    any       `json:"details,omitempty"`
	TraceID    string    `json:"traceId,omitempty"`
	StackTrace string    `json:"-"`
	Internal   error     `json:"-"`
	Location   string    `json:"-"`
}

// Error 实现 error 接口
func (e *AppError) Error() string {
	if e.Internal != nil {
		return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Internal)
	}
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// Unwrap 解包内部错误
func (e *AppError) Unwrap() error {
	return e.Internal
}

// Is 判断是否是指定错误
func (e *AppError) Is(target error) bool {
	if t, ok := target.(*AppError); ok {
		return e.Code == t.Code
	}
	return false
}

// New 创建新错误
func New(code ErrorCode, message string) *AppError {
	return &AppError{
		Code:     code,
		Message:  message,
		Location: getCallerLocation(),
	}
}

// NewWithDetails 创建带详情错误
func NewWithDetails(code ErrorCode, message string, details any) *AppError {
	return &AppError{
		Code:     code,
		Message:  message,
		Details:  details,
		Location: getCallerLocation(),
	}
}

// NewFromError 从 error 创建
func NewFromError(err error) *AppError {
	if e, ok := err.(*AppError); ok {
		return e
	}
	return &AppError{
		Code:     CodeFail,
		Message:  err.Error(),
		Internal: err,
		Location: getCallerLocation(),
	}
}

// Wrap 包装错误
func (e *AppError) Wrap(err error) *AppError {
	e.Internal = err
	e.StackTrace = getStackTrace()
	return e
}

// WrapMsg 包装错误并添加消息
func (e *AppError) WrapMsg(msg string) *AppError {
	e.Internal = errors.New(msg)
	e.Message = fmt.Sprintf("%s: %s", e.Message, msg)
	return e
}

// WithDetails 添加详情
func (e *AppError) WithDetails(details any) *AppError {
	e.Details = details
	return e
}

// WithTraceID 添加 TraceID
func (e *AppError) WithTraceID(traceID string) *AppError {
	e.TraceID = traceID
	return e
}

// ToResponse 转换为响应格式
func (e *AppError) ToResponse() map[string]any {
	resp := map[string]any{
		"code":    e.Code,
		"message": e.Message,
	}
	if e.Details != nil {
		resp["details"] = e.Details
	}
	if e.TraceID != "" {
		resp["traceId"] = e.TraceID
	}
	return resp
}

// HTTPStatus 返回对应的 HTTP 状态码
func (e *AppError) HTTPStatus() int {
	return ErrorCodeToHTTPStatus(e.Code)
}

// getCallerLocation 获取调用者位置
func getCallerLocation() string {
	_, file, line, ok := runtime.Caller(2)
	if !ok {
		return "unknown"
	}
	// 只保留文件名
	idx := strings.LastIndex(file, "/")
	if idx > 0 {
		file = file[idx+1:]
	}
	return fmt.Sprintf("%s:%d", file, line)
}

// getStackTrace 获取堆栈信息
func getStackTrace() string {
	const depth = 10
	pcs := make([]uintptr, depth)
	n := runtime.Callers(2, pcs)
	if n == 0 {
		return ""
	}

	frames := runtime.CallersFrames(pcs[:n])
	var builder strings.Builder
	for i := 0; i < n; i++ {
		frame, ok := frames.Next()
		if !ok {
			break
		}
		if strings.Contains(frame.File, "/mamoji/api/") {
			idx := strings.LastIndex(frame.File, "/")
			fileName := frame.File
			if idx > 0 {
				fileName = frame.File[idx+1:]
			}
			builder.WriteString(fmt.Sprintf("\n  at %s:%d (%s)", fileName, frame.Line, frame.Function))
		}
	}
	return builder.String()
}

// Log 记录错误日志
func (e *AppError) Log() {
	log.Printf("[ERROR] %s | Code: %d | Location: %s | Stack: %s",
		e.Message, e.Code, e.Location, e.StackTrace)
	if e.Internal != nil {
		log.Printf("[ERROR] Internal: %v", e.Internal)
	}
}

// Common Errors 常用错误工厂

// Success 成功
func Success() *AppError {
	return New(CodeSuccess, ErrorCodeToMessage(CodeSuccess))
}

// Fail 失败
func Fail(message string) *AppError {
	return New(CodeFail, message)
}

// FailWithError 失败（带错误）
func FailWithError(err error) *AppError {
	return NewFromError(err).WrapMsg("操作失败")
}

// InvalidParams 无效参数
func InvalidParams(details any) *AppError {
	return NewWithDetails(CodeInvalid, ErrorCodeToMessage(CodeInvalid), details)
}

// Unauthorized 未授权
func Unauthorized(message string) *AppError {
	if message == "" {
		message = ErrorCodeToMessage(CodeUnauthorized)
	}
	return New(CodeUnauthorized, message)
}

// TokenExpired Token 过期
func TokenExpired() *AppError {
	return New(CodeTokenExpired, ErrorCodeToMessage(CodeTokenExpired))
}

// TokenInvalid 无效 Token
func TokenInvalid() *AppError {
	return New(CodeTokenInvalid, ErrorCodeToMessage(CodeTokenInvalid))
}

// NotFound 未找到
func NotFound(resource string) *AppError {
	return New(CodeFail, fmt.Sprintf("%s不存在", resource))
}

// AlreadyExists 已存在
func AlreadyExists(resource string) *AppError {
	return New(CodeFail, fmt.Sprintf("%s已存在", resource))
}

// DatabaseError 数据库错误
func DatabaseError(err error) *AppError {
	return &AppError{
		Code:     CodeDatabaseError,
		Message:  "数据库操作失败",
		Internal: err,
		Location: getCallerLocation(),
	}
}

// SystemError 系统错误
func SystemError(err error) *AppError {
	return &AppError{
		Code:     CodeSystemError,
		Message:  "系统错误",
		Internal: err,
		Location: getCallerLocation(),
	}
}

// ServiceUnavailable 服务不可用
func ServiceUnavailable(message string) *AppError {
	if message == "" {
		message = ErrorCodeToMessage(CodeServiceUnavailable)
	}
	return New(CodeServiceUnavailable, message)
}

// HandleError 处理错误（用于 HTTP 处理器）
func HandleError(c *app.RequestContext, err error) {
	if err == nil {
		return
	}

	var appErr *AppError
	if errors.As(err, &appErr) {
		appErr.Log()
		c.JSON(appErr.HTTPStatus(), appErr.ToResponse())
		return
	}

	// 未知错误
	log.Printf("[ERROR] Unknown error: %v", err)
	c.JSON(http.StatusInternalServerError, map[string]any{
		"code":    CodeInternalError,
		"message": ErrorCodeToMessage(CodeInternalError),
	})
}

// Must 无 panic 的包装，用于初始化
func Must[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}
	return value
}
