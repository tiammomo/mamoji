package server

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/app/server/registry"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"github.com/hertz-contrib/swagger"
	swaggerFiles "github.com/swaggo/files"
	"mamoji/api/internal/config"
	"mamoji/api/internal/handler"
	"mamoji/api/internal/middleware"
)

// Server Hertz服务器
type Server struct {
	cfg *config.Config
	h   *server.Hertz
}

// New 创建服务器
func New(cfg *config.Config) *Server {
	// 配置Hertz
	h := server.New(
		server.WithHostPorts(fmt.Sprintf("%s:%d", cfg.App.Host, cfg.App.Port)),
		server.WithReadTimeout(30*time.Second),
		server.WithWriteTimeout(30*time.Second),
		server.WithMaxRequestBodySize(10<<20), // 10MB
		server.WithExitWaitTime(5*time.Second),
	)

	// Swagger 文档端点（返回 OpenAPI JSON）
	h.GET("/swagger/doc.json", func(ctx context.Context, c *app.RequestContext) {
		c.JSON(200, utils.H{
			"openapi": "3.0.0",
			"info": utils.H{
				"title":       "Mamoji API",
				"version":     "1.0.0",
				"description": "Mamoji 企业财务记账系统 API 文档",
			},
			"servers": []utils.H{
				{"url": "http://localhost:8888"},
			},
			"paths": getSwaggerPaths(),
			"components": utils.H{
				"securitySchemes": utils.H{
					"Bearer": utils.H{
						"type": "apiKey",
						"name": "Authorization",
						"in":   "header",
					},
				},
			},
		})
	})

	// Swagger UI（注册在中间件之前，公开访问）
	h.GET("/swagger/*any", swagger.WrapHandler(swaggerFiles.Handler))

	// 注册中间件
	middleware.Register(h)

	// 注册路由
	handler.Register(h)

	return &Server{
		cfg: cfg,
		h:   h,
	}
}

// Start 启动服务器
func (s *Server) Start() error {
	// 优雅退出
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		s.h.Shutdown(ctx)
	}()

	log.Printf("Server starting on %s:%d", s.cfg.App.Host, s.cfg.App.Port)
	s.h.Spin()
	return nil
}

// Engine 获取Hertz引擎
func (s *Server) Engine() *server.Hertz {
	return s.h
}

// RegisterService 注册服务发现
func (s *Server) RegisterService(info registry.Info) {
	// 服务发现配置
	_ = info
}

