package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"mamoji/api/internal/config"
	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// Interface 定义数据库模型接口
type Interface interface {
	TableName() string
}

// Service structs
type AccountService struct{}
type AuthService struct{}
type TransactionService struct{}
type BudgetService struct{}
type InvestmentService struct{}
type ReportService struct{}

// Service instances
var (
	AccountServiceInst     = &AccountService{}
	AuthServiceInst        = &AuthService{}
	TransactionServiceInst = &TransactionService{}
	BudgetServiceInst      = &BudgetService{}
	InvestmentServiceInst  = &InvestmentService{}
	ReportServiceInst      = &ReportService{}
)

func init() {
	_ = AccountServiceInst
	_ = AuthServiceInst
	_ = TransactionServiceInst
	_ = BudgetServiceInst
	_ = InvestmentServiceInst
	_ = ReportServiceInst
}

// ===== AccountService =====
func (s *AccountService) List(enterpriseId, unitId int64) ([]dto.AccountResponse, error) {
	var accounts []entity.Account
	query := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId)
	if unitId > 0 {
		query = query.Where("unit_id = ?", unitId)
	}
	if err := query.Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, errors.New("查询账户失败")
	}

	response := make([]dto.AccountResponse, 0, len(accounts))
	for _, acc := range accounts {
		response = append(response, dto.AccountResponse{
			AccountId:        acc.AccountId,
			EnterpriseId:     acc.EnterpriseId,
			UnitId:           acc.UnitId,
			Type:             acc.Type,
			Name:             acc.Name,
			AccountNo:        acc.AccountNo,
			BankCardType:     acc.BankCardType,
			AvailableBalance: acc.AvailableBalance,
			InvestedAmount:   acc.InvestedAmount,
			Status:           acc.Status,
			CreatedAt:        acc.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return response, nil
}

func (s *AccountService) GetById(accountId int64) (*dto.AccountResponse, error) {
	var account entity.Account
	if err := database.DB.Where("account_id = ? AND status = 1", accountId).First(&account).Error; err != nil {
		return nil, errors.New("账户不存在或已被删除")
	}

	response := &dto.AccountResponse{
		AccountId:        account.AccountId,
		EnterpriseId:     account.EnterpriseId,
		UnitId:           account.UnitId,
		Type:             account.Type,
		Name:             account.Name,
		AccountNo:        account.AccountNo,
		BankCardType:     account.BankCardType,
		AvailableBalance: account.AvailableBalance,
		InvestedAmount:   account.InvestedAmount,
		Status:           account.Status,
		CreatedAt:        account.CreatedAt.Format("2006-01-02 15:04:05"),
	}
	return response, nil
}

func (s *AccountService) Create(req dto.CreateAccountRequest) (*dto.AccountResponse, error) {
	// 如果没有提供UnitId，使用默认单元
	unitId := req.UnitId
	if unitId == 0 {
		var unitCount int64
		database.DB.Model(&entity.AccountingUnit{}).Where("enterprise_id = ? AND status = 1", req.EnterpriseId).Count(&unitCount)
		if unitCount == 0 {
			// 创建默认单元
			defaultUnit := &entity.AccountingUnit{
				EnterpriseId: req.EnterpriseId,
				Name:         "默认单元",
				Type:         "main",
				Level:        1,
				Status:       1,
			}
			if err := database.DB.Create(defaultUnit).Error; err != nil {
				return nil, errors.New("创建默认单元失败")
			}
			unitId = defaultUnit.UnitId
		} else {
			var unit entity.AccountingUnit
			database.DB.Where("enterprise_id = ? AND status = 1", req.EnterpriseId).First(&unit)
			unitId = unit.UnitId
		}
	}

	account := &entity.Account{
		EnterpriseId:     req.EnterpriseId,
		UnitId:           unitId,
		Type:             req.Type,
		Name:             req.Name,
		AccountNo:        req.AccountNo,
		BankCardType:     req.BankCardType,
		AvailableBalance: req.AvailableBalance,
		InvestedAmount:   req.InvestedAmount,
		Status:           1,
	}

	if err := database.DB.Create(account).Error; err != nil {
		return nil, errors.New("创建账户失败")
	}

	response := &dto.AccountResponse{
		AccountId:        account.AccountId,
		EnterpriseId:     account.EnterpriseId,
		UnitId:           account.UnitId,
		Type:             account.Type,
		Name:             account.Name,
		AccountNo:        account.AccountNo,
		BankCardType:     account.BankCardType,
		AvailableBalance: account.AvailableBalance,
		InvestedAmount:   account.InvestedAmount,
		Status:           account.Status,
		CreatedAt:        account.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	return response, nil
}

func (s *AccountService) Update(accountId int64, req dto.UpdateAccountRequest) (*dto.AccountResponse, error) {
	var account entity.Account
	if err := database.DB.Where("account_id = ? AND status = 1", accountId).First(&account).Error; err != nil {
		return nil, errors.New("账户不存在或已被删除")
	}

	// 更新字段
	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.AccountNo != "" {
		updates["account_no"] = req.AccountNo
	}
	if req.BankCardType != "" {
		updates["bank_card_type"] = req.BankCardType
	}
	if req.AvailableBalance >= 0 {
		updates["available_balance"] = req.AvailableBalance
	}
	if req.InvestedAmount >= 0 {
		updates["invested_amount"] = req.InvestedAmount
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&account).Updates(updates).Error; err != nil {
			return nil, errors.New("更新账户失败")
		}
		// 重新加载
		database.DB.Where("account_id = ?", accountId).First(&account)
	}

	response := &dto.AccountResponse{
		AccountId:        account.AccountId,
		EnterpriseId:     account.EnterpriseId,
		UnitId:           account.UnitId,
		Type:             account.Type,
		Name:             account.Name,
		AccountNo:        account.AccountNo,
		BankCardType:     account.BankCardType,
		AvailableBalance: account.AvailableBalance,
		InvestedAmount:   account.InvestedAmount,
		Status:           account.Status,
		CreatedAt:        account.CreatedAt.Format("2006-01-02 15:04:05"),
	}
	return response, nil
}

func (s *AccountService) Delete(accountId int64) error {
	var account entity.Account
	if err := database.DB.Where("account_id = ?", accountId).First(&account).Error; err != nil {
		return errors.New("账户不存在")
	}

	// 软删除：将状态置为0
	if err := database.DB.Model(&account).Update("status", 0).Error; err != nil {
		return errors.New("删除账户失败")
	}

	return nil
}

func (s *AccountService) ListFlows(accountId int64) ([]interface{}, error) {
	return nil, nil
}

// GetSummary 获取账户汇总信息（包含上月数据用于环比计算）
func (s *AccountService) GetSummary(enterpriseId int64) (*dto.AccountSummaryResponse, error) {
	// 获取本月账户数据
	var accounts []entity.Account
	if err := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).Find(&accounts).Error; err != nil {
		return nil, errors.New("查询账户失败")
	}

	// 计算本月汇总
	var totalAvailable, totalInvested float64
	for _, acc := range accounts {
		totalAvailable += acc.AvailableBalance
		totalInvested += acc.InvestedAmount
	}
	totalBalance := totalAvailable + totalInvested

	// 计算上月时间范围
	now := time.Now()
	currentYear := now.Year()
	currentMonth := int(now.Month())

	lastMonth := currentMonth - 1
	lastYear := currentYear
	if lastMonth == 0 {
		lastMonth = 12
		lastYear = currentYear - 1
	}

	lastMonthStart := time.Date(lastYear, time.Month(lastMonth), 1, 0, 0, 0, 0, time.Local)
	lastMonthEnd := time.Date(lastYear, time.Month(lastMonth+1), 0, 23, 59, 59, 999999999, time.Local)

	// 计算上月交易对账户余额的影响
	// 上月账户余额 = 本月账户余额 - 上月收入 + 上月支出
	var lastMonthIncome, lastMonthExpense float64

	// 查询上月收入
	database.DB.Model(&entity.Transaction{}).
		Where("enterprise_id = ? AND status = 1 AND occurred_at >= ? AND occurred_at <= ?",
			enterpriseId, lastMonthStart, lastMonthEnd).
		Where("type = ?", "income").
		Where("account_id > 0").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&lastMonthIncome)

	// 查询上月支出
	database.DB.Model(&entity.Transaction{}).
		Where("enterprise_id = ? AND status = 1 AND occurred_at >= ? AND occurred_at <= ?",
			enterpriseId, lastMonthStart, lastMonthEnd).
		Where("type = ?", "expense").
		Where("account_id > 0").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&lastMonthExpense)

	// 计算上月余额（简化计算：假设所有账户上月都存在）
	// 这里的计算是：上月余额 = 本月余额 - 上月收入 + 上月支出
	// 因为收入会增加余额，支出会减少余额
	lastMonthBalance := totalBalance - lastMonthIncome + lastMonthExpense
	lastMonthAvailable := totalAvailable - lastMonthIncome + lastMonthExpense
	lastMonthInvested := totalInvested // 投资金额变化不在交易中体现

	// 判断是否有历史数据（通过检查上月是否有交易记录）
	var txCount int64
	database.DB.Model(&entity.Transaction{}).
		Where("enterprise_id = ? AND status = 1 AND occurred_at >= ? AND occurred_at <= ?",
			enterpriseId, lastMonthStart, lastMonthEnd).
		Count(&txCount)
	hasHistory := txCount > 0

	// 计算环比变化率
	var balanceMoM, availableMoM, investedMoM float64
	if lastMonthBalance > 0 {
		balanceMoM = ((totalBalance - lastMonthBalance) / lastMonthBalance) * 100
	}
	if lastMonthAvailable > 0 {
		availableMoM = ((totalAvailable - lastMonthAvailable) / lastMonthAvailable) * 100
	}
	if lastMonthInvested > 0 {
		investedMoM = ((totalInvested - lastMonthInvested) / lastMonthInvested) * 100
	}

	return &dto.AccountSummaryResponse{
		TotalBalance:       totalBalance,
		TotalAvailable:     totalAvailable,
		TotalInvested:      totalInvested,
		AccountCount:       len(accounts),
		LastMonthBalance:   lastMonthBalance,
		LastMonthAvailable: lastMonthAvailable,
		LastMonthInvested:  lastMonthInvested,
		BalanceMoM:         balanceMoM,
		AvailableMoM:       availableMoM,
		InvestedMoM:        investedMoM,
		HasHistory:         hasHistory,
	}, nil
}

