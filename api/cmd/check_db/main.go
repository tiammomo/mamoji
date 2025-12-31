package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "mamoji:v*hhA7)1oyNG)nnjfw5AcO7*KmbZ1vA@tcp(rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com:3306)/mamoji?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 查询表结构
	rows, err := db.Query("DESCRIBE biz_account")
	if err != nil {
		log.Fatalf("查询表结构失败: %v", err)
	}
	defer rows.Close()

	fmt.Println("biz_account 表结构:")
	fmt.Println("+-----------------+---------------+------+-----+---------+----------------+")
	fmt.Println("| Field           | Type          | Null | Key | Default | Extra          |")
	fmt.Println("+-----------------+---------------+------+-----+---------+----------------+")
	for rows.Next() {
		var field, fieldType, null, key, def, extra string
		rows.Scan(&field, &fieldType, &null, &key, &def, &extra)
		fmt.Printf("| %-15s | %-13s | %-4s | %-3s | %-7s | %-14s |\n", field, fieldType, null, key, def, extra)
	}
	fmt.Println("+-----------------+---------------+------+-----+---------+----------------+")

	// 查询一条记录
	fmt.Println("\n示例数据:")
	var id int
	var name string
	var balance, available, invested sql.NullFloat64
	err = db.QueryRow("SELECT account_id, name, balance, available_balance, invested_amount FROM biz_account LIMIT 1").Scan(&id, &name, &balance, &available, &invested)
	if err != nil {
		log.Printf("查询数据失败: %v", err)
	} else {
		fmt.Printf("ID: %d, Name: %s\n", id, name)
		fmt.Printf("balance: %v\n", balance)
		fmt.Printf("available_balance: %v\n", available)
		fmt.Printf("invested_amount: %v\n", invested)
	}
}
