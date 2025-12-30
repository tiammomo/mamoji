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

// ListAccounts 获取账户列表
func ListAccounts(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	// 记录请求开始
	log.Infoc("ListAccounts 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/accounts",
			"query":      c.Query("unitId"),
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")
	unitIdStr := c.Query("unitId")

	var unitId int64
	if unitIdStr != "" {
		unitId, _ = strconv.ParseInt(unitIdStr, 10, 64)
		log.Debugf("解析unitId: %d", unitId)
	}

	accounts, err := service.AccountService.List(enterpriseId, unitId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("ListAccounts 请求失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"unit_id", unitId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("ListAccounts 请求成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"unit_id", unitId,
		"count", len(accounts),
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": accounts,
	})
}

// GetAccount 获取单个账户
func GetAccount(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.Infoc("GetAccount 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/accounts/{accountId}",
			"account_id": c.Param("accountId"),
			"request_id": string(requestID),
		},
	)

	accountId, err := strconv.ParseInt(c.Param("accountId"), 10, 64)
	if err != nil {
		log.Warnw("GetAccount 参数错误",
			"request_id", string(requestID),
			"account_id", c.Param("accountId"),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	account, err := service.AccountService.GetById(accountId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("GetAccount 请求失败",
			err,
			"request_id", string(requestID),
			"account_id", accountId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    404,
			"message": "账户不存在",
		})
		return
	}

	log.Infow("GetAccount 请求成功",
		"request_id", string(requestID),
		"account_id", accountId,
		"account_name", account.Name,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": account,
	})
}

// CreateAccount 创建账户
func CreateAccount(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.Infoc("CreateAccount 请求开始",
		map[string]interface{}{
			"method":     "POST",
			"path":       "/api/v1/accounts",
			"request_id": string(requestID),
		},
	)

	var req dto.CreateAccountRequest
	if err := c.BindJSON(&req); err != nil {
		log.Warnw("CreateAccount 参数绑定失败",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	log.Debugw("CreateAccount 请求参数",
		"request_id", string(requestID),
		"account_name", req.Name,
		"account_type", req.Type,
		"balance", req.Balance,
	)

	enterpriseId := c.GetInt64("enterpriseId")
	req.EnterpriseId = enterpriseId

	account, err := service.AccountService.Create(req)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("CreateAccount 创建失败",
			err,
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"account_name", req.Name,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("CreateAccount 创建成功",
		"request_id", string(requestID),
		"enterprise_id", enterpriseId,
		"account_id", account.AccountId,
		"account_name", account.Name,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "创建成功",
		"data":    account,
	})
}

// UpdateAccount 更新账户
func UpdateAccount(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.Infoc("UpdateAccount 请求开始",
		map[string]interface{}{
			"method":     "PUT",
			"path":       "/api/v1/accounts/{accountId}",
			"account_id": c.Param("accountId"),
			"request_id": string(requestID),
		},
	)

	accountId, err := strconv.ParseInt(c.Param("accountId"), 10, 64)
	if err != nil {
		log.Warnw("UpdateAccount 参数错误",
			"request_id", string(requestID),
			"account_id", c.Param("accountId"),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	var req dto.UpdateAccountRequest
	if err := c.BindJSON(&req); err != nil {
		log.Warnw("UpdateAccount 参数绑定失败",
			"request_id", string(requestID),
			"account_id", accountId,
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	log.Debugw("UpdateAccount 请求参数",
		"request_id", string(requestID),
		"account_id", accountId,
		"account_name", req.Name,
		"balance", req.Balance,
	)

	account, err := service.AccountService.Update(accountId, req)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("UpdateAccount 更新失败",
			err,
			"request_id", string(requestID),
			"account_id", accountId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("UpdateAccount 更新成功",
		"request_id", string(requestID),
		"account_id", accountId,
		"account_name", account.Name,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "更新成功",
		"data":    account,
	})
}

// DeleteAccount 删除账户
func DeleteAccount(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.Infoc("DeleteAccount 请求开始",
		map[string]interface{}{
			"method":     "DELETE",
			"path":       "/api/v1/accounts/{accountId}",
			"account_id": c.Param("accountId"),
			"request_id": string(requestID),
		},
	)

	accountId, err := strconv.ParseInt(c.Param("accountId"), 10, 64)
	if err != nil {
		log.Warnw("DeleteAccount 参数错误",
			"request_id", string(requestID),
			"account_id", c.Param("accountId"),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	err = service.AccountService.Delete(accountId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("DeleteAccount 删除失败",
			err,
			"request_id", string(requestID),
			"account_id", accountId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("DeleteAccount 删除成功",
		"request_id", string(requestID),
		"account_id", accountId,
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "删除成功",
	})
}

// ListAccountFlows 获取账户流水
func ListAccountFlows(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	log.Infoc("ListAccountFlows 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/accounts/{accountId}/flows",
			"account_id": c.Param("accountId"),
			"request_id": string(requestID),
		},
	)

	accountId, err := strconv.ParseInt(c.Param("accountId"), 10, 64)
	if err != nil {
		log.Warnw("ListAccountFlows 参数错误",
			"request_id", string(requestID),
			"account_id", c.Param("accountId"),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	flows, err := service.AccountService.ListFlows(accountId)
	duration := time.Since(startTime)

	if err != nil {
		log.Errorw("ListAccountFlows 获取失败",
			err,
			"request_id", string(requestID),
			"account_id", accountId,
			"duration_ms", duration.Milliseconds(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	log.Infow("ListAccountFlows 获取成功",
		"request_id", string(requestID),
		"account_id", accountId,
		"count", len(flows),
		"duration_ms", duration.Milliseconds(),
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": flows,
	})
}
