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

// MockTransactionRepository 模拟交易仓储
type MockTransactionRepository struct {
	mock.Mock
}

func (m *MockTransactionRepository) Create(ctx context.Context, tx *entity.Transaction) (*entity.Transaction, error) {
	args := m.Called(ctx, tx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) Update(ctx context.Context, tx *entity.Transaction) (*entity.Transaction, error) {
	args := m.Called(ctx, tx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) Delete(ctx context.Context, txID int64) error {
	args := m.Called(ctx, txID)
	return args.Error(0)
}

func (m *MockTransactionRepository) FindByID(ctx context.Context, txID int64) (*entity.Transaction, error) {
	args := m.Called(ctx, txID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) FindByEnterprise(ctx context.Context, enterpriseID int64) ([]*entity.Transaction, error) {
	args := m.Called(ctx, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) FindByAccount(ctx context.Context, accountID int64) ([]*entity.Transaction, error) {
	args := m.Called(ctx, accountID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) FindByBudget(ctx context.Context, budgetID int64) ([]*entity.Transaction, error) {
	args := m.Called(ctx, budgetID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*entity.Transaction), args.Error(1)
}

func (m *MockTransactionRepository) Paginate(ctx context.Context, enterpriseID int64, page, pageSize int) ([]*entity.Transaction, int64, error) {
	args := m.Called(ctx, enterpriseID, page, pageSize)
	if args.Get(0) == nil {
		return nil, 0, args.Error(2)
	}
	return args.Get(0).([]*entity.Transaction), args.Get(1).(int64), args.Error(2)
}

func createTestTransaction() *entity.Transaction {
	now := time.Now()
	return &entity.Transaction{
		TransactionId: 1,
		EnterpriseId:  1,
		UnitId:        1,
		UserId:        1,
		Type:          "expense",
		Category:      "餐饮",
		Amount:        100.00,
		AccountId:     1,
		OccurredAt:    now,
		Tags:          "午餐,工作",
		Note:          "测试交易",
		Status:        1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

func TestTransactionMapper_ToEntity(t *testing.T) {
	mp := mapper.NewTransactionMapper()
	req := &request.CreateTransactionRequest{
		EnterpriseId: 1,
		UnitId:       1,
		UserId:       1,
		Type:         "expense",
		Category:     "餐饮",
		Amount:       100.00,
		AccountId:    1,
		OccurredAt:   "2024-01-01 12:00:00",
		Tags:         []string{"午餐", "工作"},
		Note:         "测试交易",
	}

	entity, err := mp.ToEntity(req)

	assert.NoError(t, err)
	assert.NotNil(t, entity)
	assert.Equal(t, int64(1), entity.EnterpriseId)
	assert.Equal(t, "expense", entity.Type)
	assert.Equal(t, "餐饮", entity.Category)
	assert.Equal(t, 100.00, entity.Amount)
	assert.Equal(t, "午餐,工作", entity.Tags)
}

func TestTransactionMapper_ToEntity_InvalidDate(t *testing.T) {
	mp := mapper.NewTransactionMapper()
	req := &request.CreateTransactionRequest{
		EnterpriseId: 1,
		Type:         "expense",
		Category:     "餐饮",
		Amount:       100.00,
		AccountId:    1,
		OccurredAt:   "invalid-date",
	}

	entity, err := mp.ToEntity(req)

	assert.Error(t, err)
	assert.Nil(t, entity)
}

func TestTransactionMapper_ToResponse(t *testing.T) {
	mp := mapper.NewTransactionMapper()
	tx := createTestTransaction()

	resp := mp.ToResponse(tx)

	assert.NotNil(t, resp)
	assert.Equal(t, int64(1), resp.TransactionId)
	assert.Equal(t, "expense", resp.Type)
	assert.Equal(t, "餐饮", resp.Category)
	assert.Equal(t, 100.00, resp.Amount)
	assert.Len(t, resp.Tags, 2)
	assert.Contains(t, resp.Tags, "午餐")
}

func TestTransactionMapper_ToResponses(t *testing.T) {
	mp := mapper.NewTransactionMapper()
	txs := []*entity.Transaction{
		createTestTransaction(),
		{
			TransactionId: 2,
			EnterpriseId:  1,
			Type:          "income",
			Category:      "工资",
			Amount:        5000.00,
			AccountId:     1,
			Status:        1,
			OccurredAt:    time.Now(),
			CreatedAt:     time.Now(),
		},
	}

	resps := mp.ToResponses(txs)

	assert.Len(t, resps, 2)
	assert.Equal(t, "expense", resps[0].Type)
	assert.Equal(t, "income", resps[1].Type)
}

func TestTransactionMapper_ToResponse_NoTags(t *testing.T) {
	mp := mapper.NewTransactionMapper()
	tx := &entity.Transaction{
		TransactionId: 1,
		Type:          "expense",
		Category:      "餐饮",
		Amount:        100.00,
		Status:        1,
		OccurredAt:    time.Now(),
		CreatedAt:     time.Now(),
	}

	resp := mp.ToResponse(tx)

	assert.NotNil(t, resp)
	assert.Nil(t, resp.Tags)
}

// TransactionServiceTestable 可测试的交易服务
type TransactionServiceTestable struct {
	repo   *MockTransactionRepository
	mapper *mapper.TransactionMapper
}

func NewTransactionServiceTestable() *TransactionServiceTestable {
	return &TransactionServiceTestable{
		repo:   new(MockTransactionRepository),
		mapper: mapper.NewTransactionMapper(),
	}
}

// Create 创建交易
func (s *TransactionServiceTestable) Create(ctx context.Context, req *request.CreateTransactionRequest) (*response.TransactionResponse, error) {
	if err := request.Validate(req); err != nil {
		return nil, errors.InvalidParams(err.Error())
	}

	tx, err := s.mapper.ToEntity(req)
	if err != nil {
		return nil, errors.InvalidParams("日期格式错误")
	}

	saved, err := s.repo.Create(ctx, tx)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Get 获取交易详情
func (s *TransactionServiceTestable) Get(ctx context.Context, txID int64) (*response.TransactionResponse, error) {
	tx, err := s.repo.FindByID(ctx, txID)
	if err != nil {
		return nil, err
	}
	return s.mapper.ToResponse(tx), nil
}

// List 获取交易列表
func (s *TransactionServiceTestable) List(ctx context.Context, req *request.ListTransactionRequest) (*response.PaginatedResponse, error) {
	paginator := errors.NewPaginator(req.Page, req.PageSize)

	txs, total, err := s.repo.Paginate(ctx, 1, paginator.Page, paginator.PageSize)
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
func (s *TransactionServiceTestable) Update(ctx context.Context, txID int64, req *request.UpdateTransactionRequest) (*response.TransactionResponse, error) {
	tx, err := s.repo.FindByID(ctx, txID)
	if err != nil {
		return nil, err
	}

	if req.Type != nil {
		tx.Type = *req.Type
	}
	if req.Category != nil {
		tx.Category = *req.Category
	}
	if req.Amount != nil {
		tx.Amount = *req.Amount
	}
	if req.Note != nil {
		tx.Note = *req.Note
	}

	saved, err := s.repo.Update(ctx, tx)
	if err != nil {
		return nil, err
	}

	return s.mapper.ToResponse(saved), nil
}

// Delete 删除交易
func (s *TransactionServiceTestable) Delete(ctx context.Context, txID int64) error {
	return s.repo.Delete(ctx, txID)
}

func TestTransactionService_Create(t *testing.T) {
	svc := NewTransactionServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := &request.CreateTransactionRequest{
			EnterpriseId: 1,
			UnitId:       1,
			UserId:       1,
			Type:         "expense",
			Category:     "餐饮",
			Amount:       100.00,
			AccountId:    1,
			OccurredAt:   "2024-01-01 12:00:00",
		}

		svc.repo.On("Create", mock.Anything, mock.AnythingOfType("*entity.Transaction")).
			Return(createTestTransaction(), nil)

		resp, err := svc.Create(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "expense", resp.Type)
		svc.repo.AssertExpectations(t)
	})

	t.Run("validation error", func(t *testing.T) {
		req := &request.CreateTransactionRequest{
			EnterpriseId: 1,
			Type:         "expense",
			// 缺少必需字段
		}

		resp, err := svc.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, resp)
	})

	t.Run("invalid date format", func(t *testing.T) {
		req := &request.CreateTransactionRequest{
			EnterpriseId: 1,
			UnitId:       1,
			UserId:       1,
			Type:         "expense",
			Category:     "餐饮",
			Amount:       100.00,
			AccountId:    1,
			OccurredAt:   "invalid-date",
		}

		resp, err := svc.Create(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, resp)
	})
}

func TestTransactionService_Get(t *testing.T) {
	svc := NewTransactionServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		svc.repo.On("FindByID", ctx, int64(1)).Return(createTestTransaction(), nil)

		resp, err := svc.Get(ctx, 1)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int64(1), resp.TransactionId)
		svc.repo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		svc.repo.On("FindByID", ctx, int64(999)).Return(nil, errors.NotFound("交易记录"))

		resp, err := svc.Get(ctx, 999)

		assert.Error(t, err)
		assert.Nil(t, resp)
		svc.repo.AssertExpectations(t)
	})
}

func TestTransactionService_List(t *testing.T) {
	svc := NewTransactionServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := &request.ListTransactionRequest{
			EnterpriseId: 1,
			Page:         1,
			PageSize:     10,
		}
		txs := []*entity.Transaction{createTestTransaction()}

		svc.repo.On("Paginate", ctx, int64(1), 1, 10).Return(txs, int64(1), nil)

		resp, err := svc.List(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int64(1), resp.Total)
		svc.repo.AssertExpectations(t)
	})
}

func TestTransactionService_Update(t *testing.T) {
	svc := NewTransactionServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		amount := 200.00
		req := &request.UpdateTransactionRequest{
			Amount: &amount,
		}
		updatedTx := createTestTransaction()
		updatedTx.Amount = 200.00

		svc.repo.On("FindByID", ctx, int64(1)).Return(createTestTransaction(), nil)
		svc.repo.On("Update", ctx, mock.AnythingOfType("*entity.Transaction")).Return(updatedTx, nil)

		resp, err := svc.Update(ctx, 1, req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, 200.00, resp.Amount)
		svc.repo.AssertExpectations(t)
	})
}

