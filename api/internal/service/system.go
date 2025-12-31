package service

import (
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// ===== SystemSettingsService =====

// GetEnterprise 获取企业信息
func (s *SystemSettingsService) GetEnterprise(enterpriseId int64) (*dto.EnterpriseSettings, error) {
	var enterprise entity.Enterprise
	if err := database.DB.Where("enterprise_id = ?", enterpriseId).First(&enterprise).Error; err != nil {
		// 如果企业不存在，返回默认信息
		return &dto.EnterpriseSettings{
			EnterpriseId:   enterpriseId,
			EnterpriseName: "默认企业",
			ContactPerson:  "管理员",
			CreatedAt:      time.Now().Format("2006-01-02 15:04:05"),
		}, nil
	}

	return &dto.EnterpriseSettings{
		EnterpriseId:   enterprise.EnterpriseId,
		EnterpriseName: enterprise.Name,
		ContactPerson:  enterprise.ContactPerson,
		ContactPhone:   enterprise.ContactPhone,
		Address:        enterprise.Address,
		CreatedAt:      enterprise.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

// UpdateEnterprise 更新企业信息
func (s *SystemSettingsService) UpdateEnterprise(enterpriseId int64, req dto.UpdateEnterpriseRequest) (*dto.EnterpriseSettings, error) {
	var enterprise entity.Enterprise
	if err := database.DB.Where("enterprise_id = ?", enterpriseId).First(&enterprise).Error; err != nil {
		// 创建新企业记录
		enterprise = entity.Enterprise{
			EnterpriseId:  enterpriseId,
			Name:          req.EnterpriseName,
			ContactPerson: req.ContactPerson,
			ContactPhone:  req.ContactPhone,
			Address:       req.Address,
			Status:        1,
		}
		if err := database.DB.Create(&enterprise).Error; err != nil {
			return nil, errors.New("创建企业信息失败")
		}
	} else {
		// 更新现有企业
		updates := map[string]interface{}{
			"name":           req.EnterpriseName,
			"contact_person": req.ContactPerson,
		}
		if req.ContactPhone != "" {
			updates["contact_phone"] = req.ContactPhone
		}
		if req.Address != "" {
			updates["address"] = req.Address
		}
		if err := database.DB.Model(&enterprise).Updates(updates).Error; err != nil {
			return nil, errors.New("更新企业信息失败")
		}
	}

	return s.GetEnterprise(enterpriseId)
}

// ListUsers 获取用户列表
func (s *SystemSettingsService) ListUsers(enterpriseId int64, page, pageSize int) ([]dto.SystemUser, int64, error) {
	var total int64

	offset := (page - 1) * pageSize

	// 查询总数 - 通过 EnterpriseMember 表查询
	if err := database.DB.Model(&entity.EnterpriseMember{}).Where("enterprise_id = ?", enterpriseId).Count(&total).Error; err != nil {
		return nil, 0, errors.New("查询用户总数失败")
	}

	// 查询用户列表 - 关联 EnterpriseMember 表
	var members []entity.EnterpriseMember
	if err := database.DB.Where("enterprise_id = ?", enterpriseId).
		Order("joined_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&members).Error; err != nil {
		return nil, 0, errors.New("查询用户列表失败")
	}

	result := make([]dto.SystemUser, 0, len(members))
	for _, member := range members {
		var user entity.User
		if err := database.DB.Where("user_id = ?", member.UserId).First(&user).Error; err != nil {
			continue
		}
		result = append(result, dto.SystemUser{
			UserId:       user.UserId,
			Username:     user.Username,
			Phone:        user.Phone,
			Email:        user.Email,
			Avatar:       user.Avatar,
			EnterpriseId: enterpriseId,
			Role:         member.Role,
			Status:       user.Status,
			CreatedAt:    user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return result, total, nil
}

// GetUserById 获取单个用户
func (s *SystemSettingsService) GetUserById(userId int64) (*dto.SystemUser, error) {
	var user entity.User
	if err := database.DB.Where("user_id = ?", userId).First(&user).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	// 获取用户在企业中的角色
	var member entity.EnterpriseMember
	var enterpriseId int64
	if database.DB.Where("user_id = ?", userId).First(&member).Error == nil {
		enterpriseId = member.EnterpriseId
	}

	return &dto.SystemUser{
		UserId:       user.UserId,
		Username:     user.Username,
		Phone:        user.Phone,
		Email:        user.Email,
		Avatar:       user.Avatar,
		EnterpriseId: enterpriseId,
		Role:         member.Role,
		Status:       user.Status,
		CreatedAt:    user.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

// CreateUser 创建用户
func (s *SystemSettingsService) CreateUser(req dto.CreateUserRequest) (*dto.SystemUser, error) {
	// 检查用户名是否已存在
	var existUser entity.User
	if database.DB.Where("username = ?", req.Username).First(&existUser).Error == nil {
		return nil, errors.New("用户名已存在")
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	user := &entity.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Phone:    req.Phone,
		Email:    req.Email,
		Role:     req.Role,
		Status:   1,
	}

	if err := database.DB.Create(user).Error; err != nil {
		return nil, errors.New("创建用户失败")
	}

	// 添加到企业成员表
	member := &entity.EnterpriseMember{
		EnterpriseId: req.EnterpriseId,
		UserId:       user.UserId,
		Role:         req.Role,
	}
	if err := database.DB.Create(member).Error; err != nil {
		// 如果添加成员失败，删除已创建的用户
		database.DB.Delete(user)
		return nil, errors.New("添加企业成员失败")
	}

	return &dto.SystemUser{
		UserId:       user.UserId,
		Username:     user.Username,
		Phone:        user.Phone,
		Email:        user.Email,
		EnterpriseId: req.EnterpriseId,
		Role:         req.Role,
		Status:       user.Status,
		CreatedAt:    user.CreatedAt.Format("2006-01-02 15:04:05"),
	}, nil
}

// UpdateUser 更新用户
func (s *SystemSettingsService) UpdateUser(userId int64, req dto.UpdateUserRequest) (*dto.SystemUser, error) {
	var user entity.User
	if err := database.DB.First(&user, userId).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	updates := make(map[string]interface{})
	if req.Username != "" {
		// 检查新用户名是否已存在
		var existUser entity.User
		if database.DB.Where("username = ? AND user_id != ?", req.Username, userId).First(&existUser).Error == nil {
			return nil, errors.New("用户名已存在")
		}
		updates["username"] = req.Username
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if req.Status != 0 {
		updates["status"] = req.Status
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
			return nil, errors.New("更新用户失败")
		}
	}

	return s.GetUserById(userId)
}

// DeleteUser 删除用户
func (s *SystemSettingsService) DeleteUser(userId int64) error {
	var user entity.User
	if err := database.DB.First(&user, userId).Error; err != nil {
		return errors.New("用户不存在")
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		return errors.New("删除用户失败")
	}

	return nil
}

// UpdateUserPassword 更新用户密码
func (s *SystemSettingsService) UpdateUserPassword(userId int64, req dto.UpdateUserPasswordRequest) error {
	var user entity.User
	if err := database.DB.First(&user, userId).Error; err != nil {
		return errors.New("用户不存在")
	}

	// 验证旧密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return errors.New("原密码错误")
	}

	// 加密新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("密码加密失败")
	}

	if err := database.DB.Model(&user).Update("password", string(hashedPassword)).Error; err != nil {
		return errors.New("更新密码失败")
	}

	return nil
}

// GetRoles 获取角色列表
func (s *SystemSettingsService) GetRoles(enterpriseId int64) []dto.RoleInfo {
	roles := []dto.RoleInfo{
		{
			Role:        "super_admin",
			RoleName:    "超级管理员",
			Description: "拥有所有系统权限",
			Permissions: []string{"*"},
			UserCount:   0,
		},
		{
			Role:        "finance_admin",
			RoleName:    "财务管理员",
			Description: "管理财务数据和审批流程",
			Permissions: []string{"accounts:*", "transactions:*", "budgets:*", "reports:*"},
			UserCount:   0,
		},
		{
			Role:        "normal",
			RoleName:    "普通用户",
			Description: "可进行日常记账操作",
			Permissions: []string{"transactions:create", "transactions:read", "accounts:read"},
			UserCount:   0,
		},
		{
			Role:        "readonly",
			RoleName:    "只读用户",
			Description: "仅可查看数据",
			Permissions: []string{"transactions:read", "accounts:read", "reports:read"},
			UserCount:   0,
		},
	}

	// 统计每个角色的用户数量
	for i := range roles {
		var count int64
		database.DB.Model(&entity.User{}).Where("enterprise_id = ? AND role = ?", enterpriseId, roles[i].Role).Count(&count)
		roles[i].UserCount = int(count)
	}

	return roles
}

// GetPreferences 获取系统偏好设置
func (s *SystemSettingsService) GetPreferences(enterpriseId int64) (*dto.SystemPreferences, error) {
	// 尝试从数据库读取，如果不存在则返回默认值
	var prefs SystemPreference
	if err := database.DB.Where("enterprise_id = ?", enterpriseId).First(&prefs).Error; err != nil {
		// 返回默认值
		return &dto.SystemPreferences{
			EnterpriseId:     enterpriseId,
			Currency:         "CNY",
			Timezone:         "Asia/Shanghai",
			DateFormat:       "YYYY-MM-DD",
			MonthStart:       1,
			AutoBackup:       false,
			TransactionLimit: 100000,
			RequireApproval:  false,
		}, nil
	}

	return &dto.SystemPreferences{
		EnterpriseId:      prefs.EnterpriseId,
		Currency:          prefs.Currency,
		Timezone:          prefs.Timezone,
		DateFormat:        prefs.DateFormat,
		MonthStart:        prefs.MonthStart,
		ExpenseCategory:   prefs.ExpenseCategory,
		IncomeCategory:    prefs.IncomeCategory,
		AutoBackup:        prefs.AutoBackup,
		BackupFrequency:   prefs.BackupFrequency,
		TransactionLimit:  prefs.TransactionLimit,
		RequireApproval:   prefs.RequireApproval,
		ApprovalThreshold: prefs.ApprovalThreshold,
	}, nil
}

// UpdatePreferences 更新系统偏好设置
func (s *SystemSettingsService) UpdatePreferences(enterpriseId int64, req dto.UpdatePreferencesRequest) (*dto.SystemPreferences, error) {
	var prefs SystemPreference
	if err := database.DB.Where("enterprise_id = ?", enterpriseId).First(&prefs).Error; err != nil {
		// 创建新偏好设置
		prefs = SystemPreference{
			EnterpriseId: enterpriseId,
		}
	}

	updates := make(map[string]interface{})
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.Timezone != "" {
		updates["timezone"] = req.Timezone
	}
	if req.DateFormat != "" {
		updates["date_format"] = req.DateFormat
	}
	if req.MonthStart != 0 {
		updates["month_start"] = req.MonthStart
	}
	if req.ExpenseCategory != "" {
		updates["expense_category"] = req.ExpenseCategory
	}
	if req.IncomeCategory != "" {
		updates["income_category"] = req.IncomeCategory
	}
	updates["auto_backup"] = req.AutoBackup
	if req.BackupFrequency != "" {
		updates["backup_frequency"] = req.BackupFrequency
	}
	if req.TransactionLimit > 0 {
		updates["transaction_limit"] = req.TransactionLimit
	}
	updates["require_approval"] = req.RequireApproval
	if req.ApprovalThreshold > 0 {
		updates["approval_threshold"] = req.ApprovalThreshold
	}

	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if prefs.PreferenceId > 0 {
			if err := database.DB.Model(&prefs).Updates(updates).Error; err != nil {
				return nil, errors.New("更新偏好设置失败")
			}
		} else {
			prefs.EnterpriseId = enterpriseId
			for k, v := range updates {
				switch k {
				case "currency":
					prefs.Currency = v.(string)
				case "timezone":
					prefs.Timezone = v.(string)
				case "date_format":
					prefs.DateFormat = v.(string)
				case "month_start":
					prefs.MonthStart = v.(int)
				case "expense_category":
					prefs.ExpenseCategory = v.(string)
				case "income_category":
					prefs.IncomeCategory = v.(string)
				case "auto_backup":
					prefs.AutoBackup = v.(bool)
				case "backup_frequency":
					prefs.BackupFrequency = v.(string)
				case "transaction_limit":
					prefs.TransactionLimit = v.(float64)
				case "require_approval":
					prefs.RequireApproval = v.(bool)
				case "approval_threshold":
					prefs.ApprovalThreshold = v.(float64)
				}
			}
			if err := database.DB.Create(&prefs).Error; err != nil {
				return nil, errors.New("创建偏好设置失败")
			}
		}
	}

	return s.GetPreferences(enterpriseId)
}

// SystemPreference 系统偏好设置实体
type SystemPreference struct {
	PreferenceId      int64     `gorm:"primaryKey;autoIncrement" json:"preferenceId"`
	EnterpriseId      int64     `gorm:"index;not null" json:"enterpriseId"`
	Currency          string    `gorm:"default:CNY" json:"currency"`
	Timezone          string    `gorm:"default:Asia/Shanghai" json:"timezone"`
	DateFormat        string    `gorm:"default:YYYY-MM-DD" json:"dateFormat"`
	MonthStart        int       `gorm:"default:1" json:"monthStart"`
	ExpenseCategory   string    `gorm:"type:text" json:"expenseCategory"`
	IncomeCategory    string    `gorm:"type:text" json:"incomeCategory"`
	AutoBackup        bool      `gorm:"default:false" json:"autoBackup"`
	BackupFrequency   string    `gorm:"default:daily" json:"backupFrequency"`
	TransactionLimit  float64   `gorm:"default:100000" json:"transactionLimit"`
	RequireApproval   bool      `gorm:"default:false" json:"requireApproval"`
	ApprovalThreshold float64   `gorm:"default:0" json:"approvalThreshold"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

func (SystemPreference) TableName() string {
	return "system_preferences"
}
