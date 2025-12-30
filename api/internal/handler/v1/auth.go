package v1

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// Login 用户登录
func Login(ctx context.Context, c *app.RequestContext) {
	var req dto.LoginRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	// 调用服务层
	user, token, err := service.AuthServiceInst.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    401,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code":    0,
		"message": "登录成功",
		"data": utils.H{
			"token":     token,
			"user":      user,
			"expiresAt": time.Now().Add(24 * time.Hour).Format("2006-01-02 15:04:05"),
		},
	})
}

// Register 用户注册
func Register(ctx context.Context, c *app.RequestContext) {
	var req dto.RegisterRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	user, err := service.AuthServiceInst.Register(req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code":    0,
		"message": "注册成功",
		"data":    user,
	})
}

// Logout 用户登出
func Logout(ctx context.Context, c *app.RequestContext) {
	token := string(c.Request.Header.Get("Authorization"))
	service.AuthServiceInst.Logout(token)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "登出成功",
	})
}

// GetProfile 获取用户信息
func GetProfile(ctx context.Context, c *app.RequestContext) {
	userId := c.GetInt64("userId")
	user, err := service.AuthServiceInst.GetUserById(userId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    404,
			"message": "用户不存在",
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": user,
	})
}
