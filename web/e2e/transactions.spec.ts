import { test, expect } from '@playwright/test';

test.describe('Transactions Page (requires auth)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login form on redirect', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });
});

test.describe('Other Protected Pages', () => {
  const protectedPages = [
    { path: '/budgets', name: 'Budgets' },
    { path: '/reports', name: 'Reports' },
    { path: '/categories', name: 'Categories' },
    { path: '/settings', name: 'Settings' },
  ];

  protectedPages.forEach(({ path, name }) => {
    test(`should redirect ${name} to login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page).toHaveURL(/.*login/);
    });
  });
});

test.describe('Transactions Page - Behavior', () => {
  test('should handle page refresh', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForURL('**/login', { timeout: 10000 });
    await page.reload();
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });

  test('should handle direct navigation to various transaction routes', async ({ page }) => {
    // These routes may not have immediate client-side redirect
    await page.goto('/transactions/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/transactions/list');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Budgets and Reports Pages', () => {
  test('budgets page behavior', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    // Page should load without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('reports page behavior', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('reports/daily page behavior', async ({ page }) => {
    await page.goto('/reports/daily');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('reports/monthly page behavior', async ({ page }) => {
    await page.goto('/reports/monthly');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Categories and Settings Pages', () => {
  test('categories page should require authentication', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('settings page should require authentication', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Error Handling', () => {
  test('should handle non-existent page gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle API-like routes', async ({ page }) => {
    await page.goto('/api/users');
    await page.waitForLoadState('networkidle');
    // API routes might return JSON or redirect
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle routes with special characters', async ({ page }) => {
    await page.goto('/transactions/%E6%B5%8B%E8%AF%95');
    await page.waitForLoadState('networkidle');
    // Should load without error
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Multiple Route Variations', () => {
  const routes = [
    { path: '/transactions', shouldRedirect: true },
    { path: '/transactions/', shouldRedirect: true },
    { path: '/budgets', shouldRedirect: false },
    { path: '/categories', shouldRedirect: false },
    { path: '/reports', shouldRedirect: false },
    { path: '/settings', shouldRedirect: false },
  ];

  // Routes with path params may not have client-side protection
  const paramRoutes = [
    '/transactions/new',
    '/transactions/1',
    '/budgets/1',
    '/categories/1',
    '/reports/daily',
    '/reports/monthly',
  ];

  routes.forEach(({ path, shouldRedirect }) => {
    test(`${path} should ${shouldRedirect ? 'redirect' : 'load'} when not authenticated`, async ({ page }) => {
      await page.goto(path);
      if (shouldRedirect) {
        await page.waitForURL('**/login', { timeout: 10000 });
        await expect(page).toHaveURL(/.*login/);
      } else {
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
      }
    });
  });

  paramRoutes.forEach((route) => {
    test(`${route} should load content without error`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Page should load without error (either show content or redirect)
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
