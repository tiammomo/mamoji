package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 连接数据库
	dsn := "mamoji:v*hhA7)1oyNG)nnjfw5AcO7*KmbZ1vA@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("数据库连接测试失败: %v", err)
	}
	fmt.Println("✓ 数据库连接成功")

	// 检查表结构
	var columnCount int
	err = db.QueryRow("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='mamoji' AND table_name='biz_account' AND column_name='available_balance'").Scan(&columnCount)
	if err != nil {
		log.Fatalf("查询失败: %v", err)
	}

	if columnCount > 0 {
		fmt.Println("✓ available_balance 列已存在")
	} else {
		fmt.Println("→ 开始添加新列...")

		// 添加 available_balance 列
		_, err = db.Exec(`ALTER TABLE biz_account ADD COLUMN available_balance DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '可支配金额' AFTER balance`)
		if err != nil {
			log.Printf("警告: 添加 available_balance 列失败: %v", err)
		} else {
			fmt.Println("✓ 添加 available_balance 列成功")
		}

		// 添加 invested_amount 列
		_, err = db.Exec(`ALTER TABLE biz_account ADD COLUMN invested_amount DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '投资中金额' AFTER available_balance`)
		if err != nil {
			log.Printf("警告: 添加 invested_amount 列失败: %v", err)
		} else {
			fmt.Println("✓ 添加 invested_amount 列成功")
		}

		// 迁移数据
		fmt.Println("→ 迁移数据...")
		result, err := db.Exec(`UPDATE biz_account SET available_balance = COALESCE(balance, 0), invested_amount = 0 WHERE status = 1`)
		if err != nil {
			log.Printf("警告: 数据迁移失败: %v", err)
		} else {
			rows, _ := result.RowsAffected()
			fmt.Printf("✓ 数据迁移完成，影响 %d 条记录\n", rows)
		}
	}

	// 检查现有数据
	fmt.Println("\n→ 验证数据...")
	rows, err := db.Query(`
		SELECT account_id, name, type,
		       COALESCE(available_balance, 0) as available_balance,
		       COALESCE(invested_amount, 0) as invested_amount
		FROM biz_account WHERE status = 1
	`)
	if err != nil {
		log.Fatalf("查询账户数据失败: %v", err)
	}
	defer rows.Close()

	fmt.Println("\n账户列表:")
	fmt.Println("|---------|-------------|----------|----------------|---------------|")
	fmt.Println("| ID      | 名称        | 类型     | 可支配金额     | 投资中金额    |")
	fmt.Println("|---------|-------------|----------|----------------|---------------|")

	for rows.Next() {
		var id int
		var name, atype string
		var available, invested float64
		if err := rows.Scan(&id, &name, &atype, &available, &invested); err != nil {
			log.Printf("读取数据失败: %v", err)
			continue
		}
		fmt.Printf("| %-7d | %-11s | %-8s | %14.2f | %13.2f |\n", id, name, atype, available, invested)
	}
	fmt.Println("|---------|-------------|----------|----------------|---------------|")

	// 计算总余额
	var totalAvailable, totalInvested float64
	err = db.QueryRow(`SELECT COALESCE(SUM(available_balance), 0), COALESCE(SUM(invested_amount), 0) FROM biz_account WHERE status = 1`).Scan(&totalAvailable, &totalInvested)
	if err == nil {
		fmt.Printf("\n总可支配金额: %.2f\n", totalAvailable)
		fmt.Printf("总投资中金额: %.2f\n", totalInvested)
		fmt.Printf("总余额: %.2f\n", totalAvailable+totalInvested)
	}

	fmt.Println("\n✓ 迁移验证完成!")
}
