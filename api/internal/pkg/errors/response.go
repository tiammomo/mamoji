package errors

import (
	"fmt"
	"net/http"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
)

// Response 统一响应结构
type Response struct {
	Code       int         `json:"code"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data,omitempty"`
	TraceID    string      `json:"traceId,omitempty"`
	ServerTime string      `json:"serverTime"`
}

// PageData 分页数据结构
type PageData struct {
	List       interface{} `json:"list"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// Paginator 分页器
type Paginator struct {
	Page     int
	PageSize int
	Total    int64
}

// NewPaginator 创建分页器
func NewPaginator(page, pageSize int) *Paginator {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return &Paginator{
		Page:     page,
		PageSize: pageSize,
	}
}

// Offset 获取偏移量
func (p *Paginator) Offset() int {
	return (p.Page - 1) * p.PageSize
}

// Limit 获取限制数量
func (p *Paginator) Limit() int {
	return p.PageSize
}

// GetTotalPages 计算总页数
func (p *Paginator) GetTotalPages() int {
	if p.Total == 0 {
		return 0
	}
	return (int(p.Total) + p.PageSize - 1) / p.PageSize
}

// ToPageData 转换为分页数据
func (p *Paginator) ToPageData(list interface{}) *PageData {
	return &PageData{
		List:       list,
		Total:      p.Total,
		Page:       p.Page,
		PageSize:   p.PageSize,
		TotalPages: p.GetTotalPages(),
	}
}

// ResponseBuilder 响应构建器
type ResponseBuilder struct {
	code    int
	message string
	data    interface{}
	traceID string
}

// NewResponseBuilder 创建响应构建器
func NewResponseBuilder() *ResponseBuilder {
	return &ResponseBuilder{
		code:    0,
		message: "success",
	}
}

// SetCode 设置状态码
func (b *ResponseBuilder) SetCode(code int) *ResponseBuilder {
	b.code = code
	return b
}

// SetMessage 设置消息
func (b *ResponseBuilder) SetMessage(msg string) *ResponseBuilder {
	b.message = msg
	return b
}

// SetData 设置数据
func (b *ResponseBuilder) SetData(data interface{}) *ResponseBuilder {
	b.data = data
	return b
}

// SetTraceID 设置 TraceID
func (b *ResponseBuilder) SetTraceID(traceID string) *ResponseBuilder {
	b.traceID = traceID
	return b
}

// Success 成功响应
func (b *ResponseBuilder) Success(data interface{}) *ResponseBuilder {
	b.code = 0
	b.message = "success"
	b.data = data
	return b
}

// Fail 失败响应
func (b *ResponseBuilder) Fail(code int, message string) *ResponseBuilder {
	b.code = code
	b.message = message
	b.data = nil
	return b
}

// FailWithError 失败响应（带错误）
func (b *ResponseBuilder) FailWithError(err error) *ResponseBuilder {
	if e, ok := err.(*AppError); ok {
		b.code = int(e.Code)
		b.message = e.Message
	} else {
		b.code = 500
		b.message = err.Error()
	}
	b.data = nil
	return b
}

// Build 构建响应
func (b *ResponseBuilder) Build() *Response {
	return &Response{
		Code:       b.code,
		Message:    b.message,
		Data:       b.data,
		TraceID:    b.traceID,
		ServerTime: time.Now().Format("2006-01-02 15:04:05"),
	}
}

// BuildWithPage 构建带分页的响应
func (b *ResponseBuilder) BuildWithPage(pageData *PageData) *Response {
	return &Response{
		Code:       b.code,
		Message:    b.message,
		Data:       pageData,
		TraceID:    b.traceID,
		ServerTime: time.Now().Format("2006-01-02 15:04:05"),
	}
}

// SuccessResp 创建成功响应
func SuccessResp(data interface{}) *Response {
	return NewResponseBuilder().Success(data).Build()
}

// SuccessPageResp 创建成功分页响应
func SuccessPageResp(pageData *PageData) *Response {
	return NewResponseBuilder().Success(pageData).Build()
}

// FailResp 创建失败响应
func FailResp(code int, message string) *Response {
	return NewResponseBuilder().Fail(code, message).Build()
}

// FailWithAppErrorResp 创建失败响应（带 AppError）
func FailWithAppErrorResp(err *AppError) *Response {
	return NewResponseBuilder().Fail(int(err.Code), err.Message).Build()
}

// SendJSON 发送 JSON 响应
func SendJSON(c *app.RequestContext, status int, data interface{}) {
	c.JSON(status, data)
}

// SendSuccess 发送成功响应
func SendSuccess(c *app.RequestContext, data interface{}) {
	SendJSON(c, http.StatusOK, SuccessResp(data))
}

// SendSuccessPage 发送成功分页响应
func SendSuccessPage(c *app.RequestContext, pageData *PageData) {
	SendJSON(c, http.StatusOK, SuccessPageResp(pageData))
}

// SendFail 发送失败响应
func SendFail(c *app.RequestContext, code int, message string) {
	SendJSON(c, ErrorCodeToHTTPStatus(ErrorCode(code)), FailResp(code, message))
}

// SendFailWithError 发送失败响应（带错误）
func SendFailWithError(c *app.RequestContext, err error) {
	if e, ok := err.(*AppError); ok {
		e.Log()
		SendJSON(c, e.HTTPStatus(), FailWithAppErrorResp(e))
		return
	}
	SendFail(c, 500, "系统错误")
}

// SendInvalidParams 发送参数错误响应
func SendInvalidParams(c *app.RequestContext, details interface{}) {
	SendJSON(c, http.StatusBadRequest, NewResponseBuilder().
		SetCode(400).
		SetMessage("参数错误").
		SetData(details).
		Build())
}

// SendUnauthorized 发送未授权响应
func SendUnauthorized(c *app.RequestContext, message string) {
	if message == "" {
		message = ErrorCodeToMessage(CodeUnauthorized)
	}
	SendJSON(c, http.StatusUnauthorized, FailResp(401, message))
}

// SendNotFound 发送未找到响应
func SendNotFound(c *app.RequestContext, resource string) {
	SendFail(c, 404, resource+"不存在")
}

// SendServerError 发送服务器错误响应
func SendServerError(c *app.RequestContext, err error) {
	SendFailWithError(c, SystemError(err))
}

// ValidateRequest 验证请求参数
func ValidateRequest(c *app.RequestContext, req interface{}) bool {
	if err := c.Bind(req); err != nil {
		SendInvalidParams(c, map[string]string{
			"error": "参数绑定失败: " + err.Error(),
		})
		return false
	}
	return true
}

// PaginationParams 从请求获取分页参数
func PaginationParams(c *app.RequestContext) *Paginator {
	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		if _, err := fmt.Sscanf(p, "%d", &page); err != nil || page < 1 {
			page = 1
		}
	}
	if ps := c.Query("pageSize"); ps != "" {
		if _, err := fmt.Sscanf(ps, "%d", &pageSize); err != nil || pageSize < 1 {
			pageSize = 10
		}
	}
	return NewPaginator(page, pageSize)
}

// H 是 map[string]any 的简写
type H = utils.H
