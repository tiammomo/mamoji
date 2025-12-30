package v1

import (
	"context"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// ListAccounts 获取账户列表
func ListAccounts(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")
	unitIdStr := c.Query("unitId")

	var unitId int64
	if unitIdStr != "" {
		unitId, _ = strconv.ParseInt(unitIdStr, 10, 64)
	}

	accounts, err := service.AccountService.List(enterpriseId, unitId)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": accounts,
	})
}

// GetAccount 获取单个账户
func GetAccount(ctx context.Context, c *app.RequestContext) {
	accountId, _ := strconv.ParseInt(c.Param("accountId"), 10, 64)

	account, err := service.AccountService.GetById(accountId)
	if err != nil {
		c.JSON(utils.H{
			"code":    404,
			"message": "账户不存在",
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": account,
	})
}

// CreateAccount 创建账户
func CreateAccount(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	req.EnterpriseId = enterpriseId

	account, err := service.AccountService.Create(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "创建成功",
		"data":    account,
	})
}

// UpdateAccount 更新账户
func UpdateAccount(ctx context.Context, c *app.RequestContext) {
	accountId, _ := strconv.ParseInt(c.Param("accountId"), 10, 64)

	var req dto.UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	account, err := service.AccountService.Update(accountId, req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "更新成功",
		"data":    account,
	})
}

// DeleteAccount 删除账户
func DeleteAccount(ctx context.Context, c *app.RequestContext) {
	accountId, _ := strconv.ParseInt(c.Param("accountId"), 10, 64)

	err := service.AccountService.Delete(accountId)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "删除成功",
	})
}

// ListAccountFlows 获取账户流水
func ListAccountFlows(ctx context.Context, c *app.RequestContext) {
	accountId, _ := strconv.ParseInt(c.Param("accountId"), 10, 64)

	flows, err := service.AccountService.ListFlows(accountId)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": flows,
	})
}
