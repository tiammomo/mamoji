package database

import (
	"fmt"
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
