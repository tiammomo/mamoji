# Mamoji API 文档

## 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `/api/v1` |
| 认证方式 | JWT Bearer Token |
| 响应格式 | JSON |

## 统一响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码：0 成功，其他失败 |
| message | string | 提示信息 |
| data | object | 响应数据 |

---

## 认证模块

### 1. 用户注册

**POST** `/auth/register`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，6-15字符，支持英文、数字、下划线 |
| password | string | 是 | 密码，6-20字符 |
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |

**响应：**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "userId": 1,
    "username": "test",
    "role": "normal"
  }
}
```

---

### 2. 用户登录

**POST** `/auth/login`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应：**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "userId": 1,
      "username": "test",
      "phone": "13800138000",
      "email": "test@example.com",
      "role": "normal",
      "status": 1
    }
  }
}
```

---

### 3. 用户登出

**POST** `/auth/logout`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "message": "登出成功"
}
```

---

### 4. 刷新 Token

**POST** `/auth/refresh`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": 86400
  }
}
```

---

### 5. 获取用户信息

**GET** `/auth/profile`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "userId": 1,
    "username": "test",
    "phone": "13800138000",
    "email": "test@example.com",
    "role": "normal",
    "status": 1,
    "createdAt": "2026-01-19T10:00:00"
  }
}
```

---

### 6. 更新用户信息

**PUT** `/auth/profile`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |

**响应：**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "userId": 1,
    "username": "test",
    "phone": "13900139000",
    "email": "new@example.com"
  }
}
```

---

### 7. 修改密码

**POST** `/auth/change-password`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| oldPassword | string | 是 | 原密码 |
| newPassword | string | 是 | 新密码，6-20字符 |

**响应：**

```json
{
  "code": 0,
  "message": "密码修改成功"
}
```

---

## 账户模块

### 1. 获取账户列表

**GET** `/accounts`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | int | 状态筛选：0禁用，1正常 |

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "accountId": 1,
      "name": "工商银行储蓄卡",
      "accountType": "bank",
      "accountSubType": "bank_primary",
      "balance": 10000.00,
      "currency": "CNY",
      "includeInTotal": 1,
      "status": 1,
      "createdAt": "2026-01-19T10:00:00",
      "updatedAt": "2026-01-19T10:00:00"
    }
  ]
}
```

---

### 2. 获取账户汇总

**GET** `/accounts/summary`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "totalBalance": 50000.00,
    "totalFund": 45000.00,
    "totalCredit": -5000.00,
    "totalDebt": 0.00,
    "accountCount": 3,
    "activeAccountCount": 2
  }
}
```

**字段说明：**

| 字段 | 说明 |
|------|------|
| totalBalance | 总余额（资金 + 资产 - 负债） |
| totalFund | 资金账户总额（bank + cash + alipay + wechat + gold + fund） |
| totalCredit | 信用账户总额（credit 为负数） |
| totalDebt | 负债总额（debt） |

**账户类型（accountType / accountSubType）：**

| accountType | accountSubType | 说明 |
|-------------|----------------|------|
| bank | bank_primary | 一类银行卡 |
| bank | bank_secondary | 二类银行卡 |
| credit | credit_card | 信用卡 |
| cash | - | 现金 |
| alipay | - | 支付宝 |
| wechat | - | 微信 |
| gold | - | 黄金 |
| fund_accumulation | - | 公积金 |
| fund | - | 基金 |
| stock | - | 股票 |
| topup | - | 充值卡 |
| debt | - | 借款 |

**includeInTotal：**

| 值 | 说明 |
|----|------|
| 0 | 不计入总资产 |
| 1 | 计入总资产 |

---

### 3. 创建账户

**POST** `/accounts`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 账户名称 |
| accountType | string | 是 | 类型：bank/credit/cash/alipay/wechat/gold/fund_accumulation/fund/stock/topup/debt |
| accountSubType | string | 否 | 子类型：bank_primary/bank_secondary/credit_card |
| balance | number | 否 | 初始余额，默认 0 |
| currency | string | 否 | 币种，默认 CNY |
| includeInTotal | int | 否 | 是否计入总资产，默认 1 |

