# Mamoji 账本功能 PRD

## 1. 需求概述

### 1.1 背景
当前 Mamoji 系统为单账本单用户模式，用户希望支持家庭成员共享账本，实现多人协作记账。

### 1.2 目标
- 支持创建多个账本
- 支持家庭成员共享账本
- 支持灵活的成员角色权限
- 支持邀请链接加入账本

### 1.3 核心场景
1. **个人使用**：用户拥有自己的私人账本
2. **家庭共享**：夫妻/家人共享一个账本，各自记账
3. **账本切换**：用户可同时拥有多个账本（个人账本 + 家庭账本）

---

## 2. 功能清单

### 2.1 账本管理
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 创建账本 | 创建新的账本 | P0 |
| 编辑账本 | 修改账本名称、描述 | P0 |
| 删除账本 | 删除账本（需转移或清空数据） | P1 |
| 账本列表 | 查看所有可访问的账本 | P0 |
| 切换账本 | 在多个账本间切换 | P0 |
| 设置默认账本 | 设置登录后的默认账本 | P1 |

### 2.2 成员管理
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 成员列表 | 查看账本内所有成员 | P0 |
| 移除成员 | 将成员移出账本 | P0 |
| 退出账本 | 主动退出账本 | P0 |
| 转移 owner | 将账本转让给其他成员 | P2 |

### 2.3 角色权限
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 角色定义 | owner/admin/editor/viewer | P0 |
| 修改角色 | 修改成员的角色 | P0 |
| 权限校验 | API 级别权限控制 | P0 |

### 2.4 邀请系统
| 功能 | 说明 | 优先级 |
|------|------|--------|
| 生成邀请码 | 创建邀请链接 | P0 |
| 使用邀请码 | 通过邀请码加入账本 | P0 |
| 邀请码列表 | 查看所有邀请码 | P0 |
| 撤销邀请码 | 使邀请码失效 | P0 |
| 邀请码设置 | 设置有效期、使用次数、默认角色 | P1 |

---

## 3. 角色权限矩阵

### 3.1 角色定义
| 角色 | 说明 | 可创建人 |
|------|------|----------|
| owner | 账本所有者，超级管理员 | 系统（创建者） |
| admin | 管理员，可管理成员和邀请 | owner |
| editor | 编辑者，可添加/编辑数据 | owner/admin |
| viewer | 查看者，仅可查看数据 | owner/admin |

### 3.2 权限表
| 操作 | owner | admin | editor | viewer |
|------|-------|-------|--------|--------|
| **账本操作** |
| 查看账本信息 | ✅ | ✅ | ✅ | ✅ |
| 编辑账本信息 | ✅ | ✅ | ❌ | ❌ |
| 删除账本 | ✅ | ❌ | ❌ | ❌ |
| 转让账本 | ✅ | ❌ | ❌ | ❌ |
| **成员管理** |
| 查看成员列表 | ✅ | ✅ | ✅ | ✅ |
| 移除成员 | ✅ | ✅ | ❌ | ❌ |
| 修改成员角色 | ✅ | ✅ | ❌ | ❌ |
| 邀请新成员 | ✅ | ✅ | ❌ | ❌ |
| **邀请码管理** |
| 创建邀请码 | ✅ | ✅ | ❌ | ❌ |
| 撤销邀请码 | ✅ | ✅ | ❌ | ❌ |
| **数据操作** |
| 查看账户 | ✅ | ✅ | ✅ | ✅ |
| 添加账户 | ✅ | ✅ | ✅ | ❌ |
| 编辑账户 | ✅ | ✅ | ✅ | ❌ |
| 删除账户 | ✅ | ✅ | ❌ | ❌ |
| 查看交易 | ✅ | ✅ | ✅ | ✅ |
| 添加交易 | ✅ | ✅ | ✅ | ❌ |
| 编辑交易 | ✅ | ✅ | ✅ | ❌ |
| 删除交易 | ✅ | ✅ | ❌ | ❌ |
| 查看预算 | ✅ | ✅ | ✅ | ✅ |
| 添加预算 | ✅ | ✅ | ✅ | ❌ |
| 编辑预算 | ✅ | ✅ | ✅ | ❌ |
| 删除预算 | ✅ | ✅ | ❌ | ❌ |
| 查看分类 | ✅ | ✅ | ✅ | ✅ |
| 添加分类 | ✅ | ✅ | ✅ | ❌ |
| 编辑分类 | ✅ | ✅ | ✅ | ❌ |
| 删除分类 | ✅ | ✅ | ❌ | ❌ |

