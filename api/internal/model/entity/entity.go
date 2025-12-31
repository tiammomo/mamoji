package entity

import (
	"time"
)

// User 用户表
type User struct {
	UserId    int64     `gorm:"primaryKey;autoIncrement" json:"userId"`
	Username  string    `gorm:"size:50;not null;uniqueIndex" json:"username"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Email     string    `gorm:"size:100" json:"email"`
	Avatar    string    `gorm:"size:500" json:"avatar"`
	Role      string    `gorm:"size:20;default:user" json:"role"`
	Status    int       `gorm:"default:1" json:"status"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

// TableName 指定表名
func (User) TableName() string {
	return "sys_user"
}

// UserToken 用户Token表
type UserToken struct {
	TokenId   int64     `gorm:"primaryKey;autoIncrement" json:"tokenId"`
	UserId    int64     `gorm:"not null;uniqueIndex:idx_user_id" json:"userId"`
	Token     string    `gorm:"size:500;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (UserToken) TableName() string {
	return "sys_user_token"
}

// Enterprise 企业表
type Enterprise struct {
	EnterpriseId  int64     `gorm:"primaryKey;autoIncrement" json:"enterpriseId"`
	Name          string    `gorm:"size:100;not null" json:"name"`
	CreditCode    string    `gorm:"size:50" json:"creditCode"`
	ContactPerson string    `gorm:"size:50" json:"contactPerson"`
	ContactPhone  string    `gorm:"size:20" json:"contactPhone"`
	Address       string    `gorm:"size:255" json:"address"`
	LicenseImage  string    `gorm:"size:500" json:"licenseImage"`
	Status        int       `gorm:"default:1" json:"status"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Enterprise) TableName() string {
	return "biz_enterprise"
}

// EnterpriseMember 企业成员表
type EnterpriseMember struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	EnterpriseId int64     `gorm:"not null;uniqueIndex:idx_enterprise_user" json:"enterpriseId"`
	UserId       int64     `gorm:"not null;uniqueIndex:idx_enterprise_user" json:"userId"`
	Role         string    `gorm:"size:20;not null" json:"role"`
	JoinedAt     time.Time `gorm:"autoCreateTime" json:"joinedAt"`
}

func (EnterpriseMember) TableName() string {
	return "biz_enterprise_member"
}

// AccountingUnit 记账单元表
type AccountingUnit struct {
	UnitId       int64     `gorm:"primaryKey;autoIncrement" json:"unitId"`
	EnterpriseId int64     `gorm:"not null;index" json:"enterpriseId"`
	ParentUnitId *int64    `gorm:"index" json:"parentUnitId"`
	Name         string    `gorm:"size:50;not null" json:"name"`
	Type         string    `gorm:"size:20;not null" json:"type"`
	Level        int       `gorm:"default:1" json:"level"`
	Status       int       `gorm:"default:1" json:"status"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updatedAt"`

	// 移除自引用外键约束，避免迁移错误
	Children []*AccountingUnit `gorm:"-" json:"children,omitempty"`
}

func (AccountingUnit) TableName() string {
	return "biz_accounting_unit"
}

// UnitPermission 单元权限表
type UnitPermission struct {
	PermissionId    int64     `gorm:"primaryKey;autoIncrement" json:"permissionId"`
	EnterpriseId    int64     `gorm:"not null;index" json:"enterpriseId"`
	UserId          int64     `gorm:"not null;index" json:"userId"`
	UnitId          int64     `gorm:"not null;index" json:"unitId"`
	PermissionLevel string    `gorm:"size:20;not null" json:"permissionLevel"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (UnitPermission) TableName() string {
	return "biz_unit_permission"
}

// Account 账户表
type Account struct {
	AccountId        int64     `gorm:"primaryKey;autoIncrement" json:"accountId"`
	EnterpriseId     int64     `gorm:"not null;index" json:"enterpriseId"`
	UnitId           int64     `gorm:"not null;index" json:"unitId"`
	Type             string    `gorm:"size:20;not null" json:"type"`
	Name             string    `gorm:"size:50;not null" json:"name"`
	AccountNo        string    `gorm:"size:50" json:"accountNo"`
	BankCardType     string    `gorm:"size:20" json:"bankCardType"`
	AvailableBalance float64   `gorm:"type:decimal(18,2);not null;default:0" json:"availableBalance"`
	InvestedAmount   float64   `gorm:"type:decimal(18,2);not null;default:0" json:"investedAmount"`
	Status           int       `gorm:"default:1" json:"status"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Account) TableName() string {
	return "biz_account"
}