**响应：**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "accountId": 2,
    "name": "新账户",
    "accountType": "bank",
    "accountSubType": "bank_primary",
    "balance": 0.00,
    "status": 1
  }
}
```

---

### 4. 获取账户详情

**GET** `/accounts/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "accountId": 1,
    "name": "工商银行储蓄卡",
    "accountType": "bank",
    "accountSubType": "bank_primary",
    "balance": 10000.00,
    "currency": "CNY",
    "includeInTotal": 1,
    "status": 1,
    "createdAt": "2026-01-19T10:00:00",
    "updatedAt": "2026-01-19T10:00:00"
  }
}
```

---

### 5. 更新账户

**PUT** `/accounts/{id}`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 账户名称 |
| balance | number | 余额 |
| includeInTotal | int | 是否计入总资产 | |
| status | int | 状态 |

**响应：**

```json
{
  "code": 0,
  "message": "更新成功"
}
```

---

### 6. 删除账户

**DELETE** `/accounts/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

## 交易模块

### 1. 获取交易列表

**GET** `/transactions`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 筛选类型：income/expense |
| categoryId | int | 筛选分类 |
| accountId | int | 筛选账户 |
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |
| page | int | 页码，默认 1 |
| pageSize | int | 每页数量，默认 20 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "transactionId": 1,
        "type": "expense",
        "categoryId": 1,
        "categoryName": "餐饮",
        "accountId": 1,
        "accountName": "工商银行",
        "amount": 50.00,
        "currency": "CNY",
        "occurredAt": "2026-01-19T12:00:00",
        "note": "午餐",
        "status": 1,
        "createdAt": "2026-01-19T12:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

### 2. 创建交易

**POST** `/transactions`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 类型：income/expense |
| amount | number | 是 | 金额 |
| accountId | int | 是 | 账户ID |
| categoryId | int | 否 | 分类ID |
| occurredAt | string | 是 | 发生时间 (ISO 8601) |
| note | string | 否 | 备注 |

**响应：**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "transactionId": 2,
    "type": "expense",
    "amount": 50.00,
    "balance": 9950.00
  }
}
```

---

### 3. 获取交易详情

**GET** `/transactions/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "transactionId": 1,
    "type": "expense",
    "categoryId": 1,
    "categoryName": "餐饮",
    "accountId": 1,
    "accountName": "工商银行",
    "amount": 50.00,
    "currency": "CNY",
    "occurredAt": "2026-01-19T12:00:00",
    "note": "午餐",
    "status": 1,
    "createdAt": "2026-01-19T12:00:00",
    "updatedAt": "2026-01-19T12:00:00"
  }
}
```

---

### 4. 更新交易

**PUT** `/transactions/{id}`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| amount | number | 金额 |
| categoryId | int | 分类ID |
| accountId | int | 账户ID |
| occurredAt | string | 发生时间 |
| note | string | 备注 |
| status | int | 状态 |

**响应：**

```json
{
  "code": 0,
  "message": "更新成功"
}
```

---

### 5. 删除交易

**DELETE** `/transactions/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

## 分类模块

### 1. 获取分类列表

**GET** `/categories`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 筛选类型：income/expense |
| status | int | 状态：0禁用，1正常 |

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "categoryId": 1,
      "userId": 0,
      "name": "餐饮",
      "type": "expense",
      "status": 1,
      "createdAt": "2026-01-19T10:00:00",
      "updatedAt": "2026-01-19T10:00:00"
    }
  ]
}
```

---

### 2. 创建分类

**POST** `/categories`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| type | string | 是 | 类型：income/expense |

**响应：**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "categoryId": 13,
    "name": "自定义分类",
    "type": "expense",
    "status": 1
  }
}
```