---

## 4. 数据库设计

### 4.1 新增表

#### 4.1.1 fin_ledger（账本表）
```sql
CREATE TABLE fin_ledger (
    ledger_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '账本ID',
    name VARCHAR(100) NOT NULL COMMENT '账本名称',
    description VARCHAR(500) COMMENT '账本描述',
    owner_id BIGINT NOT NULL COMMENT '创建者ID',
    is_default TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认账本: 0=否, 1=是',
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT '默认货币',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=删除, 1=正常',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账本';
```

#### 4.1.2 fin_ledger_member（账本成员表）
```sql
CREATE TABLE fin_ledger_member (
    member_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '成员ID',
    ledger_id BIGINT NOT NULL COMMENT '账本ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role VARCHAR(20) NOT NULL DEFAULT 'editor' COMMENT '角色: owner, admin, editor, viewer',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by BIGINT COMMENT '邀请人ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=退出, 1=正常',
    UNIQUE KEY uk_ledger_user (ledger_id, user_id),
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账本成员';
```

#### 4.1.3 fin_invitation（邀请表）
```sql
CREATE TABLE fin_invitation (
    invite_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '邀请ID',
    ledger_id BIGINT NOT NULL COMMENT '账本ID',
    invite_code VARCHAR(32) NOT NULL UNIQUE COMMENT '邀请码',
    role VARCHAR(20) NOT NULL DEFAULT 'editor' COMMENT '默认角色',
    max_uses INT NOT NULL DEFAULT 0 COMMENT '最大使用次数: 0=无限',
    used_count INT NOT NULL DEFAULT 0 COMMENT '已使用次数',
    expires_at DATETIME COMMENT '过期时间: NULL=永不过期',
    created_by BIGINT NOT NULL COMMENT '创建者ID',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0=禁用, 1=正常',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ledger_id (ledger_id),
    INDEX idx_invite_code (invite_code),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码';
```

### 4.2 现有表修改

#### 4.2.1 fin_category 添加 ledger_id
```sql
ALTER TABLE fin_category
ADD COLUMN ledger_id BIGINT NOT NULL DEFAULT 0 COMMENT '账本ID: 0=系统默认' AFTER user_id,
ADD INDEX idx_ledger_id (ledger_id);
```

#### 4.2.2 fin_account 添加 ledger_id
```sql
ALTER TABLE fin_account
ADD COLUMN ledger_id BIGINT NOT NULL COMMENT '账本ID' AFTER user_id,
ADD INDEX idx_ledger_id (ledger_id);
```

#### 4.2.3 fin_transaction 添加 ledger_id
```sql
ALTER TABLE fin_transaction
ADD COLUMN ledger_id BIGINT NOT NULL COMMENT '账本ID' AFTER user_id,
ADD INDEX idx_ledger_id (ledger_id);
```

#### 4.2.4 fin_budget 添加 ledger_id
```sql
ALTER TABLE fin_budget
ADD COLUMN ledger_id BIGINT NOT NULL COMMENT '账本ID' AFTER user_id,
ADD INDEX idx_ledger_id (ledger_id);
```

### 4.3 数据迁移

