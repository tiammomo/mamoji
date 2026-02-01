# Mamoji 本地开发配置

## Docker 服务

```bash
# 启动
docker-compose up -d mysql redis

# 停止
docker-compose down
```

## 连接配置

| 服务 | 主机 | 端口 | 用户 | 密码 |
|------|------|------|------|------|
| MySQL | localhost | 3306 | root | rootpassword |
| Redis | localhost | 6379 | - | - |

## 本地测试

```bash
# MySQL 连接测试
mysql -h localhost -P 3306 -u root -prootpassword

# Redis 连接测试
redis-cli -h localhost -p 6379 ping
```

## 启动服务

```bash
# 后端 (端口 48080)
cd api && mvn spring-boot:run

# 前端 (端口 43000)
cd web && npm run dev -- -p 43000
```
