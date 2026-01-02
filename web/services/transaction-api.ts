import { get, post, put, del } from '@/lib/api';
import type {
  ApiResponse,
  PaginatedResponse,
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  ListTransactionRequest,
} from '@/types/api';

// Transaction API Service
class TransactionApiService {
  private baseUrl = '/api/v1/transactions';

  // Get transaction list
  async list(params?: ListTransactionRequest): Promise<PaginatedResponse<Transaction>> {
    const queryParams = new URLSearchParams();
    if (params?.accountId) queryParams.append('accountId', params.accountId.toString());
    if (params?.budgetId) queryParams.append('budgetId', params.budgetId.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams.toString()}` : this.baseUrl;
    return get<ApiResponse<PaginatedResponse<Transaction>>>(url).then(res => res.data);
  }

  // Get transaction detail
  async getById(transactionId: number): Promise<Transaction> {
    return get<ApiResponse<Transaction>>(`${this.baseUrl}/${transactionId}`).then(res => res.data);
  }

  // Create transaction
  async create(data: CreateTransactionRequest): Promise<Transaction> {
    return post<ApiResponse<Transaction>>(this.baseUrl, data).then(res => res.data);
  }

  // Update transaction
  async update(transactionId: number, data: UpdateTransactionRequest): Promise<Transaction> {
    return put<ApiResponse<Transaction>>(`${this.baseUrl}/${transactionId}`, data).then(res => res.data);
  }

  // Delete transaction
  async delete(transactionId: number): Promise<void> {
    return del<void>(`${this.baseUrl}/${transactionId}`).then(() => undefined);
  }
}

export const transactionApi = new TransactionApiService();
