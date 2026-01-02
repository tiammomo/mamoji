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

// TransactionApplicationService 交易应用服务
type TransactionApplicationService struct {
	repo         repository.TransactionRepository
	budgetRepo   repository.BudgetRepository
	accountRepo  repository.AccountRepository
	mapper       *mapper.TransactionMapper
	budgetMapper *mapper.BudgetMapper
}

// NewTransactionApplicationService 创建交易应用服务
func NewTransactionApplicationService(
	txRepo repository.TransactionRepository,
	budgetRepo repository.BudgetRepository,
	accountRepo repository.AccountRepository,
) *TransactionApplicationService {
	return &TransactionApplicationService{
		repo:         txRepo,
		budgetRepo:   budgetRepo,
		accountRepo:  accountRepo,
		mapper:       mapper.NewTransactionMapper(),
		budgetMapper: mapper.NewBudgetMapper(),
	}
}

// Create 创建交易
func (s *TransactionApplicationService) Create(ctx context.Context, req *request.CreateTransactionRequest) (*response.TransactionResponse, error) {
	// 验证
	if err := request.Validate(req); err != nil {
		return nil, errors.InvalidParams(err.Error())
	}

	// 验证账户存在
	_, err := s.accountRepo.FindByID(ctx, req.AccountId)
	if err != nil {
		return nil, err
	}

	// 如果指定了预算ID，验证预算存在
	if req.BudgetId != nil {
		_, err = s.budgetRepo.FindByID(ctx, *req.BudgetId)
		if err != nil {
			return nil, err
		}
	}

	// 创建实体
	tx, err := s.mapper.ToEntity(req)
	if err != nil {
		return nil, errors.InvalidParams("日期格式错误")
	}

	// 保存
	saved, err := s.repo.Create(ctx, tx)
	if err != nil {
		return nil, err
	}

	// 如果有预算ID，更新预算已使用金额
	if req.BudgetId != nil {
		budget, _ := s.budgetRepo.FindByID(ctx, *req.BudgetId)
		if budget != nil {
			budget.UsedAmount += req.Amount
			if budget.UsedAmount > budget.TotalAmount {
				budget.Status = "exceeded"
			}
			s.budgetRepo.Update(ctx, budget)
		}
	}

	return s.mapper.ToResponse(saved), nil
}

// Get 获取交易详情
func (s *TransactionApplicationService) Get(ctx context.Context, txID int64) (*response.TransactionResponse, error) {
	tx, err := s.repo.FindByID(ctx, txID)
	if err != nil {
		return nil, err
	}
	return s.mapper.ToResponse(tx), nil
}

// List 获取交易列表
func (s *TransactionApplicationService) List(ctx context.Context, req *request.ListTransactionRequest) (*response.PaginatedResponse, error) {
	paginator := errors.NewPaginator(req.Page, req.PageSize)

	var txs []*entity.Transaction
	var total int64
	var err error

	txs, total, err = s.repo.Paginate(ctx, req.EnterpriseId, paginator.Page, paginator.PageSize)
	if err != nil {
		return nil, err
	}

	return &response.PaginatedResponse{
		List:       s.mapper.ToResponses(txs),
		Total:      total,
		Page:       paginator.Page,
		PageSize:   paginator.PageSize,
		TotalPages: (int(total) + paginator.PageSize - 1) / paginator.PageSize,
	}, nil
}

// Update 更新交易
func (s *TransactionApplicationService) Update(ctx context.Context, txID int64, req *request.UpdateTransactionRequest) (*response.TransactionResponse, error) {
	// 查找交易
	tx, err := s.repo.FindByID(ctx, txID)
	if err != nil {
		return nil, err
	}

	// 验证账户存在
	if req.AccountId != nil {
		_, err = s.accountRepo.FindByID(ctx, *req.AccountId)
		if err != nil {
			return nil, err
		}
	}

	// 应用更新
	if req.Type != nil {
		tx.Type = *req.Type
	}
	if req.Category != nil {
		tx.Category = *req.Category
	}
	if req.Amount != nil {
		tx.Amount = *req.Amount
	}
	if req.AccountId != nil {
		tx.AccountId = *req.AccountId
	}
	if req.BudgetId != nil {
		tx.BudgetId = req.BudgetId
	}
	if req.Note != nil {
		tx.Note = *req.Note
	}
	if req.Status != nil {
		tx.Status = *req.Status
	}

	// 保存
	saved, err := s.repo.Update(ctx, tx)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Delete 删除交易
func (s *TransactionApplicationService) Delete(ctx context.Context, txID int64) error {
	return s.repo.Delete(ctx, txID)
}
