package cache

import (
	"encoding/json"
	"fmt"
	"time"

	"mamoji/api/internal/model/entity"
)

// BudgetCache 预算缓存服务
var BudgetCache = &budgetCache{}

type budgetCache struct{}

// GetBudget 获取单个预算缓存
func (c *budgetCache) GetBudget(budgetId int64) (*entity.Budget, error) {
	key := fmt.Sprintf("%s%d", BudgetKeyPrefix, budgetId)

	var budget entity.Budget
	err := GetJSON(key, &budget)
	if err != nil {
		return nil, err
	}

	return &budget, nil
}

// SetBudget 设置单个预算缓存
func (c *budgetCache) SetBudget(budget *entity.Budget) error {
	key := fmt.Sprintf("%s%d", BudgetKeyPrefix, budget.BudgetId)
	return SetJSON(key, budget, DefaultExpiration)
}

// DeleteBudget 删除单个预算缓存
func (c *budgetCache) DeleteBudget(budgetId int64) error {
	key := fmt.Sprintf("%s%d", BudgetKeyPrefix, budgetId)
	return Delete(key)
}

// GetBudgetList 获取企业预算列表缓存
func (c *budgetCache) GetBudgetList(enterpriseId int64) ([]*entity.Budget, error) {
	key := fmt.Sprintf("%s%d", BudgetListPrefix, enterpriseId)

	var budgets []*entity.Budget
	data, err := Get(key)
	if err != nil {
		return nil, err
	}

	if data == "" {
		return nil, fmt.Errorf("cache miss")
	}

	err = json.Unmarshal([]byte(data), &budgets)
	if err != nil {
		return nil, err
	}

	return budgets, nil
}

// SetBudgetList 设置企业预算列表缓存
func (c *budgetCache) SetBudgetList(enterpriseId int64, budgets []*entity.Budget) error {
	key := fmt.Sprintf("%s%d", BudgetListPrefix, enterpriseId)

	data, err := json.Marshal(budgets)
	if err != nil {
		return err
	}

	// 列表缓存时间稍短，避免数据不一致
	return Set(key, string(data), ShortExpiration)
}

// DeleteBudgetList 删除企业预算列表缓存
func (c *budgetCache) DeleteBudgetList(enterpriseId int64) error {
	key := fmt.Sprintf("%s%d", BudgetListPrefix, enterpriseId)
	return Delete(key)
}

// InvalidateEnterpriseBudgets 使企业下所有预算缓存失效
func (c *budgetCache) InvalidateEnterpriseBudgets(enterpriseId int64) error {
	// 删除列表缓存
	if err := c.DeleteBudgetList(enterpriseId); err != nil {
		// 列表可能不存在，忽略错误
	}

	// 删除所有预算详情缓存
	pattern := fmt.Sprintf("%s*", BudgetKeyPrefix)
	return DeletePattern(pattern)
}

// GetBudgetUsage 获取预算使用量缓存
func (c *budgetCache) GetBudgetUsage(budgetId int64) (float64, float64, error) {
	key := fmt.Sprintf("%s%d", BudgetUsagePrefix, budgetId)

	type UsageData struct {
		TotalAmount float64 `json:"totalAmount"`
		UsedAmount  float64 `json:"usedAmount"`
	}

	var usage UsageData
	err := GetJSON(key, &usage)
	if err != nil {
		return 0, 0, err
	}

	return usage.TotalAmount, usage.UsedAmount, nil
}

// SetBudgetUsage 设置预算使用量缓存
func (c *budgetCache) SetBudgetUsage(budgetId int64, totalAmount, usedAmount float64) error {
	key := fmt.Sprintf("%s%d", BudgetUsagePrefix, budgetId)

	usage := map[string]interface{}{
		"totalAmount": totalAmount,
		"usedAmount":  usedAmount,
		"cachedAt":    time.Now().Unix(),
	}

	return SetJSON(key, usage, DefaultExpiration)
}

// DeleteBudgetUsage 删除预算使用量缓存
func (c *budgetCache) DeleteBudgetUsage(budgetId int64) error {
	key := fmt.Sprintf("%s%d", BudgetUsagePrefix, budgetId)
	return Delete(key)
}

// UpdateBudgetUsage 更新预算使用量缓存
func (c *budgetCache) UpdateBudgetUsage(budgetId int64, usedAmount float64) error {
	key := fmt.Sprintf("%s%d", BudgetUsagePrefix, budgetId)

	// 先获取当前缓存
	var usage map[string]interface{}
	_ = GetJSON(key, &usage)

	if usage == nil {
		// 缓存不存在，从数据库加载
		return nil
	}

	usage["usedAmount"] = usedAmount
	usage["cachedAt"] = time.Now().Unix()

	return SetJSON(key, usage, DefaultExpiration)
}

// WarmupBudgetCache 预热预算缓存
func (c *budgetCache) WarmupBudgetCache(budgets []*entity.Budget, enterpriseId int64) error {
	// 设置列表缓存
	if err := c.SetBudgetList(enterpriseId, budgets); err != nil {
		return fmt.Errorf("failed to set budget list cache: %w", err)
	}

	// 设置每个预算的详情缓存
	for _, budget := range budgets {
		if err := c.SetBudget(budget); err != nil {
			return fmt.Errorf("failed to set budget %d cache: %w", budget.BudgetId, err)
		}
	}

	return nil
}
