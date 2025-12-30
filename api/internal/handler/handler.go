package handler

import (
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/route"
	"mamoji/api/internal/handler/v1"
)

// Register 注册所有路由
func Register(h *server.Hertz) {
	// 健康检查
	h.GET("/health", func(ctx context.Context, c *app.RequestContext) {
		c.JSON(utils.H{
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

	// 企业模块
	enterpriseGroup := v1Group.Group("/enterprise", middleware.Auth)
	enterpriseGroup.GET("", v1.GetEnterprise)
	enterpriseGroup.PUT("", v1.UpdateEnterprise)

	// 成员管理
	enterpriseGroup.GET("/members", v1.ListMembers)
	enterpriseGroup.POST("/members", v1.InviteMember)
	enterpriseGroup.DELETE("/members/:userId", v1.RemoveMember)
	enterpriseGroup.PUT("/members/:userId/role", v1.UpdateMemberRole)

	// 记账单元
	unitGroup := v1Group.Group("/units", middleware.Auth)
	unitGroup.GET("", v1.ListAccountingUnits)
	unitGroup.POST("", v1.CreateAccountingUnit)
	unitGroup.GET("/:unitId", v1.GetAccountingUnit)
	unitGroup.PUT("/:unitId", v1.UpdateAccountingUnit)
	unitGroup.DELETE("/:unitId", v1.DeleteAccountingUnit)

	// 账户管理
	accountGroup := v1Group.Group("/accounts", middleware.Auth)
	accountGroup.GET("", v1.ListAccounts)
	accountGroup.POST("", v1.CreateAccount)
	accountGroup.GET("/:accountId", v1.GetAccount)
	accountGroup.PUT("/:accountId", v1.UpdateAccount)
	accountGroup.DELETE("/:accountId", v1.DeleteAccount)
	accountGroup.GET("/:accountId/flows", v1.ListAccountFlows)

	// 交易记录
	transactionGroup := v1Group.Group("/transactions", middleware.Auth)
	transactionGroup.GET("", v1.ListTransactions)
	transactionGroup.POST("", v1.CreateTransaction)
	transactionGroup.GET("/:transactionId", v1.GetTransaction)
	transactionGroup.PUT("/:transactionId", v1.UpdateTransaction)
	transactionGroup.DELETE("/:transactionId", v1.DeleteTransaction)

	// 预算管理
	budgetGroup := v1Group.Group("/budgets", middleware.Auth)
	budgetGroup.GET("", v1.ListBudgets)
	budgetGroup.POST("", v1.CreateBudget)
	budgetGroup.GET("/:budgetId", v1.GetBudget)
	budgetGroup.PUT("/:budgetId", v1.UpdateBudget)
	budgetGroup.DELETE("/:budgetId", v1.DeleteBudget)
	budgetGroup.POST("/:budgetId/apply", v1.ApplyBudget)
	budgetGroup.POST("/:budgetId/approve", v1.ApproveBudget)

	// 投资理财
	investGroup := v1Group.Group("/investments", middleware.Auth)
	investGroup.GET("", v1.ListInvestments)
	investGroup.POST("", v1.CreateInvestment)
	investGroup.GET("/:investmentId", v1.GetInvestment)
	investGroup.PUT("/:investmentId", v1.UpdateInvestment)
	investGroup.DELETE("/:investmentId", v1.DeleteInvestment)
	investGroup.POST("/:investmentId/record", v1.CreateInvestRecord)

	// 资产管理
	assetGroup := v1Group.Group("/assets", middleware.Auth)
	assetGroup.GET("", v1.ListAssets)
	assetGroup.POST("", v1.CreateAsset)
	assetGroup.GET("/:assetId", v1.GetAsset)
	assetGroup.PUT("/:assetId", v1.UpdateAsset)
	assetGroup.DELETE("/:assetId", v1.DeleteAsset)
	assetGroup.POST("/:assetId/depreciation", v1.CalculateDepreciation)

	// 报表统计
	reportGroup := v1Group.Group("/reports", middleware.Auth)
	reportGroup.GET("/overview", v1.GetOverviewReport)
	reportGroup.GET("/income-expense", v1.GetIncomeExpenseReport)
	reportGroup.GET("/category", v1.GetCategoryReport)
	reportGroup.GET("/trend", v1.GetTrendReport)
	reportGroup.GET("/account", v1.GetAccountReport)

	// 通知管理
	notificationGroup := v1Group.Group("/notifications", middleware.Auth)
	notificationGroup.GET("", v1.ListNotifications)
	notificationGroup.GET("/unread-count", v1.GetUnreadCount)
	notificationGroup.PUT("/:notificationId/read", v1.MarkAsRead)
	notificationGroup.PUT("/read-all", v1.MarkAllAsRead)

	// 推送配置
	pushGroup := v1Group.Group("/push-config", middleware.Auth)
	pushGroup.GET("", v1.GetPushConfig)
	pushGroup.PUT("", v1.UpdatePushConfig)

	// 单元权限
	permissionGroup := v1Group.Group("/permissions", middleware.Auth)
	permissionGroup.GET("", v1.ListPermissions)
	permissionGroup.POST("", v1.CreatePermission)
	permissionGroup.DELETE("/:permissionId", v1.DeletePermission)
}
