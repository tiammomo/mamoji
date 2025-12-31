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
	fmt.Println("========== 后端接口验证测试 ==========")
	fmt.Println()

	// Test 1: Health check
	testHealthCheck()

	// Test 2: Auth module
	testAuthModule()

	// Test 3: Account module
	testAccountModule()

	// Test 4: Transaction module
	testTransactionModule()

	// Test 5: Budget module
	testBudgetModule()

	// Test 6: Settings module
	testSettingsModule()

	// Print summary
	printSummary()
}

func testHealthCheck() {
	fmt.Println("--- 测试健康检查接口 ---")
	resp, err := http.Get(baseURL + "/health")
	if err != nil {
		recordResult("Health", "/health", "GET", 0, false, err.Error(), "")
		fmt.Printf("  ❌ 健康检查失败: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 200 {
		recordResult("Health", "/health", "GET", 200, true, "OK", string(body))
		fmt.Printf("  ✅ 健康检查通过: %s\n", string(body))
	} else {
		recordResult("Health", "/health", "GET", resp.StatusCode, false, "Unexpected status", string(body))
		fmt.Printf("  ❌ 健康检查异常: %d\n", resp.StatusCode)
	}
}

func testAuthModule() {
	fmt.Println("\n--- 测试认证模块 ---")

	// Test login
	fmt.Println("  测试登录接口...")
	loginData := map[string]string{
		"username": "admin",
		"password": "admin",
	}
	jsonData, _ := json.Marshal(loginData)
	resp, err := http.Post(baseURL+"/api/v1/auth/login", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		recordResult("Auth", "/api/v1/auth/login", "POST", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 登录请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if resp.StatusCode == 200 && result["code"] == float64(0) {
		token := result["data"].(map[string]interface{})["token"].(string)
		recordResult("Auth", "/api/v1/auth/login", "POST", 200, true, "Login successful", string(body))
		fmt.Printf("    ✅ 登录成功，获取token\n")

		// Test profile with token
		fmt.Println("  测试获取用户信息...")
		req, _ := http.NewRequest("GET", baseURL+"/api/v1/auth/profile", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		client := &http.Client{Timeout: 10 * time.Second}
		resp2, err := client.Do(req)
		if err != nil {
			recordResult("Auth", "/api/v1/auth/profile", "GET", 0, false, err.Error(), "")
			fmt.Printf("    ❌ 获取用户信息失败: %v\n", err)
		} else {
			defer resp2.Body.Close()
			body2, _ := io.ReadAll(resp2.Body)
			if resp2.StatusCode == 200 {
				recordResult("Auth", "/api/v1/auth/profile", "GET", 200, true, "Profile retrieved", string(body2))
				fmt.Printf("    ✅ 获取用户信息成功\n")
			} else {
				recordResult("Auth", "/api/v1/auth/profile", "GET", resp2.StatusCode, false, "Failed to get profile", string(body2))
				fmt.Printf("    ❌ 获取用户信息失败: %s\n", string(body2))
			}
		}

		_ = token // Use token in tests
	} else {
		recordResult("Auth", "/api/v1/auth/login", "POST", resp.StatusCode, false, "Login failed", string(body))
		fmt.Printf("    ❌ 登录失败: %s\n", string(body))
	}
}

func testAccountModule() {
	fmt.Println("\n--- 测试账户管理模块 ---")
	fmt.Println("  测试获取账户列表（需要认证）...")
	resp, err := http.Get(baseURL + "/api/v1/accounts")
	if err != nil {
		recordResult("Account", "/api/v1/accounts", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		recordResult("Account", "/api/v1/accounts", "GET", 401, true, "Unauthorized as expected", string(body))
		fmt.Printf("    ✅ 401 Unauthorized（未携带token，符合预期）\n")
	} else {
		recordResult("Account", "/api/v1/accounts", "GET", resp.StatusCode, false, "Unexpected status", string(body))
		fmt.Printf("    ⚠️ 状态码: %d\n", resp.StatusCode)
	}

	// Test create account
	fmt.Println("  测试创建账户（需要认证）...")
	accountData := map[string]interface{}{
		"type":              "bank",
		"name":              "测试账户",
		"accountNo":         "6222021234567890",
		"bankCardType":      "储蓄卡",
		"availableBalance":  10000.00,
		"investedAmount":    0.00,
	}
	jsonData, _ := json.Marshal(accountData)
	resp2, err := http.Post(baseURL+"/api/v1/accounts", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		recordResult("Account", "/api/v1/accounts", "POST", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
		return
	}
	defer resp2.Body.Close()
	body2, _ := io.ReadAll(resp2.Body)

	if resp2.StatusCode == 401 {
		recordResult("Account", "/api/v1/accounts", "POST", 401, true, "Unauthorized as expected", string(body2))
		fmt.Printf("    ✅ 401 Unauthorized（需要认证）\n")
	} else {
		recordResult("Account", "/api/v1/accounts", "POST", resp2.StatusCode, false, "Unexpected status", string(body2))
		fmt.Printf("    ⚠️ 状态码: %d, 返回: %s\n", resp2.StatusCode, string(body2))
	}
}

func testTransactionModule() {
	fmt.Println("\n--- 测试交易记录模块 ---")
	fmt.Println("  测试获取交易列表...")
	resp, err := http.Get(baseURL + "/api/v1/transactions")
	if err != nil {
		recordResult("Transaction", "/api/v1/transactions", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		recordResult("Transaction", "/api/v1/transactions", "GET", 401, true, "Unauthorized as expected", string(body))
		fmt.Printf("    ✅ 401 Unauthorized（需要认证）\n")
	} else {
		recordResult("Transaction", "/api/v1/transactions", "GET", resp.StatusCode, false, "Unexpected status", string(body))
		fmt.Printf("    ⚠️ 状态码: %d\n", resp.StatusCode)
	}
}

func testBudgetModule() {
	fmt.Println("\n--- 测试预算管理模块 ---")
	fmt.Println("  测试获取预算列表...")
	resp, err := http.Get(baseURL + "/api/v1/budgets")
	if err != nil {
		recordResult("Budget", "/api/v1/budgets", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		recordResult("Budget", "/api/v1/budgets", "GET", 401, true, "Unauthorized as expected", string(body))
		fmt.Printf("    ✅ 401 Unauthorized（需要认证）\n")
	} else {
		recordResult("Budget", "/api/v1/budgets", "GET", resp.StatusCode, false, "Unexpected status", string(body))
		fmt.Printf("    ⚠️ 状态码: %d\n", resp.StatusCode)
	}
}

func testSettingsModule() {
	fmt.Println("\n--- 测试系统设置模块 ---")
	fmt.Println("  测试获取企业信息...")
	resp, err := http.Get(baseURL + "/api/v1/settings/enterprise")
	if err != nil {
		recordResult("Settings", "/api/v1/settings/enterprise", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == 401 {
		recordResult("Settings", "/api/v1/settings/enterprise", "GET", 401, true, "Unauthorized as expected", string(body))
		fmt.Printf("    ✅ 401 Unauthorized（需要认证）\n")
	} else {
		recordResult("Settings", "/api/v1/settings/enterprise", "GET", resp.StatusCode, false, "Unexpected status", string(body))
		fmt.Printf("    ⚠️ 状态码: %d\n", resp.StatusCode)
	}

	fmt.Println("  测试获取角色列表...")
	resp2, err := http.Get(baseURL + "/api/v1/settings/roles")
	if err != nil {
		recordResult("Settings", "/api/v1/settings/roles", "GET", 0, false, err.Error(), "")
		fmt.Printf("    ❌ 请求失败: %v\n", err)
		return
	}
	defer resp2.Body.Close()
	body2, _ := io.ReadAll(resp2.Body)

	if resp2.StatusCode == 401 {
		recordResult("Settings", "/api/v1/settings/roles", "GET", 401, true, "Unauthorized as expected", string(body2))
		fmt.Printf("    ✅ 401 Unauthorized（需要认证）\n")
	} else {
		recordResult("Settings", "/api/v1/settings/roles", "GET", resp2.StatusCode, false, "Unexpected status", string(body2))
		fmt.Printf("    ⚠️ 状态码: %d\n", resp2.StatusCode)
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