```sql
-- 迁移脚本: 为现有数据创建默认账本
-- 1. 为每个用户创建默认账本
INSERT INTO fin_ledger (ledger_id, name, owner_id, is_default, currency)
SELECT
    user_id,
    CONCAT(username, '的账本') AS name,
    user_id AS owner_id,
    1 AS is_default,
    COALESCE(p.currency, 'CNY') AS currency
FROM sys_user u
LEFT JOIN sys_preference p ON u.user_id = p.user_id
WHERE u.status = 1;

-- 2. 用户成为自己账本的 owner
INSERT INTO fin_ledger_member (ledger_id, user_id, role, invited_by)
SELECT ledger_id, owner_id, 'owner', owner_id FROM fin_ledger;

-- 3. 现有数据关联到账本
UPDATE fin_category SET ledger_id = user_id WHERE ledger_id = 0;
UPDATE fin_account SET ledger_id = user_id WHERE ledger_id IS NULL;
UPDATE fin_transaction SET ledger_id = user_id WHERE ledger_id IS NULL;
UPDATE fin_budget SET ledger_id = user_id WHERE ledger_id IS NULL;
```

---

## 5. API 设计

### 5.1 账本管理

#### 5.1.1 获取账本列表
```
GET /api/v1/ledgers
```
**响应**:
```json
{
  "code": 0,
  "data": {
    "ledgers": [
      {
        "ledgerId": 1,
        "name": "我的账本",
        "description": "个人记账",
        "ownerId": 1,
        "isDefault": true,
        "currency": "CNY",
        "memberCount": 1,
        "role": "owner"
      }
    ],
    "defaultLedgerId": 1
  }
}
```

#### 5.1.2 创建账本
```
POST /api/v1/ledgers
```
**请求体**:
```json
{
  "name": "家庭账本",
  "description": "家人共享",
  "currency": "CNY"
}
```

#### 5.1.3 获取账本详情
```
GET /api/v1/ledgers/{id}
```

#### 5.1.4 更新账本
```
PUT /api/v1/ledgers/{id}
```
**请求体**:
```json
{
  "name": "新名称",
  "description": "新描述"
}
```

#### 5.1.5 删除账本
```
DELETE /api/v1/ledgers/{id}
```

#### 5.1.6 设置默认账本
```
PUT /api/v1/ledgers/{id}/default
```

### 5.2 成员管理

#### 5.2.1 获取成员列表
```
GET /api/v1/ledgers/{id}/members
```
**响应**:
```json
{
  "code": 0,
  "data": [
    {
      "memberId": 1,
      "userId": 1,
      "username": "zhangsan",
      "role": "owner",
      "joinedAt": "2024-01-01 00:00:00",
      "invitedBy": null
    },
    {
      "memberId": 2,
      "userId": 2,
      "username": "lisi",
      "role": "editor",
      "joinedAt": "2024-01-15 10:00:00",
      "invitedBy": 1
    }
  ]
}
```

#### 5.2.2 修改成员角色
```
PUT /api/v1/ledgers/{id}/members/{userId}/role
```
**请求体**:
```json
{
  "role": "admin"
}
```

#### 5.2.3 移除成员
```
DELETE /api/v1/ledgers/{id}/members/{userId}
```

#### 5.2.4 退出账本
```
DELETE /api/v1/ledgers/{id}/members/me
```

### 5.3 邀请管理

#### 5.3.1 创建邀请码
```
POST /api/v1/ledgers/{id}/invitations
```
**请求体**:
```json
{
  "role": "editor",
  "maxUses": 10,
  "expiresAt": "2024-12-31 23:59:59"
}
```
**响应**:
```json
{
  "code": 0,
  "data": {
    "inviteCode": "ABC123XYZ",
    "inviteUrl": "http://localhost:43000/join/ABC123XYZ",
    "role": "editor",
    "maxUses": 10,
    "usedCount": 0,
    "expiresAt": "2024-12-31 23:59:59"
  }
}
```

#### 5.3.2 获取邀请码列表
```
GET /api/v1/ledgers/{id}/invitations
```

#### 5.3.3 撤销邀请码
```
DELETE /api/v1/ledgers/{id}/invitations/{code}
```

#### 5.3.4 使用邀请码加入账本
```
POST /api/v1/invitations/{code}/join
```

### 5.4 统一数据查询

所有数据查询 API 增加 `ledgerId` 参数（可选，不传则使用当前账本）：

```
GET /api/v1/transactions?ledgerId=1
GET /api/v1/accounts?ledgerId=1
GET /api/v1/budgets?ledgerId=1
GET /api/v1/categories?ledgerId=1
```

---

## 6. 后端改动

