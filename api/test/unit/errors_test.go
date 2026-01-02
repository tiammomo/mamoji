package unit

import (
	"testing"

	"mamoji/api/internal/pkg/errors"
)

func TestErrorCode(t *testing.T) {
	tests := []struct {
		name     string
		code     errors.ErrorCode
		expected string
	}{
		{"Success", errors.CodeSuccess, "成功"},
		{"Unauthorized", errors.CodeUnauthorized, "未授权访问"},
		{"TokenExpired", errors.CodeTokenExpired, "登录已过期"},
		{"UserNotFound", errors.CodeUserNotFound, "用户不存在"},
		{"AccountNotFound", errors.CodeAccountNotFound, "账户不存在"},
		{"TransactionNotFound", errors.CodeTransactionNotFound, "交易记录不存在"},
		{"BudgetNotFound", errors.CodeBudgetNotFound, "预算不存在"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			msg := errors.ErrorCodeToMessage(tt.code)
			if msg != tt.expected {
				t.Errorf("ErrorCodeToMessage(%d) = %s, want %s", tt.code, msg, tt.expected)
			}
		})
	}
}

func TestErrorCodeToHTTPStatus(t *testing.T) {
	tests := []struct {
		name     string
		code     errors.ErrorCode
		expected int
	}{
		{"Success", errors.CodeSuccess, 200},
		{"Fail", errors.CodeFail, 500},
		{"Unauthorized", errors.CodeUnauthorized, 401},
		{"UserNotFound", errors.CodeUserNotFound, 400},
		{"AccountNotFound", errors.CodeAccountNotFound, 400},
		{"SystemError", errors.CodeSystemError, 500},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := errors.ErrorCodeToHTTPStatus(tt.code)
			if status != tt.expected {
				t.Errorf("ErrorCodeToHTTPStatus(%d) = %d, want %d", tt.code, status, tt.expected)
			}
		})
	}
}

func TestAppError(t *testing.T) {
	t.Run("New error", func(t *testing.T) {
		err := errors.New(errors.CodeUserNotFound, "用户不存在")
		if err.Code != errors.CodeUserNotFound {
			t.Errorf("Code = %d, want %d", err.Code, errors.CodeUserNotFound)
		}
		if err.Message != "用户不存在" {
			t.Errorf("Message = %s, want 用户不存在", err.Message)
		}
	})

	t.Run("Wrap error", func(t *testing.T) {
		original := errors.New(errors.CodeDatabaseError, "数据库错误")
		wrapped := errors.New(errors.CodeFail, "操作失败").Wrap(original)

		if wrapped.Internal != original {
			t.Error("Internal error not preserved")
		}
		// Wrap does not change the message
		if wrapped.Message != "操作失败" {
			t.Errorf("Message = %s, want 操作失败", wrapped.Message)
		}
	})

	t.Run("Error string", func(t *testing.T) {
		err := errors.New(errors.CodeUserNotFound, "用户不存在")
		expected := "[2001] 用户不存在"
		if err.Error() != expected {
			t.Errorf("Error() = %s, want %s", err.Error(), expected)
		}
	})

	t.Run("Is method", func(t *testing.T) {
		err1 := errors.New(errors.CodeUserNotFound, "用户不存在")
		err2 := errors.New(errors.CodeUserNotFound, "用户不存在")
		err3 := errors.New(errors.CodeAccountNotFound, "账户不存在")

		if !err1.Is(err2) {
			t.Error("err1.Is(err2) should be true")
		}
		if err1.Is(err3) {
			t.Error("err1.Is(err3) should be false")
		}
	})

	t.Run("WithDetails", func(t *testing.T) {
		err := errors.New(errors.CodeInvalid, "参数错误").WithDetails(map[string]string{"field": "name"})
		if err.Details == nil {
			t.Error("Details should not be nil")
		}
	})

	t.Run("ToResponse", func(t *testing.T) {
		err := errors.New(errors.CodeUserNotFound, "用户不存在").WithTraceID("trace-123")
		resp := err.ToResponse()

		var code int
		switch v := resp["code"].(type) {
		case int:
			code = v
		case int64:
			code = int(v)
		case float64:
			code = int(v)
		case errors.ErrorCode:
			code = int(v)
		default:
			t.Errorf("unexpected code type: %T", resp["code"])
		}
		if code != 2001 {
			t.Errorf("code = %v, want 2001", resp["code"])
		}
		if resp["message"] != "用户不存在" {
			t.Errorf("message = %v, want 用户不存在", resp["message"])
		}
		if resp["traceId"] != "trace-123" {
			t.Errorf("traceId = %v, want trace-123", resp["traceId"])
		}
	})
}

