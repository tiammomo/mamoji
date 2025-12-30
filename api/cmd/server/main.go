package main

import (
	"log"
	"os"

	"mamoji/api/internal/config"
	"mamoji/api/internal/database"
	"mamoji/api/internal/logger"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/server"
)

var logStd = log.New(os.Stdout, "", 0)

func main() {
	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化日志器
	log := logger.New()
	log.SetupFromEnv("APP_LOG_")
	defer log.Close()

	log.Infoc("应用程序启动",
		map[string]interface{}{
			"env":  cfg.App.Env,
			"host": cfg.App.Host,
			"port": cfg.App.Port,
		},
	)

	// 初始化数据库
	if err := database.Init(cfg); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// 自动迁移数据库表
	if err := database.AutoMigrate(
		&entity.User{},
		&entity.UserToken{},
		&entity.Enterprise{},
		&entity.EnterpriseMember{},
		&entity.AccountingUnit{},
		&entity.UnitPermission{},
		&entity.Account{},
		&entity.AccountFlow{},
		&entity.Transaction{},
		&entity.Budget{},
		&entity.BudgetApproval{},
		&entity.Investment{},
		&entity.InvestRecord{},
		&entity.Notification{},
		&entity.PushConfig{},
		&entity.PushLog{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 移除外键约束（解决历史数据外键约束问题）
	if err := database.DropForeignKeys(); err != nil {
		logStd.Printf("Warning: Failed to drop foreign keys: %v", err)
	}

	log.Infoc("数据库初始化完成",
		map[string]interface{}{
			"host": cfg.Database.Host,
			"port": cfg.Database.Port,
			"name": cfg.Database.Name,
		},
	)

	// 创建并启动服务器
	srv := server.New(cfg)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
