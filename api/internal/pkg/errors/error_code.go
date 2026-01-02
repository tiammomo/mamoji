package errors

import "fmt"

// ErrorCode 定义业务错误码
type ErrorCode int

// 错误码定义
const (
	// 通用错误码 (0-999)
	CodeSuccess ErrorCode = 0
	CodeFail    ErrorCode = 500
	CodeInvalid ErrorCode = 400

	// 认证错误码 (1000-1999)
	CodeUnauthorized     ErrorCode = 1001
	CodeTokenExpired     ErrorCode = 1002
	CodeTokenInvalid     ErrorCode = 1003
	CodeNotLogin         ErrorCode = 1004
	CodeNoPermission     ErrorCode = 1005
	CodeUserDisabled     ErrorCode = 1006
	CodeTokenRefreshFail ErrorCode = 1007

	// 用户错误码 (2000-2999)
	CodeUserNotFound      ErrorCode = 2001
	CodeUserExists        ErrorCode = 2002
	CodeUserDisabledErr   ErrorCode = 2003
	CodeUserPasswordWrong ErrorCode = 2004

	// 企业错误码 (3000-3999)
	CodeEnterpriseNotFound ErrorCode = 3001
	CodeEnterpriseExists   ErrorCode = 3002
	CodeEnterpriseDisabled ErrorCode = 3003

	// 账户错误码 (4000-4999)
	CodeAccountNotFound         ErrorCode = 4001
	CodeAccountExists           ErrorCode = 4002
	CodeAccountDisabled         ErrorCode = 4003
	CodeAccountCreateFail       ErrorCode = 4004
	CodeAccountUpdateFail       ErrorCode = 4005
	CodeAccountDeleteFail       ErrorCode = 4006
	CodeAccountBalanceNotEnough ErrorCode = 4007

	// 交易错误码 (5000-5999)
	CodeTransactionNotFound    ErrorCode = 5001
	CodeTransactionCreateFail  ErrorCode = 5002
	CodeTransactionUpdateFail  ErrorCode = 5003
	CodeTransactionDeleteFail  ErrorCode = 5004
	CodeTransactionTypeInvalid ErrorCode = 5005

	// 预算错误码 (6000-6999)
	CodeBudgetNotFound   ErrorCode = 6001
	CodeBudgetExists     ErrorCode = 6002
	CodeBudgetCreateFail ErrorCode = 6003
	CodeBudgetUpdateFail ErrorCode = 6004
	CodeBudgetDeleteFail ErrorCode = 6005
	CodeBudgetExceeded   ErrorCode = 6006

	// 投资错误码 (7000-7999)
	CodeInvestmentNotFound   ErrorCode = 7001
	CodeInvestmentExists     ErrorCode = 7002
	CodeInvestmentCreateFail ErrorCode = 7003
	CodeInvestmentUpdateFail ErrorCode = 7004
	CodeInvestmentDeleteFail ErrorCode = 7005

	// 系统错误码 (9000-9999)
	CodeSystemError        ErrorCode = 9001
	CodeDatabaseError      ErrorCode = 9002
	CodeCacheError         ErrorCode = 9003
	CodeInternalError      ErrorCode = 9004
	CodeServiceUnavailable ErrorCode = 9005
)

// ErrorCodeToHTTPStatus 错误码到 HTTP 状态的映射
func ErrorCodeToHTTPStatus(code ErrorCode) int {
	switch {
	case code == CodeSuccess:
		return 200
	case code >= 1000 && code < 2000: // 认证错误
		return 401
	case code >= 2000 && code < 3000: // 用户错误
		return 400
	case code >= 3000 && code < 4000: // 企业错误
		return 400
	case code >= 4000 && code < 5000: // 账户错误
		return 400
	case code >= 5000 && code < 6000: // 交易错误
		return 400
	case code >= 6000 && code < 7000: // 预算错误
		return 400
	case code >= 7000 && code < 8000: // 投资错误
		return 400
	default: // 系统错误
		return 500
	}
}

// ErrorCodeToMessage 错误码到默认消息的映射
func ErrorCodeToMessage(code ErrorCode) string {
	messages := map[ErrorCode]string{
		CodeSuccess:                 "成功",
		CodeFail:                    "操作失败",
		CodeInvalid:                 "参数无效",
		CodeUnauthorized:            "未授权访问",
		CodeTokenExpired:            "登录已过期",
		CodeTokenInvalid:            "无效的Token",
		CodeNotLogin:                "请先登录",
		CodeNoPermission:            "权限不足",
		CodeUserDisabled:            "用户已被禁用",
		CodeTokenRefreshFail:        "Token刷新失败",
		CodeUserNotFound:            "用户不存在",
		CodeUserExists:              "用户已存在",
		CodeUserDisabledErr:         "用户已被禁用",
		CodeUserPasswordWrong:       "密码错误",
		CodeEnterpriseNotFound:      "企业不存在",
		CodeEnterpriseExists:        "企业已存在",
		CodeEnterpriseDisabled:      "企业已被禁用",
		CodeAccountNotFound:         "账户不存在",
		CodeAccountExists:           "账户已存在",
		CodeAccountDisabled:         "账户已被禁用",
		CodeAccountCreateFail:       "创建账户失败",
		CodeAccountUpdateFail:       "更新账户失败",
		CodeAccountDeleteFail:       "删除账户失败",
		CodeAccountBalanceNotEnough: "账户余额不足",
		CodeTransactionNotFound:     "交易记录不存在",
		CodeTransactionCreateFail:   "创建交易失败",
		CodeTransactionUpdateFail:   "更新交易失败",
		CodeTransactionDeleteFail:   "删除交易失败",
		CodeTransactionTypeInvalid:  "无效的交易类型",
		CodeBudgetNotFound:          "预算不存在",
		CodeBudgetExists:            "预算已存在",
		CodeBudgetCreateFail:        "创建预算失败",
		CodeBudgetUpdateFail:        "更新预算失败",
		CodeBudgetDeleteFail:        "删除预算失败",
		CodeBudgetExceeded:          "预算已超支",
		CodeInvestmentNotFound:      "投资记录不存在",
		CodeInvestmentExists:        "投资记录已存在",
		CodeInvestmentCreateFail:    "创建投资失败",
		CodeInvestmentUpdateFail:    "更新投资失败",
		CodeInvestmentDeleteFail:    "删除投资失败",
		CodeSystemError:             "系统错误",
		CodeDatabaseError:           "数据库错误",
		CodeCacheError:              "缓存错误",
		CodeInternalError:           "内部错误",
		CodeServiceUnavailable:      "服务不可用",
	}
	if msg, ok := messages[code]; ok {
		return msg
	}
	return "未知错误"
}

// GetErrorMessage 获取错误消息，支持格式化
func GetErrorMessage(code ErrorCode, args ...interface{}) string {
	return fmt.Sprintf(ErrorCodeToMessage(code), args...)
}
