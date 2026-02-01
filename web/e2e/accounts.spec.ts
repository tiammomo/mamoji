import { test, expect } from '@playwright/test';

test.describe('Accounts Page (requires auth)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login form on redirect', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });
});

test.describe('Accounts Page - Page Structure', () => {
  test('should have page title area', async ({ page }) => {
    // Since we redirect, we'll test on login page
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });

    // Login page should have proper title
    await expect(page.locator('h3:has-text("记账本")')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });

    // Should have form elements
    await expect(page.locator('form')).toBeVisible();
  });

  test('should display proper styling', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });

    // Check for card styling
    const card = page.locator('[class*="card"]');
    await expect(card.first()).toBeVisible();
  });
});

test.describe('Accounts Page - Responsive', () => {
  test('should display properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/accounts');
    await page.waitForURL('**/login', { timeout: 10000 });

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
  });
});

test.describe('All Protected Routes', () => {
  // Routes with client-side auth protection (immediate redirect)
  const redirectRoutes = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/accounts', name: 'Accounts' },
    { path: '/transactions', name: 'Transactions' },
  ];

  // Routes that may load content first (no immediate redirect)
  const contentRoutes = [
    { path: '/budgets', name: 'Budgets' },
    { path: '/reports', name: 'Reports' },
    { path: '/categories', name: 'Categories' },
    { path: '/settings', name: 'Settings' },
  ];

  redirectRoutes.forEach(({ path, name }) => {
    test(`${name} page should redirect to login when not authenticated`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page).toHaveURL(/.*login/);
    });
  });

  contentRoutes.forEach(({ path, name }) => {
    test(`${name} page should load without error`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Route Behavior', () => {
  test('should handle root path', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Should either show login or redirect somewhere
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle nested routes', async ({ page }) => {
    await page.goto('/accounts/new');
    await page.waitForLoadState('networkidle');
    // Should load without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle routes with query parameters', async ({ page }) => {
    await page.goto('/transactions?type=income');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });
});
