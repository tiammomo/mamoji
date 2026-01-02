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

// TransactionRepositoryImpl 交易仓储 GORM 实现
type TransactionRepositoryImpl struct{}

// NewTransactionRepositoryImpl 创建交易仓储实现
func NewTransactionRepositoryImpl() repository.TransactionRepository {
	return &TransactionRepositoryImpl{}
}

// Create 创建交易
func (r *TransactionRepositoryImpl) Create(ctx context.Context, tx *entity.Transaction) (*entity.Transaction, error) {
	if err := database.DB.WithContext(ctx).Create(tx).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return tx, nil
}

// Update 更新交易
func (r *TransactionRepositoryImpl) Update(ctx context.Context, tx *entity.Transaction) (*entity.Transaction, error) {
	if err := database.DB.WithContext(ctx).Save(tx).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return tx, nil
}

// Delete 删除交易（软删除）
func (r *TransactionRepositoryImpl) Delete(ctx context.Context, txID int64) error {
	result := database.DB.WithContext(ctx).
		Model(&entity.Transaction{}).
		Where("transaction_id = ?", txID).
		Update("status", 0)
	if result.Error != nil {
		return errors.DatabaseError(result.Error)
	}
	if result.RowsAffected == 0 {
		return errors.NotFound("交易记录")
	}
	return nil
}

// FindByID 根据ID查找
func (r *TransactionRepositoryImpl) FindByID(ctx context.Context, txID int64) (*entity.Transaction, error) {
	var tx entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("transaction_id = ? AND status = 1", txID).
		First(&tx).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.NotFound("交易记录")
		}
		return nil, errors.DatabaseError(err)
	}
	return &tx, nil
}

// FindByEnterprise 根据企业ID查找
func (r *TransactionRepositoryImpl) FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Transaction, error) {
	var transactions []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND status = 1", enterpriseID).
		Order("occurred_at DESC, created_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return transactions, nil
}

// FindByAccount 根据账户查找
func (r *TransactionRepositoryImpl) FindByAccount(ctx context.Context, accountID int64) ([]*entity.Transaction, error) {
	var transactions []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("account_id = ? AND status = 1", accountID).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return transactions, nil
}

// FindByBudget 根据预算查找
func (r *TransactionRepositoryImpl) FindByBudget(ctx context.Context, budgetID int64) ([]*entity.Transaction, error) {
	var transactions []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("budget_id = ? AND status = 1", budgetID).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return transactions, nil
}

// FindByType 根据类型查找
func (r *TransactionRepositoryImpl) FindByType(ctx context.Context, enterpriseID int64, txType string) ([]*entity.Transaction, error) {
	var transactions []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND type = ? AND status = 1", enterpriseID, txType).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return transactions, nil
}

// FindByDateRange 根据日期范围查找
func (r *TransactionRepositoryImpl) FindByDateRange(ctx context.Context, enterpriseID int64, start, end time.Time) ([]*entity.Transaction, error) {
	var transactions []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND status = 1 AND occurred_at >= ? AND occurred_at <= ?",
			enterpriseID, start, end).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return transactions, nil
}

// FindByCategory 根据类别查找
func (r *TransactionRepositoryImpl) FindByCategory(ctx context.Context, enterpriseID int64, category string) ([]*entity.Transaction, error) {
	var transactions []*entity.Transaction
	if err := database.DB.WithContext(ctx).
		Where("enterprise_id = ? AND category = ? AND status = 1", enterpriseID, category).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.DatabaseError(err)
	}
	return transactions, nil
}

// Count 统计数量
func (r *TransactionRepositoryImpl) Count(ctx context.Context, enterpriseID int64) (int64, error) {
	var count int64
	if err := database.DB.WithContext(ctx).
		Model(&entity.Transaction{}).
		Where("enterprise_id = ? AND status = 1", enterpriseID).
		Count(&count).Error; err != nil {
		return 0, errors.DatabaseError(err)
	}
	return count, nil
}

// SumAmount 统计金额
func (r *TransactionRepositoryImpl) SumAmount(ctx context.Context, enterpriseID int64, txType string) (float64, error) {
	var sum float64
	query := database.DB.WithContext(ctx).
		Model(&entity.Transaction{}).
		Where("enterprise_id = ? AND status = 1", enterpriseID)
	if txType != "" {
		query = query.Where("type = ?", txType)
	}
	if err := query.Select("COALESCE(SUM(amount), 0)").
		Scan(&sum).Error; err != nil {
		return 0, errors.DatabaseError(err)
	}
	return sum, nil
}

// Paginate 分页查询
func (r *TransactionRepositoryImpl) Paginate(ctx context.Context, enterpriseID int64, page, pageSize int) ([]*entity.Transaction, int64, error) {
	var transactions []*entity.Transaction
	var total int64

	offset := (page - 1) * pageSize

	if err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 查询总数
		if err := tx.Model(&entity.Transaction{}).
			Where("enterprise_id = ? AND status = 1", enterpriseID).
			Count(&total).Error; err != nil {
			return err
		}
		// 查询数据
		if err := tx.
			Where("enterprise_id = ? AND status = 1", enterpriseID).
			Order("occurred_at DESC, created_at DESC").
			Offset(offset).
			Limit(pageSize).
			Find(&transactions).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, 0, errors.DatabaseError(err)
	}

	return transactions, total, nil
}
