/**
 * Playwright Configuration for Mamoji Frontend E2E Tests
 * Copy this file to playwright.config.ts and modify as needed
 *
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试文件目录
  testDir: './e2e',

  // 并行执行配置
  fullyParallel: true,

  // CI 环境配置
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: 'html',
  // 可选: 'line', 'json', 'junit', 'github'

  // 全局测试配置
  use: {
    // 基础 URL（配合 baseURL 使用）
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:43000',

    // 跟踪配置
    trace: 'on-first-retry',
    // 可选: 'on', 'off', 'retain-on-failure'

    // 截图配置
    screenshot: 'only-on-failure',
    // 可选: 'on', 'off', 'only-on-failure'

    // 视频配置
    video: 'retain-on-failure',
    // 可选: 'on', 'off', 'retain-on-failure'

    // 无头模式
    headless: true,

    // 视口配置
    viewport: { width: 1280, height: 720 },
  },

  // 项目配置（多浏览器测试）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 移动设备测试（可选）
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web Server 配置（启动被测应用）
  webServer: {
    command: process.env.PLAYWRIGHT_START_SERVER
      ? 'npm run start'
      : 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:43000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
    },
  },

  // 截图对比配置
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
    },
  },

  // 全局超时配置
  timeout: 30000,

  // 依赖配置
  dependencies: ['install-dependencies'],
});
