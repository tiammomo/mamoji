package request

import "github.com/go-playground/validator/v10"

// CreateAccountRequest 创建账户请求
type CreateAccountRequest struct {
	EnterpriseId       int64   `json:"enterpriseId" binding:"required"`
	UnitId             int64   `json:"unitId"`
	AssetCategory      string  `json:"assetCategory" binding:"required,oneof=fund credit topup investment debt"`
	SubType            string  `json:"subType"`
	Name               string  `json:"name" binding:"required,max=50"`
	Currency           string  `json:"currency"`
	AccountNo          string  `json:"accountNo" max:"50"`
	BankCode           string  `json:"bankCode" max:"50"` // 银行编码（银行信用卡必填）
	BankName           string  `json:"bankName" max:"50"` // 开户银行（储蓄卡类型必填）/ 发卡银行（银行信用卡）
	BankCardType       string  `json:"bankCardType"`
	CreditLimit        float64 `json:"creditLimit"`
	OutstandingBalance float64 `json:"outstandingBalance"`
	BillingDate        int     `json:"billingDate"`
	RepaymentDate      int     `json:"repaymentDate"`
	AvailableBalance   float64 `json:"availableBalance"`
	InvestedAmount     float64 `json:"investedAmount"`
	TotalValue         float64 `json:"totalValue"`
	IncludeInTotal     int     `json:"includeInTotal"`
}

// UpdateAccountRequest 更新账户请求
type UpdateAccountRequest struct {
	UnitId             *int64   `json:"unitId"`
	AssetCategory      *string  `json:"assetCategory" oneof="fund credit topup investment debt"`
	SubType            *string  `json:"subType"`
	Name               *string  `json:"name" max="50"`
	Currency           *string  `json:"currency"`
	AccountNo          *string  `json:"accountNo" max:"50"`
	BankCode           *string  `json:"bankCode" max:"50"` // 银行编码（银行信用卡必填）
	BankName           *string  `json:"bankName" max:"50"` // 开户银行（储蓄卡类型必填）/ 发卡银行（银行信用卡）
	BankCardType       *string  `json:"bankCardType"`
	CreditLimit        *float64 `json:"creditLimit"`
	OutstandingBalance *float64 `json:"outstandingBalance"`
	BillingDate        *int     `json:"billingDate"`
	RepaymentDate      *int     `json:"repaymentDate"`
	AvailableBalance   *float64 `json:"availableBalance"`
	InvestedAmount     *float64 `json:"investedAmount"`
	TotalValue         *float64 `json:"totalValue"`
	IncludeInTotal     *int     `json:"includeInTotal"`
	Status             *int     `json:"status"`
}

// ListAccountRequest 列表查询请求
type ListAccountRequest struct {
	UnitId   int64  `form:"unitId"`
	Category string `form:"category"`
	Search   string `form:"search"`
	Page     int    `form:"page,default=1" validate:"min=1"`
	PageSize int    `form:"pageSize,default=10" validate:"min=1,max=100"`
}

// ListTransactionRequest 列表查询请求
type ListTransactionRequest struct {
	EnterpriseId int64  `form:"enterpriseId"`
	AccountId    int64  `form:"accountId"`
	BudgetId     int64  `form:"budgetId"`
	Type         string `form:"type"`
	Category     string `form:"category"`
	StartDate    string `form:"startDate"`
	EndDate      string `form:"endDate"`
	Page         int    `form:"page,default=1" validate:"min=1"`
	PageSize     int    `form:"pageSize,default=10" validate:"min=1,max=100"`
}

// CreateTransactionRequest 创建交易请求
type CreateTransactionRequest struct {
	EnterpriseId int64    `json:"enterpriseId" binding:"required"`
	UnitId       int64    `json:"unitId" binding:"required"`
	UserId       int64    `json:"userId" binding:"required"`
	Type         string   `json:"type" binding:"required,oneof=income expense"`
	Category     string   `json:"category" binding:"required,max=30"`
	Amount       float64  `json:"amount" binding:"required,gt=0"`
	AccountId    int64    `json:"accountId" binding:"required"`
	BudgetId     *int64   `json:"budgetId"`
	OccurredAt   string   `json:"occurredAt" binding:"required"`
	Tags         []string `json:"tags"`
	Note         string   `json:"note" max:"500"`
}

// UpdateTransactionRequest 更新交易请求
type UpdateTransactionRequest struct {
	Type       *string  `json:"type" oneof="income expense"`
	Category   *string  `json:"category" max:"30"`
	Amount     *float64 `json:"amount" gt=0`
	AccountId  *int64   `json:"accountId"`
	BudgetId   *int64   `json:"budgetId"`
	OccurredAt *string  `json:"occurredAt"`
	Tags       []string `json:"tags"`
	Note       *string  `json:"note" max:"500"`
	Status     *int     `json:"status"`
}

// CreateBudgetRequest 创建预算请求
type CreateBudgetRequest struct {
	EnterpriseId int64   `json:"enterpriseId" binding:"required"`
	UnitId       int64   `json:"unitId" binding:"required"`
	Name         string  `json:"name" binding:"required,max=50"`
	Type         string  `json:"type" binding:"required,oneof=monthly yearly project"`
	Category     string  `json:"category" binding:"required,max=30"`
	TotalAmount  float64 `json:"totalAmount" binding:"required,gt=0"`
	PeriodStart  string  `json:"periodStart" binding:"required"`
	PeriodEnd    string  `json:"periodEnd" binding:"required"`
}

// UpdateBudgetRequest 更新预算请求
type UpdateBudgetRequest struct {
	Name        *string  `json:"name" max:"50"`
	Type        *string  `json:"type" oneof="monthly yearly project"`
	Category    *string  `json:"category" max="30"`
	TotalAmount *float64 `json:"totalAmount" gt=0`
	PeriodStart *string  `json:"periodStart"`
	PeriodEnd   *string  `json:"periodEnd"`
	Status      *string  `json:"status"`
}

// ListBudgetRequest 列表查询请求
type ListBudgetRequest struct {
	UnitId   int64  `form:"unitId"`
	Type     string `form:"type"`
	Category string `form:"category"`
	Status   string `form:"status"`
	Page     int    `form:"page,default=1" validate:"min=1"`
	PageSize int    `form:"pageSize,default=10" validate:"min=1,max=100"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6,max=50"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6,max=50"`
	Phone    string `json:"phone"`
	Email    string `json:"email" binding:"email"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Phone  *string `json:"phone"`
	Email  *string `json:"email" binding:"omitempty,email"`
	Avatar *string `json:"avatar"`
	Role   *string `json:"role"`
	Status *int    `json:"status"`
}

// UpdateEnterpriseRequest 更新企业请求
type UpdateEnterpriseRequest struct {
	Name          *string `json:"name" max:"100"`
	CreditCode    *string `json:"creditCode" max:"50"`
	ContactPerson *string `json:"contactPerson" max:"50"`
	ContactPhone  *string `json:"contactPhone" max:"20"`
	Address       *string `json:"address" max:"255"`
}

// Validate 验证请求参数
func Validate(req interface{}) error {
	validate := validator.New()
	return validate.Struct(req)
}
