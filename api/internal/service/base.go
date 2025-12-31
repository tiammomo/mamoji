package service

import (
	"strings"

	"mamoji/api/internal/database"
)

// Interface 定义数据库模型接口
type Interface interface {
	TableName() string
}

// Service structs - 服务结构定义
type AccountService struct{}
type AuthService struct{}
type TransactionService struct{}
type BudgetService struct{}
type InvestmentService struct{}
type ReportService struct{}
type SystemSettingsService struct{}

// Service instances - 服务实例导出供外部使用
var (
	AccountServiceInst     = &AccountService{}
	AuthServiceInst        = &AuthService{}
	TransactionServiceInst = &TransactionService{}
	BudgetServiceInst      = &BudgetService{}
	InvestmentServiceInst  = &InvestmentService{}
	ReportServiceInst      = &ReportService{}
	SystemSettingsServiceInst = &SystemSettingsService{}
)

// init 函数确保所有服务实例被引用
func init() {
	_ = AccountServiceInst
	_ = AuthServiceInst
	_ = TransactionServiceInst
	_ = BudgetServiceInst
	_ = InvestmentServiceInst
	_ = ReportServiceInst
	_ = SystemSettingsServiceInst
}

// ===== Helper functions =====

// parseJSONArray 解析JSON数组字符串为[]string
func parseJSONArray(jsonStr string) []string {
	if jsonStr == "" || jsonStr == "[]" {
		return []string{}
	}
	// 简单解析，去掉首尾的[]，按逗号分割
	jsonStr = strings.TrimPrefix(jsonStr, "[")
	jsonStr = strings.TrimSuffix(jsonStr, "]")
	// 处理引号
	items := strings.Split(jsonStr, ",")
	result := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		item = strings.Trim(item, `"`)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}

// Save 保存实体
func Save(entity Interface) error {
	return database.DB.Save(entity).Error
}

// FindAll 查询所有记录
func FindAll(model Interface, dest interface{}) error {
	return database.DB.Find(dest).Error
}

// FindOne 查询单条记录
func FindOne(model Interface, dest interface{}, conds ...interface{}) error {
	return database.DB.First(dest, conds...).Error
}

// Delete 删除记录
func Delete(model Interface, conds ...interface{}) error {
	return database.DB.Delete(model, conds...).Error
}

// TableName implementations for legacy types
func (User) TableName() string             { return "sys_user" }
func (UserToken) TableName() string        { return "sys_user_token" }
func (Enterprise) TableName() string       { return "biz_enterprise" }
func (EnterpriseMember) TableName() string { return "biz_enterprise_member" }
func (AccountingUnit) TableName() string   { return "biz_accounting_unit" }
func (UnitPermission) TableName() string   { return "biz_unit_permission" }
func (Account) TableName() string          { return "biz_account" }
func (AccountFlow) TableName() string      { return "biz_account_flows" }
func (Transaction) TableName() string      { return "biz_transaction" }
func (Budget) TableName() string           { return "biz_budget" }
func (BudgetApproval) TableName() string   { return "biz_budget_approval" }
func (Investment) TableName() string       { return "biz_investment" }
func (InvestRecord) TableName() string     { return "biz_invest_record" }
func (Notification) TableName() string     { return "biz_notification" }
func (PushConfig) TableName() string       { return "biz_push_config" }
func (PushLog) TableName() string          { return "biz_push_log" }

// Legacy type definitions - 遗留类型定义（供迁移使用）
type User struct{}
type UserToken struct{}
type Enterprise struct{}
type EnterpriseMember struct{}
type AccountingUnit struct{}
type UnitPermission struct{}
type Account struct{}
type AccountFlow struct{}
type Transaction struct{}
type Budget struct{}
type BudgetApproval struct{}
type Investment struct{}
type InvestRecord struct{}
type Notification struct{}
type PushConfig struct{}
type PushLog struct{}
