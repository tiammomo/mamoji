import { get, post, put, del } from '@/lib/api';
import type {
  ApiResponse,
  PaginatedResponse,
  Account,
  AccountSummary,
  CreateAccountRequest,
  UpdateAccountRequest,
  ListAccountRequest,
} from '@/types/api';

// Account API Service
class AccountApiService {
  private baseUrl = '/api/v1/accounts';

  // Get account list
  async list(params?: ListAccountRequest): Promise<PaginatedResponse<Account>> {
    const queryParams = new URLSearchParams();
    if (params?.unitId) queryParams.append('unitId', params.unitId.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
    return get<ApiResponse<PaginatedResponse<Account>>>(url).then(res => res.data);
  }

  // Get account detail
  async getById(accountId: number): Promise<Account> {
    return get<ApiResponse<Account>>(`${this.baseUrl}/${accountId}`).then(res => res.data);
  }

  // Get account summary
  async getSummary(enterpriseId: number): Promise<AccountSummary> {
    return get<ApiResponse<AccountSummary>>(`/api/v1/accounts/summary?enterpriseId=${enterpriseId}`).then(res => res.data);
  }

  // Create account
  async create(data: CreateAccountRequest): Promise<Account> {
    return post<ApiResponse<Account>>(this.baseUrl, data).then(res => res.data);
  }

  // Update account
  async update(accountId: number, data: UpdateAccountRequest): Promise<Account> {
    return put<ApiResponse<Account>>(`${this.baseUrl}/${accountId}`, data).then(res => res.data);
  }

  // Delete account
  async delete(accountId: number): Promise<void> {
    return del<void>(`${this.baseUrl}/${accountId}`).then(() => undefined);
  }
}

export const accountApi = new AccountApiService();
