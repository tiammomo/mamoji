# Mamoji Skills 维护指南

## 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 21 | 后端 |
| Spring Boot | 3.5.3 | 后端框架 |
| MyBatis-Plus | 3.5.5 | ORM |
| Node.js | 20.x | 前端 |
| Next.js | 16.x | 前端框架 |
| MySQL | 8.0 | 数据库 |
| Redis | 7.x | 缓存 |

## 项目结构

```
mamoji/
├── api/                    # 后端
│   └── src/main/java/com/mamoji/
│       ├── common/         # 公共模块
│       ├── config/         # 配置
│       ├── security/       # 安全
│       └── module/         # 业务模块
│           ├── auth/
│           ├── account/
│           ├── transaction/
│           ├── budget/
│           ├── category/
│           └── report/
├── web/                    # 前端
│   ├── app/                # 页面
│   ├── components/         # 组件
│   ├── hooks/              # Hooks
│   └── api/                # API 调用
├── db/                     # 数据库脚本
└── docs/                   # 文档
```

## 开发 Checklist

- [ ] 拉取最新代码: `git pull origin master`
- [ ] 检查 Docker: `docker-compose ps`
- [ ] 运行测试: `mvn test && npm test`

## 常用命令

```bash
# Docker
docker-compose up -d    # 启动
docker-compose down     # 停止

# 后端
cd api && mvn spring-boot:run   # 启动
cd api && mvn test              # 测试

# 前端
cd web && npm run dev           # 启动
cd web && npm test              # 测试
```

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| 端口占用 | `fuser -k <port>/tcp` |
| Docker 启动失败 | `docker-compose down && up -d` |
| 数据库连接失败 | 检查 MySQL 容器状态 |
| Token 失效 | 重新登录 |
