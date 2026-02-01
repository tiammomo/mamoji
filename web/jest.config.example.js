/**
 * Jest Configuration for Mamoji Frontend
 * Copy this file to jest.config.js and modify as needed
 *
 * @see https://jestjs.io/docs/configuration
 */

const path = require('path')

/** @type {import('jest').Config} */
const config = {
  // 测试环境
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // 根目录配置
  roots: ['<rootDir>'],

  // 模块路径别名
  moduleDirectories: ['node_modules', path.resolve(__dirname, '.')],
  moduleNameMapper: {
    // Path alias (Next.js standard)
    '^@/(.*)$': '<rootDir>/$1',
    // Mock dependencies for tests
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
  },

  // TypeScript 转换
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // 不转换的 node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react)/)',
  ],

  // 覆盖率配置
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // 测试匹配模式
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
  ],

  // 支持的文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // 超时时间
  testTimeout: 10000,

  // CI 环境额外配置
  ...(process.env.CI && {
    // CI 环境：顺序执行，不允许仅测试
    maxWorkers: 1,
    forbidOnly: true,
    // 重试失败的测试
    retries: 2,
  }),
}

module.exports = config
