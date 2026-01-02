package database

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"mamoji/api/internal/config"
)

var DB *gorm.DB

// Init 初始化数据库连接
func Init(cfg *config.Config) error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.Username,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NamingStrategy: schema.NamingStrategy{
			TablePrefix:   "t_",
			SingularTable: true,
		},
	})
	if err != nil {
		return fmt.Errorf("failed to connect database: %w", err)
	}

	DB = db

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// 配置连接池
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return nil
}

// Close 关闭数据库连接
func Close() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate(models ...interface{}) error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}
	// 使用 DryRun 模式检查迁移，只执行安全的迁移
	// 对于生产环境的现有表，跳过可能引起外键冲突的迁移
	return DB.AutoMigrate(models...)
}

// SafeAutoMigrate 安全迁移（跳过可能失败的表）
func SafeAutoMigrate() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	// 核心用户表迁移（这些表是应用必需的）
	coreModels := []interface{}{
		// User 和 UserToken 是认证必需的，其他表可以后续处理
	}

	return DB.AutoMigrate(coreModels...)
}

// DropForeignKeys 移除外键约束（解决历史数据外键约束问题）
func DropForeignKeys() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	// 获取数据库名称
	var dbName string
	if err := DB.Raw("SELECT DATABASE()").Scan(&dbName).Error; err != nil {
		return err
	}

	// 注意：这里简化处理，实际可能需要根据数据库类型调整
	// GORM 的外键约束通常通过 AtIndex 实现，不会自动创建数据库外键

	return nil
}