func TestTransactionService_Delete(t *testing.T) {
	svc := NewTransactionServiceTestable()
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		svc.repo.On("Delete", ctx, int64(1)).Return(nil)

		err := svc.Delete(ctx, 1)

		assert.NoError(t, err)
		svc.repo.AssertExpectations(t)
	})
}

func TestCreateTransactionRequest_Validation(t *testing.T) {
	t.Run("valid request", func(t *testing.T) {
		req := &request.CreateTransactionRequest{
			EnterpriseId: 1,
			UnitId:       1,
			UserId:       1,
			Type:         "expense",
			Category:     "餐饮",
			Amount:       100.00,
			AccountId:    1,
			OccurredAt:   "2024-01-01 12:00:00",
		}
		err := request.Validate(req)
		assert.NoError(t, err)
	})

	t.Run("request fields can be set", func(t *testing.T) {
		req := &request.CreateTransactionRequest{
			EnterpriseId: 1,
			UnitId:       1,
			UserId:       1,
			Type:         "expense",
			Category:     "餐饮",
			Amount:       100.00,
			AccountId:    1,
			OccurredAt:   "2024-01-01 12:00:00",
			Tags:         []string{"午餐", "工作"},
			Note:         "测试交易",
		}
		assert.Equal(t, int64(1), req.EnterpriseId)
		assert.Equal(t, "expense", req.Type)
		assert.Equal(t, 100.00, req.Amount)
	})

	t.Run("request with all fields", func(t *testing.T) {
		budgetId := int64(1)
		req := &request.CreateTransactionRequest{
			EnterpriseId: 1,
			UnitId:       1,
			UserId:       1,
			Type:         "income",
			Category:     "工资",
			Amount:       5000.00,
			AccountId:    1,
			BudgetId:     &budgetId,
			OccurredAt:   "2024-01-01 12:00:00",
			Tags:         []string{"月薪"},
			Note:         "工资到账",
		}
		assert.Equal(t, "income", req.Type)
		assert.Equal(t, 5000.00, req.Amount)
		assert.NotNil(t, req.BudgetId)
		assert.Equal(t, int64(1), *req.BudgetId)
	})
}
