package gorm

import (
	"context"

	"gorm.io/gorm"

	"mamoji/api/internal/database"
	"mamoji/api/internal/domain/repository"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/pkg/errors"
)

// AccountRepositoryImpl 账户仓储 GORM 实现
type AccountRepositoryImpl struct{}

// NewAccountRepositoryImpl 创建账户仓储实现
func NewAccountRepositoryImpl() repository.AccountRepository {
	return &AccountRepositoryImpl{}
}

// Create 创建账户
func (r *AccountRepositoryImpl) Create(ctx context.Context, account *entity.Account) (*entity.Account, error) {
	if err := database.DB.WithContext(ctx).Create(account).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return account, nil
}

// Update 更新账户
func (r *AccountRepositoryImpl) Update(ctx context.Context, account *entity.Account) (*entity.Account, error) {
	if err := database.DB.WithContext(ctx).Save(account).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return account, nil
}

// Delete 删除账户（软删除）
func (r *AccountRepositoryImpl) Delete(ctx context.Context, accountID int64) error {
	result := database.DB.WithContext(ctx).
		Model(&entity.Account{}).
		Where("account_id = ?", accountID).
		Update("status", 0)
	if result.Error != nil {
		return errors.DatabaseError(result.Error)
	}
	if result.RowsAffected == 0 {
		return errors.NotFound("账户")
	}
	return nil
}

// FindByID 根据ID查找
func (r *AccountRepositoryImpl) FindByID(ctx context.Context, accountID int64) (*entity.Account, error) {
	var account entity.Account
	if err := database.DB.WithContext(ctx).
		Where("account_id = ? AND status = 1", accountID).
		First(&account).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.NotFound("账户")
		}
		return nil, errors.DatabaseError(err)
	}
	return &account, nil
}

// FindByEnterprise 根据企业ID查找所有账户
func (r *AccountRepositoryImpl) FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Account, error) {
	var accounts []*entity.Account
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND status = 1", enterpriseID).
		Order("created_at DESC").
		Find(&accounts).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return accounts, nil
}

// FindByEnterpriseAndUnit 根据企业和单元查找账户
func (r *AccountRepositoryImpl) FindByEnterpriseAndUnit(ctx context.Context, enterpriseID, unitID int64) ([]*entity.Account, error) {
	var accounts []*entity.Account
	query := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND status = 1", enterpriseID)
	if unitID > 0 {
		query = query.Where("unit_id = ?", unitID)
	}
	if err := query.Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return accounts, nil
}

// FindByCategory 根据资产类别查找
func (r *AccountRepositoryImpl) FindByCategory(ctx context.Context, enterpriseID int64, category string) ([]*entity.Account, error) {
	var accounts []*entity.Account
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND asset_category = ? AND status = 1", enterpriseID, category).
		Order("created_at DESC").
		Find(&accounts).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return accounts, nil
}

// Count 统计数量
func (r *AccountRepositoryImpl) Count(ctx context.Context, enterpriseID int64) (int64, error) {
	var count int64
	if err := database.DB.WithContext(ctx).
		Model(&entity.Account{}).
		Where("enterprise_id = ? AND status = 1", enterpriseID).
		Count(&count).Error; err != nil {
		return 0, errors.DatabaseError(err)
	}
	return count, nil
}

// SumBalance 计算总余额
func (r *AccountRepositoryImpl) SumBalance(ctx context.Context, enterpriseID int64, includeInTotal *int) (float64, error) {
	var sum float64
	query := database.DB.WithContext(ctx).
		Model(&entity.Account{}).
		Where("enterprise_id = ? AND status = 1", enterpriseID)
	if includeInTotal != nil {
		query = query.Where("include_in_total = ?", *includeInTotal)
	}
	if err := query.Select("COALESCE(SUM(available_balance), 0)").
		Scan(&sum).Error; err != nil {
		return 0, errors.DatabaseError(err)
	}
	return sum, nil
}