### 6.1 新增模块结构
```
api/src/main/java/com/mamoji/module/ledger/
├── controller/
│   └── LedgerController.java
├── entity/
│   ├── FinLedger.java
│   ├── FinLedgerMember.java
│   └── FinInvitation.java
├── mapper/
│   ├── FinLedgerMapper.java
│   ├── FinLedgerMemberMapper.java
│   └── FinInvitationMapper.java
├── service/
│   ├── LedgerService.java
│   └── LedgerServiceImpl.java
├── dto/
│   ├── LedgerDTO.java
│   ├── LedgerVO.java
│   ├── MemberVO.java
│   ├── InvitationDTO.java
│   └── InvitationVO.java
└── exception/
    ├── LedgerException.java
    └── ErrorCode.java
```

### 6.2 修改现有模块

#### 6.2.1 修改所有 Mapper
为所有数据表 Mapper 添加 `ledgerId` 条件：

```java
// FinTransactionMapper.java
List<Transaction> selectByLedgerId(@Param("ledgerId") Long ledgerId);

// FinAccountMapper.java
List<Account> selectByLedgerId(@Param("ledgerId") Long ledgerId);

// FinBudgetMapper.java
List<Budget> selectByLedgerId(@Param("ledgerId") Long ledgerId);

// FinCategoryMapper.java
List<Category> selectByLedgerId(@Param("ledgerId") Long ledgerId);
```

#### 6.2.2 修改所有 Service
```java
// 在查询方法中增加 ledgerId 参数
public List<Transaction> listTransactions(Long userId, Long ledgerId) {
    Long actualLedgerId = ledgerId != null ? ledgerId : getDefaultLedgerId(userId);
    return mapper.selectList(
        QueryWrapper.<Transaction>lambda()
            .eq(Transaction::getLedgerId, actualLedgerId)
            .eq(Transaction::getStatus, 1)
    );
}
```

#### 6.2.3 修改 JWT Token
JWT 载荷增加 `ledgerId`：
```json
{
  "userId": 1,
  "username": "zhangsan",
  "ledgerId": 1,
  "exp": 1234567890
}
```

#### 6.2.4 新增权限拦截器
```java
@Component
public class LedgerPermissionInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                           HttpServletResponse response,
                           Object handler) {
        Long ledgerId = getLedgerIdFromRequest(request);
        Long userId = getCurrentUserId();

        // 验证用户是否有权限访问该账本
        if (!ledgerService.hasAccess(ledgerId, userId)) {
            throw new LedgerException("无权访问该账本");
        }
        return true;
    }
}
```

### 6.3 新增工具类

```java
// LedgerContext.java - 获取当前账本上下文
public class LedgerContext {
    public static Long getCurrentLedgerId() {
        // 优先级: header > JWT > 默认账本
    }

    public static boolean hasPermission(String action) {
        // 权限校验
    }
}
```

---

## 7. 前端改动

### 7.1 新增页面
```
web/app/(dashboard)/ledgers/
├── page.tsx              # 账本列表页
├── [id]/page.tsx         # 账本设置页
├── [id]/members/page.tsx # 成员管理页
└── create/page.tsx       # 创建账本页

web/app/(auth)/
└── join/[code]/page.tsx  # 通过邀请码加入账本
```

### 7.2 新增组件
```
web/components/ledger/
├── ledger-selector.tsx   # 账本切换下拉框
├── member-list.tsx       # 成员列表
├── invite-modal.tsx      # 邀请模态框
├── join-form.tsx         # 加入账本表单
└── role-badge.tsx        # 角色徽章
```

### 7.3 新增 Hook/Context
```typescript
// hooks/useLedger.ts
export function useLedger() {
  const { currentLedger, ledgers, switchLedger } = useLedgerContext();
  // ...
}

// context/LedgerContext.tsx
export function LedgerProvider({ children }) {
  const [currentLedgerId, setCurrentLedgerId] = useState<number | null>(null);
  // ...
}
```

### 7.4 API 层修改

