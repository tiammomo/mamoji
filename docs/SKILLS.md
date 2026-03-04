# 技能与工具文档

本文档记录 Mamoji 项目使用的开发技能、工具链和最佳实践。

---

## 1. Claude Code 技能模块

项目在 Claude Code 中配置了以下技能，用于提升开发效率。

### 1.1 Java Spring Boot 技能

**文件位置:** `.claude/skills/java-springboot.md`

| 技能名称 | 用途 |
|---------|------|
| java-springboot | Spring Boot 开发最佳实践 |

**核心要点:**
- 使用 Maven 作为构建工具
- 按功能/领域组织包结构（如 `com.mamoji.controller`）
- 构造函数注入依赖
- 使用 DTO 而非直接暴露 JPA 实体
- 全局异常处理 `@ControllerAdvice`
- 使用 BCrypt 加密密码

### 1.2 Next.js 技能

**文件位置:** `.claude/skills/nextjs-best-practices.md`

| 技能名称 | 用途 |
|---------|------|
| nextjs-best-practices | Next.js App Router 开发规范 |

**核心要点:**
- Server Components 为默认，客户端仅在需要交互时使用
- 路由组织：page.tsx / layout.tsx / loading.tsx / error.tsx
- 数据获取：Server Component fetch / fetch with caching / no-store
- 使用 Zod 验证输入
- 图片优化使用 next/image

---

## 2. MCP 服务器配置

项目配置了以下 MCP (Model Context Protocol) 服务器。

### 2.1 已启用 MCP

| MCP 服务 | 功能 | 用途 |
|---------|------|------|
| mcp__context7__* | 文档查询 | 查询 Spring Boot、Next.js 等官方文档 |
| mcp__github__* | GitHub 操作 | PR、Issue、代码搜索等 |
| mcp__sqlite__* | SQLite 操作 | 本地数据库操作 |
| mcp__filesystem__* | 文件系统 | 文件读写、目录操作 |
| mcp__fetch__* | HTTP 请求 | 外部 API 调用 |
| mcp__memory__* | 知识图谱 | 项目知识管理 |
| mcp__playwright__* | 浏览器自动化 | 端到端测试 |

### 2.2 推荐添加 MCP

如需扩展功能，可在 Claude Code 设置中添加：

```json
{
  "mysql": {
    "command": "uvx",
    "args": ["mcp-server-mysql", "--host", "localhost", "--port", "3306", "--user", "root", "--password", "${env:DB_PASSWORD}"]
  }
}
```

---

## 3. 开发工具链

### 3.1 后端技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Spring Boot | 3.5.x |
| 语言 | Java | 21 |
| 构建 | Maven | 3.9.x |
| 数据库 | H2 (开发) / MySQL (生产) | 8.0 |
| ORM | Spring Data JPA | - |
| 安全 | Spring Security + JWT | - |

### 3.2 前端技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 16.x |
| 语言 | TypeScript | 5.x |
| 构建 | Turbopack | - |
| 样式 | Tailwind CSS | 3.x |
| 状态 | Zustand | - |
| 请求 | TanStack Query | - |

---

## 4. 项目结构

```
mamoji/
├── backend/                 # Spring Boot 后端
│   ├── src/main/java/
│   │   └── com/mamoji/
│   │       ├── config/    # 配置类
│   │       ├── controller/# REST API
│   │       ├── entity/    # JPA 实体
│   │       ├── repository/# 数据访问
│   │       └── security/  # JWT 安全
│   └── pom.xml
│
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/          # App Router 页面
│   │   ├── components/   # React 组件
│   │   ├── lib/          # 工具函数
│   │   └── store/       # Zustand 状态
│   └── package.json
│
├── docs/                   # 项目文档
│   ├── PRD.md            # 产品需求
│   ├── ARCHITECTURE.md   # 架构设计
│   ├── DB.md             # 数据库设计
│   ├── API.md            # API 文档
│   ├── DEPLOY.md         # 部署文档
│   └── SKILLS.md         # 技能与工具 (本文档)
│
├── .claude/               # Claude Code 配置
│   ├── skills/           # 技能模块
│   └── MCP-SETUP.md     # MCP 配置说明
│
└── .git/
```

---

## 5. 开发规范

### 5.1 后端规范

- **Controller**: 返回统一格式 `{code, message, data}`
- **异常处理**: 使用全局 `@ControllerAdvice`
- **认证**: JWT Token 放在 Authorization Header
- **数据库**: 使用 H2 内存数据库进行开发测试

### 5.2 前端规范

- **页面路由**: 使用 Next.js App Router
- **API 调用**: 通过 `lib/api.ts` 封装
- **状态管理**: 全局状态使用 Zustand，服务器状态使用 TanStack Query
- **组件**: 使用 Server Component 为主

---

## 6. 常用命令

### 6.1 后端

```bash
# 启动后端 (需 JDK 21)
cd backend
./mvnw spring-boot:run

# 编译
./mvnw clean compile

# 打包
./mvnw package
```

### 6.2 前端

```bash
# 安装依赖
cd frontend
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 7. 技能配置维护

如需更新技能配置：

1. **更新技能文档**: 修改 `.claude/skills/` 下的 `.md` 文件
2. **更新 MCP 配置**: 修改 `.claude/MCP-SETUP.md`
3. **更新项目配置**: 修改 `.claude/settings.local.json`

---

## 8. 参考资源

- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [Next.js 官方文档](https://nextjs.org/docs)
- [Spring Security 参考](./ARCHITECTURE.md)
- [API 设计文档](./API.md)
