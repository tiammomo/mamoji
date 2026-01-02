package repository

import (
	"context"
	"time"

	"mamoji/api/internal/model/entity"
)

// BudgetRepository 预算仓储接口
type BudgetRepository interface {
	// Create 创建预算
	Create(ctx context.Context, budget *entity.Budget) (*entity.Budget, error)

	// Update 更新预算
	Update(ctx context.Context, budget *entity.Budget) (*entity.Budget, error)

	// Delete 删除预算（软删除）
	Delete(ctx context.Context, budgetID int64) error

	// FindByID 根据ID查找
	FindByID(ctx context.Context, budgetID int64) (*entity.Budget, error)

	// FindByEnterprise 根据企业ID查找
	FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Budget, error)

	// FindByUnit 根据单元查找
	FindByUnit(ctx context.Context, enterpriseID, unitID int64) ([]*entity.Budget, error)

	// FindByCategory 根据类别查找
	FindByCategory(ctx context.Context, enterpriseID int64, category string) ([]*entity.Budget, error)

	// FindByType 根据类型查找
	FindByType(ctx context.Context, enterpriseID int64, budgetType string) ([]*entity.Budget, error)

	// FindActive 查找活跃预算
	FindActive(ctx context.Context, enterpriseID int64) ([]*entity.Budget, error)

	// FindByDateRange 根据日期范围查找
	FindByDateRange(ctx context.Context, enterpriseID int64, start, end time.Time) ([]*entity.Budget, error)

	// FindByBudget 根据预算ID查找关联的交易
	FindByBudget(ctx context.Context, budgetID int64) ([]*entity.Transaction, error)

	// Count 统计数量
	Count(ctx context.Context, enterpriseID int64) (int64, error)

	// Paginate 分页查询
	Paginate(ctx context.Context, enterpriseID int64, page, pageSize int) ([]*entity.Budget, int64, error)
}