// AccountFlow 账户流水表
type AccountFlow struct {
	FlowId        int64     `gorm:"primaryKey;autoIncrement" json:"flowId"`
	AccountId     int64     `gorm:"not null;index" json:"accountId"`
	TransactionId *int64    `gorm:"index" json:"transactionId"`
	Type          string    `gorm:"size:10;not null" json:"type"`
	Amount        float64   `gorm:"type:decimal(18,2);not null" json:"amount"`
	BalanceBefore float64   `gorm:"type:decimal(18,2);not null" json:"balanceBefore"`
	BalanceAfter  float64   `gorm:"type:decimal(18,2);not null" json:"balanceAfter"`
	Note          string    `gorm:"size:255" json:"note"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (AccountFlow) TableName() string {
	return "biz_account_flow"
}

// Transaction 账单表
type Transaction struct {
	TransactionId int64     `gorm:"primaryKey;autoIncrement" json:"transactionId"`
	EnterpriseId  int64     `gorm:"not null;index" json:"enterpriseId"`
	UnitId        int64     `gorm:"not null;index" json:"unitId"`
	UserId        int64     `gorm:"not null;index" json:"userId"`
	Type          string    `gorm:"size:10;not null" json:"type"`
	Category      string    `gorm:"size:30;not null" json:"category"`
	Amount        float64   `gorm:"type:decimal(18,2);not null" json:"amount"`
	AccountId     int64     `gorm:"not null;index" json:"accountId"`
	BudgetId      *int64    `gorm:"index;default:null" json:"budgetId"`
	OccurredAt    time.Time `gorm:"not null" json:"occurredAt"`
	Tags          string    `gorm:"type:json" json:"tags"`
	Note          string    `gorm:"size:500" json:"note"`
	Images        string    `gorm:"type:json" json:"images"`
	EcommerceInfo string    `gorm:"type:json" json:"ecommerceInfo"`
	Status        int       `gorm:"default:1" json:"status"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Transaction) TableName() string {
	return "biz_transaction"
}