// ===== AuthService =====
func (s *AuthService) Login(username, password string) (*dto.UserInfo, string, error) {
	var user entity.User

	result := database.DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, "", errors.New("用户名或密码错误")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", errors.New("用户名或密码错误")
	}

	if user.Status != 1 {
		return nil, "", errors.New("账户已被禁用")
	}

	// 查询用户所属企业
	var enterpriseId int64
	var enterpriseName string
	var member entity.EnterpriseMember
	if err := database.DB.Where("user_id = ?", user.UserId).First(&member).Error; err == nil {
		enterpriseId = member.EnterpriseId
		var enterprise entity.Enterprise
		if err := database.DB.Where("enterprise_id = ?", enterpriseId).First(&enterprise).Error; err == nil {
			enterpriseName = enterprise.Name
		}
	}

	// 如果用户没有企业，创建一个默认企业
	if enterpriseId == 0 {
		enterprise := &entity.Enterprise{
			Name:          user.Username + "的企业",
			ContactPerson: user.Username,
			ContactPhone:  user.Phone,
			Status:        1,
		}
		if err := database.DB.Create(enterprise).Error; err == nil {
			enterpriseId = enterprise.EnterpriseId
			enterpriseName = enterprise.Name
			// 添加用户为企业管理员
			database.DB.Create(&entity.EnterpriseMember{
				EnterpriseId: enterpriseId,
				UserId:       user.UserId,
				Role:         "owner",
			})
		}
	}

	// 生成包含enterpriseId的token
	token, err := s.generateToken(user.UserId, enterpriseId, user.Username)
	if err != nil {
		return nil, "", errors.New("生成令牌失败")
	}

	// 保存或更新用户token
	userToken := entity.UserToken{
		UserId: user.UserId,
		Token:  token,
	}
	userToken.ExpiresAt = time.Now().Add(24 * time.Hour)
	database.DB.Where("user_id = ?", user.UserId).Assign(userToken).FirstOrCreate(&userToken)

	userInfo := &dto.UserInfo{
		UserId:         user.UserId,
		Username:       user.Username,
		Phone:          user.Phone,
		Email:          user.Email,
		Role:           user.Role,
		EnterpriseId:   enterpriseId,
		EnterpriseName: enterpriseName,
	}

	return userInfo, token, nil
}

