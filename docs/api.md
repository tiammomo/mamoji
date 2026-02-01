# Mamoji API 文档

## 1. 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `/api/v1` |
| 认证方式 | JWT Bearer Token |
| 响应格式 | JSON |
| 后端端口 | 48080 |

---

## 2. 统一响应格式

### 2.1 响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": "2026-02-02T10:30:00"
}
```

### 2.2 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Integer | 0=成功，其他=业务错误码 |
| message | String | 提示信息 |
| data | Object/Array | 响应数据 |
| timestamp | String | 响应时间戳 |

### 2.3 错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| 0 | 200 | 成功 |
| 400 | 400 | 参数错误 |
| 401 | 401 | 未登录或Token过期 |
| 403 | 403 | 无权限访问 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 业务冲突（如重复数据） |
| 500 | 500 | 服务器内部错误 |

---

## 3. 认证模块 (Auth)

### 3.1 登录

**POST** `/auth/login`

**请求参数：**
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": 1,
      "email": "test@example.com",
      "username": "测试用户",
      "createdAt": "2026-01-01T00:00:00"
    }
  }
}
```

---

### 3.2 注册

**POST** `/auth/register`

**请求参数：**
```json
{
  "email": "newuser@example.com",
  "password": "123456",
  "username": "新用户"
}
```

**响应数据：** 同登录接口

---

### 3.3 获取用户信息

**GET** `/auth/profile`

**请求头：**
```
Authorization: Bearer <token>
```

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "userId": 1,
    "email": "test@example.com",
    "username": "测试用户",
    "phone": "13800138000",
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### 3.4 登出

**POST** `/auth/logout`

**请求头：**
```
Authorization: Bearer <token>
```

---

## 4. 账户模块 (Accounts)

### 4.1 账户列表

**GET** `/accounts`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | Integer | 否 | 1=正常，0=已删除，默认1 |
| accountType | String | 否 | 账户类型过滤 |

**响应数据：**
```json
{
  "code": 0,
  "data": [
    {
      "accountId": 1,
      "name": "招商银行储蓄卡",
      "accountType": "bank",
      "accountSubType": "bank_primary",
      "balance": 50000.00,
      "includeInTotal": 1,
      "status": 1,
      "createdAt": "2026-01-01T00:00:00"
    }
  ]
}
```

---

### 4.2 账户详情

**GET** `/accounts/{id}`

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "accountId": 1,
    "name": "招商银行储蓄卡",
    "accountType": "bank",
    "accountSubType": "bank_primary",
    "balance": 50000.00,
    "includeInTotal": 1,
    "status": 1,
    "createdAt": "2026-01-01T00:00:00",
    "updatedAt": "2026-01-15T10:30:00"
  }
}
```

---

### 4.3 创建账户

**POST** `/accounts`

**请求参数：**
```json
{
  "name": "招商银行储蓄卡",
  "accountType": "bank",
  "accountSubType": "bank_primary",
  "balance": 50000.00,
  "includeInTotal": 1
}
```

**字段说明：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | String | 是 | 账户名称 |
| accountType | String | 是 | 账户类型 |
| accountSubType | String | 否 | 子类型 |
| balance | BigDecimal | 是 | 初始余额 |
| includeInTotal | Integer | 否 | 是否计入净资产，1=是，0=否 |

---

### 4.4 更新账户

**PUT** `/accounts/{id}`

**请求参数：**
```json
{
  "name": "招商银行信用卡",
  "balance": 3000.00
}
```

---

### 4.5 删除账户

**DELETE** `/accounts/{id}`

> 软删除，将 status 设为 0

---

### 4.6 账户汇总

**GET** `/accounts/summary`

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "totalAssets": 85000.00,
    "totalLiabilities": 5000.00,
    "netAssets": 80000.00,
    "accountsCount": 5
  }
}
```

---

### 4.7 账户流水

**GET** `/accounts/{id}/flows`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| startDate | String | 开始日期 |
| endDate | String | 结束日期 |
| current | Integer | 当前页，默认1 |
| size | Integer | 每页条数，默认10 |

---

## 5. 交易模块 (Transactions)

### 5.1 交易列表

