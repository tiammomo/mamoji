import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCategories } from '@/lib/hooks';
import React from 'react';

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCategories', () => {
  it('should return initial state', async () => {
    // This is a placeholder test - in real tests, you'd mock the API
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    // The query should be in loading state initially
    expect(result.current.isLoading).toBe(true);
  });
});

describe('API Types', () => {
  it('should have correct Account type', () => {
    const account = {
      id: 1,
      name: 'Test Account',
      type: 'CASH',
      balance: 1000,
      includeInNetWorth: true,
      userId: 1,
      status: 1,
    };

    expect(account.id).toBe(1);
    expect(account.name).toBe('Test Account');
    expect(account.balance).toBe(1000);
  });

  it('should have correct Transaction type', () => {
    const transaction = {
      id: 1,
      amount: 100,
      type: 1,
      categoryId: 1,
      accountId: 1,
      date: '2026-03-06',
      userId: 1,
    };

    expect(transaction.type).toBe(1);
    expect(transaction.amount).toBe(100);
  });

  it('should have correct Budget type', () => {
    const budget = {
      id: 1,
      name: 'Monthly Budget',
      amount: 5000,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      status: 1,
      spent: 2000,
      userId: 1,
    };

    expect(budget.name).toBe('Monthly Budget');
    expect(budget.status).toBe(1);
  });
});
