import { get, post, put, del } from '@/lib/api';
import type {
  ApiResponse,
  PaginatedResponse,
  Budget,
  BudgetDetail,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  ListBudgetRequest,
} from '@/types/api';

// Budget API Service
class BudgetApiService {
  private baseUrl = '/api/v1/budgets';

  // Get budget list
  async list(params?: ListBudgetRequest): Promise<PaginatedResponse<Budget>> {
    const queryParams = new URLSearchParams();
    if (params?.unitId) queryParams.append('unitId', params.unitId.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
    return get<ApiResponse<PaginatedResponse<Budget>>>(url).then(res => res.data);
  }

  // Get budget detail with transactions
  async getDetail(budgetId: number): Promise<BudgetDetail> {
    return get<ApiResponse<BudgetDetail>>(`${this.baseUrl}/${budgetId}/detail`).then(res => res.data);
  }

  // Get budget detail
  async getById(budgetId: number): Promise<Budget> {
    return get<ApiResponse<Budget>>(`${this.baseUrl}/${budgetId}`).then(res => res.data);
  }

  // Create budget
  async create(data: CreateBudgetRequest): Promise<Budget> {
    return post<ApiResponse<Budget>>(this.baseUrl, data).then(res => res.data);
  }

  // Update budget
  async update(budgetId: number, data: UpdateBudgetRequest): Promise<Budget> {
    return put<ApiResponse<Budget>>(`${this.baseUrl}/${budgetId}`, data).then(res => res.data);
  }

  // Delete budget
  async delete(budgetId: number): Promise<void> {
    return del<void>(`${this.baseUrl}/${budgetId}`).then(() => undefined);
  }

  // Get budget list with stats
  async getListWithStats(enterpriseId: number): Promise<BudgetDetail[]> {
    return get<ApiResponse<BudgetDetail[]>>(`${this.baseUrl}/stats?enterpriseId=${enterpriseId}`).then(res => res.data);
  }
}

export const budgetApi = new BudgetApiService();
