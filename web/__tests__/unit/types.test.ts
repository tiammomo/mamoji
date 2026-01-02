import type {
  Account,
  Transaction,
  Budget,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

describe('API Types', () => {
  describe('Account', () => {
    it('should have correct structure', () => {
      const account: Account = {
        accountId: 1,
        enterpriseId: 1,
        unitId: 1,
        assetCategory: 'fund',
        subType: 'bank',
        name: '测试账户',
        currency: 'CNY',
        accountNo: '123456',
        bankName: '中国银行',
        availableBalance: 1000,
        totalValue: 1000,
        status: 1,
        createdAt: '2024-01-01 00:00:00',
      };

      expect(account.accountId).toBe(1);
      expect(account.assetCategory).toBe('fund');
      expect(account.name).toBe('测试账户');
    });

    it('should allow all asset categories', () => {
      const categories: Account['assetCategory'][] = ['fund', 'credit', 'topup', 'investment', 'debt'];

      categories.forEach(category => {
        const account: Partial<Account> = {
          assetCategory: category,
          name: '测试',
        };
        expect(account.assetCategory).toBe(category);
      });
    });
  });

  describe('Transaction', () => {
    it('should have correct structure', () => {
      const transaction: Transaction = {
        transactionId: 1,
        enterpriseId: 1,
        unitId: 1,
        userId: 1,
        type: 'expense',
        category: '餐饮',
        amount: 100,
        accountId: 1,
        occurredAt: '2024-01-01 12:00:00',
        status: 1,
        createdAt: '2024-01-01 12:00:00',
      };

      expect(transaction.transactionId).toBe(1);
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(100);
    });

    it('should allow optional fields', () => {
      const transaction: Transaction = {
        transactionId: 1,
        enterpriseId: 1,
        unitId: 1,
        userId: 1,
        type: 'income',
        category: '工资',
        amount: 5000,
        accountId: 1,
        occurredAt: '2024-01-01 12:00:00',
        tags: ['月薪'],
        note: '工资到账',
        status: 1,
        createdAt: '2024-01-01 12:00:00',
      };

      expect(transaction.tags).toEqual(['月薪']);
      expect(transaction.note).toBe('工资到账');
    });
  });

  describe('Budget', () => {
    it('should have correct structure', () => {
      const budget: Budget = {
        budgetId: 1,
        enterpriseId: 1,
        unitId: 1,
        name: '月度餐饮预算',
        type: 'monthly',
        category: '餐饮',
        totalAmount: 2000,
        usedAmount: 500,
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        status: 'active',
        createdAt: '2024-01-01 00:00:00',
      };

      expect(budget.budgetId).toBe(1);
      expect(budget.type).toBe('monthly');
      expect(budget.status).toBe('active');
    });

    it('should allow all budget types', () => {
      const types: Budget['type'][] = ['monthly', 'yearly', 'project'];

      types.forEach(type => {
        const budget: Partial<Budget> = {
          type,
          name: '测试预算',
        };
        expect(budget.type).toBe(type);
      });
    });
  });

  describe('ApiResponse', () => {
    it('should have correct structure for success', () => {
      const response: ApiResponse<Account> = {
        code: 0,
        message: 'success',
        data: {
          accountId: 1,
          name: '测试',
          status: 1,
        } as Account,
      };

      expect(response.code).toBe(0);
      expect(response.message).toBe('success');
      expect(response.data.accountId).toBe(1);
    });

    it('should have correct structure for error', () => {
      const response: ApiResponse<null> = {
        code: 4001,
        message: '账户不存在',
        data: null,
      };

      expect(response.code).toBe(4001);
      expect(response.message).toBe('账户不存在');
      expect(response.data).toBeNull();
    });

    it('should support optional traceId', () => {
      const responseWithTrace: ApiResponse<null> = {
        code: 500,
        message: '系统错误',
        data: null,
        traceId: 'abc-123',
      };

      expect(responseWithTrace.traceId).toBe('abc-123');
    });
  });

  describe('PaginatedResponse', () => {
    it('should have correct structure', () => {
      const response: PaginatedResponse<Account> = {
        list: [
          { accountId: 1, name: '账户1', status: 1 } as Account,
          { accountId: 2, name: '账户2', status: 1 } as Account,
        ],
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
      };

      expect(response.list).toHaveLength(2);
      expect(response.total).toBe(100);
      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.totalPages).toBe(10);
    });

    it('should calculate totalPages correctly', () => {
      const total = 25;
      const pageSize = 10;
      const totalPages = Math.ceil(total / pageSize);

      expect(totalPages).toBe(3);
    });
  });
});
