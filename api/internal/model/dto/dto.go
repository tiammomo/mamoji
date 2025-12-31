package dto

// LoginRequest 登录请求
type LoginRequest struct {
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Password  string `json:"password" binding:"required,min=6"`
	Captcha   string `json:"captcha"`
	CaptchaId string `json:"captchaId"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token     string    `json:"token"`
	User      *UserInfo `json:"user"`
	ExpiresAt string    `json:"expiresAt"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
}

// UserInfo 用户信息
type UserInfo struct {
	UserId         int64  `json:"userId"`
	Username       string `json:"username"`
	Phone          string `json:"phone,omitempty"`
	Email          string `json:"email,omitempty"`
	Avatar         string `json:"avatar,omitempty"`
	EnterpriseId   int64  `json:"enterpriseId,omitempty"`
	EnterpriseName string `json:"enterpriseName,omitempty"`
	Role           string `json:"role,omitempty"`
}

// CreateAccountRequest 创建账户请求
type CreateAccountRequest struct {
	EnterpriseId     int64   `json:"enterpriseId"`
	UnitId           int64   `json:"unitId"`
	Type             string  `json:"type" binding:"required"`
	Name             string  `json:"name" binding:"required,min=1,max=50"`
	AccountNo        string  `json:"accountNo,omitempty"`
	BankCardType     string  `json:"bankCardType,omitempty"`
	AvailableBalance float64 `json:"availableBalance"`
	InvestedAmount   float64 `json:"investedAmount"`
}

// UpdateAccountRequest 更新账户请求
type UpdateAccountRequest struct {
	Name             string  `json:"name,omitempty"`
	AccountNo        string  `json:"accountNo,omitempty"`
	BankCardType     string  `json:"bankCardType,omitempty"`
	AvailableBalance float64 `json:"availableBalance"`
	InvestedAmount   float64 `json:"investedAmount"`
	Status           int     `json:"status,omitempty"`
}

// AccountResponse 账户响应
type AccountResponse struct {
	AccountId        int64   `json:"accountId"`
	EnterpriseId     int64   `json:"enterpriseId"`
	UnitId           int64   `json:"unitId"`
	Type             string  `json:"type"`
	Name             string  `json:"name"`
	AccountNo        string  `json:"accountNo,omitempty"`
	BankCardType     string  `json:"bankCardType,omitempty"`
	AvailableBalance float64 `json:"availableBalance"`
	InvestedAmount   float64 `json:"investedAmount"`
	Status           int     `json:"status"`
	CreatedAt        string  `json:"createdAt"`
}

// ListTransactionRequest 列表查询请求
type ListTransactionRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	UnitId       int64  `json:"unitId,omitempty"`
	Type         string `json:"type,omitempty"`
	Category     string `json:"category,omitempty"`
	StartDate    string `json:"startDate,omitempty"`
	EndDate      string `json:"endDate,omitempty"`
	Page         int    `json:"page"`
	PageSize     int    `json:"pageSize"`
}

// CreateTransactionRequest 创建交易请求
type CreateTransactionRequest struct {
	EnterpriseId  int64    `json:"enterpriseId"`
	UnitId        int64    `json:"unitId"`
	UserId        int64    `json:"userId"`
	Type          string   `json:"type" binding:"required,oneof=income expense"`
	Category      string   `json:"category" binding:"required"`
	Amount        float64  `json:"amount" binding:"required,gt=0"`
	AccountId     int64    `json:"accountId" binding:"required"`
	BudgetId      *int64   `json:"budgetId,omitempty"`
	OccurredAt    string   `json:"occurredAt"`
	Tags          []string `json:"tags,omitempty"`
	Note          string   `json:"note,omitempty"`
	Images        []string `json:"images,omitempty"`
	EcommerceInfo string   `json:"ecommerceInfo,omitempty"`
}

// UpdateTransactionRequest 更新交易请求
type UpdateTransactionRequest struct {
	Type          string   `json:"type,omitempty"`
	Category      string   `json:"category,omitempty"`
	Amount        float64  `json:"amount,omitempty"`
	AccountId     int64    `json:"accountId,omitempty"`
	BudgetId      *int64   `json:"budgetId,omitempty"`
	OccurredAt    string   `json:"occurredAt,omitempty"`
	Tags          []string `json:"tags,omitempty"`
	Note          string   `json:"note,omitempty"`
	Images        []string `json:"images,omitempty"`
	EcommerceInfo string   `json:"ecommerceInfo,omitempty"`
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
	AccountName   string   `json:"accountName,omitempty"`
	BudgetId      *int64   `json:"budgetId,omitempty"`
	OccurredAt    string   `json:"occurredAt"`
	Tags          []string `json:"tags,omitempty"`
	Note          string   `json:"note,omitempty"`
	Images        []string `json:"images,omitempty"`
	Status        int      `json:"status"`
	CreatedAt     string   `json:"createdAt"`
}

