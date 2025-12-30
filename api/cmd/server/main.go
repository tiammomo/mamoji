package main

import (
	"log"
	"os"

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

	log.InfoMap("应用程序启动",
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

	// 自动迁移数据库表（只迁移认证相关表，避免外键冲突）
	if err := database.AutoMigrate(
		&entity.User{},
		&entity.UserToken{},
	); err != nil {
		logStd.Printf("Warning: Failed to migrate core tables: %v", err)
	}

	// 移除外键约束（解决历史数据外键约束问题）
	if err := database.DropForeignKeys(); err != nil {
		logStd.Printf("Warning: Failed to drop foreign keys: %v", err)
	}

	log.InfoMap("数据库初始化完成",
		map[string]interface{}{
			"host": cfg.Database.Host,
			"port": cfg.Database.Port,
			"name": cfg.Database.Name,
		},
	)

	// 初始化管理员账户
	if err := service.InitAdminUser(); err != nil {
		logStd.Printf("Warning: Failed to init admin user: %v", err)
	} else {
		log.InfoMap("管理员账户检查完成",
			map[string]interface{}{},
		)
	}

	// 创建并启动服务器
	srv := server.New(cfg)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
