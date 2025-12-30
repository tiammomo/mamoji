package v1

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// GetOverviewReport 获取概览报表
func GetOverviewReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	req := dto.OverviewReportRequest{
		EnterpriseId: enterpriseId,
	}

	report, err := service.ReportServiceInst.GetOverview(enterpriseId, req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": report,
	})
}

// GetCategoryReport 获取分类报表
func GetCategoryReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	req := dto.CategoryReportRequest{
		EnterpriseId: enterpriseId,
	}

	report, err := service.ReportServiceInst.GetCategory(enterpriseId, req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": report,
	})
}

// GetTrendReport 获取趋势报表
func GetTrendReport(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")

	req := dto.TrendReportRequest{
		EnterpriseId: enterpriseId,
	}

	report, err := service.ReportServiceInst.GetTrend(enterpriseId, req)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": report,
	})
}
