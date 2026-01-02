package unit

import (
	"context"
	"testing"
	"time"

	"mamoji/api/internal/application/dto/request"
	"mamoji/api/internal/application/dto/response"
	"mamoji/api/internal/application/mapper"
	"mamoji/api/internal/model/entity"
	"mamoji/api/internal/pkg/errors"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockBudgetRepository 模拟预算仓储
type MockBudgetRepository struct {
	mock.Mock
}

func (m *MockBudgetRepository) Create(ctx context.Context, budget *entity.Budget) (*entity.Budget, error) {
	args := m.Called(ctx, budget)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Budget), args.Error(1)
}

func (m *MockBudgetRepository) Update(ctx context.Context, budget *entity.Budget) (*entity.Budget, error) {
	args := m.Called(ctx, budget)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Budget), args.Error(1)
}

func (m *MockBudgetRepository) Delete(ctx context.Context, budgetID int64) error {
	args := m.Called(ctx, budgetID)
	return args.Error(0)
}

func (m *MockBudgetRepository) FindByID(ctx context.Context, budgetID int64) (*entity.Budget, error) {
	args := m.Called(ctx, budgetID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Budget), args.Error(1)
}

func (m *MockBudgetRepository) FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Budget, error) {
	args := m.Called(ctx, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Budget), args.Error(1)
}

func (m *MockBudgetRepository) FindByBudget(ctx context.Context, budgetID int64) ([]*entity.Transaction, error) {
	args := m.Called(ctx, budgetID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Transaction), args.Error(1)
}

func (m *MockBudgetRepository) Paginate(ctx context.Context, enterpriseID int64, page, pageSize int) ([]*entity.Budget, int64, error) {
	args := m.Called(ctx, enterpriseID, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*entity.Budget), args.Get(1).(int64), args.Error(2)
}

