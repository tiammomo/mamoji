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
	unitIdStr := c.Query("unitId")
	status := c.Query("status")

	var unitId int64
	if unitIdStr != "" {
		unitId, _ = strconv.ParseInt(unitIdStr, 10, 64)
	}

	req := dto.ListBudgetRequest{
		EnterpriseId: enterpriseId,
		UnitId:       unitId,
		Status:       status,
	}

	budgets, err := service.BudgetService.List(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": budgets,
	})
}

// GetBudget 获取预算详情
func GetBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	budget, err := service.BudgetService.GetById(budgetId)
	if err != nil {
		c.JSON(utils.H{
			"code":    404,
			"message": "预算不存在",
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": budget,
	})
}

// CreateBudget 创建预算
func CreateBudget(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	req.EnterpriseId = enterpriseId

	budget, err := service.BudgetService.Create(req)
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
		"data":    budget,
	})
}

// UpdateBudget 更新预算
func UpdateBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	var req dto.UpdateBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	budget, err := service.BudgetService.Update(budgetId, req)
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
		"data":    budget,
	})
}

// DeleteBudget 删除预算
func DeleteBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	err := service.BudgetService.Delete(budgetId)
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

// ApplyBudget 申请预算
func ApplyBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)
	userId := c.GetInt64("userId")

	var req dto.ApplyBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	approval, err := service.BudgetService.Apply(budgetId, userId, req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "申请已提交",
		"data":    approval,
	})
}

// ApproveBudget 审批预算
func ApproveBudget(ctx context.Context, c *app.RequestContext) {
	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)
	approverId := c.GetInt64("userId")

	var req dto.ApproveBudgetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	err := service.BudgetService.Approve(budgetId, approverId, req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "审批完成",
	})
}
