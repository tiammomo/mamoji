package service

import "mamoji/api/internal/model/dto"

// ===== InvestmentService =====

// List 获取投资列表
func (s *InvestmentService) List(enterpriseId int64) ([]dto.InvestmentResponse, error) {
	return nil, nil
}

// GetById 获取单个投资
func (s *InvestmentService) GetById(investmentId int64) (*dto.InvestmentResponse, error) {
	return nil, nil
}

// Create 创建投资
func (s *InvestmentService) Create(enterpriseId int64, req dto.CreateInvestmentRequest) (*dto.InvestmentResponse, error) {
	return nil, nil
}

// Update 更新投资
func (s *InvestmentService) Update(investmentId int64, req dto.UpdateInvestmentRequest) (*dto.InvestmentResponse, error) {
	return nil, nil
}

// Delete 删除投资
func (s *InvestmentService) Delete(investmentId int64) error {
	return nil
}
