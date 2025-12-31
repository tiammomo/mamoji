# 账户管理 API 文档

## 概述

账户管理模块提供账户的增删改查功能，支持可支配金额和投资中金额的独立管理。

## Base URL

```
/api/v1/accounts
```

## API 列表

### 1. 获取账户列表

**GET** `/api/v1/accounts`

#### 请求参数

| 参数名 | 类型 | 必填 | 位置 | 说明 |
|--------|------|------|------|------|
| unitId | int64 | 否 | query | 按记账单元筛选 |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "accountId": 1,
      "enterpriseId": 1,
      "unitId": 1,
      "type": "wechat",
      "name": "微信钱包",
      "accountNo": null,
      "bankCardType": null,
      "availableBalance": 12580.50,
      "investedAmount": 0.00,
      "status": 1,
      "createdAt": "2024-01-01 12:00:00"
    }
  ]
}
```

#### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| accountId | int64 | 账户ID |
| enterpriseId | int64 | 企业ID |
| unitId | int64 | 记账单元ID |
| type | string | 账户类型 |
| name | string | 账户名称 |
| accountNo | string | 账号(可选) |
| bankCardType | string | 银行卡类型(可选) |
| availableBalance | float64 | 可支配金额 |
| investedAmount | float64 | 投资中金额 |
| status | int | 状态：1-正常 0-停用 |
| createdAt | string | 创建时间 |

---

### 2. 获取单个账户

**GET** `/api/v1/accounts/{accountId}`

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| accountId | int64 | 是 | 账户ID |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accountId": 1,
    "enterpriseId": 1,
    "unitId": 1,
    "type": "wechat",
    "name": "微信钱包",
    "accountNo": null,
    "bankCardType": null,
    "availableBalance": 12580.50,
    "investedAmount": 0.00,
    "status": 1,
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

---

### 3. 创建账户

**POST** `/api/v1/accounts`

#### 请求体

```json
{
  "enterpriseId": 1,
  "unitId": 1,
  "type": "bank",
  "name": "建设银行",
  "accountNo": "1234",
  "bankCardType": "type1",
  "availableBalance": 50000.00,
  "investedAmount": 100000.00
}
```

#### 请求字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| enterpriseId | int64 | 否 | 企业ID(从Token获取) |
| unitId | int64 | 是 | 记账单元ID |
| type | string | 是 | 账户类型 |
| name | string | 是 | 账户名称(1-50字符) |
| accountNo | string | 否 | 账号 |
| bankCardType | string | 否 | 银行卡类型 |
| availableBalance | float64 | 否 | 可支配金额，默认0 |
| investedAmount | float64 | 否 | 投资中金额，默认0 |

#### 账户类型枚举

| 类型值 | 说明 |
|--------|------|
| wechat | 微信 |
| alipay | 支付宝 |
| bank | 银行卡 |
| credit_card | 信用卡 |
| cash | 现金 |
| other | 其他 |

#### 成功响应

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "accountId": 5,
    "enterpriseId": 1,
    "unitId": 1,
    "type": "bank",
    "name": "建设银行",
    "accountNo": "1234",
    "bankCardType": "type1",
    "availableBalance": 50000.00,
    "investedAmount": 100000.00,
    "status": 1,
    "createdAt": "2024-12-31 12:00:00"
  }
}
```

---

### 4. 更新账户

**PUT** `/api/v1/accounts/{accountId}`

#### 请求体

```json
{
  "name": "建设银行(改)",
  "availableBalance": 55000.00,
  "investedAmount": 95000.00
}
```

#### 请求字段说明

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 新账户名称 |
| availableBalance | float64 | 否 | 新可支配金额 |
| investedAmount | float64 | 否 | 新投资中金额 |

#### 成功响应

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "accountId": 5,
    "enterpriseId": 1,
    "unitId": 1,
    "type": "bank",
    "name": "建设银行(改)",
    "accountNo": "1234",
    "bankCardType": "type1",
    "availableBalance": 55000.00,
    "investedAmount": 95000.00,
    "status": 1,
    "createdAt": "2024-12-31 12:00:00"
  }
}
```

---

### 5. 删除账户

**DELETE** `/api/v1/accounts/{accountId}`

> 注意：删除为软删除，仅将状态置为0

#### 成功响应

```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 401 | 未授权 |
| 403 | 无权限 |
| 500 | 服务器错误 |

## 业务逻辑说明

### 金额计算

账户总余额 = 可支配金额 + 投资中金额

```
Total Balance = Available Balance + Invested Amount
```

### 交易影响

当创建/更新/删除交易时，系统会自动更新账户的可支配金额：

| 交易类型 | 可支配金额变化 |
|----------|----------------|
| 收入 (income) | +Amount |
| 支出 (expense) | -Amount |

> 注意：投资相关操作需要单独更新 invested_amount 字段

## 前端集成示例

```typescript
// 获取账户列表
const accounts = await get<Account[]>('/api/v1/accounts');

// 计算总余额
const totalBalance = accounts.reduce(
  (sum, acc) => sum + acc.availableBalance + acc.investedAmount,
  0
);

// 创建账户
await post('/api/v1/accounts', {
  unitId: 1,
  type: 'bank',
  name: '新账户',
  availableBalance: 10000,
  investedAmount: 5000
});
```

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2024-01-01 | 初始版本 |
| v2.0 | 2024-12-31 | 拆分为 availableBalance 和 investedAmount 两个独立字段 |