// getSwaggerPaths 返回 API 路径定义
func getSwaggerPaths() map[string]interface{} {
	// 通用响应结构
	successResp := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"code":    map[string]interface{}{"type": "integer", "description": "状态码: 0=成功"},
			"message": map[string]interface{}{"type": "string", "description": "状态消息"},
			"data":    map[string]interface{}{"description": "响应数据"},
		},
	}

	// 账户创建请求
	accountCreateReq := map[string]interface{}{
		"type": "object",
		"required": []string{"name", "assetCategory", "unitId"},
		"properties": map[string]interface{}{
			"name":               map[string]interface{}{"type": "string", "description": "账户名称", "example": "我的银行卡"},
			"assetCategory":      map[string]interface{}{"type": "string", "description": "资产大类", "example": "bank_card", "enum": []string{"fund", "credit", "topup", "investment", "debt"}},
			"subType":            map[string]interface{}{"type": "string", "description": "资产子类型", "example": "bank"},
			"unitId":             map[string]interface{}{"type": "integer", "description": "记账单元ID", "example": 1},
			"currency":           map[string]interface{}{"type": "string", "description": "币种", "example": "CNY", "default": "CNY"},
			"accountNo":          map[string]interface{}{"type": "string", "description": "账户号码", "example": "6222****8888"},
			"bankName":           map[string]interface{}{"type": "string", "description": "开户银行", "example": "招商银行"},
			"bankCardType":       map[string]interface{}{"type": "string", "description": "银行卡类型", "example": "type1", "enum": []string{"type1", "type2"}},
			"creditLimit":        map[string]interface{}{"type": "number", "description": "信用额度(信用卡)", "example": 10000.00},
			"billingDate":        map[string]interface{}{"type": "integer", "description": "出账日期(1-28)", "example": 5},
			"repaymentDate":      map[string]interface{}{"type": "integer", "description": "还款日期(1-28)", "example": 20},
			"includeInTotal":     map[string]interface{}{"type": "integer", "description": "是否计入总资产", "example": 1, "enum": []int{0, 1}},
		},
	}

	// 交易创建请求
	transactionCreateReq := map[string]interface{}{
		"type": "object",
		"required": []string{"type", "category", "amount", "accountId", "occurredAt", "unitId"},
		"properties": map[string]interface{}{
			"type":        map[string]interface{}{"type": "string", "description": "交易类型", "example": "expense", "enum": []string{"income", "expense", "transfer"}},
			"category":    map[string]interface{}{"type": "string", "description": "交易类别", "example": "餐饮"},
			"amount":      map[string]interface{}{"type": "number", "description": "交易金额", "example": 100.50},
			"accountId":   map[string]interface{}{"type": "integer", "description": "账户ID", "example": 1},
			"budgetId":    map[string]interface{}{"type": "integer", "description": "预算ID(可选)", "example": 1, "nullable": true},
			"unitId":      map[string]interface{}{"type": "integer", "description": "记账单元ID", "example": 1},
			"occurredAt":  map[string]interface{}{"type": "string", "format": "date-time", "description": "交易时间", "example": "2024-01-15T10:30:00Z"},
			"tags":        map[string]interface{}{"type": "array", "description": "标签列表", "example": []string{"午餐", "工作餐"}},
			"note":        map[string]interface{}{"type": "string", "description": "备注", "example": "公司楼下的快餐店"},
			"images":      map[string]interface{}{"type": "array", "description": "图片URL列表", "example": []string{"https://example.com/img1.jpg"}},
		},
	}

	// 预算创建请求
	budgetCreateReq := map[string]interface{}{
		"type": "object",
		"required": []string{"name", "type", "category", "totalAmount", "periodStart", "periodEnd", "unitId"},
		"properties": map[string]interface{}{
			"name":        map[string]interface{}{"type": "string", "description": "预算名称", "example": "2024年1月餐饮预算"},
			"type":        map[string]interface{}{"type": "string", "description": "预算类型", "example": "expense", "enum": []string{"income", "expense"}},
			"category":    map[string]interface{}{"type": "string", "description": "预算类别", "example": "餐饮"},
			"totalAmount": map[string]interface{}{"type": "number", "description": "预算总金额", "example": 2000.00},
			"periodStart": map[string]interface{}{"type": "string", "format": "date", "description": "开始日期", "example": "2024-01-01"},
			"periodEnd":   map[string]interface{}{"type": "string", "format": "date", "description": "结束日期", "example": "2024-01-31"},
			"unitId":      map[string]interface{}{"type": "integer", "description": "记账单元ID", "example": 1},
		},
	}

	// 投资创建请求
	investmentCreateReq := map[string]interface{}{
		"type": "object",
		"required": []string{"name", "productType", "principal", "unitId"},
		"properties": map[string]interface{}{
			"name":         map[string]interface{}{"type": "string", "description": "投资名称", "example": "余额宝"},
			"productType":  map[string]interface{}{"type": "string", "description": "产品类型", "example": "fund", "enum": []string{"fund", "stock", "bond", "deposit", "insurance", "other"}},
			"productCode":  map[string]interface{}{"type": "string", "description": "产品代码", "example": "000000"},
			"principal":    map[string]interface{}{"type": "number", "description": "本金", "example": 10000.00},
			"platform":     map[string]interface{}{"type": "string", "description": "投资平台", "example": "支付宝"},
			"startDate":    map[string]interface{}{"type": "string", "format": "date", "description": "开始日期", "example": "2024-01-01"},
			"endDate":      map[string]interface{}{"type": "string", "format": "date", "description": "结束日期(可选)", "example": "2024-12-31", "nullable": true},
			"interestRate": map[string]interface{}{"type": "number", "description": "年化利率%", "example": 2.5},
			"reminderDays": map[string]interface{}{"type": "integer", "description": "到期提醒天数", "example": 7},
			"note":         map[string]interface{}{"type": "string", "description": "备注", "example": "随用随取理财"},
			"unitId":       map[string]interface{}{"type": "integer", "description": "记账单元ID", "example": 1},
		},
	}

	// 企业信息更新请求
	enterpriseUpdateReq := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"name":           map[string]interface{}{"type": "string", "description": "企业名称", "example": "科技有限公司"},
			"creditCode":    map[string]interface{}{"type": "string", "description": "统一社会信用代码", "example": "91110000..."},
			"contactPerson": map[string]interface{}{"type": "string", "description": "联系人", "example": "张先生"},
			"contactPhone":  map[string]interface{}{"type": "string", "description": "联系电话", "example": "13800138000"},
			"address":       map[string]interface{}{"type": "string", "description": "地址", "example": "北京市朝阳区xxx"},
			"licenseImage":  map[string]interface{}{"type": "string", "description": "营业执照图片URL", "example": "https://example.com/license.jpg"},
		},
	}

	return map[string]interface{}{
		// Auth
		"/api/v1/auth/login": map[string]interface{}{
			"post": map[string]interface{}{
				"summary":     "用户登录",
				"description": "使用用户名密码获取 JWT Token",
				"tags":        []string{"Auth"},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"type": "object",
								"required": []string{"username", "password"},
								"properties": map[string]interface{}{
									"username": map[string]interface{}{"type": "string", "description": "用户名", "example": "admin"},
									"password": map[string]interface{}{"type": "string", "description": "密码", "example": "123456"},
								},
							},
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "登录成功", "content": map[string]interface{}{"application/json": map[string]interface{}{"schema": successResp}}},
				},
			},
		},
		"/api/v1/auth/register": map[string]interface{}{
			"post": map[string]interface{}{
				"summary":     "用户注册",
				"description": "注册新用户账号",
				"tags":        []string{"Auth"},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"type": "object",
								"required": []string{"username", "password"},
								"properties": map[string]interface{}{
									"username": map[string]interface{}{"type": "string", "description": "用户名", "example": "newuser"},
									"password": map[string]interface{}{"type": "string", "description": "密码", "example": "123456"},
									"phone":    map[string]interface{}{"type": "string", "description": "手机号(可选)", "example": "13800138000"},
									"email":    map[string]interface{}{"type": "string", "description": "邮箱(可选)", "example": "user@example.com"},
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/auth/profile": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取用户信息",
				"description": "获取当前登录用户的详细信息",
				"tags":        []string{"Auth"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
		},
		// Accounts
		"/api/v1/accounts": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取账户列表",
				"description": "获取当前企业所有账户列表",
				"tags":        []string{"Accounts"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "page", "in": "query", "description": "页码，默认1", "required": false, "schema": map[string]interface{}{"type": "integer", "default": 1}},
					map[string]interface{}{"name": "pageSize", "in": "query", "description": "每页数量，默认20", "required": false, "schema": map[string]interface{}{"type": "integer", "default": 20}},
					map[string]interface{}{"name": "assetCategory", "in": "query", "description": "资产大类筛选", "required": false, "schema": map[string]interface{}{"type": "string"}},
				},
			},
			"post": map[string]interface{}{
				"summary":     "创建账户",
				"description": "创建新的资产账户，支持银行卡、信用卡、充值账户、投资理财、债务等类型",
				"tags":        []string{"Accounts"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": accountCreateReq,
						},
					},
				},
			},
		},
		"/api/v1/accounts/{accountId}": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取账户详情",
				"description": "根据账户ID获取账户详细信息",
				"tags":        []string{"Accounts"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "accountId", "in": "path", "description": "账户ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"put": map[string]interface{}{
				"summary":     "更新账户",
				"description": "更新指定账户的信息",
				"tags":        []string{"Accounts"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "accountId", "in": "path", "description": "账户ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": accountCreateReq,
						},
					},
				},
			},
			"delete": map[string]interface{}{
				"summary":     "删除账户",
				"description": "删除指定账户（软删除）",
				"tags":        []string{"Accounts"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "accountId", "in": "path", "description": "账户ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
		},
		"/api/v1/accounts/summary": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取账户汇总",
				"description": "获取所有账户的资产汇总信息",
				"tags":        []string{"Accounts"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
		},
		// Transactions
		"/api/v1/transactions": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取交易列表",
				"description": "获取当前企业的交易流水列表",
				"tags":        []string{"Transactions"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "page", "in": "query", "description": "页码，默认1", "required": false, "schema": map[string]interface{}{"type": "integer", "default": 1}},
					map[string]interface{}{"name": "pageSize", "in": "query", "description": "每页数量，默认20", "required": false, "schema": map[string]interface{}{"type": "integer", "default": 20}},
					map[string]interface{}{"name": "type", "in": "query", "description": "交易类型: income/expense/transfer", "required": false, "schema": map[string]interface{}{"type": "string"}},
					map[string]interface{}{"name": "category", "in": "query", "description": "交易类别", "required": false, "schema": map[string]interface{}{"type": "string"}},
					map[string]interface{}{"name": "startDate", "in": "query", "description": "开始日期", "required": false, "schema": map[string]interface{}{"type": "string", "format": "date"}},
					map[string]interface{}{"name": "endDate", "in": "query", "description": "结束日期", "required": false, "schema": map[string]interface{}{"type": "string", "format": "date"}},
				},
			},
			"post": map[string]interface{}{
				"summary":     "创建交易",
				"description": "新增一笔交易记录（收入、支出或转账）",
				"tags":        []string{"Transactions"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": transactionCreateReq,
						},
					},
				},
			},
		},
		"/api/v1/transactions/{transactionId}": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取交易详情",
				"description": "根据交易ID获取交易详细信息",
				"tags":        []string{"Transactions"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "transactionId", "in": "path", "description": "交易ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"put": map[string]interface{}{
				"summary":     "更新交易",
				"description": "更新指定交易的信息",
				"tags":        []string{"Transactions"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "transactionId", "in": "path", "description": "交易ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": transactionCreateReq,
						},
					},
				},
			},
			"delete": map[string]interface{}{
				"summary":     "删除交易",
				"description": "删除指定交易（软删除）",
				"tags":        []string{"Transactions"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "transactionId", "in": "path", "description": "交易ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
		},
		// Budgets
		"/api/v1/budgets": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取预算列表",
				"description": "获取当前企业的预算列表",
				"tags":        []string{"Budgets"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "page", "in": "query", "description": "页码，默认1", "required": false, "schema": map[string]interface{}{"type": "integer", "default": 1}},
					map[string]interface{}{"name": "pageSize", "in": "query", "description": "每页数量，默认20", "required": false, "schema": map[string]interface{}{"type": "integer", "default": 20}},
					map[string]interface{}{"name": "status", "in": "query", "description": "状态筛选", "required": false, "schema": map[string]interface{}{"type": "string"}},
				},
			},
			"post": map[string]interface{}{
				"summary":     "创建预算",
				"description": "创建新的预算计划",
				"tags":        []string{"Budgets"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": budgetCreateReq,
						},
					},
				},
			},
		},
		"/api/v1/budgets/{budgetId}": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取预算详情",
				"description": "根据预算ID获取预算详细信息",
				"tags":        []string{"Budgets"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "budgetId", "in": "path", "description": "预算ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"put": map[string]interface{}{
				"summary":     "更新预算",
				"description": "更新指定预算的信息",
				"tags":        []string{"Budgets"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "budgetId", "in": "path", "description": "预算ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": budgetCreateReq,
						},
					},
				},
			},
			"delete": map[string]interface{}{
				"summary":     "删除预算",
				"description": "删除指定预算（软删除）",
				"tags":        []string{"Budgets"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "budgetId", "in": "path", "description": "预算ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
		},
		"/api/v1/budgets/{budgetId}/detail": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取预算详情（含统计）",
				"description": "获取预算详细信息及使用统计",
				"tags":        []string{"Budgets"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "budgetId", "in": "path", "description": "预算ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
		},
		// Investments
		"/api/v1/investments": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取投资列表",
				"description": "获取当前企业的投资理财列表",
				"tags":        []string{"Investments"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
			"post": map[string]interface{}{
				"summary":     "创建投资",
				"description": "新增一条投资记录",
				"tags":        []string{"Investments"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": investmentCreateReq,
						},
					},
				},
			},
		},
		"/api/v1/investments/{investmentId}": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取投资详情",
				"description": "根据投资ID获取投资详细信息",
				"tags":        []string{"Investments"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "investmentId", "in": "path", "description": "投资ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"put": map[string]interface{}{
				"summary":     "更新投资",
				"description": "更新指定投资的信息",
				"tags":        []string{"Investments"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "investmentId", "in": "path", "description": "投资ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"delete": map[string]interface{}{
				"summary":     "删除投资",
				"description": "删除指定投资（软删除）",
				"tags":        []string{"Investments"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "investmentId", "in": "path", "description": "投资ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
		},
		// Reports
		"/api/v1/reports/overview": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取概览报表",
				"description": "获取财务数据概览报表",
				"tags":        []string{"Reports"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "startDate", "in": "query", "description": "开始日期", "required": false, "schema": map[string]interface{}{"type": "string", "format": "date"}},
					map[string]interface{}{"name": "endDate", "in": "query", "description": "结束日期", "required": false, "schema": map[string]interface{}{"type": "string", "format": "date"}},
				},
			},
		},
		"/api/v1/reports/category": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取分类报表",
				"description": "按分类统计收支数据",
				"tags":        []string{"Reports"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
		},
		"/api/v1/reports/trend": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取趋势报表",
				"description": "获取收支趋势数据",
				"tags":        []string{"Reports"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
		},
		// Settings
		"/api/v1/settings/enterprise": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取企业信息",
				"description": "获取当前企业的详细信息",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
			"put": map[string]interface{}{
				"summary":     "更新企业信息",
				"description": "更新企业基本信息",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": enterpriseUpdateReq,
						},
					},
				},
			},
		},
		"/api/v1/settings/users": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取用户列表",
				"description": "获取当前企业的用户列表",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
			"post": map[string]interface{}{
				"summary":     "创建用户",
				"description": "在当前企业下创建新用户",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"requestBody": map[string]interface{}{
					"content": map[string]interface{}{
						"application/json": map[string]interface{}{
							"schema": map[string]interface{}{
								"type": "object",
								"required": []string{"username", "password"},
								"properties": map[string]interface{}{
									"username": map[string]interface{}{"type": "string", "description": "用户名", "example": "newuser"},
									"password": map[string]interface{}{"type": "string", "description": "密码", "example": "123456"},
									"role":     map[string]interface{}{"type": "string", "description": "角色", "example": "user"},
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/settings/users/{userId}": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取用户详情",
				"description": "根据用户ID获取用户详细信息",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "userId", "in": "path", "description": "用户ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"put": map[string]interface{}{
				"summary":     "更新用户",
				"description": "更新指定用户的信息",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "userId", "in": "path", "description": "用户ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
			"delete": map[string]interface{}{
				"summary":     "删除用户",
				"description": "删除指定用户（软删除）",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
				"parameters": []interface{}{
					map[string]interface{}{"name": "userId", "in": "path", "description": "用户ID", "required": true, "schema": map[string]interface{}{"type": "integer"}},
				},
			},
		},
		"/api/v1/settings/roles": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取角色列表",
				"description": "获取系统角色列表",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
		},
		"/api/v1/settings/preferences": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "获取偏好设置",
				"description": "获取当前用户的偏好设置",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
			"put": map[string]interface{}{
				"summary":     "更新偏好设置",
				"description": "更新当前用户的偏好设置",
				"tags":        []string{"Settings"},
				"security":    []interface{}{map[string]interface{}{"Bearer": []interface{}{}}},
			},
		},
		// Health
		"/health": map[string]interface{}{
			"get": map[string]interface{}{
				"summary":     "健康检查",
				"description": "服务健康检查接口",
				"tags":        []string{"System"},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{"description": "服务正常"},
				},
			},
		},
	}
}
