package mapper

import (
	"strings"
	"time"

	"mamoji/api/internal/application/dto/request"
	"mamoji/api/internal/application/dto/response"
	"mamoji/api/internal/model/entity"
)

// 银行编码映射
var bankCodeMap = map[string]string{
	"icbc":   "中国工商银行",
	"abc":    "中国农业银行",
	"boc":    "中国银行",
	"ccb":    "中国建设银行",
	"cmb":    "招商银行",
	"psbc":   "中国邮政储蓄银行",
	"citic":  "中信银行",
	"cib":    "兴业银行",
	"cmbc":   "民生银行",
	"spdb":   "浦发银行",
	"gdb":    "广发银行",
	"pab":    "平安银行",
	"bofc":   "中国光大银行",
	"hxb":    "华夏银行",
	"bob":    "北京银行",
	"shbank": "上海银行",
	"other":  "其他银行",
}

// AccountMapper 账户 DTO 映射器
type AccountMapper struct{}

// NewAccountMapper 创建账户映射器
func NewAccountMapper() *AccountMapper {
	return &AccountMapper{}
}

// ToEntity 请求转实体
func (m *AccountMapper) ToEntity(req *request.CreateAccountRequest) *entity.Account {
	now := time.Now()

	// 确定银行名称：储蓄卡使用BankName，银行信用卡根据BankCode获取银行名称
	bankName := req.BankName
	if req.AssetCategory == "credit" && req.SubType == "bank_card" && req.BankCode != "" {
		if name, ok := bankCodeMap[req.BankCode]; ok {
			bankName = name
		}
	}

	return &entity.Account{
		EnterpriseId:       req.EnterpriseId,
		UnitId:             req.UnitId,
		AssetCategory:      req.AssetCategory,
		SubType:            req.SubType,
		Name:               req.Name,
		Currency:           m.defaultString(req.Currency, "CNY"),
		AccountNo:          req.AccountNo,
		BankName:           bankName,
		BankCardType:       req.BankCardType,
		CreditLimit:        req.CreditLimit,
		OutstandingBalance: req.OutstandingBalance,
		BillingDate:        req.BillingDate,
		RepaymentDate:      req.RepaymentDate,
		AvailableBalance:   req.AvailableBalance,
		InvestedAmount:     req.InvestedAmount,
		TotalValue:         m.calculateTotalValue(req),
		IncludeInTotal:     m.defaultInt(req.IncludeInTotal, 1),
		Status:             1,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
}

// ToResponse 实体转响应
func (m *AccountMapper) ToResponse(account *entity.Account) *response.AccountResponse {
	return &response.AccountResponse{
		AccountId:          account.AccountId,
		EnterpriseId:       account.EnterpriseId,
		UnitId:             account.UnitId,
		AssetCategory:      account.AssetCategory,
		SubType:            account.SubType,
		Name:               account.Name,
		Currency:           account.Currency,
		AccountNo:          account.AccountNo,
		BankName:           account.BankName,
		BankCardType:       account.BankCardType,
		CreditLimit:        account.CreditLimit,
		OutstandingBalance: account.OutstandingBalance,
		BillingDate:        account.BillingDate,
		RepaymentDate:      account.RepaymentDate,
		AvailableBalance:   account.AvailableBalance,
		InvestedAmount:     account.InvestedAmount,
		TotalValue:         account.TotalValue,
		IncludeInTotal:     account.IncludeInTotal,
		Status:             account.Status,
		CreatedAt:          account.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ToResponses 批量转换
func (m *AccountMapper) ToResponses(accounts []*entity.Account) []*response.AccountResponse {
	result := make([]*response.AccountResponse, len(accounts))
	for i, account := range accounts {
		result[i] = m.ToResponse(account)
	}
	return result
}

// ApplyUpdate 应用更新
func (m *AccountMapper) ApplyUpdate(account *entity.Account, req *request.UpdateAccountRequest) {
	if req.UnitId != nil {
		account.UnitId = *req.UnitId
	}
	if req.AssetCategory != nil {
		account.AssetCategory = *req.AssetCategory
	}
	if req.SubType != nil {
		account.SubType = *req.SubType
	}
	if req.Name != nil {
		account.Name = *req.Name
	}
	if req.Currency != nil {
		account.Currency = *req.Currency
	}
	if req.AccountNo != nil {
		account.AccountNo = *req.AccountNo
	}
	if req.BankName != nil {
		account.BankName = *req.BankName
	}
	if req.BankCardType != nil {
		account.BankCardType = *req.BankCardType
	}
	if req.CreditLimit != nil {
		account.CreditLimit = *req.CreditLimit
	}
	if req.OutstandingBalance != nil {
		account.OutstandingBalance = *req.OutstandingBalance
	}
	if req.BillingDate != nil {
		account.BillingDate = *req.BillingDate
	}
	if req.RepaymentDate != nil {
		account.RepaymentDate = *req.RepaymentDate
	}
	if req.AvailableBalance != nil {
		account.AvailableBalance = *req.AvailableBalance
	}
	if req.InvestedAmount != nil {
		account.InvestedAmount = *req.InvestedAmount
	}
	if req.TotalValue != nil {
		account.TotalValue = *req.TotalValue
	} else if req.AvailableBalance != nil || req.InvestedAmount != nil {
		account.TotalValue = account.AvailableBalance + account.InvestedAmount
	}
	if req.IncludeInTotal != nil {
		account.IncludeInTotal = *req.IncludeInTotal
	}
	if req.Status != nil {
		account.Status = *req.Status
	}
	account.UpdatedAt = time.Now()
}

func (m *AccountMapper) defaultString(s, defaultVal string) string {
	if s == "" {
		return defaultVal
	}
	return s
}

func (m *AccountMapper) defaultInt(v, defaultVal int) int {
	if v == 0 {
		return defaultVal
	}
	return v
}

func (m *AccountMapper) calculateTotalValue(req *request.CreateAccountRequest) float64 {
	if req.TotalValue > 0 {
		return req.TotalValue
	}
	return req.AvailableBalance + req.InvestedAmount
}

// TransactionMapper 交易 DTO 映射器
type TransactionMapper struct{}

// NewTransactionMapper 创建交易映射器
func NewTransactionMapper() *TransactionMapper {
	return &TransactionMapper{}
}

// ToEntity 请求转实体
func (m *TransactionMapper) ToEntity(req *request.CreateTransactionRequest) (*entity.Transaction, error) {
	occurredAt, err := time.Parse("2006-01-02 15:04:05", req.OccurredAt)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	tags := ""
	if len(req.Tags) > 0 {
		tags = strings.Join(req.Tags, ",")
	}
	return &entity.Transaction{
		EnterpriseId: req.EnterpriseId,
		UnitId:       req.UnitId,
		UserId:       req.UserId,
		Type:         req.Type,
		Category:     req.Category,
		Amount:       req.Amount,
		AccountId:    req.AccountId,
		BudgetId:     req.BudgetId,
		OccurredAt:   occurredAt,
		Tags:         tags,
		Note:         req.Note,
		Status:       1,
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// ToResponse 实体转响应
func (m *TransactionMapper) ToResponse(tx *entity.Transaction) *response.TransactionResponse {
	var tags []string
	if tx.Tags != "" {
		tags = strings.Split(tx.Tags, ",")
	}
	return &response.TransactionResponse{
		TransactionId: tx.TransactionId,
		EnterpriseId:  tx.EnterpriseId,
		UnitId:        tx.UnitId,
		UserId:        tx.UserId,
		Type:          tx.Type,
		Category:      tx.Category,
		Amount:        tx.Amount,
		AccountId:     tx.AccountId,
		BudgetId:      tx.BudgetId,
		OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
		Tags:          tags,
		Note:          tx.Note,
		Status:        tx.Status,
		CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:     tx.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ToResponses 批量转换
func (m *TransactionMapper) ToResponses(txs []*entity.Transaction) []*response.TransactionResponse {
	result := make([]*response.TransactionResponse, len(txs))
	for i, tx := range txs {
		result[i] = m.ToResponse(tx)
	}
	return result
}

// BudgetMapper 预算 DTO 映射器
type BudgetMapper struct{}

// NewBudgetMapper 创建预算映射器
func NewBudgetMapper() *BudgetMapper {
	return &BudgetMapper{}
}

// ToEntity 请求转实体
func (m *BudgetMapper) ToEntity(req *request.CreateBudgetRequest) (*entity.Budget, error) {
	periodStart, err := time.Parse("2006-01-02", req.PeriodStart)
	if err != nil {
		return nil, err
	}
	periodEnd, err := time.Parse("2006-01-02", req.PeriodEnd)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	return &entity.Budget{
		EnterpriseId: req.EnterpriseId,
		UnitId:       req.UnitId,
		Name:         req.Name,
		Type:         req.Type,
		Category:     req.Category,
		TotalAmount:  req.TotalAmount,
		UsedAmount:   0,
		PeriodStart:  periodStart,
		PeriodEnd:    periodEnd,
		Status:       "active",
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// ToResponse 实体转响应
func (m *BudgetMapper) ToResponse(budget *entity.Budget) *response.BudgetResponse {
	return &response.BudgetResponse{
		BudgetId:     budget.BudgetId,
		EnterpriseId: budget.EnterpriseId,
		UnitId:       budget.UnitId,
		Name:         budget.Name,
		Type:         budget.Type,
		Category:     budget.Category,
		TotalAmount:  budget.TotalAmount,
		UsedAmount:   budget.UsedAmount,
		PeriodStart:  budget.PeriodStart.Format("2006-01-02"),
		PeriodEnd:    budget.PeriodEnd.Format("2006-01-02"),
		Status:       budget.Status,
		CreatedAt:    budget.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ToResponses 批量转换
func (m *BudgetMapper) ToResponses(budgets []*entity.Budget) []*response.BudgetResponse {
	result := make([]*response.BudgetResponse, len(budgets))
	for i, budget := range budgets {
		result[i] = m.ToResponse(budget)
	}
	return result
}

// ToDetailResponse 转换为详情响应
func (m *BudgetMapper) ToDetailResponse(budget *entity.Budget, transactions []*entity.Transaction) *response.BudgetDetailResponse {
	resp := &response.BudgetDetailResponse{
		BudgetResponse:  *m.ToResponse(budget),
		UsedAmount:      budget.UsedAmount,
		RemainingAmount: budget.TotalAmount - budget.UsedAmount,
		UsagePercent:    0,
	}
	if budget.TotalAmount > 0 {
		resp.UsagePercent = (budget.UsedAmount / budget.TotalAmount) * 100
	}
	if len(transactions) > 0 {
		txMapper := NewTransactionMapper()
		resp.Transactions = txMapper.ToResponses(transactions)
	}
	return resp
}