---

### 3. 更新分类

**PUT** `/categories/{id}`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 分类名称 |
| status | int | 状态 |

**响应：**

```json
{
  "code": 0,
  "message": "更新成功"
}
```

---

### 4. 删除分类

**DELETE** `/categories/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

## 预算模块

### 1. 获取预算列表

**GET** `/budgets`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | int | 状态：0取消，1进行中，2已完成，3超支 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "budgetId": 1,
      "name": "1月总预算",
      "amount": 5000.00,
      "spent": 1500.00,
      "remaining": 3500.00,
      "usagePercent": 30.00,
      "startDate": "2026-01-01",
      "endDate": "2026-01-31",
      "status": 1,
      "createdAt": "2026-01-19T10:00:00"
    }
  ]
}
```

---

### 2. 创建预算

**POST** `/budgets`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 预算名称 |
| amount | number | 是 | 预算金额 |
| startDate | string | 是 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 是 | 结束日期 (YYYY-MM-DD) |

**响应：**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "budgetId": 1,
    "name": "1月总预算",
    "amount": 5000.00,
    "spent": 0.00,
    "remaining": 5000.00,
    "usagePercent": 0,
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "status": 1
  }
}
```

---

### 3. 获取预算详情

**GET** `/budgets/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "budgetId": 1,
    "name": "1月总预算",
    "amount": 5000.00,
    "spent": 1500.00,
    "remaining": 3500.00,
    "usagePercent": 30.00,
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "status": 1,
    "transactionCount": 15,
    "createdAt": "2026-01-19T10:00:00",
    "updatedAt": "2026-01-19T10:00:00"
  }
}
```

---

### 4. 更新预算

**PUT** `/budgets/{id}`

**Headers：** `Authorization: Bearer {token}`

**请求参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| name | string | 预算名称 |
| amount | number | 预算金额 |
| status | int | 状态 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

**响应：**

```json
{
  "code": 0,
  "message": "更新成功"
}
```

---

### 5. 删除预算

**DELETE** `/budgets/{id}`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

## 报表模块

### 1. 收支概览

**GET** `/reports/summary`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |

**响应：**

```json
{
  "code": 0,
  "data": {
    "totalBalance": 50000.00,
    "totalFund": 55000.00,
    "totalCredit": -5000.00,
    "monthlyIncome": 15000.00,
    "monthlyExpense": 8000.00,
    "monthlyBalance": 7000.00,
    "accountCount": 3,
    "transactionCount": 50,
    "budgetCount": 2,
    "activeBudgetCount": 1
  }
}
```

---

### 2. 收支报表

**GET** `/reports/income-expense`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |

**响应：**

```json
{
  "code": 0,
  "data": {
    "period": "2026-01-01 ~ 2026-01-31",
    "totalIncome": 15000.00,
    "totalExpense": 8000.00,
    "balance": 7000.00,
    "incomeByCategory": [
      { "categoryId": 1, "categoryName": "工资", "amount": 12000.00, "percent": 80.0, "count": 2 }
    ],
    "expenseByCategory": [
      { "categoryId": 5, "categoryName": "餐饮", "amount": 3000.00, "percent": 37.5, "count": 25 }
    ]
  }
}
```

---

### 3. 月度报表

**GET** `/reports/monthly`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| year | int | 年份，必填 |
| month | int | 月份，必填 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "year": 2026,
    "month": 1,
    "totalIncome": 15000.00,
    "totalExpense": 8000.00,
    "balance": 7000.00,
    "dailyData": [
      { "date": "2026-01-01", "income": 500.00, "expense": 200.00, "balance": 300.00 },
      { "date": "2026-01-02", "income": 12000.00, "expense": 1000.00, "balance": 11000.00 }
    ],
    "summary": {
      "avgDailyIncome": 483.87,
      "avgDailyExpense": 258.06,
      "maxExpenseDay": "2026-01-15",
      "maxExpenseAmount": 1500.00,
      "transactionDays": 28
    }
  }
}
```

