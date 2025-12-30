# 组件拓展指南

本文档提供项目组件集成的建议顺序和每个阶段的功能扩展说明。

---

## 阶段一：UI 基础组件（优先级最高）

### 1.1 shadcn/ui 安装
```bash
npx shadcn-ui@latest init
```

**集成功能：**
| 组件 | 用途 | 集成方式 |
|------|------|----------|
| Button | 按钮 | 替换现有 Button |
| Input | 输入框 | 替换现有 Input |
| Select | 选择器 | 替换现有 Select |
| Card | 卡片 | 替换现有 Card |
| Modal/Dialog | 对话框 | 替换现有 Modal |
| Badge | 标签 | 替换现有 Badge |
| Table | 表格 | 新增数据列表 |
| Form | 表单 | 新增复杂表单 |
| DropdownMenu | 下拉菜单 | 新增导航 |

**配置步骤：**
1. 初始化 shadcn-ui：`npx shadcn-ui@latest init`
2. 添加基础组件：`npx shadcn-ui@latest add button input select card dialog badge table form`
3. 更新 `components/ui/index.tsx` 使用新组件
4. 配置 Tailwind CSS 主题

---

### 1.2 Tailwind CSS 配置

**功能扩展：**
- 自定义配色方案（品牌色、语义色）
- 响应式断点配置
- 暗色模式支持

