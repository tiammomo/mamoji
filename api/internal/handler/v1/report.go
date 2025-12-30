package v1

import (
	"context"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// GetOverviewReport 获取概览报表
func GetOverviewReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	req := dto.OverviewReportRequest{
		EnterpriseId: enterpriseId,
		StartDate:    startDate,
		EndDate:      endDate,
	}

	report, err := service.ReportService.GetOverview(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": report,
	})
}

// GetIncomeExpenseReport 获取收支报表
func GetIncomeExpenseReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	unitIdStr := c.Query("unitId")

	var unitId int64
	if unitIdStr != "" {
		unitId, _ = strconv.ParseInt(unitIdStr, 10, 64)
	}

	req := dto.IncomeExpenseReportRequest{
		EnterpriseId: enterpriseId,
		UnitId:       unitId,
		StartDate:    startDate,
		EndDate:      endDate,
	}

	report, err := service.ReportService.GetIncomeExpense(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": report,
	})
}

// GetCategoryReport 获取分类报表
func GetCategoryReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	req := dto.CategoryReportRequest{
		EnterpriseId: enterpriseId,
		StartDate:    startDate,
		EndDate:      endDate,
	}

	report, err := service.ReportService.GetCategory(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": report,
	})
}

// GetTrendReport 获取趋势报表
func GetTrendReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	groupBy := c.DefaultQuery("groupBy", "day")

	req := dto.TrendReportRequest{
		EnterpriseId: enterpriseId,
		StartDate:    startDate,
		EndDate:      endDate,
		GroupBy:      groupBy,
	}

	report, err := service.ReportService.GetTrend(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": report,
	})
}

// GetAccountReport 获取账户报表
func GetAccountReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	report, err := service.ReportService.GetAccount(enterpriseId)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": report,
	})
}
