package v1

import (
	"context"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// ListTransactions 获取交易列表
func ListTransactions(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	// 解析查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	unitIdStr := c.Query("unitId")
	typeStr := c.Query("type")
	category := c.Query("category")

	var unitId int64
	if unitIdStr != "" {
		unitId, _ = strconv.ParseInt(unitIdStr, 10, 64)
	}

	req := dto.ListTransactionRequest{
		EnterpriseId: enterpriseId,
		UnitId:       unitId,
		Type:         typeStr,
		Category:     category,
		Page:         page,
		PageSize:     pageSize,
	}

	result, err := service.TransactionService.List(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": result,
	})
}

// GetTransaction 获取单个交易
func GetTransaction(ctx context.Context, c *app.RequestContext) {
	transactionId, _ := strconv.ParseInt(c.Param("transactionId"), 10, 64)

	transaction, err := service.TransactionService.GetById(transactionId)
	if err != nil {
		c.JSON(utils.H{
			"code":    404,
			"message": "交易记录不存在",
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": transaction,
	})
}

// CreateTransaction 创建交易
func CreateTransaction(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	userId := c.GetInt64("userId")
	req.EnterpriseId = enterpriseId
	req.UserId = userId

	transaction, err := service.TransactionService.Create(req)
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
		"data":    transaction,
	})
}

// UpdateTransaction 更新交易
func UpdateTransaction(ctx context.Context, c *app.RequestContext) {
	transactionId, _ := strconv.ParseInt(c.Param("transactionId"), 10, 64)

	var req dto.UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	transaction, err := service.TransactionService.Update(transactionId, req)
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
		"data":    transaction,
	})
}

// DeleteTransaction 删除交易
func DeleteTransaction(ctx context.Context, c *app.RequestContext) {
	transactionId, _ := strconv.ParseInt(c.Param("transactionId"), 10, 64)

	err := service.TransactionService.Delete(transactionId)
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
