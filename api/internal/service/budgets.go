package service

import (
	"errors"
	"fmt"
	"time"

	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// ===== BudgetService =====

// List 获取预算列表
func (s *BudgetService) List(req dto.ListBudgetRequest) ([]dto.BudgetResponse, error) {
	var budgets []entity.Budget

	// 构建查询条件
	db := database.DB.Where("enterprise_id = ? AND status = 'active'", req.EnterpriseId)

	// 如果指定了时间范围，只返回与该时间范围有交集的预算
	// 即：预算的 period_start <= endDate 且预算的 period_end >= startDate
	// 使用 DATE 函数直接比较日期，避免时区问题
	if req.StartDate != "" || req.EndDate != "" {
		// 如果有有效的时间范围，添加筛选条件
		// 使用 DATE() 函数直接比较日期字符串
		if req.StartDate != "" {
			db = db.Where("DATE(period_end) >= ?", req.StartDate)
		}
		if req.EndDate != "" {
			db = db.Where("DATE(period_start) <= ?", req.EndDate)
		}
	}

	// 执行查询
	if err := db.Order("created_at DESC").Find(&budgets).Error; err != nil {
		return nil, errors.New("查询预算列表失败")
	}

	result := make([]dto.BudgetResponse, 0, len(budgets))
	for _, b := range budgets {
		// 根据关联的交易记录计算实际使用的金额（兼容旧数据）
		var actualUsedAmount float64
		// 使用聚合查询替代循环查询，提升性能
		database.DB.Model(&entity.Transaction{}).
			Where("budget_id = ? AND type = ? AND status = 1", b.BudgetId, "expense").
			Select("COALESCE(SUM(amount), 0)").
			Scan(&actualUsedAmount)
		// 如果实际使用金额与数据库中的不一致，更新数据库
		if actualUsedAmount != b.UsedAmount {
			fmt.Printf("[预算列表] 修正 usedAmount: %.2f -> %.2f (budgetId=%d)\n", b.UsedAmount, actualUsedAmount, b.BudgetId)
			database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", actualUsedAmount, b.BudgetId)
			b.UsedAmount = actualUsedAmount
		}

		// 计算使用百分比
		var usagePercent float64
		if b.TotalAmount > 0 {
			usagePercent = (b.UsedAmount / b.TotalAmount) * 100
		}
		result = append(result, dto.BudgetResponse{
			BudgetId:     b.BudgetId,
			EnterpriseId: b.EnterpriseId,
			UnitId:       b.UnitId,
			Name:         b.Name,
			Type:         b.Type,
			Category:     b.Category,
			TotalAmount:  b.TotalAmount,
			UsedAmount:   b.UsedAmount,
			PeriodStart:  b.PeriodStart.Format("2006-01-02"),
			PeriodEnd:    b.PeriodEnd.Format("2006-01-02"),
			Status:       b.Status,
			UsagePercent: usagePercent,
			CreatedAt:    b.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, nil
}

// GetById 获取单个预算
func (s *BudgetService) GetById(budgetId int64) (*dto.BudgetResponse, error) {
	var budget entity.Budget
	// 过滤软删除的数据
	if err := database.DB.Where("budget_id = ? AND status = 'active'", budgetId).First(&budget).Error; err != nil {
		return nil, errors.New("预算不存在或已被删除")
	}
	return &dto.BudgetResponse{
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
	}, nil
}

// Create 创建预算
func (s *BudgetService) Create(enterpriseId int64, req dto.CreateBudgetRequest) (*dto.BudgetResponse, error) {
	// 获取或创建默认记账单元
	unitId := req.UnitId
	if unitId == 0 {
		var unit entity.AccountingUnit
		database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).First(&unit)
		if unit.UnitId == 0 {
			defaultUnit := &entity.AccountingUnit{
				EnterpriseId: enterpriseId,
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

	// 解析日期
	var periodStart, periodEnd time.Time
	formats := []string{"2006-01-02", "2006-01-02 15:04:05", "2006/01/02"}
	for _, format := range formats {
		if t, err := time.Parse(format, req.PeriodStart); err == nil {
			periodStart = t
			break
		}
	}
	for _, format := range formats {
		if t, err := time.Parse(format, req.PeriodEnd); err == nil {
			periodEnd = t
			break
		}
	}
	if periodStart.IsZero() {
		periodStart = time.Now()
	}
	if periodEnd.IsZero() {
		periodEnd = time.Now()
	}

	// 验证金额
	if req.TotalAmount <= 0 {
		return nil, errors.New("预算金额必须大于0")
	}

	budget := &entity.Budget{
		EnterpriseId: enterpriseId,
		UnitId:       unitId,
		Name:         req.Name,
		Type:         req.Type,
		Category:     req.Category,
		TotalAmount:  req.TotalAmount,
		UsedAmount:   0,
		PeriodStart:  periodStart,
		PeriodEnd:    periodEnd,
		Status:       "active",
	}

	if err := database.DB.Create(budget).Error; err != nil {
		return nil, errors.New("创建预算失败")
	}

	return &dto.BudgetResponse{
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
	}, nil
}

// Update 更新预算
func (s *BudgetService) Update(budgetId int64, req dto.UpdateBudgetRequest) (*dto.BudgetResponse, error) {
	var budget entity.Budget
	if err := database.DB.First(&budget, budgetId).Error; err != nil {
		return nil, errors.New("预算不存在")
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.TotalAmount > 0 {
		// 检查新金额是否小于已使用金额
		if req.TotalAmount < budget.UsedAmount {
			return nil, errors.New("预算金额不能小于已使用金额")
		}
		updates["total_amount"] = req.TotalAmount
	}
	if req.PeriodStart != "" {
		if t, err := time.Parse("2006-01-02", req.PeriodStart); err == nil {
			updates["period_start"] = t
		}
	}
	if req.PeriodEnd != "" {
		if t, err := time.Parse("2006-01-02", req.PeriodEnd); err == nil {
			updates["period_end"] = t
		}
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&budget).Updates(updates).Error; err != nil {
			return nil, errors.New("更新预算失败")
		}
	}

	// 重新加载
	database.DB.First(&budget, budgetId)

	return &dto.BudgetResponse{
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
	}, nil
}

// Delete 删除预算
func (s *BudgetService) Delete(budgetId int64) error {
	var budget entity.Budget
	if err := database.DB.First(&budget, budgetId).Error; err != nil {
		return errors.New("预算不存在")
	}

	// 软删除 - 更新状态
	if err := database.DB.Model(&budget).Update("status", "ended").Error; err != nil {
		return errors.New("删除预算失败")
	}

	return nil
}

// GetDetailWithTransactions 获取预算详情及关联的交易记录
func (s *BudgetService) GetDetailWithTransactions(budgetId int64) (*dto.BudgetDetailResponse, error) {
	var budget entity.Budget
	// 获取预算信息
	if err := database.DB.Where("budget_id = ? AND status = 'active'", budgetId).First(&budget).Error; err != nil {
		return nil, errors.New("预算不存在或已被删除")
	}

	// 获取关联的交易记录（只查询支出类型的交易）
	var transactions []entity.Transaction
	if err := database.DB.Where("budget_id = ? AND type = 'expense' AND status = 1", budgetId).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.New("查询关联交易记录失败")
	}

	// 根据关联的交易记录计算实际使用的金额（兼容旧数据）
	var actualUsedAmount float64
	for _, tx := range transactions {
		actualUsedAmount += tx.Amount
	}

	// 如果实际使用金额与数据库中的不一致，更新数据库
	if actualUsedAmount != budget.UsedAmount {
		fmt.Printf("[预算详情] 修正 usedAmount: %.2f -> %.2f (budgetId=%d)\n", budget.UsedAmount, actualUsedAmount, budget.BudgetId)
		database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", actualUsedAmount, budget.BudgetId)
		budget.UsedAmount = actualUsedAmount
	}

	// 计算使用百分比
	var usagePercent float64
	if budget.TotalAmount > 0 {
		usagePercent = (budget.UsedAmount / budget.TotalAmount) * 100
	}

	// 构建交易响应
	transactionResponses := make([]dto.TransactionResponse, 0, len(transactions))
	for _, tx := range transactions {
		// 获取账户名称
		var account entity.Account
		accountName := ""
		if tx.AccountId > 0 {
			database.DB.Where("account_id = ?", tx.AccountId).First(&account)
			accountName = account.Name
		}

		transactionResponses = append(transactionResponses, dto.TransactionResponse{
			TransactionId: tx.TransactionId,
			EnterpriseId:  tx.EnterpriseId,
			UnitId:        tx.UnitId,
			UserId:        tx.UserId,
			Type:          tx.Type,
			Category:      tx.Category,
			Amount:        tx.Amount,
			AccountId:     tx.AccountId,
			AccountName:   accountName,
			BudgetId:      tx.BudgetId,
			OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
			Tags:          parseJSONArray(tx.Tags),
			Note:          tx.Note,
			Images:        parseJSONArray(tx.Images),
			Status:        tx.Status,
			CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	remainingAmount := budget.TotalAmount - budget.UsedAmount
	if remainingAmount < 0 {
		remainingAmount = 0
	}

	return &dto.BudgetDetailResponse{
		BudgetResponse: dto.BudgetResponse{
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
			UsagePercent: usagePercent,
			CreatedAt:    budget.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Transactions:     transactionResponses,
		TransactionCount: len(transactions),
		RemainingAmount:  remainingAmount,
	}, nil
}
