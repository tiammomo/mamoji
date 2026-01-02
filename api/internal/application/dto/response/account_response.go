package response

import (
	"time"
)

// AccountResponse 账户响应
type AccountResponse struct {
	AccountId          int64   `json:"accountId"`
	EnterpriseId       int64   `json:"enterpriseId"`
	UnitId             int64   `json:"unitId"`
	AssetCategory      string  `json:"assetCategory"`
	SubType            string  `json:"subType"`
	Name               string  `json:"name"`
	Currency           string  `json:"currency"`
	AccountNo          string  `json:"accountNo,omitempty"`
	BankName           string  `json:"bankName,omitempty"`
	BankCardType       string  `json:"bankCardType,omitempty"`
	CreditLimit        float64 `json:"creditLimit"`
	OutstandingBalance float64 `json:"outstandingBalance"`
	BillingDate        int     `json:"billingDate"`
	RepaymentDate      int     `json:"repaymentDate"`
	AvailableBalance   float64 `json:"availableBalance"`
	InvestedAmount     float64 `json:"investedAmount"`
	TotalValue         float64 `json:"totalValue"`
	IncludeInTotal     int     `json:"includeInTotal"`
	Status             int     `json:"status"`
	CreatedAt          string  `json:"createdAt"`
}

// AccountSummaryResponse 账户汇总响应
type AccountSummaryResponse struct {
	TotalBalance       float64 `json:"totalBalance"`
	TotalAvailable     float64 `json:"totalAvailable"`
	TotalInvested      float64 `json:"totalInvested"`
	AccountCount       int     `json:"accountCount"`
	LastMonthBalance   float64 `json:"lastMonthBalance"`
	LastMonthAvailable float64 `json:"lastMonthAvailable"`
	LastMonthInvested  float64 `json:"lastMonthInvested"`
	BalanceMoM         float64 `json:"balanceMoM"`
	AvailableMoM       float64 `json:"availableMoM"`
	InvestedMoM        float64 `json:"investedMoM"`
	HasHistory         bool    `json:"hasHistory"`
}

// TransactionResponse 交易响应
type TransactionResponse struct {
	TransactionId int64    `json:"transactionId"`
	EnterpriseId  int64    `json:"enterpriseId"`
	UnitId        int64    `json:"unitId"`
	UserId        int64    `json:"userId"`
	Type          string   `json:"type"`
	Category      string   `json:"category"`
	Amount        float64  `json:"amount"`
	AccountId     int64    `json:"accountId"`
	BudgetId      *int64   `json:"budgetId,omitempty"`
	OccurredAt    string   `json:"occurredAt"`
	Tags          []string `json:"tags,omitempty"`
	Note          string   `json:"note,omitempty"`
	Status        int      `json:"status"`
	CreatedAt     string   `json:"createdAt"`
	UpdatedAt     string   `json:"updatedAt,omitempty"`
}

// BudgetResponse 预算响应
type BudgetResponse struct {
	BudgetId     int64   `json:"budgetId"`
	EnterpriseId int64   `json:"enterpriseId"`
	UnitId       int64   `json:"unitId"`
	Name         string  `json:"name"`
	Type         string  `json:"type"`
	Category     string  `json:"category"`
	TotalAmount  float64 `json:"totalAmount"`
	UsedAmount   float64 `json:"usedAmount"`
	PeriodStart  string  `json:"periodStart"`
	PeriodEnd    string  `json:"periodEnd"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt,omitempty"`
}

// BudgetDetailResponse 预算详情响应
type BudgetDetailResponse struct {
	BudgetResponse
	UsedAmount      float64                `json:"usedAmount"`
	RemainingAmount float64                `json:"remainingAmount"`
	UsagePercent    float64                `json:"usagePercent"`
	Transactions    []*TransactionResponse `json:"transactions,omitempty"`
}

// UserResponse 用户响应
type UserResponse struct {
	UserId    int64     `json:"userId"`
	Username  string    `json:"username"`
	Phone     string    `json:"phone,omitempty"`
	Email     string    `json:"email,omitempty"`
	Avatar    string    `json:"avatar,omitempty"`
	Role      string    `json:"role"`
	Status    int       `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// EnterpriseResponse 企业响应
type EnterpriseResponse struct {
	EnterpriseId  int64     `json:"enterpriseId"`
	Name          string    `json:"name"`
	CreditCode    string    `json:"creditCode,omitempty"`
	ContactPerson string    `json:"contactPerson,omitempty"`
	ContactPhone  string    `json:"contactPhone,omitempty"`
	Address       string    `json:"address,omitempty"`
	LicenseImage  string    `json:"licenseImage,omitempty"`
	Status        int       `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token     string        `json:"token"`
	User      *UserResponse `json:"user"`
	ExpiresAt string        `json:"expiresAt"`
}

// PaginatedResponse 通用分页响应
type PaginatedResponse struct {
	List       interface{} `json:"list"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// OverviewReportResponse 概览报表响应
type OverviewReportResponse struct {
	TotalIncome      float64 `json:"totalIncome"`
	TotalExpense     float64 `json:"totalExpense"`
	NetIncome        float64 `json:"netIncome"`
	AccountBalance   float64 `json:"accountBalance"`
	TransactionCount int64   `json:"transactionCount"`
	Period           string  `json:"period"`
}

// CategoryReportResponse 分类报表响应
type CategoryReportResponse struct {
	Category    string  `json:"category"`
	Type        string  `json:"type"`
	TotalAmount float64 `json:"totalAmount"`
	Percent     float64 `json:"percent"`
	Count       int64   `json:"count"`
}
