# 测试文档

## 技术栈

| 层级 | 框架 | 命令 |
|------|------|------|
| 前端 | Jest + Testing Library | `npm test` |
| 后端 | JUnit 5 + Mockito | `mvn test` |

## 运行测试

```bash
# 前端
cd web && npm test

# 后端 (需 Docker MySQL)
cd api && mvn test
```

## 测试覆盖目标

| 层级 | 当前 | 目标 |
|------|------|------|
| 前端 | ~45% | 60% |
| 后端 | ~35% | 50% |

## Mock 规范

```typescript
// 测试中 Mock API
jest.mock('@/api', () => ({
  transactionApi: {
    list: jest.fn().mockResolvedValue({ code: 0, data: [] })
  }
}))
```

## 常见问题

| 问题 | 解决 |
|------|------|
| 测试找不到元素 | 使用 `waitFor` 等待异步渲染 |
| Mock 不生效 | 确保 Mock 在导入之前调用 |
| 数据库连接失败 | 确认 Docker MySQL 已启动 |