```typescript
// lib/api.ts
// 所有请求自动带上当前账本ID
axios.interceptors.request.use((config) => {
  const ledgerId = ledgerStore.getState().currentLedgerId;
  if (ledgerId) {
    config.headers['X-Ledger-Id'] = ledgerId;
  }
  return config;
});
```

### 7.5 页面修改

| 页面 | 修改内容 |
|------|----------|
| 仪表盘 | 从当前账本获取数据 |
| 交易列表 | 从当前账本获取数据 |
| 账户列表 | 从当前账本获取数据 |
| 预算列表 | 从当前账本获取数据 |
| 分类列表 | 从当前账本获取数据 + 系统默认分类 |
| 侧边栏 | 添加账本切换器 |

---

## 8. 实现计划

### Phase 1: 基础架构（3天）
| 任务 | 工时 |
|------|------|
| 数据库表创建 | 0.5天 |
| 基础实体和 Mapper | 0.5天 |
| LedgerService 核心逻辑 | 1天 |
| LedgerController API | 0.5天 |
| 权限校验拦截器 | 0.5天 |

### Phase 2: 邀请系统（1天）
| 任务 | 工时 |
|------|------|
| 邀请码生成和验证 | 0.5天 |
| 加入账本 API | 0.25天 |
| 前端加入页面 | 0.25天 |

### Phase 3: 数据迁移（0.5天）
| 任务 | 工时 |
|------|------|
| 数据迁移脚本 | 0.25天 |
| 测试迁移脚本 | 0.25天 |

### Phase 4: 前端实现（2天）
| 任务 | 工时 |
|------|------|
| 账本切换器组件 | 0.5天 |
| 账本列表/创建页面 | 0.5天 |
| 成员管理页面 | 0.5天 |
| 邀请链接功能 | 0.5天 |

### Phase 5: 集成测试（1天）
| 任务 | 工时 |
|------|------|
| 后端单元测试 | 0.5天 |
| 前后端联调测试 | 0.5天 |

**总计: 7.5 天**

---

## 9. 测试用例

### 9.1 账本管理
- [ ] 创建账本成功
- [ ] 创建账本同名检查
- [ ] 更新账本信息
- [ ] 删除空账本
- [ ] 删除非空账本（应拒绝）
- [ ] 切换到不存在的账本

### 9.2 成员管理
- [ ] 账本 owner 正确
- [ ] 成员列表正确
- [ ] owner 移除自己（应拒绝）
- [ ] 成员主动退出
- [ ] admin 修改其他成员角色
- [ ] viewer 修改角色（应拒绝）

### 9.3 邀请系统
- [ ] 创建邀请码成功
- [ ] 使用邀请码加入成功
- [ ] 使用邀请码加入重复成员（应拒绝）
- [ ] 邀请码达到使用次数后失效
- [ ] 邀请码过期后失效
- [ ] 撤销邀请码后失效

### 9.4 权限校验
- [ ] 非成员访问账本（应拒绝）
- [ ] viewer 尝试添加交易（应拒绝）
- [ ] editor 尝试移除成员（应拒绝）

### 9.5 数据隔离
- [ ] 用户只能看到自己有权限的账本
- [ ] 账本数据正确隔离
- [ ] 默认账本正确设置

---

## 10. 风险与应对

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 数据迁移失败 | 高 | 提前备份，提供回滚脚本 |
| 权限漏洞 | 高 | 多轮安全测试，代码审查 |
| 前端改动遗漏 | 中 | 全面的回归测试 |
| 性能下降 | 中 | 优化索引，添加缓存 |

---

## 11. 附录

### 11.1 邀请链接格式
```
http://localhost:43000/join/{inviteCode}
```

### 11.2 错误码定义
| 错误码 | 说明 |
|--------|------|
| LEDGER_001 | 账本不存在 |
| LEDGER_002 | 无权访问账本 |
| LEDGER_003 | 账本名称已存在 |
| LEDGER_004 | 不能移除账本 owner |
| LEDGER_005 | 不能修改 owner 角色 |
| INVITE_001 | 邀请码不存在 |
| INVITE_002 | 邀请码已过期 |
| INVITE_003 | 邀请码已达到使用次数上限 |
| INVITE_004 | 已是账本成员 |
