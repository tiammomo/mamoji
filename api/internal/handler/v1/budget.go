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

// ListBudgets 获取预算列表（带缓存）
func ListBudgets(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	// 记录请求开始
	log.Infoc("ListBudgets 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/budgets",
			"query":      c.Query("unitId"),
			"request_id": string(requestID),
			"enterprise": c.GetInt64("enterpriseId"),
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")

	// 使用缓存获取预算列表
	budgets, err := service.BudgetService.List(enterpriseId)
	if err != nil {
		log.Warnw("ListBudgets 获取预算列表失败",
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	// 转换为响应格式
	responses := service.BudgetService.ConvertToResponseList(budgets)

	duration := time.Since(startTime)
	log.Infoc("ListBudgets 请求完成",
		map[string]interface{}{
			"request_id":  string(requestID),
			"count":       len(responses),
			"duration_ms": duration.Milliseconds(),
		},
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": responses,
	})
}

// GetBudget 获取预算详情（带缓存）
func GetBudget(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	log.Infoc("GetBudget 请求开始",
		map[string]interface{}{
			"method":     "GET",
			"path":       "/api/v1/budgets/" + strconv.FormatInt(budgetId, 10),
			"request_id": string(requestID),
			"budget_id":  budgetId,
		},
	)

	// 使用缓存获取预算详情
	budget, err := service.BudgetService.GetById(budgetId)
	if err != nil {
		log.Warnw("GetBudget 获取预算详情失败",
			"request_id", string(requestID),
			"budget_id", budgetId,
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    404,
			"message": "预算不存在",
		})
		return
	}

	// 转换为响应格式
	response := service.BudgetService.ConvertToResponse(budget)

	duration := time.Since(startTime)
	log.Infoc("GetBudget 请求完成",
		map[string]interface{}{
			"request_id":  string(requestID),
			"budget_id":   budgetId,
			"duration_ms": duration.Milliseconds(),
		},
	)

	c.JSON(200, utils.H{
		"code": 0,
		"data": response,
	})
}

// CreateBudget 创建预算（写缓存 + MySQL）
func CreateBudget(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	var req dto.CreateBudgetRequest
	if err := c.BindJSON(&req); err != nil {
		log.Warnw("CreateBudget 参数错误",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	log.Infoc("CreateBudget 请求开始",
		map[string]interface{}{
			"method":     "POST",
			"path":       "/api/v1/budgets",
			"request_id": string(requestID),
			"name":       req.Name,
		},
	)

	enterpriseId := c.GetInt64("enterpriseId")

	budget, err := service.BudgetService.Create(enterpriseId, req)
	if err != nil {
		log.Warnw("CreateBudget 创建失败",
			"request_id", string(requestID),
			"enterprise_id", enterpriseId,
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	// 转换为响应格式
	response := service.BudgetService.ConvertToResponse(budget)

	duration := time.Since(startTime)
	log.Infoc("CreateBudget 请求完成",
		map[string]interface{}{
			"request_id":  string(requestID),
			"budget_id":   budget.BudgetId,
			"duration_ms": duration.Milliseconds(),
		},
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "创建成功",
		"data":    response,
	})
}

// UpdateBudget 更新预算（写缓存 + MySQL）
func UpdateBudget(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	log.Infoc("UpdateBudget 请求开始",
		map[string]interface{}{
			"method":     "PUT",
			"path":       "/api/v1/budgets/" + strconv.FormatInt(budgetId, 10),
			"request_id": string(requestID),
			"budget_id":  budgetId,
		},
	)

	var req dto.UpdateBudgetRequest
	if err := c.BindJSON(&req); err != nil {
		log.Warnw("UpdateBudget 参数错误",
			"request_id", string(requestID),
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	budget, err := service.BudgetService.Update(budgetId, req)
	if err != nil {
		log.Warnw("UpdateBudget 更新失败",
			"request_id", string(requestID),
			"budget_id", budgetId,
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	// 转换为响应格式
	response := service.BudgetService.ConvertToResponse(budget)

	duration := time.Since(startTime)
	log.Infoc("UpdateBudget 请求完成",
		map[string]interface{}{
			"request_id":  string(requestID),
			"budget_id":   budgetId,
			"duration_ms": duration.Milliseconds(),
		},
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "更新成功",
		"data":    response,
	})
}

// DeleteBudget 删除预算（删缓存 + MySQL）
func DeleteBudget(ctx context.Context, c *app.RequestContext) {
	requestID := c.GetHeader("X-Request-ID")
	startTime := time.Now()
	log := logger.Get()

	budgetId, _ := strconv.ParseInt(c.Param("budgetId"), 10, 64)

	log.Infoc("DeleteBudget 请求开始",
		map[string]interface{}{
			"method":     "DELETE",
			"path":       "/api/v1/budgets/" + strconv.FormatInt(budgetId, 10),
			"request_id": string(requestID),
			"budget_id":  budgetId,
		},
	)

	err := service.BudgetService.Delete(budgetId)
	if err != nil {
		log.Warnw("DeleteBudget 删除失败",
			"request_id", string(requestID),
			"budget_id", budgetId,
			"error", err.Error(),
		)
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	duration := time.Since(startTime)
	log.Infoc("DeleteBudget 请求完成",
		map[string]interface{}{
			"request_id":  string(requestID),
			"budget_id":   budgetId,
			"duration_ms": duration.Milliseconds(),
		},
	)

	c.JSON(200, utils.H{
		"code":    0,
		"message": "删除成功",
	})
}