func (s *AuthService) Register(req dto.RegisterRequest) (*dto.UserInfo, error) {
	var count int64
	database.DB.Model(&entity.User{}).Where("username = ?", req.Username).Count(&count)
	if count > 0 {
		return nil, errors.New("用户名已存在")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	user := entity.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Phone:    req.Phone,
		Email:    req.Email,
		Status:   1,
		Role:     "user",
	}

	result := database.DB.Create(&user)
	if result.Error != nil {
		return nil, errors.New("创建用户失败")
	}

	userInfo := &dto.UserInfo{
		UserId:   user.UserId,
		Username: user.Username,
		Phone:    user.Phone,
		Email:    user.Email,
		Role:     user.Role,
	}

	return userInfo, nil
}

func (s *AuthService) Logout(token string) {
	database.DB.Where("token = ?", token).Delete(&entity.UserToken{})
}

func (s *AuthService) GetUserById(userId int64) (*dto.UserInfo, error) {
	var user entity.User
	result := database.DB.Where("user_id = ?", userId).First(&user)
	if result.Error != nil {
		return nil, errors.New("用户不存在")
	}

	return &dto.UserInfo{
		UserId:   user.UserId,
		Username: user.Username,
		Phone:    user.Phone,
		Email:    user.Email,
		Role:     user.Role,
	}, nil
}

func (s *AuthService) generateToken(userId, enterpriseId int64, username string) (string, error) {
	claims := jwt.MapClaims{
		"userId":       userId,
		"enterpriseId": enterpriseId,
		"username":     username,
		"jti":          uuid.New().String(),
		"exp":          time.Now().Add(24 * time.Hour).Unix(),
		"iat":          time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.JWT_SECRET))
}

func InitAdminUser() error {
	var count int64
	database.DB.Model(&entity.User{}).Where("username = ?", "admin").Count(&count)

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		admin := entity.User{
			Username: "admin",
			Password: string(hashedPassword),
			Phone:    "13800000000",
			Email:    "admin@mamoji.com",
			Status:   1,
			Role:     "admin",
		}

		if err := database.DB.Create(&admin).Error; err != nil {
			return err
		}

		fmt.Println("管理员账户已创建: admin / admin")
	}

	return nil
}