**配置文件：**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { ... },
        secondary: { ... },
        muted: { ... },
      },
    },
  },
}
```

---

## 阶段二：状态管理

### 2.1 Zustand 增强

**当前状态：** 已有基础 Zustand store

**扩展功能：**
| 功能 | 说明 | 实现方式 |
|------|------|----------|
| 异步状态 | 处理异步数据 | 扩展 store 添加 async 方法 |
| 持久化 | 数据持久化 | 使用 persist middleware |
| 派生状态 | 计算属性 | 使用 selector |
| 命名空间 | 模块化 store | 拆分大型 store |

**示例扩展：**
```typescript
// stores/auth.ts
interface AuthState {
  // 现有...
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

---

### 2.2 React Query (推荐)

**集成时机：** API 调用增多时

**安装：**
```bash
npm install @tanstack/react-query
```

**功能扩展：**
- 缓存管理
- 自动重新获取
-乐观更新
- 无限滚动

**配置步骤：**
1. 创建 QueryClientProvider
2. 封装 API hook
3. 替换 store 中的异步方法

---

## 阶段三：表单处理

### 3.1 React Hook Form

**集成时机：** 表单复杂度增加时

**安装：**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**功能扩展：**
| 功能 | 说明 |
|------|------|
| 表单验证 | 使用 Zod schema |
| 复杂表单 | 多字段联动 |
| 表单步骤 | 分步表单 |
| 文件上传 | 集成 Dropzone |

**集成顺序：**
1. 登录/注册表单 → 使用 React Hook Form
2. 记账表单 → 添加验证规则
3. 账户表单 → 支持多类型字段

---

### 3.2 Zod 验证

**安装：**
```bash
npm install zod
```

**使用示例：**
```typescript
// schemas/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6).max(32),
});

export const registerSchema = loginSchema.extend({
  email: z.string().email(),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "密码不匹配",
  path: ["confirmPassword"],
});
```

---

## 阶段四：图表组件

### 4.1 Recharts

**集成时机：** 需要数据可视化时

**安装：**
```bash
npm install recharts
```

**组件列表：**
| 组件 | 用途 |
|------|------|
| LineChart | 趋势折线图 |
| BarChart | 柱状图 |
| PieChart | 饼图 |
| AreaChart | 面积图 |
| ComposedChart | 组合图 |

**应用场景：**
- 收支趋势图
- 分类占比饼图
- 预算执行进度
- 投资收益曲线

---

### 4.2 ECharts (备选)

**安装：**
```bash
npm install echarts echarts-for-react
```

**使用场景：**
- 复杂交互图表
- 大数据量展示
- 股票K线图
- 地图可视化

---

## 阶段五：日期处理

### 5.1 Day.js

**集成时机：** 需要日期格式化时

**安装：**
```bash
npm install dayjs
```

**功能扩展：**
| 功能 | 示例 |
|------|------|
| 格式化 | `dayjs().format('YYYY-MM-DD')` |
| 相对时间 | `dayjs().fromNow()` |
| 日期计算 | `dayjs().add(7, 'day')` |
| 时区处理 | `dayjs.tz()` |

---

## 阶段六：HTTP 客户端

### 6.1 Axios

**集成时机：** 需要拦截器时

**安装：**
```bash
npm install axios
```

**功能扩展：**
| 功能 | 说明 |
|------|------|
| 请求拦截 | 自动添加 Token |
| 响应拦截 | 统一错误处理 |
| 取消请求 | 请求Cancellation |
| 进度监控 | 文件上传进度 |

**配置示例：**
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 阶段七：文件上传

### 7.1 react-dropzone

**集成时机：** 需要图片/文件上传时

**安装：**
```bash
npm install react-dropzone
```

**功能扩展：**
- 图片预览
- 拖拽上传
- 多文件上传
- 进度显示

---

## 阶段八：国际化

### 8.1 next-i18next

**集成时机：** 需要多语言支持时

**安装：**
```bash
npm install next-i18next i18next react-i18next
```

**配置步骤：**
1. 创建 `public/locales/zh/common.json`
2. 创建 `public/locales/en/common.json`
3. 配置 `next-i18next.config.js`
4. 创建 `middleware.ts`

---

## 阶段九：测试工具

### 9.1 Jest + React Testing Library

**安装：**
```bash
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

**功能：**
- 单元测试
- 组件测试
- 集成测试

---

### 9.2 Cypress

**安装：**
```bash
npm install --save-dev cypress
```

**功能：**
- E2E 测试
- 组件测试
- 自动化测试

---

## 阶段十：后端组件集成

### 10.1 数据库 (GORM + MySQL)

**安装：**
```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/mysql
```

**配置步骤：**
1. 创建数据库连接
2. 定义数据模型
3. 创建 Repository 层
4. 集成事务处理

**扩展功能：**
- 自动迁移
- 软删除
- 批量操作
- 分库分表

---

### 10.2 Redis 缓存

**安装：**
```bash
go get -u github.com/go-redis/redis/v8
```

**功能扩展：**
| 功能 | 用途 |
|------|------|
| 会话存储 | Session 管理 |
| 数据缓存 | 热点数据 |
| 分布式锁 | 并发控制 |
| 限流计数 | API 限流 |

---

### 10.3 RocketMQ 消息队列

**安装：**
```bash
go get -u github.com/apache/rocketmq-client-go/v2
```

**功能扩展：**
| 功能 | 用途 |
|------|------|
| 异步处理 | 账单创建事件 |
| 消息通知 | 预算预警 |
| 定时任务 | 每日报告生成 |
| 分布式事务 | 跨服务一致性 |

---

## 推荐集成顺序

```
Phase 1: UI 基础组件 (1周)
  ├── shadcn/ui
  └── Tailwind CSS

Phase 2: 状态管理 (3天)
  └── Zustand 增强 / React Query

Phase 3: 表单处理 (1周)
  ├── React Hook Form
  └── Zod

Phase 4: 数据可视化 (1周)
  └── Recharts

Phase 5: 工具库补充 (3天)
  ├── Day.js
  └── Axios

Phase 6: 文件上传 (3天)
  └── react-dropzone

Phase 7: 后端集成 (2周)
  ├── GORM + MySQL
  ├── Redis
  └── RocketMQ
```

---

## 注意事项

1. **按需引入**：不要一次性集成所有组件
2. **渐进式升级**：先使用基础功能，逐步添加高级特性
3. **文档更新**：每次集成后更新相关文档
4. **测试覆盖**：关键功能需有单元测试
5. **性能监控**：关注组件加载和渲染性能
