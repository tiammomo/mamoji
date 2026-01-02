package repository

import (
	"context"

	"mamoji/api/internal/model/entity"
)

// AccountRepository 账户仓储接口
type AccountRepository interface {
	// Create 创建账户
	Create(ctx context.Context, account *entity.Account) (*entity.Account, error)

	// Update 更新账户
	Update(ctx context.Context, account *entity.Account) (*entity.Account, error)

	// Delete 删除账户（软删除）
	Delete(ctx context.Context, accountID int64) error

	// FindByID 根据ID查找
	FindByID(ctx context.Context, accountID int64) (*entity.Account, error)

	// FindByEnterprise 根据企业ID查找所有账户
	FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Account, error)

	// FindByEnterpriseAndUnit 根据企业和单元查找账户
	FindByEnterpriseAndUnit(ctx context.Context, enterpriseID, unitID int64) ([]*entity.Account, error)

	// FindByCategory 根据资产类别查找
	FindByCategory(ctx context.Context, enterpriseID int64, category string) ([]*entity.Account, error)

	// Count 统计数量
	Count(ctx context.Context, enterpriseID int64) (int64, error)

	// SumBalance 计算总余额
	SumBalance(ctx context.Context, enterpriseID int64, includeInTotal *int) (float64, error)
}
