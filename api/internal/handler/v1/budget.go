package v1

import (
	"context"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// ListBudgets 获取预算列表
func ListBudgets(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	budgets, err := service.BudgetServiceInst.List(enterpriseId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": budgets,
	})
}

// GetBudget 获取预算详情
func GetBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	budget, err := service.BudgetServiceInst.GetById(budgetId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    404,
			"message": "预算不存在",
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": budget,
	})
}

// CreateBudget 创建预算
func CreateBudget(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateBudgetRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")

	budget, err := service.BudgetServiceInst.Create(enterpriseId, req)
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
		"data":    budget,
	})
}

// UpdateBudget 更新预算
func UpdateBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	var req dto.UpdateBudgetRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	budget, err := service.BudgetServiceInst.Update(budgetId, req)
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
		"data":    budget,
	})
}

// DeleteBudget 删除预算
func DeleteBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	err := service.BudgetServiceInst.Delete(budgetId)
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

// GetBudgetDetail 获取预算详情（包含关联的交易记录）
func GetBudgetDetail(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	detail, err := service.BudgetServiceInst.GetDetailWithTransactions(budgetId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    404,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": detail,
	})
}