// Budget 预算表
type Budget struct {
	BudgetId     int64     `gorm:"primaryKey;autoIncrement" json:"budgetId"`
	EnterpriseId int64     `gorm:"not null;index" json:"enterpriseId"`
	UnitId       int64     `gorm:"not null;index" json:"unitId"`
	Name         string    `gorm:"size:50;not null" json:"name"`
	Type         string    `gorm:"size:20;not null" json:"type"`
	Category     string    `gorm:"size:30;not null" json:"category"`
	TotalAmount  float64   `gorm:"type:decimal(18,2);not null" json:"totalAmount"`
	UsedAmount   float64   `gorm:"type:decimal(18,2);not null;default:0" json:"usedAmount"`
	PeriodStart  time.Time `gorm:"not null" json:"periodStart"`
	PeriodEnd    time.Time `gorm:"not null" json:"periodEnd"`
	Status       string    `gorm:"size:20;not null;default:active" json:"status"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Budget) TableName() string {
	return "biz_budget"
}

// BudgetApproval 预算审批表
type BudgetApproval struct {
	ApprovalId     int64      `gorm:"primaryKey;autoIncrement" json:"approvalId"`
	BudgetId       int64      `gorm:"not null;index" json:"budgetId"`
	ApplicantId    int64      `gorm:"not null;index" json:"applicantId"`
	ApproverId     *int64     `gorm:"index" json:"approverId"`
	ApplyAmount    float64    `gorm:"type:decimal(18,2);not null" json:"applyAmount"`
	ApprovedAmount *float64   `gorm:"type:decimal(18,2)" json:"approvedAmount"`
	Status         string     `gorm:"size:20;not null;default:pending" json:"status"`
	ApplyReason    string     `gorm:"size:500" json:"applyReason"`
	ApproveComment string     `gorm:"size:500" json:"approveComment"`
	AppliedAt      time.Time  `gorm:"autoCreateTime" json:"appliedAt"`
	ApprovedAt     *time.Time `json:"approvedAt"`
}

func (BudgetApproval) TableName() string {
	return "biz_budget_approval"
}

// Investment 理财账户表
type Investment struct {
	InvestmentId  int64      `gorm:"primaryKey;autoIncrement" json:"investmentId"`
	EnterpriseId  int64      `gorm:"not null;index" json:"enterpriseId"`
	UnitId        int64      `gorm:"not null;index" json:"unitId"`
	Name          string     `gorm:"size:50;not null" json:"name"`
	ProductType   string     `gorm:"size:20;not null" json:"productType"`
	ProductCode   string     `gorm:"size:50" json:"productCode"`
	Principal     float64    `gorm:"type:decimal(18,2);not null" json:"principal"`
	CurrentValue  float64    `gorm:"type:decimal(18,2);not null;default:0" json:"currentValue"`
	TotalProfit   float64    `gorm:"type:decimal(18,2);not null;default:0" json:"totalProfit"`
	Quantity      float64    `gorm:"type:decimal(18,4)" json:"quantity"`
	CostPrice     float64    `gorm:"type:decimal(18,4)" json:"costPrice"`
	CurrentPrice  float64    `gorm:"type:decimal(18,4)" json:"currentPrice"`
	Platform      string     `gorm:"size:50" json:"platform"`
	StartDate     *time.Time `json:"startDate"`
	EndDate       *time.Time `json:"endDate"`
	InterestRate  float64    `gorm:"type:decimal(8,4)" json:"interestRate"`
	LastUpdatedAt *time.Time `json:"lastUpdatedAt"`
	ReminderDays  int        `gorm:"default:7" json:"reminderDays"`
	Status        int        `gorm:"default:1" json:"status"`
	Note          string     `gorm:"size:500" json:"note"`
	CreatedAt     time.Time  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Investment) TableName() string {
	return "biz_investment"
}

// InvestRecord 理财记录表
type InvestRecord struct {
	RecordId     int64     `gorm:"primaryKey;autoIncrement" json:"recordId"`
	InvestmentId int64     `gorm:"not null;index" json:"investmentId"`
	Type         string    `gorm:"size:20;not null" json:"type"`
	Amount       float64   `gorm:"type:decimal(18,2);not null" json:"amount"`
	Price        float64   `gorm:"type:decimal(18,4)" json:"price"`
	Quantity     float64   `gorm:"type:decimal(18,4)" json:"quantity"`
	RecordedAt   time.Time `gorm:"not null" json:"recordedAt"`
	Note         string    `gorm:"size:500" json:"note"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (InvestRecord) TableName() string {
	return "biz_invest_record"
}

// Notification 通知表
type Notification struct {
	NotificationId int64     `gorm:"primaryKey;autoIncrement" json:"notificationId"`
	UserId         int64     `gorm:"not null;index" json:"userId"`
	Type           string    `gorm:"size:50;not null" json:"type"`
	Title          string    `gorm:"size:100;not null" json:"title"`
	Content        string    `gorm:"size:500;not null" json:"content"`
	Data           string    `gorm:"type:json" json:"data"`
	IsRead         int       `gorm:"default:0" json:"isRead"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"createdAt"`
}

func (Notification) TableName() string {
	return "biz_notification"
}

// PushConfig 推送配置表
type PushConfig struct {
	ConfigId           int64     `gorm:"primaryKey;autoIncrement" json:"configId"`
	EnterpriseId       int64     `gorm:"not null;index" json:"enterpriseId"`
	Type               string    `gorm:"size:20;not null" json:"type"`
	Target             string    `gorm:"size:100;not null" json:"target"`
	Enabled            int       `gorm:"default:1" json:"enabled"`
	PushTime           string    `gorm:"size:10;default:20:00" json:"pushTime"`
	Frequency          string    `gorm:"size:20;default:daily" json:"frequency"`
	DailyReportEnabled int       `gorm:"default:1" json:"dailyReportEnabled"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (PushConfig) TableName() string {
	return "biz_push_config"
}

// PushLog 推送记录表
type PushLog struct {
	LogId        int64      `gorm:"primaryKey;autoIncrement" json:"logId"`
	EnterpriseId int64      `gorm:"not null;index" json:"enterpriseId"`
	ConfigId     int64      `gorm:"not null;index" json:"configId"`
	Type         string     `gorm:"size:20;not null" json:"type"`
	Content      string     `gorm:"type:text" json:"content"`
	Status       string     `gorm:"size:20;not null" json:"status"`
	ErrorMessage string     `gorm:"size:500" json:"errorMessage"`
	SentAt       *time.Time `json:"sentAt"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"createdAt"`
}

func (PushLog) TableName() string {
	return "biz_push_log"
}