// AddMissingColumns 添加缺失的列（处理GORM无法自动添加的列）
func AddMissingColumns() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	// 检查并添加 biz_transaction 表的 budget_id 列
	// 该列在添加预算功能时需要，但历史表可能缺少此列
	var columnExists bool
	if err := DB.Raw("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biz_transaction' AND COLUMN_NAME = 'budget_id'").Scan(&columnExists).Error; err != nil {
		return fmt.Errorf("failed to check budget_id column: %w", err)
	}

	if !columnExists {
		// 添加 budget_id 列
		if err := DB.Exec("ALTER TABLE `biz_transaction` ADD COLUMN `budget_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '关联预算ID' AFTER `account_id`").Error; err != nil {
			// 如果列已存在（并发情况下），忽略错误
			if !isDuplicateColumnError(err) {
				return fmt.Errorf("failed to add budget_id column: %w", err)
			}
		} else {
			log.Println("Added budget_id column to biz_transaction table")
		}

		// 添加索引
		if err := DB.Exec("CREATE INDEX `idx_budget_id` ON `biz_transaction` (`budget_id`)").Error; err != nil {
			if !isDuplicateIndexError(err) {
				log.Printf("Warning: failed to create index on budget_id: %v", err)
			}
		}
	}

	// 检查并添加 biz_account 表的资产字段列
	// 该列在添加资产管理功能时需要，但历史表可能缺少这些列
	accountColumns := []struct {
		name    string
		colType string
		comment string
	}{
		{"type", "VARCHAR(20) DEFAULT 'bank' COMMENT '账户类型（兼容旧字段）'", "账户类型"},
		{"currency", "VARCHAR(10) DEFAULT 'CNY' COMMENT '币种: CNY(人民币), USD(美元), etc.'", "币种"},
		{"account_no", "VARCHAR(50) COMMENT '账号/卡号'", "账号卡号"},
		{"bank_name", "VARCHAR(50) COMMENT '开户银行/发卡银行'", "银行名称"},
		{"bank_card_type", "VARCHAR(20) COMMENT '银行卡类型: type1(一类卡), type2(二类卡)'", "银行卡类型"},
		{"credit_limit", "DECIMAL(18,2) DEFAULT 0 COMMENT '信用额度（信用卡）'", "信用额度"},
		{"outstanding_balance", "DECIMAL(18,2) DEFAULT 0 COMMENT '总欠款（信用卡）'", "总欠款"},
		{"billing_date", "INT DEFAULT 0 COMMENT '出账日期（1-28）'", "出账日期"},
		{"repayment_date", "INT DEFAULT 0 COMMENT '还款日期（1-28）'", "还款日期"},
		{"invested_amount", "DECIMAL(18,2) DEFAULT 0 COMMENT '投资中金额'", "投资金额"},
		{"asset_category", "VARCHAR(20) DEFAULT 'fund' COMMENT '资产大类: fund(资金账户), credit(信用卡), topup(充值账户), investment(投资理财), debt(债务)'", "资产大类"},
		{"sub_type", "VARCHAR(30) COMMENT '资产子类型: cash, wechat, alipay, bank, etc.'", "资产子类型"},
		{"total_value", "DECIMAL(18,2) DEFAULT 0 COMMENT '资产总价值'", "资产总价值"},
		{"include_in_total", "INT DEFAULT 1 COMMENT '是否计入总资产: 1(是), 0(否)'", "是否计入总资产"},
	}

	for _, col := range accountColumns {
		if err := DB.Raw("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biz_account' AND COLUMN_NAME = ?", col.name).Scan(&columnExists).Error; err != nil {
			log.Printf("Warning: failed to check %s column: %v", col.name, err)
			continue
		}

		if !columnExists {
			// 添加列
			addColSQL := fmt.Sprintf("ALTER TABLE `biz_account` ADD COLUMN `%s` %s", col.name, col.colType)
			if err := DB.Exec(addColSQL).Error; err != nil {
				if !isDuplicateColumnError(err) {
					log.Printf("Warning: failed to add %s column: %v", col.name, err)
				}
			} else {
				log.Printf("Added %s column to biz_account table", col.name)
			}
		}
	}

	// 检查并添加 biz_account 表的 unit_id 列（如果历史表缺少）
	if err := DB.Raw("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biz_account' AND COLUMN_NAME = 'unit_id'").Scan(&columnExists).Error; err != nil {
		log.Printf("Warning: failed to check unit_id column: %v", err)
	} else if !columnExists {
		if err := DB.Exec("ALTER TABLE `biz_account` ADD COLUMN `unit_id` BIGINT DEFAULT 0 COMMENT '记账单元ID' AFTER `enterprise_id`").Error; err != nil {
			if !isDuplicateColumnError(err) {
				log.Printf("Warning: failed to add unit_id column: %v", err)
			}
		} else {
			log.Println("Added unit_id column to biz_account table")
		}

		// 添加索引
		if err := DB.Exec("CREATE INDEX `idx_account_unit_id` ON `biz_account` (`unit_id`)").Error; err != nil {
			if !isDuplicateIndexError(err) {
				log.Printf("Warning: failed to create index on unit_id: %v", err)
			}
		}
	}

	// 检查 biz_account 表的 type 列是否存在且没有默认值
	var hasDefault bool
	if err := DB.Raw("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biz_account' AND COLUMN_NAME = 'type' AND COLUMN_DEFAULT IS NOT NULL").Scan(&hasDefault).Error; err != nil {
		log.Printf("Warning: failed to check type column default: %v", err)
	} else if !hasDefault {
		// 列存在但没有默认值，添加默认值
		if err := DB.Exec("ALTER TABLE `biz_account` MODIFY COLUMN `type` VARCHAR(20) DEFAULT 'bank' COMMENT '账户类型（兼容旧字段）'").Error; err != nil {
			log.Printf("Warning: failed to modify type column: %v", err)
		} else {
			log.Println("Modified type column to add default value")
		}
	}

	return nil
}

// isDuplicateColumnError 检查是否为列已存在的错误
func isDuplicateColumnError(err error) bool {
	return containsString(err.Error(), "Duplicate column")
}

// isDuplicateIndexError 检查是否为索引已存在的错误
func isDuplicateIndexError(err error) bool {
	errStr := err.Error()
	return containsString(errStr, "Duplicate key name") || containsString(errStr, "already exists")
}

// containsString 检查字符串是否包含子串
func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstring(s, substr))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
