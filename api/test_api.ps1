# Mamoji API 测试脚本
$baseUrl = "http://localhost:8888"

# 1. 登录获取Token
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试1: 用户登录" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$loginResp = curl -s -X POST "$baseUrl/api/v1/auth/login" -H "Content-Type: application/json" -d '{"username":"testuser","password":"123456"}'
$loginData = $loginResp | ConvertFrom-Json
$token = $loginData.data.token
Write-Host "Token: $($token.Substring(0, 50))..." -ForegroundColor Yellow
Write-Host ""

# 2. 获取用户信息
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试2: 获取用户信息" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$profileResp = curl -s "$baseUrl/api/v1/auth/profile" -H "Authorization: Bearer $token"
$profileData = $profileResp | ConvertFrom-Json
Write-Host $profileResp -ForegroundColor Green
Write-Host ""

# 3. 获取账户列表
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试3: 获取账户列表" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$accountsResp = curl -s "$baseUrl/api/v1/accounts" -H "Authorization: Bearer $token"
$accountsData = $accountsResp | ConvertFrom-Json
Write-Host $accountsResp -ForegroundColor Green
Write-Host ""

# 4. 创建账户
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试4: 创建银行账户" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$createAccountResp = curl -s -X POST "$baseUrl/api/v1/accounts" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"type":"bank","name":"测试银行账户","accountNo":"6222****8888","balance":10000.00}'
$accountData = $createAccountResp | ConvertFrom-Json
Write-Host $createAccountResp -ForegroundColor Green
$accountId = $accountData.data.accountId
Write-Host "Created Account ID: $accountId" -ForegroundColor Yellow
Write-Host ""

# 5. 创建微信账户
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试5: 创建微信账户" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$wechatResp = curl -s -X POST "$baseUrl/api/v1/accounts" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"type":"wechat","name":"微信钱包","balance":5000.00}'
Write-Host $wechatResp -ForegroundColor Green
Write-Host ""

# 6. 获取交易列表（空）
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试6: 获取交易列表" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$txResp = curl -s "$baseUrl/api/v1/transactions" -H "Authorization: Bearer $token"
Write-Host $txResp -ForegroundColor Green
Write-Host ""

# 7. 创建交易
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试7: 创建收入交易" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$createTxResp = curl -s -X POST "$baseUrl/api/v1/transactions" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"type":"income","category":"主营业务","amount":15000.00,"accountId":' + $accountId + ',"occurredAt":"2025-12-31","note":"测试收入"}'
$txData = $createTxResp | ConvertFrom-Json
Write-Host $createTxResp -ForegroundColor Green
$txId = $txData.data.transactionId
Write-Host "Created Transaction ID: $txId" -ForegroundColor Yellow
Write-Host ""

# 8. 获取单个交易
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试8: 获取单个交易" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$getTxResp = curl -s "$baseUrl/api/v1/transactions/$txId" -H "Authorization: Bearer $token"
Write-Host $getTxResp -ForegroundColor Green
Write-Host ""

# 9. 获取预算列表
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试9: 获取预算列表" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$budgetResp = curl -s "$baseUrl/api/v1/budgets" -H "Authorization: Bearer $token"
Write-Host $budgetResp -ForegroundColor Green
Write-Host ""

# 10. 创建预算
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试10: 创建预算" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$createBudgetResp = curl -s -X POST "$baseUrl/api/v1/budgets" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"name":"12月运营预算","type":"monthly","category":"经营成本","totalAmount":50000.00,"periodStart":"2025-12-01","periodEnd":"2025-12-31"}'
$budgetData = $createBudgetResp | ConvertFrom-Json
Write-Host $createBudgetResp -ForegroundColor Green
$budgetId = $budgetData.data.budgetId
Write-Host "Created Budget ID: $budgetId" -ForegroundColor Yellow
Write-Host ""

# 11. 创建支出交易（关联预算）
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试11: 创建支出交易(关联预算)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$expenseResp = curl -s -X POST "$baseUrl/api/v1/transactions" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"type":"expense","category":"经营成本","amount":8000.00,"accountId":' + $accountId + ',"budgetId":' + $budgetId + ',"occurredAt":"2025-12-31","note":"采购办公用品"}'
Write-Host $expenseResp -ForegroundColor Green
Write-Host ""

# 12. 获取投资列表
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试12: 获取投资列表" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$investResp = curl -s "$baseUrl/api/v1/investments" -H "Authorization: Bearer $token"
Write-Host $investResp -ForegroundColor Green
Write-Host ""

# 13. 创建投资
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试13: 创建投资" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$createInvestResp = curl -s -X POST "$baseUrl/api/v1/investments" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"name":"沪深300指数基金","productType":"fund","principal":100000.00}'
Write-Host $createInvestResp -ForegroundColor Green
Write-Host ""

# 14. 获取报表概览
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试14: 获取报表概览" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$reportResp = curl -s "$baseUrl/api/v1/reports/overview" -H "Authorization: Bearer $token"
Write-Host $reportResp -ForegroundColor Green
Write-Host ""

# 15. 更新账户
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试15: 更新账户" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$updateAccResp = curl -s -X PUT "$baseUrl/api/v1/accounts/$accountId" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"name":"测试银行账户(已更新)","balance":12000.00}'
Write-Host $updateAccResp -ForegroundColor Green
Write-Host ""

# 16. 删除交易
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试16: 删除交易" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$deleteTxResp = curl -s -X DELETE "$baseUrl/api/v1/transactions/$txId" -H "Authorization: Bearer $token"
Write-Host $deleteTxResp -ForegroundColor Green
Write-Host ""

# 17. 异常测试: 无效Token
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试17: 无效Token测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$invalidResp = curl -s "$baseUrl/api/v1/accounts" -H "Authorization: Bearer invalid_token"
Write-Host $invalidResp -ForegroundColor Red
Write-Host ""

# 18. 异常测试: 未授权访问
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    测试18: 未授权访问测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$noAuthResp = curl -s "$baseUrl/api/v1/accounts"
Write-Host $noAuthResp -ForegroundColor Red
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    所有测试完成!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
