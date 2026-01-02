package service

import (
	"context"

	"mamoji/api/internal/application/dto/request"
	"mamoji/api/internal/application/dto/response"
	"mamoji/api/internal/application/mapper"
	"mamoji/api/internal/domain/repository"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/pkg/errors"
)

// BudgetApplicationService 预算应用服务
type BudgetApplicationService struct {
	repo   repository.BudgetRepository
	txRepo repository.TransactionRepository
	mapper *mapper.BudgetMapper
}

// NewBudgetApplicationService 创建预算应用服务
func NewBudgetApplicationService(
	budgetRepo repository.BudgetRepository,
	txRepo repository.TransactionRepository,
) *BudgetApplicationService {
	return &BudgetApplicationService{
		repo:   budgetRepo,
		txRepo: txRepo,
		mapper: mapper.NewBudgetMapper(),
	}
}

// Create 创建预算
func (s *BudgetApplicationService) Create(ctx context.Context, req *request.CreateBudgetRequest) (*response.BudgetResponse, error) {
	// 验证
	if err := request.Validate(req); err != nil {
		return nil, errors.InvalidParams(err.Error())
	}

	// 创建实体
	budget, err := s.mapper.ToEntity(req)
	if err != nil {
		return nil, errors.InvalidParams("日期格式错误")
	}

	// 保存
	saved, err := s.repo.Create(ctx, budget)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Get 获取预算详情
func (s *BudgetApplicationService) Get(ctx context.Context, budgetID int64) (*response.BudgetResponse, error) {
	budget, err := s.repo.FindByID(ctx, budgetID)
	if err != nil {
		return nil, err
	}
	return s.mapper.ToResponse(budget), nil
}

// GetDetail 获取预算详情（包含交易）
func (s *BudgetApplicationService) GetDetail(ctx context.Context, budgetID int64) (*response.BudgetDetailResponse, error) {
	budget, err := s.repo.FindByID(ctx, budgetID)
	if err != nil {
		return nil, err
	}

	// 获取关联的交易
	transactions, _ := s.repo.FindByBudget(ctx, budgetID)

	return s.mapper.ToDetailResponse(budget, transactions), nil
}

// List 获取预算列表
func (s *BudgetApplicationService) List(ctx context.Context, req *request.ListBudgetRequest) (*response.PaginatedResponse, error) {
	paginator := errors.NewPaginator(req.Page, req.PageSize)

	var budgets []*entity.Budget
	var err error
	var total int64

	budgets, total, err = s.repo.Paginate(ctx, req.UnitId, paginator.Page, paginator.PageSize)
	if err != nil {
		return nil, err
	}

	return &response.PaginatedResponse{
		List:       s.mapper.ToResponses(budgets),
		Total:      total,
		Page:       paginator.Page,
		PageSize:   paginator.PageSize,
		TotalPages: (int(total) + paginator.PageSize - 1) / paginator.PageSize,
	}, nil
}

// Update 更新预算
func (s *BudgetApplicationService) Update(ctx context.Context, budgetID int64, req *request.UpdateBudgetRequest) (*response.BudgetResponse, error) {
	// 查找预算
	budget, err := s.repo.FindByID(ctx, budgetID)
	if err != nil {
		return nil, err
	}

	// 应用更新
	if req.Name != nil {
		budget.Name = *req.Name
	}
	if req.Type != nil {
		budget.Type = *req.Type
	}
	if req.Category != nil {
		budget.Category = *req.Category
	}
	if req.TotalAmount != nil {
		budget.TotalAmount = *req.TotalAmount
	}
	if req.Status != nil {
		budget.Status = *req.Status
	}

	// 保存
	saved, err := s.repo.Update(ctx, budget)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Delete 删除预算
func (s *BudgetApplicationService) Delete(ctx context.Context, budgetID int64) error {
	return s.repo.Delete(ctx, budgetID)
}

// GetListWithStats 获取预算列表（带统计）
func (s *BudgetApplicationService) GetListWithStats(ctx context.Context, enterpriseID int64) ([]*response.BudgetDetailResponse, error) {
	budgets, err := s.repo.FindByEnterprise(ctx, enterpriseID)
	if err != nil {
		return nil, err
	}

	var result []*response.BudgetDetailResponse
	for _, budget := range budgets {
		// 获取关联的交易
		transactions, _ := s.repo.FindByBudget(ctx, budget.BudgetId)
		result = append(result, s.mapper.ToDetailResponse(budget, transactions))
	}

	return result, nil
}
