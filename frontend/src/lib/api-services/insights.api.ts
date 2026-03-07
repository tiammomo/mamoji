import { api, API_BASE, buildQueryString } from "../api.client";
import type {
  Receipt,
  ReceiptListResponse,
  RecurringListResponse,
  RecurringTransaction,
  StatsCategory,
  StatsOverview,
  StatsTrend,
  Transaction,
} from "../api.types";

export const statsApi = {
  getOverview: (month?: string) => api.get<StatsOverview>(`/stats/overview${month ? `?month=${month}` : ""}`),
  getTrend: (startDate?: string, endDate?: string) => {
    const queryString = buildQueryString({ startDate, endDate });
    return api.get<StatsTrend[]>(`/stats/trend${queryString}`);
  },
  getCategories: (type: number, startDate?: string, endDate?: string) => {
    const queryString = buildQueryString({ type, startDate, endDate });
    return api.get<StatsCategory[]>(`/stats/categories${queryString}`);
  },
};

export const receiptApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.postForm<Receipt>("/receipts/upload", formData);
  },
  getReceipts: (params?: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryString = buildQueryString({
      page: params?.page,
      pageSize: params?.pageSize,
      startDate: params?.startDate,
      endDate: params?.endDate,
    });
    return api.get<ReceiptListResponse>(`/receipts${queryString}`);
  },
  getReceipt: (id: number) => api.get<Receipt>(`/receipts/${id}`),
  getReceiptsByTransaction: (transactionId: number) => api.get<Receipt[]>(`/receipts/transaction/${transactionId}`),
  updateReceipt: (
    id: number,
    data: {
      description?: string;
      amount?: number;
      merchant?: string;
      date?: string;
    }
  ) => api.put<Receipt>(`/receipts/${id}`, data),
  linkToTransaction: (id: number, transactionId: number) => api.post<Receipt>(`/receipts/${id}/link`, { transactionId }),
  deleteReceipt: (id: number) => api.delete<void>(`/receipts/${id}`),
  downloadReceipt: (id: number) => {
    const token = localStorage.getItem("token");
    window.open(`${API_BASE}/receipts/${id}/download?token=${token}`, "_blank");
  },
};

export const recurringApi = {
  getRecurringTransactions: (params?: {
    page?: number;
    pageSize?: number;
  }) => {
    const queryString = buildQueryString({ page: params?.page, pageSize: params?.pageSize });
    return api.get<RecurringListResponse>(`/recurring${queryString}`);
  },
  getRecurringTransaction: (id: number) => api.get<RecurringTransaction>(`/recurring/${id}`),
  createRecurringTransaction: (data: Partial<RecurringTransaction>) => api.post<RecurringTransaction>("/recurring", data),
  updateRecurringTransaction: (id: number, data: Partial<RecurringTransaction>) =>
    api.put<RecurringTransaction>(`/recurring/${id}`, data),
  deleteRecurringTransaction: (id: number) => api.delete<void>(`/recurring/${id}`),
  toggleStatus: (id: number) => api.post<RecurringTransaction>(`/recurring/${id}/toggle`, {}),
  manualExecute: (id: number) => api.post<Transaction>(`/recurring/${id}/execute`, {}),
};