func TestCommonErrors(t *testing.T) {
	tests := []struct {
		name string
		fn   func() *errors.AppError
		code errors.ErrorCode
	}{
		{"Success", func() *errors.AppError { return errors.Success() }, errors.CodeSuccess},
		{"Unauthorized", func() *errors.AppError { return errors.Unauthorized("") }, errors.CodeUnauthorized},
		{"TokenExpired", func() *errors.AppError { return errors.TokenExpired() }, errors.CodeTokenExpired},
		{"TokenInvalid", func() *errors.AppError { return errors.TokenInvalid() }, errors.CodeTokenInvalid},
		{"NotFound", func() *errors.AppError { return errors.NotFound("用户") }, errors.CodeFail},
		{"AlreadyExists", func() *errors.AppError { return errors.AlreadyExists("用户") }, errors.CodeFail},
		{"DatabaseError", func() *errors.AppError { return errors.DatabaseError(nil) }, errors.CodeDatabaseError},
		{"SystemError", func() *errors.AppError { return errors.SystemError(nil) }, errors.CodeSystemError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.fn()
			if err.Code != tt.code {
				t.Errorf("Code = %d, want %d", err.Code, tt.code)
			}
		})
	}
}

func TestPaginator(t *testing.T) {
	t.Run("NewPaginator", func(t *testing.T) {
		p := errors.NewPaginator(1, 10)
		if p.Page != 1 {
			t.Errorf("Page = %d, want 1", p.Page)
		}
		if p.PageSize != 10 {
			t.Errorf("PageSize = %d, want 10", p.PageSize)
		}
	})

	t.Run("Page bounds", func(t *testing.T) {
		p := errors.NewPaginator(0, 0)
		if p.Page != 1 {
			t.Errorf("Page = %d, want 1", p.Page)
		}
		if p.PageSize != 10 {
			t.Errorf("PageSize = %d, want 10", p.PageSize)
		}

		p = errors.NewPaginator(1, 200)
		if p.PageSize != 100 {
			t.Errorf("PageSize = %d, want 100", p.PageSize)
		}
	})

	t.Run("Offset and Limit", func(t *testing.T) {
		p := errors.NewPaginator(3, 20)
		if p.Offset() != 40 {
			t.Errorf("Offset = %d, want 40", p.Offset())
		}
		if p.Limit() != 20 {
			t.Errorf("Limit = %d, want 20", p.Limit())
		}
	})

	t.Run("TotalPages", func(t *testing.T) {
		p := errors.NewPaginator(1, 10)
		p.Total = 95
		if p.GetTotalPages() != 10 {
			t.Errorf("TotalPages = %d, want 10", p.GetTotalPages())
		}

		p.Total = 100
		if p.GetTotalPages() != 10 {
			t.Errorf("TotalPages = %d, want 10", p.GetTotalPages())
		}

		p.Total = 0
		if p.GetTotalPages() != 0 {
			t.Errorf("TotalPages = %d, want 0", p.GetTotalPages())
		}
	})
}

func TestResponseBuilder(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		resp := errors.NewResponseBuilder().Success(map[string]string{"key": "value"}).Build()
		if resp.Code != 0 {
			t.Errorf("Code = %d, want 0", resp.Code)
		}
		if resp.Message != "success" {
			t.Errorf("Message = %s, want success", resp.Message)
		}
		if resp.Data == nil {
			t.Error("Data should not be nil")
		}
	})

	t.Run("Fail", func(t *testing.T) {
		resp := errors.NewResponseBuilder().Fail(400, "参数错误").Build()
		if resp.Code != 400 {
			t.Errorf("Code = %d, want 400", resp.Code)
		}
		if resp.Message != "参数错误" {
			t.Errorf("Message = %s, want 参数错误", resp.Message)
		}
	})

	t.Run("Chain methods", func(t *testing.T) {
		resp := errors.NewResponseBuilder().
			SetCode(500).
			SetMessage("系统错误").
			SetData(nil).
			SetTraceID("trace-123").
			Build()

		if resp.Code != 500 {
			t.Errorf("Code = %d, want 500", resp.Code)
		}
		if resp.Message != "系统错误" {
			t.Errorf("Message = %s, want 系统错误", resp.Message)
		}
		if resp.TraceID != "trace-123" {
			t.Errorf("TraceID = %s, want trace-123", resp.TraceID)
		}
	})
}