// PaginatedResponse 分页响应
type PaginatedResponse struct {
	List       interface{} `json:"list"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}

// ListBudgetRequest 预算列表查询请求
type ListBudgetRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	UnitId       int64  `json:"unitId,omitempty"`
	Status       string `json:"status,omitempty"`
	// 时间范围筛选（用于筛选预算的 period_start 和 period_end）
	StartDate string `json:"startDate,omitempty"`
	EndDate   string `json:"endDate,omitempty"`
}

// CreateBudgetRequest 创建预算请求
type CreateBudgetRequest struct {
	EnterpriseId int64   `json:"enterpriseId"`
	UnitId       int64   `json:"unitId" binding:"required"`
	Name         string  `json:"name" binding:"required,min=1,max=50"`
	Type         string  `json:"type" binding:"required,oneof=monthly yearly project"`
	Category     string  `json:"category" binding:"required"`
	TotalAmount  float64 `json:"totalAmount" binding:"required,gt=0"`
	PeriodStart  string  `json:"periodStart" binding:"required"`
	PeriodEnd    string  `json:"periodEnd" binding:"required"`
}

// UpdateBudgetRequest 更新预算请求
type UpdateBudgetRequest struct {
	Name        string  `json:"name,omitempty"`
	TotalAmount float64 `json:"totalAmount,omitempty"`
	PeriodStart string  `json:"periodStart,omitempty"`
	PeriodEnd   string  `json:"periodEnd,omitempty"`
	Status      string  `json:"status,omitempty"`
}

// ApplyBudgetRequest 申请预算请求
type ApplyBudgetRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
	Reason string  `json:"reason" binding:"required"`
}

// ApproveBudgetRequest 审批预算请求
type ApproveBudgetRequest struct {
	ApprovedAmount float64 `json:"approvedAmount,omitempty"`
	Comment        string  `json:"comment,omitempty"`
	Action         string  `json:"action" binding:"required,oneof=approve reject"`
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
	UsagePercent float64 `json:"usagePercent"`
	CreatedAt    string  `json:"createdAt"`
}

// BudgetDetailResponse 预算详情响应（包含关联的交易记录）
type BudgetDetailResponse struct {
	BudgetResponse
	Transactions     []TransactionResponse `json:"transactions"`
	TransactionCount int                   `json:"transactionCount"`
	RemainingAmount  float64               `json:"remainingAmount"`
}

// ListInvestmentRequest 投资列表查询请求
type ListInvestmentRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	UnitId       int64  `json:"unitId,omitempty"`
	ProductType  string `json:"productType,omitempty"`
}

// CreateInvestmentRequest 创建投资请求
type CreateInvestmentRequest struct {
	EnterpriseId int64   `json:"enterpriseId"`
	UnitId       int64   `json:"unitId" binding:"required"`
	Name         string  `json:"name" binding:"required,min=1,max=50"`
	ProductType  string  `json:"productType" binding:"required"`
	ProductCode  string  `json:"productCode,omitempty"`
	Principal    float64 `json:"principal" binding:"required,gt=0"`
	Quantity     float64 `json:"quantity,omitempty"`
	CostPrice    float64 `json:"costPrice,omitempty"`
	Platform     string  `json:"platform,omitempty"`
	StartDate    string  `json:"startDate,omitempty"`
	EndDate      string  `json:"endDate,omitempty"`
	InterestRate float64 `json:"interestRate,omitempty"`
	ReminderDays int     `json:"reminderDays,omitempty"`
	Note         string  `json:"note,omitempty"`
}

// UpdateInvestmentRequest 更新投资请求
type UpdateInvestmentRequest struct {
	Name         string  `json:"name,omitempty"`
	ProductCode  string  `json:"productCode,omitempty"`
	CurrentValue float64 `json:"currentValue,omitempty"`
	Quantity     float64 `json:"quantity,omitempty"`
	CostPrice    float64 `json:"costPrice,omitempty"`
	CurrentPrice float64 `json:"currentPrice,omitempty"`
	ReminderDays int     `json:"reminderDays,omitempty"`
	Note         string  `json:"note,omitempty"`
	Status       int     `json:"status,omitempty"`
}

// CreateInvestRecordRequest 创建投资记录请求
type CreateInvestRecordRequest struct {
	Type       string  `json:"type" binding:"required,oneof=buy sell profit dividend interest"`
	Amount     float64 `json:"amount" binding:"required"`
	Price      float64 `json:"price,omitempty"`
	Quantity   float64 `json:"quantity,omitempty"`
	RecordedAt string  `json:"recordedAt"`
	Note       string  `json:"note,omitempty"`
}

// InvestmentResponse 投资响应
type InvestmentResponse struct {
	InvestmentId  int64   `json:"investmentId"`
	EnterpriseId  int64   `json:"enterpriseId"`
	UnitId        int64   `json:"unitId"`
	Name          string  `json:"name"`
	ProductType   string  `json:"productType"`
	ProductCode   string  `json:"productCode,omitempty"`
	Principal     float64 `json:"principal"`
	CurrentValue  float64 `json:"currentValue"`
	TotalProfit   float64 `json:"totalProfit"`
	ReturnRate    float64 `json:"returnRate"`
	Quantity      float64 `json:"quantity,omitempty"`
	CostPrice     float64 `json:"costPrice,omitempty"`
	CurrentPrice  float64 `json:"currentPrice,omitempty"`
	LastUpdatedAt string  `json:"lastUpdatedAt,omitempty"`
	ReminderDays  int     `json:"reminderDays"`
	Status        int     `json:"status"`
	CreatedAt     string  `json:"createdAt"`
}

// OverviewReportRequest 概览报表请求
type OverviewReportRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
}

// OverviewReportResponse 概览报表响应
type OverviewReportResponse struct {
	TotalAssets      float64              `json:"totalAssets"`
	MonthlyIncome    float64              `json:"monthlyIncome"`
	MonthlyExpense   float64              `json:"monthlyExpense"`
	MonthlyBalance   float64              `json:"monthlyBalance"`
	TotalInvestments float64              `json:"totalInvestments"`
	InvestProfit     float64              `json:"investProfit"`
	BudgetUsage      []BudgetUsageItem    `json:"budgetUsage"`
	AccountBalance   []AccountBalanceItem `json:"accountBalance"`
}

// BudgetUsageItem 预算使用项
type BudgetUsageItem struct {
	Name         string  `json:"name"`
	TotalAmount  float64 `json:"totalAmount"`
	UsedAmount   float64 `json:"usedAmount"`
	UsagePercent float64 `json:"usagePercent"`
	Status       string  `json:"status"`
}

// AccountBalanceItem 账户余额项
type AccountBalanceItem struct {
	Name    string  `json:"name"`
	Balance float64 `json:"balance"`
	Type    string  `json:"type"`
}

// IncomeExpenseReportRequest 收支报表请求
type IncomeExpenseReportRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	UnitId       int64  `json:"unitId,omitempty"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
}

