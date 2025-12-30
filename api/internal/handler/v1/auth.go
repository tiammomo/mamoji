package v1

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"gorm.io/gorm"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/service"
)

// Login 用户登录
func Login(ctx context.Context, c *app.RequestContext) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
			"data":    err.Error(),
		})
		return
	}

	// 调用服务层
	user, token, err := service.AuthService.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(utils.H{
			"code":    401,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"message": "登录成功",
		"data": dto.LoginResponse{
			Token:     token,
			User:      user,
			ExpiresAt: time.Now().Add(24 * time.Hour).Format("2006-01-02 15:04:05"),
		},
	})
}

// Register 用户注册
func Register(ctx context.Context, c *app.RequestContext) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	user, err := service.AuthService.Register(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "注册成功",
		"data":    user,
	})
}

// Logout 用户登出
func Logout(ctx context.Context, c *app.RequestContext) {
	token := string(c.Request.Header.Get("Authorization"))
	service.AuthService.Logout(token)

	c.JSON(utils.H{
		"code":    0,
		"message": "登出成功",
	})
}

// GetProfile 获取用户信息
func GetProfile(ctx context.Context, c *app.RequestContext) {
	userId := c.GetInt64("userId")
	user, err := service.AuthService.GetUserById(userId)
	if err != nil {
		c.JSON(utils.H{
			"code":    404,
			"message": "用户不存在",
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": user,
	})
}