**GET** `/transactions`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| accountId | Long | 否 | 账户ID |
| categoryId | Long | 否 | 分类ID |
| type | String | 否 | INCOME/EXPENSE |
| startDate | String | 否 | 开始日期 |
| endDate | String | 否 | 结束日期 |
| minAmount | BigDecimal | 否 | 最小金额 |
| maxAmount | BigDecimal | 否 | 最大金额 |
| keyword | String | 否 | 备注关键词 |
| current | Integer | 否 | 当前页，默认1 |
| size | Integer | 否 | 每页条数，默认10 |

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "current": 1,
    "size": 10,
    "total": 100,
    "pages": 10,
    "records": [
      {
        "transactionId": 1,
        "type": "EXPENSE",
        "amount": 50.00,
        "accountId": 1,
        "accountName": "招商银行储蓄卡",
        "categoryId": 1,
        "categoryName": "餐饮",
        "budgetId": 1,
        "budgetName": "1月餐饮预算",
        "occurredAt": "2026-01-15T12:00:00",
        "note": "午餐",
        "status": 1
      }
    ]
  }
}
```

---

### 5.2 最近交易

**GET** `/transactions/recent`

**查询参数：**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | Integer | 否 | 10 | 返回数量 |

---

### 5.3 交易详情

**GET** `/transactions/{id}`

---

### 5.4 创建交易

**POST** `/transactions`

**请求参数：**
```json
{
  "type": "EXPENSE",
  "amount": 50.00,
  "accountId": 1,
  "categoryId": 1,
  "budgetId": 1,
  "occurredAt": "2026-01-15T12:00:00",
  "note": "午餐"
}
```

**字段说明：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | String | 是 | INCOME/EXPENSE |
| amount | BigDecimal | 是 | 金额（正数） |
| accountId | Long | 是 | 账户ID |
| categoryId | Long | 是 | 分类ID |
| budgetId | Long | 否* | 预算ID（支出必填） |
| occurredAt | String | 是 | 交易时间 |
| note | String | 否 | 备注 |

> * 支出交易必须关联预算

---

### 5.5 更新交易

**PUT** `/transactions/{id}`

**请求参数：**
```json
{
  "amount": 100.00,
  "note": "修改后的备注"
}
```

---

### 5.6 删除交易

**DELETE** `/transactions/{id}`

---

### 5.7 交易退款列表

**GET** `/transactions/{id}/refunds`

---

### 5.8 创建退款

**POST** `/transactions/{id}/refunds`

**请求参数：**
```json
{
  "amount": 25.00,
  "occurredAt": "2026-01-16T10:00:00",
  "note": "部分退款"
}
```

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "refundId": 1,
    "transactionId": 1,
    "amount": 25.00,
    "note": "部分退款",
    "status": 1,
    "createdAt": "2026-01-16T10:00:00"
  }
}
```

---

### 5.9 取消退款

**DELETE** `/transactions/{id}/refunds/{refundId}`

---

## 6. 分类模块 (Categories)

### 6.1 分类列表

**GET** `/categories`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| type | String | 分类类型：INCOME/EXPENSE |
| status | Integer | 状态：1=正常，0=禁用 |

**响应数据：**
```json
{
  "code": 0,
  "data": [
    {
      "categoryId": 1,
      "name": "餐饮",
      "type": "EXPENSE",
      "icon": "🍔",
      "status": 1
    }
  ]
}
```

---

### 6.2 创建分类

**POST** `/categories`

**请求参数：**
```json
{
  "name": "新分类",
  "type": "EXPENSE",
  "icon": "📝"
}
```

---

### 6.3 更新分类

**PUT** `/categories/{id}`

---

### 6.4 删除分类

**DELETE** `/categories/{id}`

---

## 7. 预算模块 (Budgets)

### 7.1 预算列表

**GET** `/budgets`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| status | Integer | 状态过滤 |
| activeOnly | Boolean | 仅显示进行中的预算 |

**响应数据：**
```json
{
  "code": 0,
  "data": [
    {
      "budgetId": 1,
      "name": "1月餐饮预算",
      "amount": 2000.00,
      "spent": 500.00,
      "startDate": "2026-01-01",
      "endDate": "2026-01-31",
      "status": 1,
      "alertThreshold": 80
    }
  ]
}
```

---

### 7.2 预算详情

**GET** `/budgets/{id}`