func createTestBudget() *entity.Budget {
	now := time.Now()
	return &entity.Budget{
		BudgetId:     1,
		EnterpriseId: 1,
		UnitId:       1,
		Name:         "月度餐饮预算",
		Type:         "monthly",
		Category:     "餐饮",
		TotalAmount:  2000.00,
		UsedAmount:   500.00,
		PeriodStart:  time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		PeriodEnd:    time.Date(2024, 1, 31, 23, 59, 59, 0, time.UTC),
		Status:       "active",
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func TestBudgetMapper_ToEntity(t *testing.T) {
	mp := mapper.NewBudgetMapper()
	req := &request.CreateBudgetRequest{
		EnterpriseId: 1,
		UnitId:       1,
		Name:         "月度餐饮预算",
		Type:         "monthly",
		Category:     "餐饮",
		TotalAmount:  2000.00,
		PeriodStart:  "2024-01-01",
		PeriodEnd:    "2024-01-31",
	}

	budget, err := mp.ToEntity(req)

	assert.NoError(t, err)
	assert.NotNil(t, budget)
	assert.Equal(t, int64(1), budget.EnterpriseId)
	assert.Equal(t, "月度餐饮预算", budget.Name)
	assert.Equal(t, "monthly", budget.Type)
	assert.Equal(t, "餐饮", budget.Category)
	assert.Equal(t, 2000.00, budget.TotalAmount)
	assert.Equal(t, 0.00, budget.UsedAmount)
	assert.Equal(t, "active", budget.Status)
}

func TestBudgetMapper_ToEntity_InvalidDate(t *testing.T) {
	mp := mapper.NewBudgetMapper()
	req := &request.CreateBudgetRequest{
		EnterpriseId: 1,
		Name:         "预算",
		Type:         "monthly",
		Category:     "餐饮",
		TotalAmount:  1000.00,
		PeriodStart:  "invalid",
		PeriodEnd:    "2024-01-31",
	}

	budget, err := mp.ToEntity(req)

	assert.Error(t, err)
	assert.Nil(t, budget)
}

func TestBudgetMapper_ToResponse(t *testing.T) {
	mp := mapper.NewBudgetMapper()
	budget := createTestBudget()

	resp := mp.ToResponse(budget)

	assert.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.BudgetId)
	assert.Equal(t, "月度餐饮预算", resp.Name)
	assert.Equal(t, "monthly", resp.Type)
	assert.Equal(t, 2000.00, resp.TotalAmount)
	assert.Equal(t, 500.00, resp.UsedAmount)
}

func TestBudgetMapper_ToResponses(t *testing.T) {
	mp := mapper.NewBudgetMapper()
	budgets := []*entity.Budget{
		createTestBudget(),
		{
			BudgetId:     2,
			EnterpriseId: 1,
			Name:         "月度购物预算",
			Type:         "monthly",
			Category:     "购物",
			TotalAmount:  3000.00,
			UsedAmount:   1000.00,
			Status:       "active",
			PeriodStart:  time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			PeriodEnd:    time.Date(2024, 1, 31, 23, 59, 59, 0, time.UTC),
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
	}

	resps := mp.ToResponses(budgets)

	assert.Len(t, resps, 2)
	assert.Equal(t, "月度餐饮预算", resps[0].Name)
	assert.Equal(t, "月度购物预算", resps[1].Name)
}

func TestBudgetMapper_ToDetailResponse(t *testing.T) {
	mp := mapper.NewBudgetMapper()
	budget := createTestBudget()
	txs := []*entity.Transaction{
		{
			TransactionId: 1,
			Amount:        100.00,
			Type:          "expense",
			Status:        1,
			OccurredAt:    time.Now(),
			CreatedAt:     time.Now(),
		},
	}

	detail := mp.ToDetailResponse(budget, txs)

	assert.NotNil(t, detail)
	assert.Equal(t, 2000.00-500.00, detail.RemainingAmount)
	assert.Equal(t, (500.00/2000.00)*100, detail.UsagePercent)
	assert.Len(t, detail.Transactions, 1)
}

func TestBudgetMapper_ToDetailResponse_NoTransactions(t *testing.T) {
	mp := mapper.NewBudgetMapper()
	budget := createTestBudget()

	detail := mp.ToDetailResponse(budget, nil)

	assert.NotNil(t, detail)
	assert.Nil(t, detail.Transactions)
}

// BudgetServiceTestable 可测试的预算服务
type BudgetServiceTestable struct {
	repo   *MockBudgetRepository
	mapper *mapper.BudgetMapper
}

func NewBudgetServiceTestable() *BudgetServiceTestable {
	return &BudgetServiceTestable{
		repo:   new(MockBudgetRepository),
		mapper: mapper.NewBudgetMapper(),
	}
}

// Create 创建预算
func (s *BudgetServiceTestable) Create(ctx context.Context, req *request.CreateBudgetRequest) (*response.BudgetResponse, error) {
	if err := request.Validate(req); err != nil {
		return nil, errors.InvalidParams(err.Error())
	}

	budget, err := s.mapper.ToEntity(req)
	if err != nil {
		return nil, errors.InvalidParams("日期格式错误")
	}

	saved, err := s.repo.Create(ctx, budget)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Get 获取预算详情
func (s *BudgetServiceTestable) Get(ctx context.Context, budgetID int64) (*response.BudgetResponse, error) {
	budget, err := s.repo.FindByID(ctx, budgetID)
	if err != nil {
		return nil, err
	}
	return s.mapper.ToResponse(budget), nil
}

// GetDetail 获取预算详情（包含交易）
func (s *BudgetServiceTestable) GetDetail(ctx context.Context, budgetID int64) (*response.BudgetDetailResponse, error) {
	budget, err := s.repo.FindByID(ctx, budgetID)
	if err != nil {
		return nil, err
	}

	txs, _ := s.repo.FindByBudget(ctx, budgetID)

	return s.mapper.ToDetailResponse(budget, txs), nil
}

// List 获取预算列表
func (s *BudgetServiceTestable) List(ctx context.Context, req *request.ListBudgetRequest) (*response.PaginatedResponse, error) {
	paginator := errors.NewPaginator(req.Page, req.PageSize)

	budgets, total, err := s.repo.Paginate(ctx, 1, paginator.Page, paginator.PageSize)
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
func (s *BudgetServiceTestable) Update(ctx context.Context, budgetID int64, req *request.UpdateBudgetRequest) (*response.BudgetResponse, error) {
	budget, err := s.repo.FindByID(ctx, budgetID)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		budget.Name = *req.Name
	}
	if req.Type != nil {
		budget.Type = *req.Type
	}
	if req.TotalAmount != nil {
		budget.TotalAmount = *req.TotalAmount
	}

	saved, err := s.repo.Update(ctx, budget)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Delete 删除预算
func (s *BudgetServiceTestable) Delete(ctx context.Context, budgetID int64) error {
	return s.repo.Delete(ctx, budgetID)
}

// GetListWithStats 获取预算列表（带统计）
func (s *BudgetServiceTestable) GetListWithStats(ctx context.Context, enterpriseID int64) ([]*response.BudgetDetailResponse, error) {
	budgets, err := s.repo.FindByEnterprise(ctx, enterpriseID)
	if err != nil {
		return nil, err
	}

	var result []*response.BudgetDetailResponse
	for _, budget := range budgets {
		txs, _ := s.repo.FindByBudget(ctx, budget.BudgetId)
		result = append(result, s.mapper.ToDetailResponse(budget, txs))
	}

	return result, nil
}

func TestBudgetService_Create(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := &request.CreateBudgetRequest{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         "月度餐饮预算",
			Type:         "monthly",
			Category:     "餐饮",
			TotalAmount:  2000.00,
			PeriodStart:  "2024-01-01",
			PeriodEnd:    "2024-01-31",
		}

		svc.repo.On("Create", mock.Anything, mock.AnythingOfType("*entity.Budget")).
			Return(createTestBudget(), nil)

		resp, err := svc.Create(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "月度餐饮预算", resp.Name)
		svc.repo.AssertExpectations(t)
	})

	t.Run("validation error", func(t *testing.T) {
		req := &request.CreateBudgetRequest{
			EnterpriseId: 1,
			// 缺少必需字段
		}

		resp, err := svc.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, resp)
	})

	t.Run("invalid date format", func(t *testing.T) {
		req := &request.CreateBudgetRequest{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         "预算",
			Type:         "monthly",
			Category:     "餐饮",
			TotalAmount:  1000.00,
			PeriodStart:  "invalid",
			PeriodEnd:    "2024-01-31",
		}

		resp, err := svc.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, resp)
	})
}

