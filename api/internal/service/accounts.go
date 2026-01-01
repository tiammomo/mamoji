package service

import (
	"errors"
	"time"

	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// 银行卡子类型
const FUND_SUB_TYPE_BANK = "bank"

// ===== AssetService =====

// List 获取资产账户列表
func (s *AccountService) List(enterpriseId, unitId int64) ([]dto.AccountResponse, error) {
	var accounts []entity.Account
	query := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId)
	if unitId > 0 {
		query = query.Where("unit_id = ?", unitId)
	}
	if err := query.Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, errors.New("查询资产账户失败")
	}

	response := make([]dto.AccountResponse, 0, len(accounts))
	for _, acc := range accounts {
		response = append(response, dto.AccountResponse{
			AccountId:          acc.AccountId,
			EnterpriseId:       acc.EnterpriseId,
			UnitId:             acc.UnitId,
			AssetCategory:      acc.AssetCategory,
			SubType:            acc.SubType,
			Name:               acc.Name,
			Currency:           acc.Currency,
			AccountNo:          acc.AccountNo,
			BankName:           acc.BankName,
			BankCardType:       acc.BankCardType,
			CreditLimit:        acc.CreditLimit,
			OutstandingBalance: acc.OutstandingBalance,
			BillingDate:        acc.BillingDate,
			RepaymentDate:      acc.RepaymentDate,
			AvailableBalance:   acc.AvailableBalance,
			InvestedAmount:     acc.InvestedAmount,
			TotalValue:         acc.TotalValue,
			IncludeInTotal:     acc.IncludeInTotal,
			Status:             acc.Status,
			CreatedAt:          acc.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return response, nil
}

// GetById 获取单个资产账户
func (s *AccountService) GetById(accountId int64) (*dto.AccountResponse, error) {
	var account entity.Account
	if err := database.DB.Where("account_id = ? AND status = 1", accountId).First(&account).Error; err != nil {
		return nil, errors.New("资产账户不存在或已被删除")
	}

	return &dto.AccountResponse{
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
	}, nil
}

// Create 创建资产账户
func (s *AccountService) Create(req dto.CreateAccountRequest) (*dto.AccountResponse, error) {
	// 验证：银行卡类型必须填写开户行信息
	if req.AssetCategory == "fund" && req.SubType == FUND_SUB_TYPE_BANK {
		if req.BankName == "" {
			return nil, errors.New("银行卡类型必须填写开户银行信息")
		}
	}

	// 获取或创建默认记账单元
	unitId := req.UnitId
	if unitId == 0 {
		var unit entity.AccountingUnit
		database.DB.Where("enterprise_id = ? AND status = 1", req.EnterpriseId).First(&unit)
		if unit.UnitId == 0 {
			defaultUnit := &entity.AccountingUnit{
				EnterpriseId: req.EnterpriseId,
				Name:         "默认单元",
				Type:         "main",
				Level:        1,
				Status:       1,
			}
			if err := database.DB.Create(defaultUnit).Error; err != nil {
				return nil, errors.New("创建默认单元失败")
			}
			unitId = defaultUnit.UnitId
		} else {
			unitId = unit.UnitId
		}
	}

	// 计算总价值（投资理财类需要根据可用和投资金额计算）
	totalValue := req.AvailableBalance + req.InvestedAmount
	if req.TotalValue > 0 {
		totalValue = req.TotalValue
	}

	// 设置币种默认值
	currency := req.Currency
	if currency == "" {
		currency = "CNY"
	}

	// 设置是否计入总资产默认值
	includeInTotal := req.IncludeInTotal
	if includeInTotal == 0 {
		includeInTotal = 1 // 默认计入总资产
	}

	account := &entity.Account{
		EnterpriseId:       req.EnterpriseId,
		UnitId:             unitId,
		AssetCategory:      req.AssetCategory,
		SubType:            req.SubType,
		Name:               req.Name,
		Currency:           currency,
		AccountNo:          req.AccountNo,
		BankName:           req.BankName,
		BankCardType:       req.BankCardType,
		CreditLimit:        req.CreditLimit,
		OutstandingBalance: req.OutstandingBalance,
		BillingDate:        req.BillingDate,
		RepaymentDate:      req.RepaymentDate,
		AvailableBalance:   req.AvailableBalance,
		InvestedAmount:     req.InvestedAmount,
		TotalValue:         totalValue,
		IncludeInTotal:     includeInTotal,
		Status:             1,
	}

	if err := database.DB.Create(account).Error; err != nil {
		return nil, errors.New("创建资产账户失败")
	}

	return &dto.AccountResponse{
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
	}, nil
}

// Update 更新资产账户
func (s *AccountService) Update(accountId int64, req dto.UpdateAccountRequest) (*dto.AccountResponse, error) {
	var account entity.Account
	if err := database.DB.First(&account, accountId).Error; err != nil {
		return nil, errors.New("资产账户不存在")
	}

	// 验证：如果更新为银行卡类型且原类型不是银行卡，必须填写开户行信息
	newCategory := req.AssetCategory
	newSubType := req.SubType
	if newCategory == "" {
		newCategory = account.AssetCategory
	}
	if newSubType == "" {
		newSubType = account.SubType
	}

	// 如果是银行卡类型且原开户行为空，则必须填写
	if newCategory == "fund" && newSubType == FUND_SUB_TYPE_BANK {
		if account.BankName == "" && req.BankName == "" {
			return nil, errors.New("银行卡类型必须填写开户银行信息")
		}
	}

	updates := make(map[string]interface{})
	if req.AssetCategory != "" {
		updates["asset_category"] = req.AssetCategory
	}
	if req.SubType != "" {
		updates["sub_type"] = req.SubType
	}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.AccountNo != "" {
		updates["account_no"] = req.AccountNo
	}
	if req.BankName != "" {
		updates["bank_name"] = req.BankName
	}
	if req.BankCardType != "" {
		updates["bank_card_type"] = req.BankCardType
	}
	// 只有在明确传入数值时才更新余额
	if req.AvailableBalance > 0 || req.AvailableBalance == 0 {
		updates["available_balance"] = req.AvailableBalance
	}
	if req.InvestedAmount > 0 || req.InvestedAmount == 0 {
		updates["invested_amount"] = req.InvestedAmount
	}
	if req.TotalValue > 0 || req.TotalValue == 0 {
		updates["total_value"] = req.TotalValue
	} else if req.AvailableBalance > 0 || req.InvestedAmount > 0 {
		// 如果没有显式设置TotalValue，根据可用和投资金额计算
		updates["total_value"] = req.AvailableBalance + req.InvestedAmount
	}
	if req.CreditLimit > 0 || req.CreditLimit == 0 {
		updates["credit_limit"] = req.CreditLimit
	}
	if req.OutstandingBalance > 0 || req.OutstandingBalance == 0 {
		updates["outstanding_balance"] = req.OutstandingBalance
	}
	if req.BillingDate > 0 {
		updates["billing_date"] = req.BillingDate
	}
	if req.RepaymentDate > 0 {
		updates["repayment_date"] = req.RepaymentDate
	}
	if req.IncludeInTotal != 0 {
		updates["include_in_total"] = req.IncludeInTotal
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&account).Updates(updates).Error; err != nil {
			return nil, errors.New("更新资产账户失败")
		}
	}

	return s.GetById(accountId)
}

// Delete 删除资产账户
func (s *AccountService) Delete(accountId int64) error {
	var account entity.Account
	if err := database.DB.First(&account, accountId).Error; err != nil {
		return errors.New("资产账户不存在")
	}

	if err := database.DB.Model(&account).Update("status", 0).Error; err != nil {
		return errors.New("删除资产账户失败")
	}

	return nil
}

// GetSummary 获取资产账户汇总（包含环比数据）
// 注意：总资产计算只计入 include_in_total = 1 的账户
func (s *AccountService) GetSummary(enterpriseId int64) (*dto.AccountSummaryResponse, error) {
	// 获取所有有效账户
	var accounts []entity.Account
	if err := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).Find(&accounts).Error; err != nil {
		return nil, errors.New("查询资产账户失败")
	}

	// 计算当前总价值（只计入 include_in_total = 1 的账户）
	var totalAvailable, totalInvested, totalValue float64
	for _, acc := range accounts {
		if acc.IncludeInTotal == 1 {
			totalAvailable += acc.AvailableBalance
			totalInvested += acc.InvestedAmount
			totalValue += acc.TotalValue
		}
	}

	// 计算上月的起止时间
	now := time.Now()
	lastMonthStart := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())
	lastMonthEnd := lastMonthStart.AddDate(0, 1, 0).Add(-time.Second)

	// 使用单次查询获取上月收支数据
	var lastMonthIncome, lastMonthExpense float64
	var txCount int64

	type MonthStats struct {
		Income  float64
		Expense float64
		TxCount int64
	}
	var stats MonthStats
	database.DB.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
			COUNT(*) as tx_count
		FROM biz_transaction
		WHERE enterprise_id = ? AND status = 1 AND occurred_at >= ? AND occurred_at <= ?
	`, enterpriseId, lastMonthStart, lastMonthEnd).Scan(&stats)

	lastMonthIncome = stats.Income
	lastMonthExpense = stats.Expense
	txCount = stats.TxCount

	// 使用TotalValue作为总余额，如果没有则计算
	totalBalance := totalValue
	if totalBalance == 0 {
		totalBalance = totalAvailable + totalInvested
	}

	// 上月初始余额 = 当月余额 - 当月收入 + 当月支出
	lastMonthBalance := totalBalance - lastMonthIncome + lastMonthExpense
	lastMonthAvailable := totalAvailable - lastMonthIncome + lastMonthExpense
	lastMonthInvested := totalInvested

	// 计算环比变化率
	var balanceMoM, availableMoM, investedMoM float64
	if lastMonthBalance > 0 {
		balanceMoM = ((totalBalance - lastMonthBalance) / lastMonthBalance) * 100
	}
	if lastMonthAvailable > 0 {
		availableMoM = ((totalAvailable - lastMonthAvailable) / lastMonthAvailable) * 100
	}
	if lastMonthInvested > 0 {
		investedMoM = ((totalInvested - lastMonthInvested) / lastMonthInvested) * 100
	}

	return &dto.AccountSummaryResponse{
		TotalBalance:       totalBalance,
		TotalAvailable:     totalAvailable,
		TotalInvested:      totalInvested,
		AccountCount:       len(accounts),
		LastMonthBalance:   lastMonthBalance,
		LastMonthAvailable: lastMonthAvailable,
		LastMonthInvested:  lastMonthInvested,
		BalanceMoM:         balanceMoM,
		AvailableMoM:       availableMoM,
		InvestedMoM:        investedMoM,
		HasHistory:         txCount > 0,
	}, nil
}

// ListFlows 获取账户流水
func (s *AccountService) ListFlows(accountId int64) ([]interface{}, error) {
	return nil, nil
}
