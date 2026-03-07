# 安全策略

## 报告安全漏洞

如果您发现安全漏洞，请通过以下方式报告：

1. **不要**在 GitHub Issues 中公开报告
2. 发送邮件至 security@mamoji.com
3. 我们将在 24 小时内回复
4. ，我们会尽快修复并发布更新

## 支持的安全版本

| 版本 | 支持状态 |
|------|----------|
| 1.x.x | ✅ 积极维护 |

## 安全最佳实践

### 1. 身份验证

- JWT 密钥长度至少 32 字符
- 定期轮换 JWT 密钥
- 使用 HTTPS 传输

### 2. 数据保护

- 生产环境使用强数据库密码
- Redis 设置密码
- 敏感数据加密存储

### 3. API 安全

- 启用请求限流
- IP 白名单（可选）
- 输入验证

### 4. 依赖安全

- 启用 Dependabot 自动更新
- 定期检查依赖漏洞
- 及时更新依赖版本

## 依赖漏洞扫描

项目使用 GitHub Dependabot 进行自动漏洞扫描：

```bash
# 手动检查漏洞
cd backend
mvn org.owasp:dependency-check-maven:check

# 更新依赖
mvn versions:use-latest-releases
```

## 安全配置检查清单

- [ ] 修改默认 JWT 密钥
- [ ] 配置强数据库密码
- [ ] 配置 Redis 密码
- [ ] 启用 HTTPS
- [ ] 配置防火墙
- [ ] 启用审计日志
- [ ] 定期备份数据