---

### 4. 趋势报表

**GET** `/reports/trend`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| startDate | string | 开始日期 (YYYY-MM-DD) |
| endDate | string | 结束日期 (YYYY-MM-DD) |
| groupBy | string | 分组方式：day/week/month，默认 day |

**响应：**

```json
{
  "code": 0,
  "data": {
    "period": "2026-01-01 ~ 2026-01-31",
    "groupBy": "day",
    "trend": [
      { "date": "2026-01-01", "income": 500.00, "expense": 200.00, "balance": 300.00 },
      { "date": "2026-01-02", "income": 12000.00, "expense": 1000.00, "balance": 11000.00 }
    ],
    "summary": {
      "totalIncome": 15000.00,
      "totalExpense": 8000.00,
      "avgDailyIncome": 483.87,
      "avgDailyExpense": 258.06,
      "maxIncomeDay": "2026-01-02",
      "maxIncomeAmount": 12000.00,
      "maxExpenseDay": "2026-01-15",
      "maxExpenseAmount": 1500.00
    }
  }
}
```

---

### 5. 资产负债表

**GET** `/reports/balance-sheet`

**Headers：** `Authorization: Bearer {token}`

**响应：**

```json
{
  "code": 0,
  "data": {
    "asOfDate": "2026-01-19",
    "assets": {
      "fund": [
        { "accountId": 1, "accountName": "现金", "amount": 5000.00 },
        { "accountId": 2, "accountName": "银行卡", "amount": 30000.00 }
      ],
      "topup": [
        { "accountId": 3, "accountName": "支付宝", "amount": 10000.00 }
      ]
    },
    "liabilities": {
      "credit": [
        { "accountId": 4, "accountName": "信用卡", "amount": -5000.00 }
      ],
      "debt": []
    },
    "summary": {
      "totalAssets": 45000.00,
      "totalLiabilities": 5000.00,
      "netAssets": 40000.00
    }
  }
}
```

---

### 6. 预算执行报表

**GET** `/reports/budget-execution`

**Headers：** `Authorization: Bearer {token}`

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| year | int | 年份，默认当前年 |
| month | int | 月份，默认当前月 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "period": "2026年1月",
    "budgets": [
      {
        "budgetId": 1,
        "name": "1月总预算",
        "amount": 5000.00,
        "spent": 1500.00,
        "remaining": 3500.00,
        "usagePercent": 30.00,
        "status": 1,
        "transactionCount": 15
      },
      {
        "budgetId": 2,
        "name": "餐饮预算",
        "amount": 2000.00,
        "spent": 1200.00,
        "remaining": 800.00,
        "usagePercent": 60.00,
        "status": 1,
        "transactionCount": 20
      }
    ],
    "summary": {
      "totalBudget": 7000.00,
      "totalSpent": 2700.00,
      "totalRemaining": 4300.00,
      "avgUsagePercent": 38.57
    }
  }
}
```

---

## 错误码说明

| 错误码 | 说明 | 备注 |
|--------|------|------|
| 0 | 成功 | - |
| 400 | 参数错误 | 请求参数不合法 |
| 401 | 未登录或 token 无效 | 需要重新登录 |
| 403 | 无权限 | 无操作权限 |
| 404 | 资源不存在 | 资源已被删除或不存在 |
| 405 | 方法不允许 | 请求方法不支持 |
| 409 | 业务冲突 | 业务规则不允许 |
| 422 | 数据验证失败 | 数据校验未通过 |
| 423 | 账户已锁定 | 登录失败次数过多，请稍后再试 |
| 500 | 服务器错误 | 内部错误 |

---

## 通用分页响应

列表类接口的分页响应结构：

```json
{
  "code": 0,
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| list | array | 数据列表 |
| total | int | 总记录数 |
| page | int | 当前页码 |
| pageSize | int | 每页数量 |
| totalPages | int | 总页数 |
