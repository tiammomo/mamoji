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

// AccountApplicationService 账户应用服务
type AccountApplicationService struct {
	repo   repository.AccountRepository
	mapper *mapper.AccountMapper
}

// NewAccountApplicationService 创建账户应用服务
func NewAccountApplicationService(repo repository.AccountRepository) *AccountApplicationService {
	return &AccountApplicationService{
		repo:   repo,
		mapper: mapper.NewAccountMapper(),
	}
}

// Create 创建账户
func (s *AccountApplicationService) Create(ctx context.Context, req *request.CreateAccountRequest) (*response.AccountResponse, error) {
	// 验证
	if err := request.Validate(req); err != nil {
		return nil, errors.InvalidParams(err.Error())
	}

	// 验证储蓄卡类型必须填写开户行信息
	if req.AssetCategory == "fund" && req.SubType == "bank" && req.BankName == "" {
		return nil, errors.New(4000, "储蓄卡类型必须填写开户银行信息")
	}

	// 验证银行信用卡类型必须填写发卡银行和卡号
	if req.AssetCategory == "credit" && req.SubType == "bank_card" {
		if req.BankCode == "" {
			return nil, errors.New(4000, "银行信用卡必须选择发卡银行")
		}
		if req.AccountNo == "" {
			return nil, errors.New(4000, "银行信用卡必须填写卡号")
		}
	}

	// 创建实体
	account := s.mapper.ToEntity(req)

	// 保存
	saved, err := s.repo.Create(ctx, account)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Get 获取账户详情
func (s *AccountApplicationService) Get(ctx context.Context, accountID int64) (*response.AccountResponse, error) {
	account, err := s.repo.FindByID(ctx, accountID)
	if err != nil {
		return nil, err
	}
	return s.mapper.ToResponse(account), nil
}

// List 获取账户列表
func (s *AccountApplicationService) List(ctx context.Context, req *request.ListAccountRequest) (*response.PaginatedResponse, error) {
	paginator := errors.NewPaginator(req.Page, req.PageSize)

	var accounts []*entity.Account
	var err error
	var total int64

	if req.Category != "" {
		accounts, err = s.repo.FindByCategory(ctx, req.UnitId, req.Category)
	} else if req.UnitId > 0 {
		accounts, err = s.repo.FindByEnterpriseAndUnit(ctx, req.UnitId, req.UnitId)
	} else {
		accounts, err = s.repo.FindByEnterprise(ctx, req.UnitId)
	}
	if err != nil {
		return nil, err
	}

	total = int64(len(accounts))
	return &response.PaginatedResponse{
		List:       s.mapper.ToResponses(accounts),
		Total:      total,
		Page:       paginator.Page,
		PageSize:   paginator.PageSize,
		TotalPages: (int(total) + paginator.PageSize - 1) / paginator.PageSize,
	}, nil
}

// GetSummary 获取账户汇总
func (s *AccountApplicationService) GetSummary(ctx context.Context, enterpriseID int64) (*response.AccountSummaryResponse, error) {
	// 获取所有账户
	accounts, err := s.repo.FindByEnterprise(ctx, enterpriseID)
	if err != nil {
		return nil, err
	}

	// 计算汇总
	var totalAvailable, totalInvested, totalValue float64
	includeInTotal := 1
	for _, acc := range accounts {
		if acc.IncludeInTotal == includeInTotal {
			totalAvailable += acc.AvailableBalance
			totalInvested += acc.InvestedAmount
			totalValue += acc.TotalValue
		}
	}

	if totalValue == 0 {
		totalValue = totalAvailable + totalInvested
	}

	return &response.AccountSummaryResponse{
		TotalBalance:   totalValue,
		TotalAvailable: totalAvailable,
		TotalInvested:  totalInvested,
		AccountCount:   len(accounts),
		HasHistory:     len(accounts) > 0,
	}, nil
}

// Update 更新账户
func (s *AccountApplicationService) Update(ctx context.Context, accountID int64, req *request.UpdateAccountRequest) (*response.AccountResponse, error) {
	// 查找账户
	account, err := s.repo.FindByID(ctx, accountID)
	if err != nil {
		return nil, err
	}

	// 应用更新
	s.mapper.ApplyUpdate(account, req)

	// 保存
	saved, err := s.repo.Update(ctx, account)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Delete 删除账户
func (s *AccountApplicationService) Delete(ctx context.Context, accountID int64) error {
	return s.repo.Delete(ctx, accountID)
}