---

### 7.3 创建预算

**POST** `/budgets`

**请求参数：**
```json
{
  "name": "1月餐饮预算",
  "amount": 2000.00,
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "alertThreshold": 80
}
```

---

### 7.4 更新预算

**PUT** `/budgets/{id}`

---

### 7.5 删除预算

**DELETE** `/budgets/{id}`

---

### 7.6 预算进度

**GET** `/budgets/{id}/progress`

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "budgetId": 1,
    "name": "1月餐饮预算",
    "amount": 2000.00,
    "spent": 500.00,
    "remaining": 1500.00,
    "usagePercent": 25.0,
    "status": "NORMAL",
    "transactionCount": 5
  }
}
```

---

## 8. 报表模块 (Reports)

### 8.1 收支概览

**GET** `/reports/summary`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| startDate | String | 开始日期 |
| endDate | String | 结束日期 |
| accountId | Long | 账户ID |

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "totalIncome": 15000.00,
    "totalExpense": 3500.00,
    "netIncome": 11500.00,
    "transactionCount": 25,
    "accountCount": 5
  }
}
```

---

### 8.2 分类收支报表

**GET** `/reports/income-expense`

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| startDate | String | 开始日期 |
| endDate | String | 结束日期 |

**响应数据：**
```json
{
  "code": 0,
  "data": [
    {
      "categoryId": 1,
      "categoryName": "餐饮",
      "type": "EXPENSE",
      "amount": 500.00,
      "count": 10,
      "percentage": 14.3
    }
  ]
}
```

---

### 8.3 月度报表

**GET** `/reports/monthly`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| year | Integer | 是 | 年份 |
| month | Integer | 是 | 月份 |

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "year": 2026,
    "month": 1,
    "totalIncome": 8000.00,
    "totalExpense": 3500.00,
    "netIncome": 4500.00,
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "dailyData": [
      {
        "day": 1,
        "income": 500.00,
        "expense": 100.00
      }
    ]
  }
}
```

---

### 8.4 自定义日期报表

**GET** `/reports/daily`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | String | 是 | 开始日期 |
| endDate | String | 是 | 结束日期 |

---

### 8.5 趋势报表

**GET** `/reports/trend`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | String | 是 | 开始日期 |
| endDate | String | 是 | 结束日期 |
| period | String | 否 | 粒度：daily/weekly/monthly |

**响应数据：**
```json
{
  "code": 0,
  "data": [
    {
      "period": "2026-01",
      "income": 8000.00,
      "expense": 3500.00,
      "netIncome": 4500.00,
      "transactionCount": 25,
      "incomeChangePercent": 10.5,
      "expenseChangePercent": -5.2
    }
  ]
}
```

---

### 8.6 资产负债表

**GET** `/reports/balance-sheet`

**响应数据：**
```json
{
  "code": 0,
  "data": {
    "totalAssets": 85000.00,
    "totalLiabilities": 5000.00,
    "netAssets": 80000.00,
    "asOfDate": "2026-02-02",
    "assets": [
      {
        "accountId": 1,
        "name": "招商银行储蓄卡",
        "type": "bank",
        "balance": 50000.00,
        "percentage": 58.8
      }
    ],
    "liabilities": [
      {
        "accountId": 2,
        "name": "信用卡",
        "balance": 5000.00
      }
    ]
  }
}
```

---

## 9. 附录

### 9.1 账户类型枚举

| 值 | 说明 |
|------|------|
| bank | 银行卡 |
| credit | 信用卡 |
| cash | 现金 |
| digital | 数字钱包 |
| investment | 投资 |
| debt | 负债 |

### 9.2 交易类型枚举

| 值 | 说明 |
|------|------|
| INCOME | 收入 |
| EXPENSE | 支出 |

### 9.3 预算状态枚举

| 值 | 说明 |
|------|------|
| 0 | 已取消 |
| 1 | 进行中 |
| 2 | 已完成 |
| 3 | 超支 |

### 9.4 分页响应字段

| 字段 | 说明 |
|------|------|
| current | 当前页码 |
| size | 每页条数 |
| total | 总记录数 |
| pages | 总页数 |
| records | 数据列表 |

---

**文档版本**: v1.0
**最后更新**: 2026-02-02