// IncomeExpenseReportResponse 收支报表响应
type IncomeExpenseReportResponse struct {
	TotalIncome       float64        `json:"totalIncome"`
	TotalExpense      float64        `json:"totalExpense"`
	Balance           float64        `json:"balance"`
	IncomeByCategory  []CategoryItem `json:"incomeByCategory"`
	ExpenseByCategory []CategoryItem `json:"expenseByCategory"`
	IncomeTrend       []TrendItem    `json:"incomeTrend"`
	ExpenseTrend      []TrendItem    `json:"expenseTrend"`
}

// CategoryItem 分类项
type CategoryItem struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
	Percent  float64 `json:"percent"`
}

// TrendItem 趋势项
type TrendItem struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

// CategoryReportRequest 分类报表请求
type CategoryReportRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
}

// CategoryReportResponse 分类报表响应
type CategoryReportResponse struct {
	Incomes  []CategoryItem `json:"incomes"`
	Expenses []CategoryItem `json:"expenses"`
}

// TrendReportRequest 趋势报表请求
type TrendReportRequest struct {
	EnterpriseId int64  `json:"enterpriseId"`
	StartDate    string `json:"startDate"`
	EndDate      string `json:"endDate"`
	GroupBy      string `json:"groupBy"`
}

// TrendReportResponse 趋势报表响应
type TrendReportResponse struct {
	Period   string      `json:"period"`
	Incomes  []TrendItem `json:"incomes"`
	Expenses []TrendItem `json:"expenses"`
}

// AccountSummaryResponse 账户汇总响应（包含环比数据）
type AccountSummaryResponse struct {
	// 本月数据
	TotalBalance   float64 `json:"totalBalance"`
	TotalAvailable float64 `json:"totalAvailable"`
	TotalInvested  float64 `json:"totalInvested"`
	AccountCount   int     `json:"accountCount"`
	// 上月数据
	LastMonthBalance   float64 `json:"lastMonthBalance"`
	LastMonthAvailable float64 `json:"lastMonthAvailable"`
	LastMonthInvested  float64 `json:"lastMonthInvested"`
	// 环比变化率 (%)
	BalanceMoM   float64 `json:"balanceMoM"`
	AvailableMoM float64 `json:"availableMoM"`
	InvestedMoM  float64 `json:"investedMoM"`
	// 是否有历史数据
	HasHistory bool `json:"hasHistory"`
}

