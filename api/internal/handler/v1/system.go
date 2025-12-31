package v1

import (
	"context"
	"strconv"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/logger"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// GetEnterprise 获取企业信息
func GetEnterprise(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("GetEnterprise 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/settings/enterprise",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")
	result, err := service.SystemSettingsServiceInst.GetEnterprise(enterpriseId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("GetEnterprise 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("GetEnterprise 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// UpdateEnterprise 更新企业信息
func UpdateEnterprise(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("UpdateEnterprise 请求开始",
		map[string]interface{}{
			"method":     "PUT",
			"path":       "/api/v1/settings/enterprise",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	var req dto.UpdateEnterpriseRequest
	if err := c.Bind(&req); err != nil {
		log.Warnw("UpdateEnterprise 请求参数错误",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	result, err := service.SystemSettingsServiceInst.UpdateEnterprise(enterpriseId, req)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("UpdateEnterprise 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("UpdateEnterprise 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// ListUsers 获取用户列表
func ListUsers(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("ListUsers 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/settings/users",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")
	page, _ := strconv.Atoi(c.Query("page"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize"))

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	users, total, err := service.SystemSettingsServiceInst.ListUsers(enterpriseId, page, pageSize)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("ListUsers 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("ListUsers 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"count", len(users),
		"total", total,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": utils.H{
			"list":  users,
			"total": total,
			"page":  page,
			"pageSize": pageSize,
		},
	})
}

// GetUser 获取单个用户
func GetUser(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	userIdStr := c.Param("userId")
	userId, _ := strconv.ParseInt(userIdStr, 10, 64)

	log.InfoMap("GetUser 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/settings/users/" + userIdStr,
			"request_id": string(requestID),
			"user_id":    userId,
		},
	)

	result, err := service.SystemSettingsServiceInst.GetUserById(userId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("GetUser 请求失败",
			err,
			"request_id", string(requestID),
			"user_id", userId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("GetUser 请求成功",
		"request_id", string(requestID),
		"user_id", userId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// CreateUser 创建用户
func CreateUser(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("CreateUser 请求开始",
		map[string]interface{}{
			"method":     "POST",
			"path":       "/api/v1/settings/users",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	var req dto.CreateUserRequest
	if err := c.Bind(&req); err != nil {
		log.Warnw("CreateUser 请求参数错误",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	req.EnterpriseId = c.GetInt64("enterpriseId")

	result, err := service.SystemSettingsServiceInst.CreateUser(req)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("CreateUser 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", req.EnterpriseId,
			"username", req.Username,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("CreateUser 请求成功",
		"request_id", string(requestID),
		"enterprise_id", req.EnterpriseId,
		"user_id", result.UserId,
		"username", result.Username,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// UpdateUser 更新用户
func UpdateUser(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	userIdStr := c.Param("userId")
	userId, _ := strconv.ParseInt(userIdStr, 10, 64)

	log.InfoMap("UpdateUser 请求开始",
		map[string]interface{}{
			"method":     "PUT",
			"path":       "/api/v1/settings/users/" + userIdStr,
			"request_id": string(requestID),
			"user_id":    userId,
		},
	)

	var req dto.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		log.Warnw("UpdateUser 请求参数错误",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	result, err := service.SystemSettingsServiceInst.UpdateUser(userId, req)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("UpdateUser 请求失败",
			err,
			"request_id", string(requestID),
			"user_id", userId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("UpdateUser 请求成功",
		"request_id", string(requestID),
		"user_id", userId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// DeleteUser 删除用户
func DeleteUser(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	userIdStr := c.Param("userId")
	userId, _ := strconv.ParseInt(userIdStr, 10, 64)

	log.InfoMap("DeleteUser 请求开始",
		map[string]interface{}{
			"method":     "DELETE",
			"path":       "/api/v1/settings/users/" + userIdStr,
			"request_id": string(requestID),
			"user_id":    userId,
		},
	)

	err := service.SystemSettingsServiceInst.DeleteUser(userId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("DeleteUser 请求失败",
			err,
			"request_id", string(requestID),
			"user_id", userId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("DeleteUser 请求成功",
		"request_id", string(requestID),
		"user_id", userId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "删除成功",
	})
}

// GetRoles 获取角色列表
func GetRoles(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("GetRoles 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/settings/roles",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")
	result := service.SystemSettingsServiceInst.GetRoles(enterpriseId)
	duration := time.Since(startTime)

	log.Infow("GetRoles 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"count", len(result),
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// GetPreferences 获取系统偏好设置
func GetPreferences(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("GetPreferences 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/settings/preferences",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")
	result, err := service.SystemSettingsServiceInst.GetPreferences(enterpriseId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("GetPreferences 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("GetPreferences 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// UpdatePreferences 更新系统偏好设置
func UpdatePreferences(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.InfoMap("UpdatePreferences 请求开始",
		map[string]interface{}{
			"method":     "PUT",
			"path":       "/api/v1/settings/preferences",
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	var req dto.UpdatePreferencesRequest
	if err := c.Bind(&req); err != nil {
		log.Warnw("UpdatePreferences 请求参数错误",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "请求参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	result, err := service.SystemSettingsServiceInst.UpdatePreferences(enterpriseId, req)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("UpdatePreferences 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("UpdatePreferences 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}
