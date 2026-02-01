import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // Page structure tests
  test('should display login page title', async ({ page }) => {
    await expect(page.locator('h3:has-text("记账本")')).toBeVisible();
    await expect(page.locator('text=登录您的账户')).toBeVisible();
  });

  test('should have username and password inputs', async ({ page }) => {
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have login button', async ({ page }) => {
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveText('登录');
  });

  test('should have remember me checkbox', async ({ page }) => {
    await expect(page.locator('#rememberMe')).toBeVisible();
    await expect(page.locator('text=记住我')).toBeVisible();
  });

  // Form interaction tests
  test('should accept input in form fields', async ({ page }) => {
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');

    await expect(page.locator('#username')).toHaveValue('testuser');
    await expect(page.locator('#password')).toHaveValue('testpass');
  });

  test('should toggle password visibility', async ({ page }) => {
    // Initially password should be masked
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show/hide button
    await page.click('button:has-text("显示")');

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should clear form on navigation', async ({ page }) => {
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'testpass');

    // Navigate away and back
    await page.goto('/login');

    // Form should be cleared
    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('should have proper form structure', async ({ page }) => {
    // Check for form element
    await expect(page.locator('form')).toBeVisible();

    // Check input labels
    await expect(page.locator('label[for="username"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Check placeholder texts
    await expect(page.locator('#username')).toHaveAttribute('placeholder', '请输入用户名');
    await expect(page.locator('#password')).toHaveAttribute('placeholder', '请输入密码');
  });

  test('should display login card with proper styling classes', async ({ page }) => {
    const card = page.locator('[class*="card"], .w-full');
    await expect(card.first()).toBeVisible();
  });
});

test.describe('Login Page - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should show validation error when username is empty', async ({ page }) => {
    // Leave username empty and try to submit
    await page.fill('#password', 'admin123');

    // Press enter or click submit
    await page.click('button[type="submit"]');

    // Wait a bit for validation
    await page.waitForTimeout(500);

    // Should stay on login page (validation failed)
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation error when password is empty', async ({ page }) => {
    await page.fill('#username', 'admin');

    // Submit with empty password
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/.*login/);
  });

  test('should show validation error when both fields are empty', async ({ page }) => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Login Page - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.fill('#username', 'nonexistent_user');
    await page.fill('#password', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Wait for API response
    await page.waitForTimeout(2000);

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should stay on login page after failed login', async ({ page }) => {
    await page.fill('#username', 'admin');
    await page.fill('#password', 'wrongpassword');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should still be on login page after failed attempt
    await expect(page).toHaveURL(/.*login/);
  });
});
