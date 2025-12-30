package v1

import (
	"context"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/utils"
	"mamoji/api/internal/model/dto"
	"mamoji/api/internal/service"
)

// ListInvestments 获取投资列表
func ListInvestments(ctx context.Context, c *app.RequestContext) {
	enterpriseId := c.GetInt64("enterpriseId")
	unitIdStr := c.Query("unitId")
	productType := c.Query("productType")

	var unitId int64
	if unitIdStr != "" {
		unitId, _ = strconv.ParseInt(unitIdStr, 10, 64)
	}

	req := dto.ListInvestmentRequest{
		EnterpriseId: enterpriseId,
		UnitId:       unitId,
		ProductType:  productType,
	}

	investments, err := service.InvestmentService.List(req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": investments,
	})
}

// GetInvestment 获取投资详情
func GetInvestment(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	investment, err := service.InvestmentService.GetById(investmentId)
	if err != nil {
		c.JSON(utils.H{
			"code":    404,
			"message": "投资不存在",
		})
		return
	}

	c.JSON(utils.H{
		"code": 0,
		"data": investment,
	})
}

// CreateInvestment 创建投资
func CreateInvestment(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateInvestmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	req.EnterpriseId = enterpriseId

	investment, err := service.InvestmentService.Create(req)
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
		"data":    investment,
	})
}

// UpdateInvestment 更新投资
func UpdateInvestment(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	var req dto.UpdateInvestmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	investment, err := service.InvestmentService.Update(investmentId, req)
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
		"data":    investment,
	})
}

// DeleteInvestment 删除投资
func DeleteInvestment(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	err := service.InvestmentService.Delete(investmentId)
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

// CreateInvestRecord 创建投资记录
func CreateInvestRecord(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	var req dto.CreateInvestRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	record, err := service.InvestmentService.CreateRecord(investmentId, req)
	if err != nil {
		c.JSON(utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(utils.H{
		"code":    0,
		"message": "记录成功",
		"data":    record,
	})
}
