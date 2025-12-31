package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"mamoji/api/internal/config"
	"mamoji/api/internal/database"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
)

// ===== AuthService =====

// Login 用户登录
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

// Register 用户注册
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

// Logout 用户登出
func (s *AuthService) Logout(token string) {
	database.DB.Where("token = ?", token).Delete(&entity.UserToken{})
}

// GetUserById 根据ID获取用户信息
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

// generateToken 生成JWT token
func (s *AuthService) generateToken(userId, enterpriseId int64, username string) (string, error) {
	claims := jwt.MapClaims{
		"userId":       userId,
		"enterpriseId": enterpriseId,
		"username":     username,
		"exp":          time.Now().Add(24 * time.Hour).Unix(),
		"iat":          time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.JWT_SECRET))
}

// InitAdminUser 初始化管理员用户
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

		// 打印到标准输出（main函数中会处理日志）
		println("管理员账户已创建: admin / admin")
	}

	return nil
}
