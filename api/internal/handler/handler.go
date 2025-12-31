package handler

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/handler/v1"
	"mamoji/api/internal/middleware"
)

// Register 注册所有路由
func Register(h *server.Hertz) {
	// 健康检查
	h.GET("/health", func(ctx context.Context, c *app.RequestContext) {
		c.JSON(200, utils.H{
			"code":    0,
			"message": "OK",
			"data": utils.H{
				"service": "mamoji-api",
				"status":  "healthy",
			},
		})
	})

	// API v1 路由组
	v1Group := h.Group("/api/v1")

	// 认证模块
	authGroup := v1Group.Group("/auth")
	authGroup.POST("/login", v1.Login)
	authGroup.POST("/register", v1.Register)
	authGroup.GET("/profile", middleware.Auth(), v1.GetProfile)

	// 账户管理
	accountGroup := v1Group.Group("/accounts", middleware.Auth())
	accountGroup.GET("", v1.ListAccounts)
	accountGroup.POST("", v1.CreateAccount)
	accountGroup.GET("/:accountId", v1.GetAccount)
	accountGroup.PUT("/:accountId", v1.UpdateAccount)
	accountGroup.DELETE("/:accountId", v1.DeleteAccount)

	// 交易记录
	transactionGroup := v1Group.Group("/transactions", middleware.Auth())
	transactionGroup.GET("", v1.ListTransactions)
	transactionGroup.POST("", v1.CreateTransaction)
	transactionGroup.GET("/:transactionId", v1.GetTransaction)
	transactionGroup.PUT("/:transactionId", v1.UpdateTransaction)
	transactionGroup.DELETE("/:transactionId", v1.DeleteTransaction)

	// 预算管理
	budgetGroup := v1Group.Group("/budgets", middleware.Auth())
	budgetGroup.GET("", v1.ListBudgets)
	budgetGroup.POST("", v1.CreateBudget)
	budgetGroup.GET("/:budgetId", v1.GetBudget)
	budgetGroup.GET("/:budgetId/detail", v1.GetBudgetDetail)
	budgetGroup.PUT("/:budgetId", v1.UpdateBudget)
	budgetGroup.DELETE("/:budgetId", v1.DeleteBudget)

	// 投资理财
	investGroup := v1Group.Group("/investments", middleware.Auth())
	investGroup.GET("", v1.ListInvestments)
	investGroup.POST("", v1.CreateInvestment)
	investGroup.GET("/:investmentId", v1.GetInvestment)
	investGroup.PUT("/:investmentId", v1.UpdateInvestment)
	investGroup.DELETE("/:investmentId", v1.DeleteInvestment)

	// 报表统计
	reportGroup := v1Group.Group("/reports", middleware.Auth())
	reportGroup.GET("/overview", v1.GetOverviewReport)
	reportGroup.GET("/category", v1.GetCategoryReport)
	reportGroup.GET("/trend", v1.GetTrendReport)
}
