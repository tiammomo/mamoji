package main

import (
	"log"
	"os"

	"mamoji/api/internal/cache"
	"mamoji/api/internal/config"
	"mamoji/api/internal/database"
	"mamoji/api/internal/logger"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/server"
	"mamoji/api/internal/service"
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

	// 移除外键约束（必须在迁移之前执行，解决历史数据外键约束问题）
	if err := database.DropForeignKeys(); err != nil {
		logStd.Printf("Warning: Failed to drop foreign keys: %v", err)
	}

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

	log.Infoc("数据库初始化完成",
		map[string]interface{}{
			"host": cfg.Database.Host,
			"port": cfg.Database.Port,
			"name": cfg.Database.Name,
		},
	)

	// 初始化默认管理员用户
	if err := service.AuthService.InitDefaultAdmin(); err != nil {
		log.Warnw("初始化默认管理员失败", "error", err.Error())
	}

	// 初始化 Redis 缓存
	if err := cache.Init(cfg); err != nil {
		log.Warnw("Redis 缓存初始化失败，降级为无缓存模式",
			"error", err.Error(),
		)
		// Redis 初始化失败不影响服务启动，只是使用无缓存模式
	} else {
		defer cache.Close()
		log.Infoc("Redis 缓存初始化成功",
			map[string]interface{}{
				"host": cfg.Redis.Host,
				"port": cfg.Redis.Port,
				"db":   cfg.Redis.DB,
			},
		)
	}

	// 创建并启动服务器
	srv := server.New(cfg)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