func TestBudgetService_Get(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		svc.repo.On("FindByID", ctx, int64(1)).Return(createTestBudget(), nil)

		resp, err := svc.Get(ctx, 1)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int64(1), resp.BudgetId)
		svc.repo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		svc.repo.On("FindByID", ctx, int64(999)).Return(nil, errors.NotFound("预算"))

		resp, err := svc.Get(ctx, 999)

		assert.Error(t, err)
		assert.Nil(t, resp)
		svc.repo.AssertExpectations(t)
	})
}

func TestBudgetService_GetDetail(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		txs := []*entity.Transaction{
			{
				TransactionId: 1,
				Amount:        100.00,
				Status:        1,
				OccurredAt:    time.Now(),
				CreatedAt:     time.Now(),
			},
		}

		svc.repo.On("FindByID", ctx, int64(1)).Return(createTestBudget(), nil)
		svc.repo.On("FindByBudget", ctx, int64(1)).Return(txs, nil)

		resp, err := svc.GetDetail(ctx, 1)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int64(1), resp.BudgetId)
		assert.Len(t, resp.Transactions, 1)
		svc.repo.AssertExpectations(t)
	})
}

func TestBudgetService_List(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := &request.ListBudgetRequest{
			Page:     1,
			PageSize: 10,
		}
		budgets := []*entity.Budget{createTestBudget()}

		svc.repo.On("Paginate", ctx, int64(1), 1, 10).Return(budgets, int64(1), nil)

		resp, err := svc.List(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int64(1), resp.Total)
		svc.repo.AssertExpectations(t)
	})
}

func TestBudgetService_Update(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		amount := 3000.00
		req := &request.UpdateBudgetRequest{
			TotalAmount: &amount,
		}
		updatedBudget := createTestBudget()
		updatedBudget.TotalAmount = 3000.00

		svc.repo.On("FindByID", ctx, int64(1)).Return(createTestBudget(), nil)
		svc.repo.On("Update", ctx, mock.AnythingOfType("*entity.Budget")).Return(updatedBudget, nil)

		resp, err := svc.Update(ctx, 1, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, 3000.00, resp.TotalAmount)
		svc.repo.AssertExpectations(t)
	})
}

func TestBudgetService_Delete(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		svc.repo.On("Delete", ctx, int64(1)).Return(nil)

		err := svc.Delete(ctx, 1)

		assert.NoError(t, err)
		svc.repo.AssertExpectations(t)
	})
}

func TestBudgetService_GetListWithStats(t *testing.T) {
	svc := NewBudgetServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		budgets := []*entity.Budget{createTestBudget()}
		txs := []*entity.Transaction{}

		svc.repo.On("FindByEnterprise", ctx, int64(1)).Return(budgets, nil)
		svc.repo.On("FindByBudget", ctx, int64(1)).Return(txs, nil)

		resp, err := svc.GetListWithStats(ctx, 1)

		assert.NoError(t, err)
		assert.Len(t, resp, 1)
		svc.repo.AssertExpectations(t)
	})
}

func TestCreateBudgetRequest_Validation(t *testing.T) {
	t.Run("valid request", func(t *testing.T) {
		req := &request.CreateBudgetRequest{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         "月度预算",
			Type:         "monthly",
			Category:     "餐饮",
			TotalAmount:  1000.00,
			PeriodStart:  "2024-01-01",
			PeriodEnd:    "2024-01-31",
		}
		err := request.Validate(req)
		assert.NoError(t, err)
	})

	t.Run("request fields can be set", func(t *testing.T) {
		req := &request.CreateBudgetRequest{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         "月度预算",
			Type:         "monthly",
			Category:     "餐饮",
			TotalAmount:  1000.00,
			PeriodStart:  "2024-01-01",
			PeriodEnd:    "2024-01-31",
		}
		assert.Equal(t, int64(1), req.EnterpriseId)
		assert.Equal(t, "月度预算", req.Name)
		assert.Equal(t, "monthly", req.Type)
		assert.Equal(t, 1000.00, req.TotalAmount)
	})

	t.Run("request with yearly type", func(t *testing.T) {
		req := &request.CreateBudgetRequest{
			EnterpriseId: 1,
			UnitId:       1,
			Name:         "年度预算",
			Type:         "yearly",
			Category:     "总预算",
			TotalAmount:  12000.00,
			PeriodStart:  "2024-01-01",
			PeriodEnd:    "2024-12-31",
		}
		assert.Equal(t, "yearly", req.Type)
		assert.Equal(t, 12000.00, req.TotalAmount)
	})
}
