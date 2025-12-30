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

	req := dto.ListTransactionRequest{
		EnterpriseId: enterpriseId,
		Page:         1,
		PageSize:     20,
	}

	result, err := service.TransactionService.List(enterpriseId, req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": result,
	})
}

// GetTransaction 获取单个交易
func GetTransaction(ctx context.Context, c *app.RequestContext) {
	transactionId, _ := strconv.ParseInt(c.Param("transactionId"), 10, 64)

	transaction, err := service.TransactionService.GetById(transactionId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    404,
			"message": "交易记录不存在",
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": transaction,
	})
}

// CreateTransaction 创建交易
func CreateTransaction(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateTransactionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	userId := c.GetInt64("userId")
	req.EnterpriseId = enterpriseId
	req.UserId = userId

	transaction, err := service.TransactionService.Create(enterpriseId, req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code":    0,
		"message": "创建成功",
		"data":    transaction,
	})
}

// UpdateTransaction 更新交易
func UpdateTransaction(ctx context.Context, c *app.RequestContext) {
	transactionId, _ := strconv.ParseInt(c.Param("transactionId"), 10, 64)

	var req dto.UpdateTransactionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	transaction, err := service.TransactionService.Update(transactionId, req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
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
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code":    0,
		"message": "删除成功",
	})
}