// ==================== 系统设置相关 DTO ====================

// EnterpriseSettings 企业信息设置
type EnterpriseSettings struct {
	EnterpriseId   int64  `json:"enterpriseId"`
	EnterpriseName string `json:"enterpriseName"`
	ContactPerson  string `json:"contactPerson"`
	ContactPhone   string `json:"contactPhone,omitempty"`
	ContactEmail   string `json:"contactEmail,omitempty"`
	Address        string `json:"address,omitempty"`
	Logo           string `json:"logo,omitempty"`
	CreatedAt      string `json:"createdAt"`
}

// UpdateEnterpriseRequest 更新企业信息请求
type UpdateEnterpriseRequest struct {
	EnterpriseName string `json:"enterpriseName" binding:"required,min=2,max=100"`
	ContactPerson  string `json:"contactPerson" binding:"required,min=2,max=50"`
	ContactPhone   string `json:"contactPhone,omitempty"`
	ContactEmail   string `json:"contactEmail,omitempty" binding:"omitempty,email"`
	Address        string `json:"address,omitempty"`
	Logo           string `json:"logo,omitempty"`
}

// SystemUser 系统用户
type SystemUser struct {
	UserId       int64  `json:"userId"`
	Username     string `json:"username"`
	Phone        string `json:"phone,omitempty"`
	Email        string `json:"email,omitempty"`
	Avatar       string `json:"avatar,omitempty"`
	EnterpriseId int64  `json:"enterpriseId"`
	Role         string `json:"role"`
	Status       int    `json:"status"`
	CreatedAt    string `json:"createdAt"`
	LastLoginAt  string `json:"lastLoginAt,omitempty"`
}

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username     string `json:"username" binding:"required,min=3,max=50"`
	Password     string `json:"password" binding:"required,min=6"`
	Phone        string `json:"phone,omitempty"`
	Email        string `json:"email,omitempty" binding:"omitempty,email"`
	Role         string `json:"role" binding:"required,oneof=super_admin finance_admin normal readonly"`
	EnterpriseId int64  `json:"enterpriseId"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Username string `json:"username,omitempty" binding:"omitempty,min=3,max=50"`
	Phone    string `json:"phone,omitempty"`
	Email    string `json:"email,omitempty" binding:"omitempty,email"`
	Role     string `json:"role,omitempty" binding:"omitempty,oneof=super_admin finance_admin normal readonly"`
	Status   int    `json:"status,omitempty" binding:"omitempty,oneof=0 1"`
}

// UpdateUserPasswordRequest 更新用户密码请求
type UpdateUserPasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// RoleInfo 角色信息
type RoleInfo struct {
	Role        string   `json:"role"`
	RoleName    string   `json:"roleName"`
	Description string   `json:"description"`
	Permissions []string `json:"permissions"`
	UserCount   int      `json:"userCount"`
}

// SystemPreferences 系统偏好设置
type SystemPreferences struct {
	EnterpriseId      int64   `json:"enterpriseId"`
	Currency          string  `json:"currency"`
	Timezone          string  `json:"timezone"`
	DateFormat        string  `json:"dateFormat"`
	MonthStart        int     `json:"monthStart"`
	ExpenseCategory   string  `json:"expenseCategory,omitempty"`
	IncomeCategory    string  `json:"incomeCategory,omitempty"`
	AutoBackup        bool    `json:"autoBackup"`
	BackupFrequency   string  `json:"backupFrequency,omitempty"`
	TransactionLimit  float64 `json:"transactionLimit"`
	RequireApproval   bool    `json:"requireApproval"`
	ApprovalThreshold float64 `json:"approvalThreshold,omitempty"`
}

// UpdatePreferencesRequest 更新偏好设置请求
type UpdatePreferencesRequest struct {
	Currency          string  `json:"currency,omitempty"`
	Timezone          string  `json:"timezone,omitempty"`
	DateFormat        string  `json:"dateFormat,omitempty"`
	MonthStart        int     `json:"monthStart,omitempty" binding:"omitempty,oneof=1 15"`
	ExpenseCategory   string  `json:"expenseCategory,omitempty"`
	IncomeCategory    string  `json:"incomeCategory,omitempty"`
	AutoBackup        bool    `json:"autoBackup"`
	BackupFrequency   string  `json:"backupFrequency,omitempty" binding:"omitempty,oneof=daily weekly monthly"`
	TransactionLimit  float64 `json:"transactionLimit,omitempty"`
	RequireApproval   bool    `json:"requireApproval"`
	ApprovalThreshold float64 `json:"approvalThreshold,omitempty"`
}
