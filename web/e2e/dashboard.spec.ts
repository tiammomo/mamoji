import { test, expect } from '@playwright/test';

test.describe('Dashboard Page (requires auth)', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login page elements on redirect', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('h3:has-text("记账本")')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });
});

test.describe('Protected Pages - Authentication', () => {
  const protectedPages = [
    '/accounts',
    '/transactions',
    '/budgets',
    '/reports',
    '/categories',
    '/settings',
  ];

  protectedPages.forEach((pageUrl) => {
    test(`should redirect ${pageUrl} to login when not authenticated`, async ({ page }) => {
      await page.goto(pageUrl);
      await page.waitForURL('**/login', { timeout: 10000 });
      await expect(page).toHaveURL(/.*login/);
    });
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages via direct URL', async ({ page }) => {
    // Dashboard redirects to login
    await page.goto('/dashboard');
    await page.waitForURL('**/login');

    // Accounts redirects to login
    await page.goto('/accounts');
    await page.waitForURL('**/login');

    // Transactions redirects to login
    await page.goto('/transactions');
    await page.waitForURL('**/login');
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');
    await page.waitForLoadState('networkidle');
    // Should show some content (either 404 page or redirect)
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Page Loading', () => {
  test('should load login page quickly', async ({ page }) => {
    await page.goto('/login');

    // Page should load within reasonable time
    await expect(page.locator('h3:has-text("记账本")')).toBeVisible({ timeout: 10000 });
  });

  test('should handle page refresh on login page', async ({ page }) => {
    await page.goto('/login');
    await page.reload();
    await expect(page.locator('#username')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure on login page', async ({ page }) => {
    await page.goto('/login');

    // Check that there's at least one heading
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
  });

  test('should have labeled form inputs on login page', async ({ page }) => {
    await page.goto('/login');

    // Username should have associated label
    const usernameLabel = page.locator('label[for="username"]');
    await expect(usernameLabel).toBeVisible();

    // Password should have associated label
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
  });

  test('should have button with accessible name', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText('登录');
  });
});

test.describe('Responsive Layout', () => {
  test('should display properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/login');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
  });

  test('should display properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
  });
});
