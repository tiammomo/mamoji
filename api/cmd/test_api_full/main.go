package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "http://localhost:8888"

var testResults []TestResult
var authToken string
var enterpriseId int64

type TestResult struct {
	Module    string
	Endpoint  string
	Method    string
	Status    int
	Passed    bool
	Message   string
	Response  string
}

func main() {
	fmt.Println("========== 后端完整接口验证测试 ==========")
	fmt.Println()

	// Step 1: Login
	if !login() {
		fmt.Println("登录失败，终止测试")
		return
	}

	// Step 2: Test all modules with authentication
	testAccountModule()
	testTransactionModule()
	testBudgetModule()
	testSettingsModule()

	// Print summary
	printSummary()
}

func login() bool {
	fmt.Println("--- 用户登录 ---")
	loginData := map[string]string{
		"username": "admin",
		"password": "admin",
	}
	jsonData, _ := json.Marshal(loginData)
	resp, err := http.Post(baseURL+"/api/v1/auth/login", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("  ❌ 登录请求失败: %v\n", err)
		return false
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if resp.StatusCode == 200 && result["code"] == float64(0) {
		authToken = result["data"].(map[string]interface{})["token"].(string)
		userData := result["data"].(map[string]interface{})["user"].(map[string]interface{})
		enterpriseId = int64(userData["enterpriseId"].(float64))
		fmt.Printf("  ✅ 登录成功, EnterpriseId: %d\n", enterpriseId)
		return true
	}
	fmt.Printf("  ❌ 登录失败: %s\n", string(body))
	return false
}

func makeRequest(method, path string, data interface{}) (*http.Response, []byte, error) {
	var body []byte
	var req *http.Request

	if data != nil {
		jsonData, _ := json.Marshal(data)
		req, _ = http.NewRequest(method, baseURL+path, bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, baseURL+path, nil)
	}

	req.Header.Set("Authorization", "Bearer "+authToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, err
	}

	body, _ = io.ReadAll(resp.Body)
	resp.Body = io.NopCloser(bytes.NewBuffer(body))

	return resp, body, nil
}

func testAccountModule() {
	fmt.Println("\n--- 测试账户管理模块 ---")

	// Test list accounts
	fmt.Println("  [GET] /api/v1/accounts - 获取账户列表")
	resp, body, err := makeRequest("GET", "/api/v1/accounts", nil)
	if err != nil {
		recordResult("Account", "/api/v1/accounts", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Account", "/api/v1/accounts", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Account", "/api/v1/accounts", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test get account summary
	fmt.Println("  [GET] /api/v1/accounts/summary - 获取账户汇总")
	resp, body, err = makeRequest("GET", "/api/v1/accounts/summary", nil)
	if err != nil {
		recordResult("Account", "/api/v1/accounts/summary", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Account", "/api/v1/accounts/summary", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Account", "/api/v1/accounts/summary", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test create account
	fmt.Println("  [POST] /api/v1/accounts - 创建账户")
	accountData := map[string]interface{}{
		"type":              "bank",
		"name":              "测试账户",
		"accountNo":         "6222021234567890",
		"bankCardType":      "储蓄卡",
		"availableBalance":  10000.00,
		"investedAmount":    0.00,
	}
	resp, body, err = makeRequest("POST", "/api/v1/accounts", accountData)
	if err != nil {
		recordResult("Account", "/api/v1/accounts", "POST", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		var result map[string]interface{}
		json.Unmarshal(body, &result)
		if resp.StatusCode == 200 && result["code"] == float64(0) {
			recordResult("Account", "/api/v1/accounts", "POST", 200, true, "Account created", string(body))
			fmt.Printf("    ✅ 成功, 账户ID: %d\n", int(result["data"].(map[string]interface{})["accountId"].(float64)))
		} else {
			recordResult("Account", "/api/v1/accounts", "POST", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}
}

func testTransactionModule() {
	fmt.Println("\n--- 测试交易记录模块 ---")

	// Test list transactions
	fmt.Println("  [GET] /api/v1/transactions - 获取交易列表")
	resp, body, err := makeRequest("GET", "/api/v1/transactions", nil)
	if err != nil {
		recordResult("Transaction", "/api/v1/transactions", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Transaction", "/api/v1/transactions", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Transaction", "/api/v1/transactions", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test create transaction (income)
	fmt.Println("  [POST] /api/v1/transactions - 创建收入交易")
	txData := map[string]interface{}{
		"type":       "income",
		"category":   "工资",
		"amount":     5000.00,
		"accountId":  1,
		"occurredAt": time.Now().Format("2006-01-02 15:04:05"),
		"note":       "测试收入",
	}
	resp, body, err = makeRequest("POST", "/api/v1/transactions", txData)
	if err != nil {
		recordResult("Transaction", "/api/v1/transactions", "POST", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		var result map[string]interface{}
		json.Unmarshal(body, &result)
		if resp.StatusCode == 200 && result["code"] == float64(0) {
			recordResult("Transaction", "/api/v1/transactions", "POST", 200, true, "Transaction created", string(body))
			fmt.Printf("    ✅ 成功, 交易ID: %d\n", int(result["data"].(map[string]interface{})["transactionId"].(float64)))
		} else {
			recordResult("Transaction", "/api/v1/transactions", "POST", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test create transaction (expense)
	fmt.Println("  [POST] /api/v1/transactions - 创建支出交易")
	expenseData := map[string]interface{}{
		"type":       "expense",
		"category":   "餐饮",
		"amount":     200.00,
		"accountId":  1,
		"occurredAt": time.Now().Format("2006-01-02 15:04:05"),
		"note":       "测试支出",
	}
	resp, body, err = makeRequest("POST", "/api/v1/transactions", expenseData)
	if err != nil {
		recordResult("Transaction", "/api/v1/transactions (expense)", "POST", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		var result map[string]interface{}
		json.Unmarshal(body, &result)
		if resp.StatusCode == 200 && result["code"] == float64(0) {
			recordResult("Transaction", "/api/v1/transactions (expense)", "POST", 200, true, "Expense created", string(body))
			fmt.Printf("    ✅ 成功\n")
		} else {
			recordResult("Transaction", "/api/v1/transactions (expense)", "POST", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}
}

func testBudgetModule() {
	fmt.Println("\n--- 测试预算管理模块 ---")

	// Test list budgets
	fmt.Println("  [GET] /api/v1/budgets - 获取预算列表")
	resp, body, err := makeRequest("GET", "/api/v1/budgets", nil)
	if err != nil {
		recordResult("Budget", "/api/v1/budgets", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Budget", "/api/v1/budgets", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Budget", "/api/v1/budgets", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test create budget
	fmt.Println("  [POST] /api/v1/budgets - 创建预算")
	budgetData := map[string]interface{}{
		"name":        "月度餐饮预算",
		"type":        "expense",
		"category":    "餐饮",
		"totalAmount": 2000.00,
		"periodStart": time.Now().Format("2006-01-02"),
		"periodEnd":   time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
	}
	resp, body, err = makeRequest("POST", "/api/v1/budgets", budgetData)
	if err != nil {
		recordResult("Budget", "/api/v1/budgets", "POST", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		var result map[string]interface{}
		json.Unmarshal(body, &result)
		if resp.StatusCode == 200 && result["code"] == float64(0) {
			recordResult("Budget", "/api/v1/budgets", "POST", 200, true, "Budget created", string(body))
			fmt.Printf("    ✅ 成功, 预算ID: %d\n", int(result["data"].(map[string]interface{})["budgetId"].(float64)))
		} else {
			recordResult("Budget", "/api/v1/budgets", "POST", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}
}

func testSettingsModule() {
	fmt.Println("\n--- 测试系统设置模块 ---")

	// Test get enterprise
	fmt.Println("  [GET] /api/v1/settings/enterprise - 获取企业信息")
	resp, body, err := makeRequest("GET", "/api/v1/settings/enterprise", nil)
	if err != nil {
		recordResult("Settings", "/api/v1/settings/enterprise", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Settings", "/api/v1/settings/enterprise", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Settings", "/api/v1/settings/enterprise", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test update enterprise
	fmt.Println("  [PUT] /api/v1/settings/enterprise - 更新企业信息")
	enterpriseData := map[string]interface{}{
		"enterpriseName": "测试企业",
		"contactPerson":  "管理员",
		"contactPhone":   "13800138000",
	}
	resp, body, err = makeRequest("PUT", "/api/v1/settings/enterprise", enterpriseData)
	if err != nil {
		recordResult("Settings", "/api/v1/settings/enterprise", "PUT", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		var result map[string]interface{}
		json.Unmarshal(body, &result)
		if resp.StatusCode == 200 && result["code"] == float64(0) {
			recordResult("Settings", "/api/v1/settings/enterprise", "PUT", 200, true, "Updated", string(body))
			fmt.Printf("    ✅ 成功\n")
		} else {
			recordResult("Settings", "/api/v1/settings/enterprise", "PUT", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test get users
	fmt.Println("  [GET] /api/v1/settings/users - 获取用户列表")
	resp, body, err = makeRequest("GET", "/api/v1/settings/users?page=1&pageSize=10", nil)
	if err != nil {
		recordResult("Settings", "/api/v1/settings/users", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Settings", "/api/v1/settings/users", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Settings", "/api/v1/settings/users", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test get roles
	fmt.Println("  [GET] /api/v1/settings/roles - 获取角色列表")
	resp, body, err = makeRequest("GET", "/api/v1/settings/roles", nil)
	if err != nil {
		recordResult("Settings", "/api/v1/settings/roles", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Settings", "/api/v1/settings/roles", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Settings", "/api/v1/settings/roles", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}

	// Test get preferences
	fmt.Println("  [GET] /api/v1/settings/preferences - 获取偏好设置")
	resp, body, err = makeRequest("GET", "/api/v1/settings/preferences", nil)
	if err != nil {
		recordResult("Settings", "/api/v1/settings/preferences", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
	} else {
		if resp.StatusCode == 200 {
			recordResult("Settings", "/api/v1/settings/preferences", "GET", 200, true, "Success", string(body))
			fmt.Printf("    ✅ 成功, 返回 %d 字节\n", len(body))
		} else {
			recordResult("Settings", "/api/v1/settings/preferences", "GET", resp.StatusCode, false, "Failed", string(body))
			fmt.Printf("    ❌ 失败: %d - %s\n", resp.StatusCode, string(body))
		}
	}
}

func recordResult(module, endpoint, method string, status int, passed bool, message, response string) {
	testResults = append(testResults, TestResult{
		Module:   module,
		Endpoint: endpoint,
		Method:   method,
		Status:   status,
		Passed:   passed,
		Message:  message,
		Response: response,
	})
}

func printSummary() {
	fmt.Println("\n========== 测试结果汇总 ==========")

	passed := 0
	failed := 0

	for _, r := range testResults {
		status := "✅"
		if !r.Passed {
			status = "❌"
			failed++
		} else {
			passed++
		}
		fmt.Printf("%s [%s] %s %s - %s\n", status, r.Module, r.Method, r.Endpoint, r.Message)
	}

	fmt.Println()
	fmt.Printf("总测试数: %d\n", len(testResults))
	fmt.Printf("通过: %d\n", passed)
	fmt.Printf("失败: %d\n", failed)
}
