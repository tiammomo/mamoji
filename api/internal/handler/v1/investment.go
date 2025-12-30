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

	investments, err := service.InvestmentServiceInst.List(enterpriseId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    500,
			"message": err.Error(),
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": investments,
	})
}

// GetInvestment 获取投资详情
func GetInvestment(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	investment, err := service.InvestmentServiceInst.GetById(investmentId)
	if err != nil {
		c.JSON(200, utils.H{
			"code":    404,
			"message": "投资不存在",
		})
		return
	}

	c.JSON(200, utils.H{
		"code": 0,
		"data": investment,
	})
}

// CreateInvestment 创建投资
func CreateInvestment(ctx context.Context, c *app.RequestContext) {
	var req dto.CreateInvestmentRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	enterpriseId := c.GetInt64("enterpriseId")
	req.EnterpriseId = enterpriseId

	investment, err := service.InvestmentServiceInst.Create(enterpriseId, req)
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
		"data":    investment,
	})
}

// UpdateInvestment 更新投资
func UpdateInvestment(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	var req dto.UpdateInvestmentRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(200, utils.H{
			"code":    400,
			"message": "参数错误",
		})
		return
	}

	investment, err := service.InvestmentServiceInst.Update(investmentId, req)
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
		"data":    investment,
	})
}

// DeleteInvestment 删除投资
func DeleteInvestment(ctx context.Context, c *app.RequestContext) {
	investmentId, _ := strconv.ParseInt(c.Param("investmentId"), 10, 64)

	err := service.InvestmentServiceInst.Delete(investmentId)
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