// ===== TransactionService =====
func (s *TransactionService) List(enterpriseId int64, req dto.ListTransactionRequest) ([]dto.TransactionResponse, error) {
	var transactions []entity.Transaction
	// 过滤软删除的数据（status = 1 表示正常状态）
	query := database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId)
	if req.UnitId > 0 {
		query = query.Where("unit_id = ?", req.UnitId)
	}
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}
	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.StartDate != "" {
		query = query.Where("occurred_at >= ?", req.StartDate)
	}
	if req.EndDate != "" {
		query = query.Where("occurred_at <= ?", req.EndDate)
	}

	page := req.Page
	if page < 1 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize
	if err := query.Order("occurred_at DESC, created_at DESC").Offset(offset).Limit(pageSize).Find(&transactions).Error; err != nil {
		return nil, errors.New("查询交易记录失败")
	}

	response := make([]dto.TransactionResponse, 0, len(transactions))
	for _, tx := range transactions {
		// 获取账户名称
		var account entity.Account
		accountName := ""
		if tx.AccountId > 0 {
			database.DB.Where("account_id = ?", tx.AccountId).First(&account)
			accountName = account.Name
		}

		response = append(response, dto.TransactionResponse{
			TransactionId: tx.TransactionId,
			EnterpriseId:  tx.EnterpriseId,
			UnitId:        tx.UnitId,
			UserId:        tx.UserId,
			Type:          tx.Type,
			Category:      tx.Category,
			Amount:        tx.Amount,
			AccountId:     tx.AccountId,
			AccountName:   accountName,
			BudgetId:      tx.BudgetId,
			OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
			Tags:          parseJSONArray(tx.Tags),
			Note:          tx.Note,
			Images:        parseJSONArray(tx.Images),
			Status:        tx.Status,
			CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return response, nil
}

func (s *TransactionService) GetById(transactionId int64) (*dto.TransactionResponse, error) {
	var tx entity.Transaction
	// 过滤软删除的数据
	if err := database.DB.Where("transaction_id = ? AND status = 1", transactionId).First(&tx).Error; err != nil {
		return nil, errors.New("交易记录不存在或已被删除")
	}

	var account entity.Account
	accountName := ""
	if tx.AccountId > 0 {
		database.DB.Where("account_id = ?", tx.AccountId).First(&account)
		accountName = account.Name
	}

	return &dto.TransactionResponse{
		TransactionId: tx.TransactionId,
		EnterpriseId:  tx.EnterpriseId,
		UnitId:        tx.UnitId,
		UserId:        tx.UserId,
		Type:          tx.Type,
		Category:      tx.Category,
		Amount:        tx.Amount,
		AccountId:     tx.AccountId,
		AccountName:   accountName,
		BudgetId:      tx.BudgetId,
		OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
		Tags:          parseJSONArray(tx.Tags),
		Note:          tx.Note,
		Images:        parseJSONArray(tx.Images),
		Status:        tx.Status,
		CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *TransactionService) Create(enterpriseId int64, req dto.CreateTransactionRequest) (*dto.TransactionResponse, error) {
	// 如果没有提供UnitId，使用默认单元
	unitId := req.UnitId
	if unitId == 0 {
		var unitCount int64
		database.DB.Model(&entity.AccountingUnit{}).Where("enterprise_id = ? AND status = 1", enterpriseId).Count(&unitCount)
		if unitCount == 0 {
			defaultUnit := &entity.AccountingUnit{
				EnterpriseId: enterpriseId,
				Name:         "默认单元",
				Type:         "main",
				Level:        1,
				Status:       1,
			}
			if err := database.DB.Create(defaultUnit).Error; err != nil {
				return nil, errors.New("创建默认单元失败")
			}
			unitId = defaultUnit.UnitId
		} else {
			var unit entity.AccountingUnit
			database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).First(&unit)
			unitId = unit.UnitId
		}
	}

	// 解析OccurredAt时间
	var occurredAt time.Time
	if req.OccurredAt != "" {
		// 尝试多种日期格式
		formats := []string{
			"2006-01-02 15:04:05",
			"2006-01-02",
			"2006/01/02 15:04:05",
			"2006/01/02",
		}
		for _, format := range formats {
			if t, err := time.Parse(format, req.OccurredAt); err == nil {
				occurredAt = t
				break
			}
		}
	}
	if occurredAt.IsZero() {
		occurredAt = time.Now()
	}

	// 处理tags和images为JSON字符串
	tagsJSON := "[]"
	if len(req.Tags) > 0 {
		tagsJSON = `["` + joinStrings(req.Tags, `","`) + `"]`
	}
	imagesJSON := "[]"
	if len(req.Images) > 0 {
		imagesJSON = `["` + joinStrings(req.Images, `","`) + `"]`
	}
	// 处理ecommerceInfo为JSON字符串，空字符串转为null
	ecommerceInfoJSON := "null"
	if req.EcommerceInfo != "" {
		ecommerceInfoJSON = req.EcommerceInfo
	}

	tx := &entity.Transaction{
		EnterpriseId:  enterpriseId,
		UnitId:        unitId,
		UserId:        req.UserId,
		Type:          req.Type,
		Category:      req.Category,
		Amount:        req.Amount,
		AccountId:     req.AccountId,
		BudgetId:      req.BudgetId,
		OccurredAt:    occurredAt,
		Tags:          tagsJSON,
		Note:          req.Note,
		Images:        imagesJSON,
		EcommerceInfo: ecommerceInfoJSON,
		Status:        1,
	}

	if err := database.DB.Create(tx).Error; err != nil {
		return nil, errors.New("创建交易记录失败")
	}

	// 更新账户可用余额
	if tx.AccountId > 0 {
		var account entity.Account
		if err := database.DB.Where("account_id = ?", tx.AccountId).First(&account).Error; err == nil {
			balanceChange := req.Amount
			if req.Type == "expense" {
				balanceChange = -req.Amount
			}
			newBalance := account.AvailableBalance + balanceChange
			database.DB.Model(&account).Update("available_balance", newBalance)
		}
	}

	// 更新预算已使用金额（仅支出时自动关联预算）
	if req.Type == "expense" {
		// 如果前端已指定BudgetId，直接使用；否则自动查找匹配的预算
		var budgetId *int64
		var budget entity.Budget
		var budgetMatched bool

		if req.BudgetId != nil && *req.BudgetId > 0 {
			// 使用前端指定的预算
			budgetId = req.BudgetId
			if err := database.DB.Where("budget_id = ? AND status = ?", *req.BudgetId, "active").First(&budget).Error; err != nil {
				fmt.Printf("[预算关联] 未找到指定预算 budgetId=%d: %v\n", *req.BudgetId, err)
			} else {
				budgetMatched = true
				fmt.Printf("[预算关联] 使用指定预算 budgetId=%d, name=%s, usedAmount=%.2f\n", budget.BudgetId, budget.Name, budget.UsedAmount)
			}
		} else {
			// 自动查找匹配的预算：根据分类和日期范围
			var matchedBudget entity.Budget
			fmt.Printf("[预算关联] 自动匹配: enterpriseId=%d, category=%s, occurredAt=%v\n", enterpriseId, req.Category, occurredAt)
			err := database.DB.Where(
				"enterprise_id = ? AND status = ? AND category = ? AND period_start <= ? AND period_end >= ?",
				enterpriseId, "active", req.Category, occurredAt, occurredAt,
			).First(&matchedBudget).Error

			if err == nil {
				budgetId = &matchedBudget.BudgetId
				budget = matchedBudget
				budgetMatched = true
				fmt.Printf("[预算关联] 自动匹配成功 budgetId=%d, name=%s, period=%v~%v, usedAmount=%.2f\n",
					budget.BudgetId, budget.Name, budget.PeriodStart, budget.PeriodEnd, budget.UsedAmount)
			} else {
				fmt.Printf("[预算关联] 自动匹配失败: %v\n", err)
			}
		}

		// 更新预算已使用金额
		if budgetMatched && budgetId != nil && budget.BudgetId > 0 {
			// 检查预算是否在有效期内（使用交易发生时间）
			// occurredAt 应该介于 periodStart 和 periodEnd 之间（包含边界）
			if (occurredAt.After(budget.PeriodStart) || occurredAt.Equal(budget.PeriodStart)) &&
				occurredAt.Before(budget.PeriodEnd.AddDate(0, 0, 1)) {
				// 更新 transaction 的 BudgetId
				tx.BudgetId = budgetId
				database.DB.Model(&tx).Update("budget_id", *budgetId)

				// 更新预算已使用金额 - 使用直接 SQL 确保更新
				newUsedAmount := budget.UsedAmount + req.Amount
				result := database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", newUsedAmount, budget.BudgetId)
				if result.Error != nil {
					fmt.Printf("[预算关联] 更新预算失败: %v\n", result.Error)
				} else {
					fmt.Printf("[预算关联] 预算更新完成: budgetId=%d, newUsedAmount=%.2f, affectedRows=%d\n",
						budget.BudgetId, newUsedAmount, result.RowsAffected)
				}
			} else {
				fmt.Printf("[预算关联] 交易时间不在预算期内: occurredAt=%v, periodStart=%v, periodEnd=%v\n",
					occurredAt, budget.PeriodStart, budget.PeriodEnd)
			}
		}
	}

	// 获取账户名称
	var account entity.Account
	accountName := ""
	if tx.AccountId > 0 {
		database.DB.Where("account_id = ?", tx.AccountId).First(&account)
		accountName = account.Name
	}

	response := &dto.TransactionResponse{
		TransactionId: tx.TransactionId,
		EnterpriseId:  tx.EnterpriseId,
		UnitId:        tx.UnitId,
		UserId:        tx.UserId,
		Type:          tx.Type,
		Category:      tx.Category,
		Amount:        tx.Amount,
		AccountId:     tx.AccountId,
		AccountName:   accountName,
		BudgetId:      tx.BudgetId,
		OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
		Tags:          req.Tags,
		Note:          tx.Note,
		Images:        req.Images,
		Status:        tx.Status,
		CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	return response, nil
}

func (s *TransactionService) Update(transactionId int64, req dto.UpdateTransactionRequest) (*dto.TransactionResponse, error) {
	var tx entity.Transaction
	if err := database.DB.Where("transaction_id = ?", transactionId).First(&tx).Error; err != nil {
		return nil, errors.New("交易记录不存在")
	}

	// 计算金额变化，调整账户余额
	oldAmount := tx.Amount
	oldType := tx.Type
	oldAccountId := tx.AccountId

	// 更新字段
	updates := map[string]interface{}{}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Amount > 0 {
		updates["amount"] = req.Amount
	}
	if req.AccountId > 0 {
		updates["account_id"] = req.AccountId
	}
	if req.OccurredAt != "" {
		// 解析日期
		if parsedTime, err := time.Parse("2006-01-02", req.OccurredAt); err == nil {
			updates["occurred_at"] = parsedTime
		}
	}
	if req.Note != "" {
		updates["note"] = req.Note
	}
	if req.Tags != nil {
		tagsJSON, _ := json.Marshal(req.Tags)
		updates["tags"] = string(tagsJSON)
	}
	if req.Images != nil {
		imagesJSON, _ := json.Marshal(req.Images)
		updates["images"] = string(imagesJSON)
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&tx).Updates(updates).Error; err != nil {
			return nil, errors.New("更新交易记录失败")
		}
		// 重新加载
		database.DB.Where("transaction_id = ?", transactionId).First(&tx)
	}

	// 如果金额或类型或账户发生变化，需要调整账户可用余额
	if req.Amount > 0 && (req.Amount != oldAmount || req.Type != "" || req.AccountId > 0) {
		// 恢复旧账户的旧金额影响
		if oldAccountId > 0 {
			var oldAccount entity.Account
			if database.DB.Where("account_id = ?", oldAccountId).First(&oldAccount).Error == nil {
				if oldType == "expense" {
					database.DB.Model(&oldAccount).Update("available_balance", oldAccount.AvailableBalance+oldAmount)
				} else if oldType == "income" {
					database.DB.Model(&oldAccount).Update("available_balance", oldAccount.AvailableBalance-oldAmount)
				}
			}
		}

		// 应用新金额到新账户
		newAccountId := req.AccountId
		if newAccountId == 0 {
			newAccountId = oldAccountId
		}
		newType := req.Type
		if newType == "" {
			newType = oldType
		}
		newAmount := req.Amount

		if newAccountId > 0 {
			var newAccount entity.Account
			if database.DB.Where("account_id = ?", newAccountId).First(&newAccount).Error == nil {
				if newType == "expense" {
					database.DB.Model(&newAccount).Update("available_balance", newAccount.AvailableBalance-newAmount)
				} else if newType == "income" {
					database.DB.Model(&newAccount).Update("available_balance", newAccount.AvailableBalance+newAmount)
				}
			}
		}
	}

	// 处理预算关联变更
	// 场景一：从"不关联预算"改为"关联具体预算"：将金额加到新预算
	// 场景二：从"关联具体预算"改为"不关联预算"：将金额从旧预算中减掉（加回预算）
	oldBudgetId := tx.BudgetId
	newBudgetId := req.BudgetId

	// 检查预算ID是否发生变化
	oldHasBudget := oldBudgetId != nil && *oldBudgetId > 0
	newHasBudget := newBudgetId != nil && *newBudgetId > 0

	if oldHasBudget && !newHasBudget {
		// 场景二：从有预算改为无预算，将金额加回旧预算
		var oldBudget entity.Budget
		if database.DB.Where("budget_id = ?", *oldBudgetId).First(&oldBudget).Error == nil {
			newUsedAmount := oldBudget.UsedAmount - tx.Amount
			if newUsedAmount < 0 {
				newUsedAmount = 0
			}
			database.DB.Model(&oldBudget).Update("used_amount", newUsedAmount)
		}
	} else if !oldHasBudget && newHasBudget {
		// 场景一：从无预算改为有预算，将金额加到新预算
		var newBudget entity.Budget
		if database.DB.Where("budget_id = ?", *newBudgetId).First(&newBudget).Error == nil {
			database.DB.Model(&newBudget).Update("used_amount", newBudget.UsedAmount+req.Amount)
		}
	}

	// 更新预算已使用金额（仅支出时处理预算金额变化）
	if oldType == "expense" || req.Type == "expense" {
		// 如果金额发生变化，需要调整预算（已在上面的预算关联变更中处理了预算ID变更的情况）
		// 这里处理金额变化但预算不变的情况
		if req.Amount > 0 && req.Amount != oldAmount && oldHasBudget && newHasBudget && *oldBudgetId == *newBudgetId {
			// 预算不变，只调整金额差额
			var budget entity.Budget
			if database.DB.Where("budget_id = ?", *oldBudgetId).First(&budget).Error == nil {
				amountDiff := req.Amount - oldAmount
				newUsedAmount := budget.UsedAmount + amountDiff
				if newUsedAmount < 0 {
					newUsedAmount = 0
				}
				database.DB.Model(&budget).Update("used_amount", newUsedAmount)
			}
		} else if req.Amount > 0 && req.Amount != oldAmount && oldHasBudget && !newHasBudget {
			// 从有预算改为无预算，且金额变化：先加回旧预算的旧金额，再（不添加到新预算，因为新预算为空）
			// 上面已经处理了"从有预算改为无预算"的情况，这里不需要额外处理
		} else if req.Amount > 0 && req.Amount != oldAmount && !oldHasBudget && newHasBudget {
			// 从无预算改为有预算，且金额变化：添加新预算的新金额
			// 上面已经处理了"从无预算改为有预算"的情况，这里不需要额外处理
		}
	}

	// 获取账户名称
	var account entity.Account
	accountName := ""
	if tx.AccountId > 0 {
		database.DB.Where("account_id = ?", tx.AccountId).First(&account)
		accountName = account.Name
	}

	response := &dto.TransactionResponse{
		TransactionId: tx.TransactionId,
		EnterpriseId:  tx.EnterpriseId,
		UnitId:        tx.UnitId,
		UserId:        tx.UserId,
		Type:          tx.Type,
		Category:      tx.Category,
		Amount:        tx.Amount,
		AccountId:     tx.AccountId,
		AccountName:   accountName,
		OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
		Tags:          parseJSONArray(tx.Tags),
		Note:          tx.Note,
		Images:        parseJSONArray(tx.Images),
		Status:        tx.Status,
		CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
	}
	return response, nil
}

func (s *TransactionService) Delete(transactionId int64) error {
	// 先查询记录是否存在
	var tx entity.Transaction
	if err := database.DB.Where("transaction_id = ?", transactionId).First(&tx).Error; err != nil {
		return errors.New("交易记录不存在")
	}

	// 更新账户可用余额（反向操作）
	if tx.AccountId > 0 && tx.Type == "expense" {
		// 支出删除时，恢复账户可用余额
		var account entity.Account
		if err := database.DB.Where("account_id = ?", tx.AccountId).First(&account).Error; err == nil {
			database.DB.Model(&account).Update("available_balance", account.AvailableBalance+tx.Amount)
		}
	} else if tx.AccountId > 0 && tx.Type == "income" {
		// 收入删除时，扣减账户可用余额
		var account entity.Account
		if err := database.DB.Where("account_id = ?", tx.AccountId).First(&account).Error; err == nil {
			database.DB.Model(&account).Update("available_balance", account.AvailableBalance-tx.Amount)
		}
	}

	// 更新预算已使用金额（仅支出且有关联预算时）
	if tx.Type == "expense" && tx.BudgetId != nil && *tx.BudgetId > 0 {
		var budget entity.Budget
		if err := database.DB.Where("budget_id = ?", *tx.BudgetId).First(&budget).Error; err == nil {
			// 将已使用的金额加回预算 - 使用直接 SQL 确保更新
			newUsedAmount := budget.UsedAmount - tx.Amount
			if newUsedAmount < 0 {
				newUsedAmount = 0
			}
			result := database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", newUsedAmount, budget.BudgetId)
			if result.Error != nil {
				fmt.Printf("[预算关联] 删除交易时更新预算失败: %v\n", result.Error)
			} else {
				fmt.Printf("[预算关联] 删除交易更新预算: budgetId=%d, newUsedAmount=%.2f, affectedRows=%d\n",
					budget.BudgetId, newUsedAmount, result.RowsAffected)
			}
		}
	}

	// 删除记录
	if err := database.DB.Delete(&tx).Error; err != nil {
		return errors.New("删除交易记录失败")
	}

	return nil
}

// ===== BudgetService =====
func (s *BudgetService) List(req dto.ListBudgetRequest) ([]dto.BudgetResponse, error) {
	var budgets []entity.Budget

	// 构建查询条件
	db := database.DB.Where("enterprise_id = ? AND status = 'active'", req.EnterpriseId)

	// 如果指定了时间范围，只返回与该时间范围有交集的预算
	// 即：预算的 period_start <= endDate 且预算的 period_end >= startDate
	// 使用 DATE 函数直接比较日期，避免时区问题
	if req.StartDate != "" || req.EndDate != "" {
		// 如果有有效的时间范围，添加筛选条件
		// 使用 DATE() 函数直接比较日期字符串
		if req.StartDate != "" {
			db = db.Where("DATE(period_end) >= ?", req.StartDate)
		}
		if req.EndDate != "" {
			db = db.Where("DATE(period_start) <= ?", req.EndDate)
		}
	}

	// 执行查询
	if err := db.Order("created_at DESC").Find(&budgets).Error; err != nil {
		return nil, errors.New("查询预算列表失败")
	}

	result := make([]dto.BudgetResponse, 0, len(budgets))
	for _, b := range budgets {
		// 根据关联的交易记录计算实际使用的金额（兼容旧数据）
		var transactions []entity.Transaction
		var actualUsedAmount float64
		database.DB.Where("budget_id = ? AND deleted_at IS NULL", b.BudgetId).Find(&transactions)
		for _, tx := range transactions {
			actualUsedAmount += tx.Amount
		}
		// 如果实际使用金额与数据库中的不一致，更新数据库
		if actualUsedAmount != b.UsedAmount {
			fmt.Printf("[预算列表] 修正 usedAmount: %.2f -> %.2f (budgetId=%d)\n", b.UsedAmount, actualUsedAmount, b.BudgetId)
			database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", actualUsedAmount, b.BudgetId)
			b.UsedAmount = actualUsedAmount
		}

		// 计算使用百分比
		var usagePercent float64
		if b.TotalAmount > 0 {
			usagePercent = (b.UsedAmount / b.TotalAmount) * 100
		}
		result = append(result, dto.BudgetResponse{
			BudgetId:     b.BudgetId,
			EnterpriseId: b.EnterpriseId,
			UnitId:       b.UnitId,
			Name:         b.Name,
			Type:         b.Type,
			Category:     b.Category,
			TotalAmount:  b.TotalAmount,
			UsedAmount:   b.UsedAmount,
			PeriodStart:  b.PeriodStart.Format("2006-01-02"),
			PeriodEnd:    b.PeriodEnd.Format("2006-01-02"),
			Status:       b.Status,
			UsagePercent: usagePercent,
			CreatedAt:    b.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, nil
}

func (s *BudgetService) GetById(budgetId int64) (*dto.BudgetResponse, error) {
	var budget entity.Budget
	// 过滤软删除的数据
	if err := database.DB.Where("budget_id = ? AND status = 'active'", budgetId).First(&budget).Error; err != nil {
		return nil, errors.New("预算不存在或已被删除")
	}
	return &dto.BudgetResponse{
		BudgetId:     budget.BudgetId,
		EnterpriseId: budget.EnterpriseId,
		UnitId:       budget.UnitId,
		Name:         budget.Name,
		Type:         budget.Type,
		Category:     budget.Category,
		TotalAmount:  budget.TotalAmount,
		UsedAmount:   budget.UsedAmount,
		PeriodStart:  budget.PeriodStart.Format("2006-01-02"),
		PeriodEnd:    budget.PeriodEnd.Format("2006-01-02"),
		Status:       budget.Status,
		CreatedAt:    budget.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *BudgetService) Create(enterpriseId int64, req dto.CreateBudgetRequest) (*dto.BudgetResponse, error) {
	// 获取或创建默认记账单元
	unitId := req.UnitId
	if unitId == 0 {
		var unit entity.AccountingUnit
		database.DB.Where("enterprise_id = ? AND status = 1", enterpriseId).First(&unit)
		if unit.UnitId == 0 {
			defaultUnit := &entity.AccountingUnit{
				EnterpriseId: enterpriseId,
				Name:         "默认单元",
				Type:         "main",
				Level:        1,
				Status:       1,
			}
			if err := database.DB.Create(defaultUnit).Error; err != nil {
				return nil, errors.New("创建默认单元失败")
			}
			unitId = defaultUnit.UnitId
		} else {
			unitId = unit.UnitId
		}
	}

	// 解析日期
	var periodStart, periodEnd time.Time
	formats := []string{"2006-01-02", "2006-01-02 15:04:05", "2006/01/02"}
	for _, format := range formats {
		if t, err := time.Parse(format, req.PeriodStart); err == nil {
			periodStart = t
			break
		}
	}
	for _, format := range formats {
		if t, err := time.Parse(format, req.PeriodEnd); err == nil {
			periodEnd = t
			break
		}
	}
	if periodStart.IsZero() {
		periodStart = time.Now()
	}
	if periodEnd.IsZero() {
		periodEnd = time.Now()
	}

	// 验证金额
	if req.TotalAmount <= 0 {
		return nil, errors.New("预算金额必须大于0")
	}

	budget := &entity.Budget{
		EnterpriseId: enterpriseId,
		UnitId:       unitId,
		Name:         req.Name,
		Type:         req.Type,
		Category:     req.Category,
		TotalAmount:  req.TotalAmount,
		UsedAmount:   0,
		PeriodStart:  periodStart,
		PeriodEnd:    periodEnd,
		Status:       "active",
	}

	if err := database.DB.Create(budget).Error; err != nil {
		return nil, errors.New("创建预算失败")
	}

	return &dto.BudgetResponse{
		BudgetId:     budget.BudgetId,
		EnterpriseId: budget.EnterpriseId,
		UnitId:       budget.UnitId,
		Name:         budget.Name,
		Type:         budget.Type,
		Category:     budget.Category,
		TotalAmount:  budget.TotalAmount,
		UsedAmount:   budget.UsedAmount,
		PeriodStart:  budget.PeriodStart.Format("2006-01-02"),
		PeriodEnd:    budget.PeriodEnd.Format("2006-01-02"),
		Status:       budget.Status,
		CreatedAt:    budget.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *BudgetService) Update(budgetId int64, req dto.UpdateBudgetRequest) (*dto.BudgetResponse, error) {
	var budget entity.Budget
	if err := database.DB.First(&budget, budgetId).Error; err != nil {
		return nil, errors.New("预算不存在")
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.TotalAmount > 0 {
		// 检查新金额是否小于已使用金额
		if req.TotalAmount < budget.UsedAmount {
			return nil, errors.New("预算金额不能小于已使用金额")
		}
		updates["total_amount"] = req.TotalAmount
	}
	if req.PeriodStart != "" {
		if t, err := time.Parse("2006-01-02", req.PeriodStart); err == nil {
			updates["period_start"] = t
		}
	}
	if req.PeriodEnd != "" {
		if t, err := time.Parse("2006-01-02", req.PeriodEnd); err == nil {
			updates["period_end"] = t
		}
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := database.DB.Model(&budget).Updates(updates).Error; err != nil {
			return nil, errors.New("更新预算失败")
		}
	}

	// 重新加载
	database.DB.First(&budget, budgetId)

	return &dto.BudgetResponse{
		BudgetId:     budget.BudgetId,
		EnterpriseId: budget.EnterpriseId,
		UnitId:       budget.UnitId,
		Name:         budget.Name,
		Type:         budget.Type,
		Category:     budget.Category,
		TotalAmount:  budget.TotalAmount,
		UsedAmount:   budget.UsedAmount,
		PeriodStart:  budget.PeriodStart.Format("2006-01-02"),
		PeriodEnd:    budget.PeriodEnd.Format("2006-01-02"),
		Status:       budget.Status,
		CreatedAt:    budget.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *BudgetService) Delete(budgetId int64) error {
	var budget entity.Budget
	if err := database.DB.First(&budget, budgetId).Error; err != nil {
		return errors.New("预算不存在")
	}

	// 软删除 - 更新状态
	if err := database.DB.Model(&budget).Update("status", "ended").Error; err != nil {
		return errors.New("删除预算失败")
	}

	return nil
}

// GetDetailWithTransactions 获取预算详情及关联的交易记录
func (s *BudgetService) GetDetailWithTransactions(budgetId int64) (*dto.BudgetDetailResponse, error) {
	var budget entity.Budget
	// 获取预算信息
	if err := database.DB.Where("budget_id = ? AND status = 'active'", budgetId).First(&budget).Error; err != nil {
		return nil, errors.New("预算不存在或已被删除")
	}

	// 获取关联的交易记录（只查询支出类型的交易）
	var transactions []entity.Transaction
	if err := database.DB.Where("budget_id = ? AND type = 'expense' AND status = 1", budgetId).
		Order("occurred_at DESC").
		Find(&transactions).Error; err != nil {
		return nil, errors.New("查询关联交易记录失败")
	}

	// 根据关联的交易记录计算实际使用的金额（兼容旧数据）
	var actualUsedAmount float64
	for _, tx := range transactions {
		actualUsedAmount += tx.Amount
	}

	// 如果实际使用金额与数据库中的不一致，更新数据库
	if actualUsedAmount != budget.UsedAmount {
		fmt.Printf("[预算详情] 修正 usedAmount: %.2f -> %.2f (budgetId=%d)\n", budget.UsedAmount, actualUsedAmount, budget.BudgetId)
		database.DB.Exec("UPDATE biz_budget SET used_amount = ? WHERE budget_id = ?", actualUsedAmount, budget.BudgetId)
		budget.UsedAmount = actualUsedAmount
	}

	// 计算使用百分比
	var usagePercent float64
	if budget.TotalAmount > 0 {
		usagePercent = (budget.UsedAmount / budget.TotalAmount) * 100
	}

	// 构建交易响应
	transactionResponses := make([]dto.TransactionResponse, 0, len(transactions))
	for _, tx := range transactions {
		// 获取账户名称
		var account entity.Account
		accountName := ""
		if tx.AccountId > 0 {
			database.DB.Where("account_id = ?", tx.AccountId).First(&account)
			accountName = account.Name
		}

		transactionResponses = append(transactionResponses, dto.TransactionResponse{
			TransactionId: tx.TransactionId,
			EnterpriseId:  tx.EnterpriseId,
			UnitId:        tx.UnitId,
			UserId:        tx.UserId,
			Type:          tx.Type,
			Category:      tx.Category,
			Amount:        tx.Amount,
			AccountId:     tx.AccountId,
			AccountName:   accountName,
			BudgetId:      tx.BudgetId,
			OccurredAt:    tx.OccurredAt.Format("2006-01-02 15:04:05"),
			Tags:          parseJSONArray(tx.Tags),
			Note:          tx.Note,
			Images:        parseJSONArray(tx.Images),
			Status:        tx.Status,
			CreatedAt:     tx.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	remainingAmount := budget.TotalAmount - budget.UsedAmount
	if remainingAmount < 0 {
		remainingAmount = 0
	}

	return &dto.BudgetDetailResponse{
		BudgetResponse: dto.BudgetResponse{
			BudgetId:     budget.BudgetId,
			EnterpriseId: budget.EnterpriseId,
			UnitId:       budget.UnitId,
			Name:         budget.Name,
			Type:         budget.Type,
			Category:     budget.Category,
			TotalAmount:  budget.TotalAmount,
			UsedAmount:   budget.UsedAmount,
			PeriodStart:  budget.PeriodStart.Format("2006-01-02"),
			PeriodEnd:    budget.PeriodEnd.Format("2006-01-02"),
			Status:       budget.Status,
			UsagePercent: usagePercent,
			CreatedAt:    budget.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Transactions:     transactionResponses,
		TransactionCount: len(transactions),
		RemainingAmount:  remainingAmount,
	}, nil
}

// ===== InvestmentService =====
func (s *InvestmentService) List(enterpriseId int64) ([]dto.InvestmentResponse, error) {
	return nil, nil
}

func (s *InvestmentService) GetById(investmentId int64) (*dto.InvestmentResponse, error) {
	return nil, nil
}

func (s *InvestmentService) Create(enterpriseId int64, req dto.CreateInvestmentRequest) (*dto.InvestmentResponse, error) {
	return nil, nil
}

func (s *InvestmentService) Update(investmentId int64, req dto.UpdateInvestmentRequest) (*dto.InvestmentResponse, error) {
	return nil, nil
}

func (s *InvestmentService) Delete(investmentId int64) error {
	return nil
}

// ===== ReportService =====
func (s *ReportService) GetReport(enterpriseId int64, req interface{}) (interface{}, error) {
	return nil, nil
}

func (s *ReportService) GetOverview(enterpriseId int64, req interface{}) (interface{}, error) {
	return nil, nil
}

func (s *ReportService) GetCategory(enterpriseId int64, req interface{}) (interface{}, error) {
	return nil, nil
}

func (s *ReportService) GetTrend(enterpriseId int64, req interface{}) (interface{}, error) {
	return nil, nil
}

func (s *ReportService) GetBalanceSheet(enterpriseId int64, req interface{}) (interface{}, error) {
	return nil, nil
}

func (s *ReportService) GetProfitLoss(enterpriseId int64, req interface{}) (interface{}, error) {
	return nil, nil
}

// ===== Helper functions =====

// parseJSONArray 解析JSON数组字符串为[]string
func parseJSONArray(jsonStr string) []string {
	if jsonStr == "" || jsonStr == "[]" {
		return []string{}
	}
	// 简单解析，去掉首尾的[]，按逗号分割
	jsonStr = strings.TrimPrefix(jsonStr, "[")
	jsonStr = strings.TrimSuffix(jsonStr, "]")
	// 处理引号
	items := strings.Split(jsonStr, ",")
	result := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		item = strings.Trim(item, `"`)
		if item != "" {
			result = append(result, item)
		}
	}
	return result
}

// joinStrings 将字符串数组合并为JSON数组字符串
func joinStrings(items []string, sep string) string {
	return strings.Join(items, sep)
}

func Save(entity Interface) error {
	return database.DB.Save(entity).Error
}

func FindAll(model Interface, dest interface{}) error {
	return database.DB.Find(dest).Error
}

func FindOne(model Interface, dest interface{}, conds ...interface{}) error {
	return database.DB.First(dest, conds...).Error
}

func Delete(model Interface, conds ...interface{}) error {
	return database.DB.Delete(model, conds...).Error
}

// TableName implementations for legacy types
func (User) TableName() string             { return "users" }
func (UserToken) TableName() string        { return "user_tokens" }
func (Enterprise) TableName() string       { return "enterprises" }
func (EnterpriseMember) TableName() string { return "enterprise_members" }
func (AccountingUnit) TableName() string   { return "accounting_units" }
func (UnitPermission) TableName() string   { return "unit_permissions" }
func (Account) TableName() string          { return "accounts" }
func (AccountFlow) TableName() string      { return "account_flows" }
func (Transaction) TableName() string      { return "transactions" }
func (Budget) TableName() string           { return "budgets" }
func (BudgetApproval) TableName() string   { return "budget_approvals" }
func (Investment) TableName() string       { return "investments" }
func (InvestRecord) TableName() string     { return "invest_records" }
func (Notification) TableName() string     { return "notifications" }
func (PushConfig) TableName() string       { return "push_configs" }
func (PushLog) TableName() string          { return "push_logs" }

// Legacy type definitions
type User struct{}
type UserToken struct{}
type Enterprise struct{}
type EnterpriseMember struct{}
type AccountingUnit struct{}
type UnitPermission struct{}
type Account struct{}
type AccountFlow struct{}
type Transaction struct{}
type Budget struct{}
type BudgetApproval struct{}
type Investment struct{}
type InvestRecord struct{}
type Notification struct{}
type PushConfig struct{}
type PushLog struct{}
