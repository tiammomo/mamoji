package service

import (
	"errors"
	"time"

	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// ===== AccountService =====

// List 获取账户列表
func (s *AccountService) List(enterpriseId, unitId int64) ([]dto.AccountResponse, error) {
	var accounts []entity.Account
	query := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId)
	if unitId > 0 {
		query = query.Where("unit_id = ?", unitId)
	}
	if err := query.Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, errors.New("查询账户失败")
	}

	response := make([]dto.AccountResponse, 0, len(accounts))
	for _, acc := range accounts {
		response = append(response, dto.AccountResponse{
			AccountId:        acc.AccountId,
			EnterpriseId:     acc.EnterpriseId,
			UnitId:           acc.UnitId,
			Type:             acc.Type,
			Name:             acc.Name,
			AccountNo:        acc.AccountNo,
			BankCardType:     acc.BankCardType,
			AvailableBalance: acc.AvailableBalance,
			InvestedAmount:   acc.InvestedAmount,
			Status:           acc.Status,
			CreatedAt:        acc.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return response, nil
}

// GetById 获取单个账户
func (s *AccountService) GetById(accountId int64) (*dto.AccountResponse, error) {
	var account entity.Account
	if err := database.DB.Where("account_id = ? AND status = 1", accountId).First(&account).Error; err != nil {
		return nil, errors.New("账户不存在或已被删除")
	}

	return &dto.AccountResponse{
		AccountId:        account.AccountId,
		EnterpriseId:     account.EnterpriseId,
		UnitId:           account.UnitId,
		Type:             account.Type,
		Name:             account.Name,
		AccountNo:        account.AccountNo,
		BankCardType:     account.BankCardType,
		AvailableBalance: account.AvailableBalance,
		InvestedAmount:   account.InvestedAmount,
		Status:           account.Status,
		CreatedAt:        account.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

// Create 创建账户
func (s *AccountService) Create(req dto.CreateAccountRequest) (*dto.AccountResponse, error) {
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

	account := &entity.Account{
		EnterpriseId:     req.EnterpriseId,
		UnitId:           unitId,
		Type:             req.Type,
		Name:             req.Name,
		AccountNo:        req.AccountNo,
		BankCardType:     req.BankCardType,
		AvailableBalance: req.AvailableBalance,
		InvestedAmount:   req.InvestedAmount,
		Status:           1,
	}

	if err := database.DB.Create(account).Error; err != nil {
		return nil, errors.New("创建账户失败")
	}

	return &dto.AccountResponse{
		AccountId:        account.AccountId,
		EnterpriseId:     account.EnterpriseId,
		UnitId:           account.UnitId,
		Type:             account.Type,
		Name:             account.Name,
		AccountNo:        account.AccountNo,
		BankCardType:     account.BankCardType,
		AvailableBalance: account.AvailableBalance,
		InvestedAmount:   account.InvestedAmount,
		Status:           account.Status,
		CreatedAt:        account.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

// Update 更新账户
func (s *AccountService) Update(accountId int64, req dto.UpdateAccountRequest) (*dto.AccountResponse, error) {
	var account entity.Account
	if err := database.DB.First(&account, accountId).Error; err != nil {
		return nil, errors.New("账户不存在")
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.AccountNo != "" {
		updates["account_no"] = req.AccountNo
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
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&account).Updates(updates).Error; err != nil {
			return nil, errors.New("更新账户失败")
		}
	}

	return s.GetById(accountId)
}

// Delete 删除账户
func (s *AccountService) Delete(accountId int64) error {
	var account entity.Account
	if err := database.DB.First(&account, accountId).Error; err != nil {
		return errors.New("账户不存在")
	}

	if err := database.DB.Model(&account).Update("status", 0).Error; err != nil {
		return errors.New("删除账户失败")
	}

	return nil
}

// GetSummary 获取账户汇总（包含环比数据）
func (s *AccountService) GetSummary(enterpriseId int64) (*dto.AccountSummaryResponse, error) {
	// 获取所有有效账户
	var accounts []entity.Account
	if err := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).Find(&accounts).Error; err != nil {
		return nil, errors.New("查询账户失败")
	}

	// 计算当前总余额
	var totalAvailable, totalInvested float64
	for _, acc := range accounts {
		totalAvailable += acc.AvailableBalance
		totalInvested += acc.InvestedAmount
	}
	totalBalance := totalAvailable + totalInvested

	// 计算上月的起止时间
	now := time.Now()
	lastMonthStart := time.Date(now.Year(), now.Month()-1, 1, 0, 0, 0, 0, now.Location())
	lastMonthEnd := lastMonthStart.AddDate(0, 1, 0).Add(-time.Second)

	// 使用单次查询获取上月收支数据
	var lastMonthIncome, lastMonthExpense float64
	var txCount int64

	// 使用 Raw SQL 进行优化查询
	type MonthStats struct {
		Income   float64
		Expense  float64
		TxCount  int64
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
