package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// ===== TransactionService =====

// List 获取交易记录列表
func (s *TransactionService) List(enterpriseId int64, req dto.ListTransactionRequest) ([]dto.TransactionResponse, error) {
	var transactions []entity.Transaction
	// 过滤软删除的数据（status = 1 表示正常状态）
	query := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId)
	if req.UnitId > 0 {
		query = query.Where("unit_id = ?", req.UnitId)
	}
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}
	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.StartDate != "" {
		query = query.Where("occurred_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("occurred_at <= ?", req.EndDate)
	}

	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize
	if err := query.Order("occurred_at DESC, created_at DESC").Offset(offset).Limit(pageSize).Find(&transactions).Error; err != nil {
		return nil, errors.New("查询交易记录失败")
	}

	response := make([]dto.TransactionResponse, 0, len(transactions))
	for _, tx := range transactions {
		// 获取账户名称
		var account entity.Account
		accountName := ""
		if tx.AccountId > 0 {
			database.DB.Where("account_id = ?", tx.AccountId).First(&account)
			accountName = account.Name
		}

		response = append(response, dto.TransactionResponse{
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

	return response, nil
}

// GetById 获取单个交易记录
func (s *TransactionService) GetById(transactionId int64) (*dto.TransactionResponse, error) {
	var tx entity.Transaction
	// 过滤软删除的数据
	if err := database.DB.Where("transaction_id = ? AND status = 1", transactionId).First(&tx).Error; err != nil {
		return nil, errors.New("交易记录不存在或已被删除")
	}

	var account entity.Account
	accountName := ""
	if tx.AccountId > 0 {
		database.DB.Where("account_id = ?", tx.AccountId).First(&account)
		accountName = account.Name
	}

	return &dto.TransactionResponse{
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
	}, nil
}

// Create 创建交易记录
func (s *TransactionService) Create(enterpriseId int64, req dto.CreateTransactionRequest) (*dto.TransactionResponse, error) {
	// 如果没有提供UnitId，使用默认单元
	unitId := req.UnitId
	if unitId == 0 {
		var unitCount int64
		database.DB.Model(&entity.AccountingUnit{}).Where("enterprise_id = ? AND status = 1", enterpriseId).Count(&unitCount)
		if unitCount == 0 {
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
			var unit entity.AccountingUnit
			database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).First(&unit)
			unitId = unit.UnitId
		}
	}

	// 解析OccurredAt时间
	var occurredAt time.Time
	if req.OccurredAt != "" {
		// 尝试多种日期格式
		formats := []string{
			"2006-01-02 15:04:05",
			"2006-01-02",
			"2006/01/02 15:04:05",
			"2006/01/02",
		}
		for _, format := range formats {
			if t, err := time.Parse(format, req.OccurredAt); err == nil {
				occurredAt = t
				break
			}
		}
	}
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}

	// 处理tags和images为JSON字符串
	tagsJSON := "[]"
	if len(req.Tags) > 0 {
		tagsJSON = `["` + joinStrings(req.Tags, `","`) + `"]`
	}
	imagesJSON := "[]"
	if len(req.Images) > 0 {
		imagesJSON = `["` + joinStrings(req.Images, `","`) + `"]`
	}
	// 处理ecommerceInfo为JSON字符串，空字符串转为null
	ecommerceInfoJSON := "null"
	if req.EcommerceInfo != "" {
		ecommerceInfoJSON = req.EcommerceInfo
	}

	tx := &entity.Transaction{
		EnterpriseId:  enterpriseId,
		UnitId:        unitId,
		UserId:        req.UserId,
		Type:          req.Type,
		Category:      req.Category,
		Amount:        req.Amount,
		AccountId:     req.AccountId,
		BudgetId:      req.BudgetId,
		OccurredAt:    occurredAt,
		Tags:          tagsJSON,
		Note:          req.Note,
		Images:        imagesJSON,
		EcommerceInfo: ecommerceInfoJSON,
		Status:        1,
	}

	if err := database.DB.Create(tx).Error; err != nil {
		return nil, errors.New("创建交易记录失败")
	}

	// 更新账户可用余额
	if tx.AccountId > 0 {
		var account entity.Account
		if err := database.DB.Where("account_id = ?", tx.AccountId).First(&account).Error; err == nil {
			balanceChange := req.Amount
			if req.Type == "expense" {
				balanceChange = -req.Amount
			}
			newBalance := account.AvailableBalance + balanceChange
			database.DB.Model(&account).Update("available_balance", newBalance)
		}
	}

	// 更新预算已使用金额（仅支出时自动关联预算）
	if req.Type == "expense" {
		// 如果前端已指定BudgetId，直接使用；否则自动查找匹配的预算
		var budgetId *int64
		var budget entity.Budget
		var budgetMatched bool

		if req.BudgetId != nil && *req.BudgetId > 0 {
			// 使用前端指定的预算
			budgetId = req.BudgetId
			if err := database.DB.Where("budget_id = ? AND status = ?", *req.BudgetId, "active").First(&budget).Error; err != nil {
				fmt.Printf("[预算关联] 未找到指定预算 budgetId=%d: %v\n", *req.BudgetId, err)
			} else {
				budgetMatched = true
				fmt.Printf("[预算关联] 使用指定预算 budgetId=%d, name=%s, usedAmount=%.2f\n", budget.BudgetId, budget.Name, budget.UsedAmount)
			}
		} else {
			// 自动查找匹配的预算：根据分类和日期范围
			var matchedBudget entity.Budget
			fmt.Printf("[预算关联] 自动匹配: enterpriseId=%d, category=%s, occurredAt=%v\n", enterpriseId, req.Category, occurredAt)
			err := database.DB.Where(
				"enterprise_id = ? AND status = ? AND category = ? AND period_start <= ? AND period_end >= ?",
				enterpriseId, "active", req.Category, occurredAt, occurredAt,
			).First(&matchedBudget).Error

			if err == nil {
				budgetId = &matchedBudget.BudgetId
				budget = matchedBudget
				budgetMatched = true
				fmt.Printf("[预算关联] 自动匹配成功 budgetId=%d, name=%s, period=%v~%v, usedAmount=%.2f\n",
					budget.BudgetId, budget.Name, budget.PeriodStart, budget.PeriodEnd, budget.UsedAmount)
			} else {
				fmt.Printf("[预算关联] 自动匹配失败: %v\n", err)
			}
		}

		// 更新预算已使用金额
		if budgetMatched && budgetId != nil && budget.BudgetId > 0 {
			// 检查预算是否在有效期内（使用交易发生时间）
			// occurredAt 应该介于 periodStart 和 periodEnd 之间（包含边界）
			if (occurredAt.After(budget.PeriodStart) || occurredAt.Equal(budget.PeriodStart)) &&
				occurredAt.Before(budget.PeriodEnd.AddDate(0, 0, 1)) {
				// 更新 transaction 的 BudgetId
				tx.BudgetId = budgetId
				database.DB.Model(&tx).Update("budget_id", *budgetId)

				// 更新预算已使用金额 - 使用直接 SQL 确保更新
				newUsedAmount := budget.UsedAmount + req.Amount
				result := database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", newUsedAmount, budget.BudgetId)
				if result.Error != nil {
					fmt.Printf("[预算关联] 更新预算失败: %v\n", result.Error)
				} else {
					fmt.Printf("[预算关联] 预算更新完成: budgetId=%d, newUsedAmount=%.2f, affectedRows=%d\n",
						budget.BudgetId, newUsedAmount, result.RowsAffected)
				}
			} else {
				fmt.Printf("[预算关联] 交易时间不在预算期内: occurredAt=%v, periodStart=%v, periodEnd=%v\n",
					occurredAt, budget.PeriodStart, budget.PeriodEnd)
			}
		}
	}

	// 获取账户名称
	var account entity.Account
	accountName := ""
	if tx.AccountId > 0 {
		database.DB.Where("account_id = ?", tx.AccountId).First(&account)
		accountName = account.Name
	}

	response := &dto.TransactionResponse{
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
		Tags:          req.Tags,
		Note:          tx.Note,
		Images:        req.Images,
		Status:        tx.Status,
		CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	return response, nil
}

// Update 更新交易记录
func (s *TransactionService) Update(transactionId int64, req dto.UpdateTransactionRequest) (*dto.TransactionResponse, error) {
	var tx entity.Transaction
	if err := database.DB.Where("transaction_id = ?", transactionId).First(&tx).Error; err != nil {
		return nil, errors.New("交易记录不存在")
	}

	// 计算金额变化，调整账户余额
	oldAmount := tx.Amount
	oldType := tx.Type
	oldAccountId := tx.AccountId

	// 更新字段
	updates := map[string]interface{}{}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Amount > 0 {
		updates["amount"] = req.Amount
	}
	if req.AccountId > 0 {
		updates["account_id"] = req.AccountId
	}
	if req.OccurredAt != "" {
		// 解析日期
		if parsedTime, err := time.Parse("2006-01-02", req.OccurredAt); err == nil {
			updates["occurred_at"] = parsedTime
		}
	}
	if req.Note != "" {
		updates["note"] = req.Note
	}
	if req.Tags != nil {
		tagsJSON, _ := json.Marshal(req.Tags)
		updates["tags"] = string(tagsJSON)
	}
	if req.Images != nil {
		imagesJSON, _ := json.Marshal(req.Images)
		updates["images"] = string(imagesJSON)
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&tx).Updates(updates).Error; err != nil {
			return nil, errors.New("更新交易记录失败")
		}
		// 重新加载
		database.DB.Where("transaction_id = ?", transactionId).First(&tx)
	}

	// 如果金额或类型或账户发生变化，需要调整账户可用余额
	if req.Amount > 0 && (req.Amount != oldAmount || req.Type != "" || req.AccountId > 0) {
		// 恢复旧账户的旧金额影响
		if oldAccountId > 0 {
			var oldAccount entity.Account
			if database.DB.Where("account_id = ?", oldAccountId).First(&oldAccount).Error == nil {
				if oldType == "expense" {
					database.DB.Model(&oldAccount).Update("available_balance", oldAccount.AvailableBalance+oldAmount)
				} else if oldType == "income" {
					database.DB.Model(&oldAccount).Update("available_balance", oldAccount.AvailableBalance-oldAmount)
				}
			}
		}

		// 应用新金额到新账户
		newAccountId := req.AccountId
		if newAccountId == 0 {
			newAccountId = oldAccountId
		}
		newType := req.Type
		if newType == "" {
			newType = oldType
		}
		newAmount := req.Amount

		if newAccountId > 0 {
			var newAccount entity.Account
			if database.DB.Where("account_id = ?", newAccountId).First(&newAccount).Error == nil {
				if newType == "expense" {
					database.DB.Model(&newAccount).Update("available_balance", newAccount.AvailableBalance-newAmount)
				} else if newType == "income" {
					database.DB.Model(&newAccount).Update("available_balance", newAccount.AvailableBalance+newAmount)
				}
			}
		}
	}

	// 处理预算关联变更
	// 场景一：从"不关联预算"改为"关联具体预算"：将金额加到新预算
	// 场景二：从"关联具体预算"改为"不关联预算"：将金额从旧预算中减掉（加回预算）
	oldBudgetId := tx.BudgetId
	newBudgetId := req.BudgetId

	// 检查预算ID是否发生变化
	oldHasBudget := oldBudgetId != nil && *oldBudgetId > 0
	newHasBudget := newBudgetId != nil && *newBudgetId > 0

	if oldHasBudget && !newHasBudget {
		// 场景二：从有预算改为无预算，将金额加回旧预算
		var oldBudget entity.Budget
		if database.DB.Where("budget_id = ?", *oldBudgetId).First(&oldBudget).Error == nil {
			newUsedAmount := oldBudget.UsedAmount - tx.Amount
			if newUsedAmount < 0 {
				newUsedAmount = 0
			}
			database.DB.Model(&oldBudget).Update("used_amount", newUsedAmount)
		}
	} else if !oldHasBudget && newHasBudget {
		// 场景一：从无预算改为有预算，将金额加到新预算
		var newBudget entity.Budget
		if database.DB.Where("budget_id = ?", *newBudgetId).First(&newBudget).Error == nil {
			database.DB.Model(&newBudget).Update("used_amount", newBudget.UsedAmount+req.Amount)
		}
	}

	// 更新预算已使用金额（仅支出时处理预算金额变化）
	if oldType == "expense" || req.Type == "expense" {
		// 如果金额发生变化，需要调整预算（已在上面的预算关联变更中处理了预算ID变更的情况）
		// 这里处理金额变化但预算不变的情况
		if req.Amount > 0 && req.Amount != oldAmount && oldHasBudget && newHasBudget && *oldBudgetId == *newBudgetId {
			// 预算不变，只调整金额差额
			var budget entity.Budget
			if database.DB.Where("budget_id = ?", *oldBudgetId).First(&budget).Error == nil {
				amountDiff := req.Amount - oldAmount
				newUsedAmount := budget.UsedAmount + amountDiff
				if newUsedAmount < 0 {
					newUsedAmount = 0
				}
				database.DB.Model(&budget).Update("used_amount", newUsedAmount)
			}
		}
	}

	// 获取账户名称
	var account entity.Account
	accountName := ""
	if tx.AccountId > 0 {
		database.DB.Where("account_id = ?", tx.AccountId).First(&account)
		accountName = account.Name
	}

	response := &dto.TransactionResponse{
		TransactionId: tx.TransactionId,
		EnterpriseId:  tx.EnterpriseId,
		UnitId:        tx.UnitId,
		UserId:        tx.UserId,
		Type:          tx.Type,
		Category:      tx.Category,
		Amount:        tx.Amount,
		AccountId:     tx.AccountId,
		AccountName:   accountName,
		OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
		Tags:          parseJSONArray(tx.Tags),
		Note:          tx.Note,
		Images:        parseJSONArray(tx.Images),
		Status:        tx.Status,
		CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
	}
	return response, nil
}

// Delete 删除交易记录
func (s *TransactionService) Delete(transactionId int64) error {
	// 先查询记录是否存在
	var tx entity.Transaction
	if err := database.DB.Where("transaction_id = ?", transactionId).First(&tx).Error; err != nil {
		return errors.New("交易记录不存在")
	}

	// 更新账户可用余额（反向操作）
	if tx.AccountId > 0 && tx.Type == "expense" {
		// 支出删除时，恢复账户可用余额
		var account entity.Account
		if err := database.DB.Where("account_id = ?", tx.AccountId).First(&account).Error; err == nil {
			database.DB.Model(&account).Update("available_balance", account.AvailableBalance+tx.Amount)
		}
	} else if tx.AccountId > 0 && tx.Type == "income" {
		// 收入删除时，扣减账户可用余额
		var account entity.Account
		if err := database.DB.Where("account_id = ?", tx.AccountId).First(&account).Error; err == nil {
			database.DB.Model(&account).Update("available_balance", account.AvailableBalance-tx.Amount)
		}
	}

	// 更新预算已使用金额（仅支出且有关联预算时）
	if tx.Type == "expense" && tx.BudgetId != nil && *tx.BudgetId > 0 {
		var budget entity.Budget
		if err := database.DB.Where("budget_id = ?", *tx.BudgetId).First(&budget).Error; err == nil {
			// 将已使用的金额加回预算 - 使用直接 SQL 确保更新
			newUsedAmount := budget.UsedAmount - tx.Amount
			if newUsedAmount < 0 {
				newUsedAmount = 0
			}
			result := database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", newUsedAmount, budget.BudgetId)
			if result.Error != nil {
				fmt.Printf("[预算关联] 删除交易时更新预算失败: %v\n", result.Error)
			} else {
				fmt.Printf("[预算关联] 删除交易更新预算: budgetId=%d, newUsedAmount=%.2f, affectedRows=%d\n",
					budget.BudgetId, newUsedAmount, result.RowsAffected)
			}
		}
	}

	// 删除记录
	if err := database.DB.Delete(&tx).Error; err != nil {
		return errors.New("删除交易记录失败")
	}

	return nil
}

// joinStrings 将字符串数组合并为JSON数组字符串
func joinStrings(items []string, sep string) string {
	return strings.Join(items, sep)
}
