package main

import (
	"fmt"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"mamoji/api/internal/config"
	"mamoji/api/internal/database"
	"mamoji/api/internal/model/entity"
)

func main() {
	file, _ := os.Create("test_admin.log")
	defer file.Close()
	write := func(msg string) {
		file.WriteString(msg + "\n")
		fmt.Println(msg)
	}

	write("Starting admin user test at " + time.Now().Format("2006-01-02 15:04:05"))

	// Get the project root directory
	configPath := "d:/projects/shuai/mamoji/api/config"
	write("Config path: " + configPath)

	// Load config from the correct path
	v := config.LoadViper(configPath)
	cfg := &config.Config{}
	if err := v.Unmarshal(cfg); err != nil {
		write(fmt.Sprintf("Failed to load config: %v", err))
		os.Exit(1)
	}
	write("Config loaded successfully")
	write(fmt.Sprintf("Database host: %s", cfg.Database.Host))

	// 初始化数据库
	if err := database.Init(cfg); err != nil {
		write(fmt.Sprintf("Failed to initialize database: %v", err))
		os.Exit(1)
	}
	write("Database connected successfully")

	// 查找 admin 用户
	var user entity.User
	result := database.DB.Where("username = ?", "admin").First(&user)
	if result.Error != nil {
		write(fmt.Sprintf("Admin user not found: %v", result.Error))
		write("Creating admin user...")
		createAdminUser()
		os.Exit(0)
	}

	write("Admin user found:")
	write(fmt.Sprintf("  UserId: %d", user.UserId))
	write(fmt.Sprintf("  Username: %s", user.Username))
	write(fmt.Sprintf("  Password hash: %s", user.Password))
	write(fmt.Sprintf("  Role: %s", user.Role))
	write(fmt.Sprintf("  Status: %d", user.Status))

	// 验证密码
	testPassword := "admin"
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(testPassword))
	if err != nil {
		write(fmt.Sprintf("\nPassword verification FAILED: %v", err))
		write("This explains why admin/admin cannot login!")
		write("Fixing admin password...")
		fixAdminPassword(user.UserId)
	} else {
		write(fmt.Sprintf("\nPassword verification SUCCESS"))
		write("Admin login should work!")
	}
}

func createAdminUser() {
	file, _ := os.Create("test_admin.log")
	defer file.Close()
	write := func(msg string) {
		file.WriteString(msg + "\n")
		fmt.Println(msg)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	if err != nil {
		write(fmt.Sprintf("Failed to hash password: %v", err))
		return
	}

	admin := entity.User{
		Username: "admin",
		Password: string(hashedPassword),
		Phone:    "13800000000",
		Email:    "admin@mamoji.com",
		Status:   1,
		Role:     "admin",
	}

	if err := database.DB.Create(&admin).Error; err != nil {
		write(fmt.Sprintf("Failed to create admin: %v", err))
		return
	}

	write(fmt.Sprintf("Admin user created: %s / admin", admin.Username))
	write(fmt.Sprintf("Password hash: %s", admin.Password))
}

func fixAdminPassword(userId int64) {
	file, _ := os.Create("test_admin.log")
	defer file.Close()
	write := func(msg string) {
		file.WriteString(msg + "\n")
		fmt.Println(msg)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	if err != nil {
		write(fmt.Sprintf("Failed to hash password: %v", err))
		return
	}

	if err := database.DB.Model(&entity.User{}).Where("user_id = ?", userId).Update("password", string(hashedPassword)).Error; err != nil {
		write(fmt.Sprintf("Failed to update password: %v", err))
		return
	}

	write(fmt.Sprintf("Admin password fixed for userId: %d", userId))
}
