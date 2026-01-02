package repository

import (
	"context"
	"time"

	"mamoji/api/internal/model/entity"
)

// TransactionRepository 交易仓储接口
type TransactionRepository interface {
	// Create 创建交易
	Create(ctx context.Context, tx *entity.Transaction) (*entity.Transaction, error)

	// Update 更新交易
	Update(ctx context.Context, tx *entity.Transaction) (*entity.Transaction, error)

	// Delete 删除交易（软删除）
	Delete(ctx context.Context, txID int64) error

	// FindByID 根据ID查找
	FindByID(ctx context.Context, txID int64) (*entity.Transaction, error)

	// FindByEnterprise 根据企业ID查找
	FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Transaction, error)

	// FindByAccount 根据账户查找
	FindByAccount(ctx context.Context, accountID int64) ([]*entity.Transaction, error)

	// FindByBudget 根据预算查找
	FindByBudget(ctx context.Context, budgetID int64) ([]*entity.Transaction, error)

	// FindByType 根据类型查找
	FindByType(ctx context.Context, enterpriseID int64, txType string) ([]*entity.Transaction, error)

	// FindByDateRange 根据日期范围查找
	FindByDateRange(ctx context.Context, enterpriseID int64, start, end time.Time) ([]*entity.Transaction, error)

	// FindByCategory 根据类别查找
	FindByCategory(ctx context.Context, enterpriseID int64, category string) ([]*entity.Transaction, error)

	// Count 统计数量
	Count(ctx context.Context, enterpriseID int64) (int64, error)

	// SumAmount 统计金额
	SumAmount(ctx context.Context, enterpriseID int64, txType string) (float64, error)

	// Paginate 分页查询
	Paginate(ctx context.Context, enterpriseID int64, page, pageSize int) ([]*entity.Transaction, int64, error)
}
