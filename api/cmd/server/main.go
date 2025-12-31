package main

import (
	"log"
	"os"
	"path/filepath"

	"mamoji/api/internal/config"
	"mamoji/api/internal/database"
	"mamoji/api/internal/logger"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/server"
	"mamoji/api/internal/service"
)

var logStd = log.New(os.Stdout, "", 0)

func main() {
	log.Println("Starting mamoji server...")

	// 获取当前可执行文件所在目录
	execDir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		execDir = "."
	}
	log.Printf("Executable directory: %s", execDir)

	// 加载配置（支持相对路径和绝对路径）
	configPath := "config"
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// 如果当前目录没有config，尝试在可执行文件目录查找
		altPath := filepath.Join(execDir, "config")
		if _, err := os.Stat(altPath); err == nil {
			configPath = altPath
		}
	}
	log.Printf("Loading config from: %s", configPath)

	cfg, err := config.LoadFromPath(configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Config loaded: %+v", cfg.App)
	log.Printf("Database host: %s", cfg.Database.Host)

	log.Println("Initializing logger...")
	// 初始化日志器
	logInstance := logger.New()
	log.Println("Logger initialized")
	logInstance.Infow("Logger initialized successfully")

	logInstance.InfoMap("应用程序启动",
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

	// 迁移业务表（添加新字段）
	if err := database.AutoMigrate(
		&entity.Transaction{}, // 包含新的budgetId字段
		&entity.Budget{},
		&entity.Account{},
		&entity.AccountingUnit{},
	); err != nil {
		logStd.Printf("Warning: Failed to migrate business tables: %v", err)
	}

	// 移除外键约束（解决历史数据外键约束问题）
	if err := database.DropForeignKeys(); err != nil {
		logStd.Printf("Warning: Failed to drop foreign keys: %v", err)
	}

	logInstance.InfoMap("数据库初始化完成",
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
		logInstance.InfoMap("管理员账户检查完成",
			map[string]interface{}{},
		)
	}

	// 创建并启动服务器
	srv := server.New(cfg)
	if err := srv.Start(); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
