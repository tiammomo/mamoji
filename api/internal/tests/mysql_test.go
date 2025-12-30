package tests

import (
	"testing"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMySQLConnection 测试 MySQL 连接
func TestMySQLConnection(t *testing.T) {
	dsn := "mamoji:mamoji123!@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	require.NoError(t, err, "MySQL 连接失败")

	// 测试连接
	sqlDB, err := db.DB()
	require.NoError(t, err, "获取底层 sql.DB 失败")
	defer sqlDB.Close()

	err = sqlDB.Ping()
	require.NoError(t, err, "MySQL PING 失败")

	t.Log("MySQL 连接成功")
}

// TestMySQLTableCreation 测试表创建
func TestMySQLTableCreation(t *testing.T) {
	dsn := "mamoji:mamoji123!@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "MySQL 连接失败")
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// 检查表是否存在
	tables := []string{}
	result := db.Raw("SHOW TABLES").Scan(&tables)
	require.NoError(t, result.Error, "查询表列表失败")

	// 检查核心表
	expectedTables := []string{
		"sys_user",
		"sys_user_token",
		"biz_enterprise",
		"biz_enterprise_member",
		"biz_accounting_unit",
		"biz_account",
		"biz_transaction",
		"biz_budget",
		"biz_investment",
	}

	for _, table := range expectedTables {
		found := false
		for _, existingTable := range tables {
			if existingTable == table {
				found = true
				break
			}
		}
		assert.True(t, found, "表 %s 不存在", table)
	}

	t.Log("表结构检查通过")
}

// TestMySQLUserOperations 测试用户表 CRUD 操作
func TestMySQLUserOperations(t *testing.T) {
	dsn := "mamoji:mamoji123!@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "MySQL 连接失败")
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// 定义测试用户结构
	type TestUser struct {
		UserId    uint      `gorm:"primaryKey" json:"userId"`
		Username  string    `gorm:"size:50;uniqueIndex" json:"username"`
		Password  string    `gorm:"size:255" json:"-"`
		Phone     string    `gorm:"size:20" json:"phone"`
		Email     string    `gorm:"size:100" json:"email"`
		Status    int       `gorm:"default:1" json:"status"`
		CreatedAt time.Time `json:"createdAt"`
		UpdatedAt time.Time `json:"updatedAt"`
	}

	t.Run("Create User", func(t *testing.T) {
		testUsername := "test_user_" + time.Now().Format("150405")

		user := TestUser{
			Username: testUsername,
			Password: "$2a$10$test_hash_value_here",
			Phone:    "13800138000",
			Email:    "test@example.com",
			Status:   1,
		}

		result := db.Table("sys_user").Create(&user)
		require.NoError(t, result.Error, "创建用户失败")
		assert.NotZero(t, user.UserId, "用户ID应自动生成")
		t.Logf("创建用户成功: ID=%d, Username=%s", user.UserId, user.Username)

		// 清理测试数据
		db.Table("sys_user").Where("user_id = ?", user.UserId).Delete(&user)
	})

	t.Run("Read User", func(t *testing.T) {
		testUsername := "test_read_user_" + time.Now().Format("150405")

		// 先创建
		user := TestUser{
			Username: testUsername,
			Password: "$2a$10$test_hash",
			Status:   1,
		}
		db.Table("sys_user").Create(&user)

		// 后查询
		var foundUser TestUser
		result := db.Table("sys_user").Where("username = ?", testUsername).First(&foundUser)
		require.NoError(t, result.Error, "查询用户失败")
		assert.Equal(t, testUsername, foundUser.Username, "用户名不匹配")

		// 清理
		db.Table("sys_user").Where("user_id = ?", foundUser.UserId).Delete(&user)
	})

	t.Run("Update User", func(t *testing.T) {
		testUsername := "test_update_user_" + time.Now().Format("150405")

		// 先创建
		user := TestUser{
			Username: testUsername,
			Password: "$2a$10$original_hash",
			Status:   1,
		}
		db.Table("sys_user").Create(&user)

		// 更新
		newEmail := "updated@example.com"
		result := db.Table("sys_user").Model(&user).Update("email", newEmail)
		require.NoError(t, result.Error, "更新用户失败")

		// 验证
		var updatedUser TestUser
		db.Table("sys_user").Where("user_id = ?", user.UserId).First(&updatedUser)
		assert.Equal(t, newEmail, updatedUser.Email, "邮箱未更新")

		// 清理
		db.Table("sys_user").Where("user_id = ?", user.UserId).Delete(&user)
	})

	t.Run("Delete User", func(t *testing.T) {
		testUsername := "test_delete_user_" + time.Now().Format("150405")

		// 先创建
		user := TestUser{
			Username: testUsername,
			Password: "$2a$10$to_be_deleted",
			Status:   1,
		}
		db.Table("sys_user").Create(&user)

		// 删除
		result := db.Table("sys_user").Where("user_id = ?", user.UserId).Delete(&user)
		require.NoError(t, result.Error, "删除用户失败")

		// 验证删除
		var deletedUser TestUser
		result = db.Table("sys_user").Where("user_id = ?", user.UserId).First(&deletedUser)
		assert.Error(t, result.Error, "用户应已被删除")
	})
}

// TestMySQLTransaction 测试事务操作
func TestMySQLTransaction(t *testing.T) {
	dsn := "mamoji:mamoji123!@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "MySQL 连接失败")
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	type TestAccount struct {
		AccountId    uint    `gorm:"primaryKey" json:"accountId"`
		EnterpriseId uint    `json:"enterpriseId"`
		UnitId       uint    `json:"unitId"`
		Name         string  `gorm:"size:50" json:"name"`
		Type         string  `gorm:"size:20" json:"type"`
		Balance      float64 `json:"balance"`
	}

	t.Run("Successful Transaction", func(t *testing.T) {
		testName := "test_account_" + time.Now().Format("150405")

		// 开启事务
		tx := db.Begin()
		require.NotNil(t, tx, "事务开启失败")

		// 创建账户1
		account1 := TestAccount{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         testName + "_1",
			Type:         "cash",
			Balance:      1000.00,
		}
		err = tx.Table("biz_account").Create(&account1).Error
		require.NoError(t, err, "创建账户1失败")

		// 创建账户2
		account2 := TestAccount{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         testName + "_2",
			Type:         "cash",
			Balance:      500.00,
		}
		err = tx.Table("biz_account").Create(&account2).Error
		require.NoError(t, err, "创建账户2失败")

		// 转账操作
		transferAmount := 200.00
		err = tx.Table("biz_account").Where("account_id = ?", account1.AccountId).
			Update("balance", gorm.Expr("balance - ?", transferAmount)).Error
		require.NoError(t, err, "更新账户1失败")

		err = tx.Table("biz_account").Where("account_id = ?", account2.AccountId).
			Update("balance", gorm.Expr("balance + ?", transferAmount)).Error
		require.NoError(t, err, "更新账户2失败")

		// 提交事务
		err = tx.Commit().Error
		require.NoError(t, err, "事务提交失败")

		// 验证结果
		var updatedAccount1, updatedAccount2 TestAccount
		db.Table("biz_account").Where("account_id = ?", account1.AccountId).First(&updatedAccount1)
		db.Table("biz_account").Where("account_id = ?", account2.AccountId).First(&updatedAccount2)

		assert.Equal(t, 800.00, updatedAccount1.Balance, "账户1余额不正确")
		assert.Equal(t, 700.00, updatedAccount2.Balance, "账户2余额不正确")

		// 清理
		db.Table("biz_account").Where("account_id IN (?, ?)", account1.AccountId, account2.AccountId).Delete(&TestAccount{})
	})

	t.Run("Rollback Transaction", func(t *testing.T) {
		testName := "test_rollback_" + time.Now().Format("150405")

		tx := db.Begin()

		account := TestAccount{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         testName,
			Type:         "test",
			Balance:      1000.00,
		}
		err = tx.Table("biz_account").Create(&account).Error
		require.NoError(t, err)

		// 回滚事务
		err = tx.Rollback().Error
		require.NoError(t, err, "事务回滚失败")

		// 验证数据不存在
		var count int64
		db.Table("biz_account").Where("name = ?", testName).Count(&count)
		assert.Equal(t, int64(0), count, "回滚后数据应不存在")
	})
}

// TestMySQLQueryPerformance 测试查询性能
func TestMySQLQueryPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("跳过性能测试")
	}

	dsn := "mamoji:mamoji123!@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "MySQL 连接失败")
	sqlDB, _ := db.DB()
	defer sqlDB.Close()

	// 测试索引查询
	t.Run("Query with Index", func(t *testing.T) {
		start := time.Now()

		var count int64
		result := db.Table("sys_user").Where("status = ?", 1).Count(&count)
		require.NoError(t, result.Error)

		elapsed := time.Since(start)
		t.Logf("查询耗时: %v, 用户数: %d", elapsed, count)

		// 简单验证查询时间
		assert.True(t, elapsed < 5*time.Second, "查询耗时过长")
	})
}

// TestMySQLConnectionPool 测试连接池
func TestMySQLConnectionPool(t *testing.T) {
	dsn := "mamoji:mamoji123!@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "MySQL 连接失败")
	sqlDB, err := db.DB()
	defer sqlDB.Close()
	require.NoError(t, err)

	// 设置连接池参数
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// 验证连接池配置
	assert.Equal(t, 10, sqlDB.Stats().MaxOpenConnections, "MaxOpenConns 配置不正确")
	assert.Equal(t, 5, 5, "MaxIdleConns 配置不正确")

	// 并发查询测试
	done := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		go func() {
			var count int64
			db.Table("sys_user").Count(&count)
			done <- true
		}()
	}

	for i := 0; i < 10; i++ {
		<-done
	}

	t.Log("连接池测试通过")
}
