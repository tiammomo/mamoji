package service

// service 包按照功能模块进行了拆分
//
// 包含以下模块文件:
//   - base.go: 共享类型、接口和工具函数
//   - accounts.go: 账户服务 (AccountService)
//   - auth.go: 认证服务 (AuthService)
//   - transactions.go: 交易服务 (TransactionService)
//   - budgets.go: 预算服务 (BudgetService)
//   - investments.go: 投资服务 (InvestmentService)
//   - reports.go: 报表服务 (ReportService)
//   - system.go: 系统设置服务 (SystemSettingsService)
//
// 所有服务实例已在各模块中导出，可直接使用：
//   - service.AccountServiceInst
//   - service.AuthServiceInst
//   - service.TransactionServiceInst
//   - service.BudgetServiceInst
//   - service.InvestmentServiceInst
//   - service.ReportServiceInst
//   - service.SystemSettingsServiceInst
