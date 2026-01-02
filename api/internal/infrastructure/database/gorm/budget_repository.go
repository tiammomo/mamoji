package gorm

import (
	"context"
	"time"

	"mamoji/api/internal/database"
	"mamoji/api/internal/domain/repository"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/pkg/errors"

	"gorm.io/gorm"
)

// BudgetRepositoryImpl 预算仓储 GORM 实现
type BudgetRepositoryImpl struct{}

// NewBudgetRepositoryImpl 创建预算仓储实现
func NewBudgetRepositoryImpl() repository.BudgetRepository {
	return &BudgetRepositoryImpl{}
}

// Create 创建预算
func (r *BudgetRepositoryImpl) Create(ctx context.Context, budget *entity.Budget) (*entity.Budget, error) {
	if err := database.DB.WithContext(ctx).Create(budget).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budget, nil
}

// Update 更新预算
func (r *BudgetRepositoryImpl) Update(ctx context.Context, budget *entity.Budget) (*entity.Budget, error) {
	if err := database.DB.WithContext(ctx).Save(budget).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budget, nil
}

// Delete 删除预算（软删除）
func (r *BudgetRepositoryImpl) Delete(ctx context.Context, budgetID int64) error {
	result := database.DB.WithContext(ctx).
		Model(&entity.Budget{}).
		Where("budget_id = ?", budgetID).
		Update("status", "ended")
	if result.Error != nil {
		return errors.DatabaseError(result.Error)
	}
	if result.RowsAffected == 0 {
		return errors.NotFound("预算")
	}
	return nil
}

// FindByID 根据ID查找
func (r *BudgetRepositoryImpl) FindByID(ctx context.Context, budgetID int64) (*entity.Budget, error) {
	var budget entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("budget_id = ?", budgetID).
		First(&budget).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.NotFound("预算")
		}
		return nil, errors.DatabaseError(err)
	}
	return &budget, nil
}

// FindByEnterprise 根据企业ID查找
func (r *BudgetRepositoryImpl) FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Budget, error) {
	var budgets []*entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ?", enterpriseID).
		Order("created_at DESC").
		Find(&budgets).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budgets, nil
}

// FindByUnit 根据单元查找
func (r *BudgetRepositoryImpl) FindByUnit(ctx context.Context, enterpriseID, unitID int64) ([]*entity.Budget, error) {
	var budgets []*entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND unit_id = ?", enterpriseID, unitID).
		Order("created_at DESC").
		Find(&budgets).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budgets, nil
}

// FindByCategory 根据类别查找
func (r *BudgetRepositoryImpl) FindByCategory(ctx context.Context, enterpriseID int64, category string) ([]*entity.Budget, error) {
	var budgets []*entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND category = ?", enterpriseID, category).
		Order("created_at DESC").
		Find(&budgets).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budgets, nil
}

// FindByType 根据类型查找
func (r *BudgetRepositoryImpl) FindByType(ctx context.Context, enterpriseID int64, budgetType string) ([]*entity.Budget, error) {
	var budgets []*entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND type = ?", enterpriseID, budgetType).
		Order("created_at DESC").
		Find(&budgets).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budgets, nil
}

// FindActive 查找活跃预算
func (r *BudgetRepositoryImpl) FindActive(ctx context.Context, enterpriseID int64) ([]*entity.Budget, error) {
	now := time.Now()
	var budgets []*entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND status = 'active' AND period_start <= ? AND period_end >= ?",
			enterpriseID, now, now).
		Order("created_at DESC").
		Find(&budgets).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budgets, nil
}

// FindByDateRange 根据日期范围查找
func (r *BudgetRepositoryImpl) FindByDateRange(ctx context.Context, enterpriseID int64, start, end time.Time) ([]*entity.Budget, error) {
	var budgets []*entity.Budget
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND period_start >= ? AND period_end <= ?",
			enterpriseID, start, end).
		Order("created_at DESC").
		Find(&budgets).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return budgets, nil
}

// FindByBudget 根据预算ID查找关联的交易
func (r *BudgetRepositoryImpl) FindByBudget(ctx context.Context, budgetID int64) ([]*entity.Transaction, error) {
	var txs []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("budget_id = ? AND status = 1", budgetID).
		Order("occurred_at DESC").
		Find(&txs).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return txs, nil
}

// Count 统计数量
func (r *BudgetRepositoryImpl) Count(ctx context.Context, enterpriseID int64) (int64, error) {
	var count int64
	if err := database.DB.WithContext(ctx).
		Model(&entity.Budget{}).
		Where("enterprise_id = ?", enterpriseID).
		Count(&count).Error; err != nil {
		return 0, errors.DatabaseError(err)
	}
	return count, nil
}

// Paginate 分页查询
func (r *BudgetRepositoryImpl) Paginate(ctx context.Context, enterpriseID int64, page, pageSize int) ([]*entity.Budget, int64, error) {
	var budgets []*entity.Budget
	var total int64

	offset := (page - 1) * pageSize

	if err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 查询总数
		if err := tx.Model(&entity.Budget{}).
			Where("enterprise_id = ?", enterpriseID).
			Count(&total).Error; err != nil {
			return err
		}
		// 查询数据
		if err := tx.
			Where("enterprise_id = ?", enterpriseID).
			Order("created_at DESC").
			Offset(offset).
			Limit(pageSize).
			Find(&budgets).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, 0, errors.DatabaseError(err)
	}

	return budgets, total, nil
}
