# 企业级财务记账系统 API 接口设计文档

## 一、接口规范

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 协议 | HTTPS |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 基础路径 | `/api/v1` |

### 1.2 统一响应格式

```go
// 成功响应
{
    "code": 0,
    "message": "success",
    "data": {...}
}

// 失败响应
{
    "code": 10001,
    "message": "参数错误",
    "data": null
}
```

### 1.3 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 10001 | 参数错误 |
| 10002 | 未登录 |
| 10003 | 无权限 |
| 10004 | 资源不存在 |
| 10005 | 资源已存在 |
| 10006 | 操作失败 |
| 20001 | 预算超支 |
| 20002 | 预算不存在 |
| 30001 | 企业不存在 |
| 30002 | 非企业成员 |
| 30003 | 记账单元不存在 |

### 1.4 认证方式

```
Authorization: Bearer {JWT_TOKEN}
```

---

## 二、用户认证模块

### 2.1 用户注册

```http
POST /api/v1/auth/register
```

**请求参数**
```json
{
    "username": "string",     // 用户名 (必填, 3-20字符)
    "password": "string",     // 密码 (必填, 6-20字符)
    "phone": "string",        // 手机号 (选填)
    "email": "string"         // 邮箱 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "user_id": "string",
        "username": "string",
        "token": "string"
    }
}
```

### 2.2 用户登录

```http
POST /api/v1/auth/login
```

**请求参数**
```json
{
    "username": "string",     // 用户名或手机号
    "password": "string"      // 密码
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "user_id": "string",
        "username": "string",
        "avatar": "string",
        "token": "string",
        "has_family": boolean    // 是否已加入家庭
    }
}
```

### 2.3 获取当前用户信息

```http
GET /api/v1/user/me
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "user_id": "string",
        "username": "string",
        "phone": "string",
        "email": "string",
        "avatar": "string",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 2.4 更新用户信息

```http
PUT /api/v1/user/me
```

**请求参数**
```json
{
    "username": "string",     // 选填
    "avatar": "string",       // 选填, 头像URL
    "phone": "string",        // 选填
    "email": "string"         // 选填
}
```

### 2.5 修改密码

```http
PUT /api/v1/user/password
```

**请求参数**
```json
{
    "old_password": "string",
    "new_password": "string"
}
```

---

## 三、企业管理模块

### 3.1 创建企业

```http
POST /api/v1/enterprise
```

**请求参数**
```json
{
    "name": "string",                    // 企业名称
    "credit_code": "string",             // 统一社会信用代码
    "contact_person": "string",          // 联系人
    "contact_phone": "string",           // 联系电话
    "address": "string",                 // 企业地址 (选填)
    "license_image": "string"            // 营业执照图片URL (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "enterprise_id": "string",
        "name": "string",
        "credit_code": "string",
        "role": "super_admin",           // 创建者为超级管理员
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 3.2 获取企业信息

```http
GET /api/v1/enterprise
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "enterprise_id": "string",
        "name": "string",
        "credit_code": "string",
        "contact_person": "string",
        "contact_phone": "string",
        "address": "string",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "members": [
            {
                "user_id": "string",
                "username": "string",
                "avatar": "string",
                "role": "super_admin",
                "joined_at": "2024-01-01T00:00:00Z"
            }
        ],
        "accounting_units": [
            {
                "unit_id": "string",
                "name": "string",
                "type": "business",
                "status": "active"
            }
        ]
    }
}
```

### 3.3 更新企业信息

```http
PUT /api/v1/enterprise
```

**请求参数**
```json
{
    "name": "string",                    // 选填
    "contact_person": "string",          // 选填
    "contact_phone": "string",           // 选填
    "address": "string"                  // 选填
}
```

### 3.4 添加企业成员

```http
POST /api/v1/enterprise/members
```

**请求参数**
```json
{
    "user_id": "string",         // 被邀请用户ID
    "role": "finance_admin"      // 角色: super_admin/finance_admin/normal/readonly
}
```

### 3.5 移除企业成员

```http
DELETE /api/v1/enterprise/members/{user_id}
```

**权限**: 仅超级管理员可操作

### 3.6 退出企业

```http
DELETE /api/v1/enterprise/leave
```

---

## 四、记账单元管理模块

### 4.1 创建记账单元

```http
POST /api/v1/accounting-units
```

**请求参数**
```json
{
    "name": "string",           // 单元名称 (如：主业务/电商项目/投资项目)
    "type": "business",         // 单元类型: business/project/department
    "note": "string"            // 备注 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "unit_id": "string",
        "name": "string",
        "type": "business",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 4.2 获取记账单元列表

```http
GET /api/v1/accounting-units
```

**查询参数**
```
?type=business           // 按类型筛选 (选填)
&status=active           // 按状态筛选 (选填)
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "units": [
            {
                "unit_id": "string",
                "name": "string",
                "type": "business",
                "status": "active",
                "month_income": 50000.00,
                "month_expense": 30000.00,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 4.3 更新记账单元

```http
PUT /api/v1/accounting-units/{unit_id}
```

**请求参数**
```json
{
    "name": "string",       // 选填
    "type": "project",      // 选填
    "note": "string"        // 选填
}
```

### 4.4 删除记账单元

```http
DELETE /api/v1/accounting-units/{unit_id}
```

---

## 五、账户管理模块

### 5.1 创建账户

```http
POST /api/v1/accounts
```

**请求参数**
```json
{
    "unit_id": "string",          // 记账单元ID (必填)
    "type": "bank",               // 账户类型: wechat/alipay/bank/cash/other
    "name": "string",             // 账户名称
    "account_no": "string",       // 账号 (选填, 银行卡卡号后四位)
    "bank_card_type": "type1",    // 银行卡类型: type1(一类卡)/type2(二类卡), 仅银行卡有效
    "balance": 100.50,            // 初始余额 (选填, 默认0)
    "icon": "string"              // 图标 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "account_id": "string",
        "unit_id": "string",
        "type": "bank",
        "name": "string",
        "account_no": "string",
        "bank_card_type": "type1",
        "bank_card_type_name": "一类卡",
        "balance": 100.50,
        "icon": "string",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 5.2 获取账户列表

```http
GET /api/v1/accounts
```

**查询参数**
```
?unit_id=xxx             // 按记账单元筛选 (选填)
&type=wechat             // 按类型筛选 (选填)
&status=active           // 按状态筛选 (选填)
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 100.50,             // 总余额
        "by_owner": [                 // 按归属人统计
            {"owner": "husband", "owner_name": "丈夫", "total": 60.00},
            {"owner": "wife", "owner_name": "妻子", "total": 40.00}
        ],
        "accounts": [
            {
                "account_id": "string",
                "type": "wechat",
                "name": "string",
                "account_no": "string",
                "owner": "husband",
                "owner_name": "丈夫",
                "bank_card_type": null,
                "bank_card_type_name": null,
                "balance": 50.00,
                "icon": "string",
                "status": "active",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 4.3 获取账户详情

```http
GET /api/v1/accounts/{account_id}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "account_id": "string",
        "type": "bank",
        "name": "string",
        "account_no": "string",
        "owner": "husband",
        "owner_name": "丈夫",
        "bank_card_type": "type1",
        "bank_card_type_name": "一类卡",
        "balance": 50.00,
        "icon": "string",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "recent_transactions": [...]  // 最近交易记录
    }
}
```

### 4.4 更新账户

```http
PUT /api/v1/accounts/{account_id}
```

**请求参数**
```json
{
    "name": "string",               // 选填
    "account_no": "string",         // 选填
    "owner": "wife",                // 选填: husband/wife/joint
    "bank_card_type": "type2",      // 选填: type1/type2 (仅银行卡)
    "balance": 100.50,              // 选填 (手动调整余额)
    "icon": "string",               // 选填
    "status": "disabled"            // 选填: active/disabled
}
```

### 4.5 删除账户

```http
DELETE /api/v1/accounts/{account_id}
```

---

## 五、账单管理模块

### 5.1 创建账单

```http
POST /api/v1/transactions
```

**请求参数**
```json
{
    "type": "expense",              // 类型: income/expense
    "category": "commission",       // 分类: salary/side_hustle/ecommerce/stock/commission/traffic_fee/sharing/advertising/food等
    "amount": 100.50,
    "account_id": "string",         // 支出/收入账户
    "occurred_at": "2024-01-01T00:00:00Z",  // 发生时间 (选填, 默认当前时间)
    "tags": ["tag1", "tag2"],       // 标签 (选填)
    "note": "string",               // 备注 (选填)
    "images": ["url1", "url2"],     // 图片URLs (选填)
    "ecommerce": {                  // 电商信息 (选填, 电商类账单)
        "supplier": "string",       // 供应商 (进货专用)
        "product_category": "string", // 商品类目 (进货专用)
        "quantity": 10,             // 数量 (进货专用)
        "unit_price": 5.00,         // 单价 (进货专用)
        "platform": "taobao",       // 交易平台
        "commission_rate": 5.5,     // 抽佣比例 % (平台抽佣专用)
        "commission_amount": 27.50, // 抽佣金额 (平台抽佣专用)
        "traffic_platform": "douyin", // 投流平台 (投流费用专用)
        "traffic_budget": 1000.00,  // 投流预算 (投流费用专用)
        "traffic_actual": 850.00,   // 实际消耗 (投流费用专用)
        "traffic_roi": 3.5,         // ROI (投流费用专用)
        "partner": "string",        // 合作方 (合作分成专用)
        "sharing_rate": 20,         // 分成比例 % (合作分成专用)
        "sharing_amount": 200.00,   // 分成金额 (合作分成专用)
        "campaign": "string"        // 推广计划 (广告费专用)
    }
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "transaction_id": "string",
        "type": "expense",
        "category": "shopping",
        "amount": 100.50,
        "account": {...},
        "occurred_at": "2024-01-01T00:00:00Z",
        "tags": ["tag1", "tag2"],
        "note": "string",
        "images": ["url1", "url2"],
        "ecommerce": {...},
        "created_by": "string",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 5.2 获取账单列表

```http
GET /api/v1/transactions
```

**查询参数**
```
?type=expense              // 按类型筛选 (选填)
&category=shopping         // 按分类筛选 (选填)
&account_id=xxx            // 按账户筛选 (选填)
&start_date=2024-01-01     // 开始日期 (选填)
&end_date=2024-12-31       // 结束日期 (选填)
&page=1                    // 页码 (默认1)
&page_size=20              // 每页数量 (默认20)
&sort_by=occurred_at       // 排序字段: occurred_at/amount/created_at (默认occurred_at)
&order=desc                // 排序方向: asc/desc (默认desc)
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 100,
        "page": 1,
        "page_size": 20,
        "transactions": [
            {
                "transaction_id": "string",
                "type": "expense",
                "category": "shopping",
                "category_name": "购物",   // 分类中文名
                "amount": 100.50,
                "account": {
                    "account_id": "string",
                    "name": "微信钱包",
                    "type": "wechat"
                },
                "occurred_at": "2024-01-01T00:00:00Z",
                "tags": ["tag1"],
                "note": "string",
                "images": ["url1"],
                "ecommerce": {...},
                "created_by": "string",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 5.3 获取账单详情

```http
GET /api/v1/transactions/{transaction_id}
```

### 5.4 更新账单

```http
PUT /api/v1/transactions/{transaction_id}
```

**请求参数**: 同创建账单

### 5.5 删除账单

```http
DELETE /api/v1/transactions/{transaction_id}
```

### 5.6 获取分类列表

```http
GET /api/v1/transactions/categories
```

**查询参数**
```
?type=expense          // 筛选收入或支出的分类
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "income": [
            {"value": "salary", "label": "工资收入"},
            {"value": "side_hustle", "label": "副业收入"},
            {"value": "ecommerce", "label": "电商收入"},
            {"value": "investment", "label": "理财收益"},
            {"value": "other", "label": "其他收入"}
        ],
        "expense": [
            {"value": "food", "label": "餐饮"},
            {"value": "shopping", "label": "购物"},
            {"value": "transport", "label": "交通"},
            {"value": "housing", "label": "居住"},
            {"value": "stock", "label": "进货成本"},
            {"value": "commission", "label": "平台抽佣"},
            {"value": "traffic_fee", "label": "投流费用"},
            {"value": "sharing", "label": "合作分成"},
            {"value": "advertising", "label": "广告费"},
            {"value": "other", "label": "其他支出"}
        ]
    }
}
```

---

## 六、预算管理模块

### 6.1 创建预算

```http
POST /api/v1/budgets
```

**请求参数**
```json
{
    "name": "string",                // 预算名称
    "type": "monthly",               // 预算类型: monthly/yearly/project
    "category": "shopping",          // 预算分类 (选填, 留空则表示总预算)
    "amount": 5000.00,               // 预算金额
    "period_start": "2024-01-01",    // 预算周期开始日期
    "period_end": "2024-12-31",      // 预算周期结束日期
    "alert_threshold": 80,           // 预警阈值百分比 (选填, 默认80)
    "note": "string"                 // 备注 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "budget_id": "string",
        "name": "string",
        "type": "monthly",
        "category": "shopping",
        "amount": 5000.00,
        "used_amount": 0.00,
        "remaining_amount": 5000.00,
        "usage_percentage": 0,
        "period_start": "2024-01-01",
        "period_end": "2024-12-31",
        "alert_threshold": 80,
        "status": "draft",           // draft: 草稿, active: 生效中, exceeded: 已超支, ended: 已结束
        "note": "string",
        "created_by": "string",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 6.2 获取预算列表

```http
GET /api/v1/budgets
```

**查询参数**
```
?status=active              // 按状态筛选
&type=monthly               // 按类型筛选
&year=2024                  // 年份筛选
&month=1                    // 月份筛选
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "summary": {
            "total_budget": 10000.00,
            "total_used": 3500.00,
            "total_remaining": 6500.00,
            "total_percentage": 35
        },
        "budgets": [
            {
                "budget_id": "string",
                "name": "string",
                "type": "monthly",
                "category": "shopping",
                "category_name": "购物",
                "amount": 5000.00,
                "used_amount": 2500.00,
                "remaining_amount": 2500.00,
                "usage_percentage": 50,
                "period_start": "2024-01-01",
                "period_end": "2024-01-31",
                "status": "active",
                "is_over_threshold": false
            }
        ]
    }
}
```

### 6.3 获取预算详情

```http
GET /api/v1/budgets/{budget_id}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "budget_id": "string",
        "name": "string",
        "type": "monthly",
        "category": "shopping",
        "amount": 5000.00,
        "used_amount": 2500.00,
        "remaining_amount": 2500.00,
        "usage_percentage": 50,
        "period_start": "2024-01-01",
        "period_end": "2024-01-31",
        "alert_threshold": 80,
        "status": "active",
        "note": "string",
        "created_by": "string",
        "created_at": "2024-01-01T00:00:00Z",
        "daily_spending": {
            "date": "2024-01-15",
            "average": 166.67
        },
        "transactions": [...]  // 该预算下的相关交易
    }
}
```

### 6.4 更新预算

```http
PUT /api/v1/budgets/{budget_id}
```

**请求参数**: 同创建预算

### 6.5 删除预算

```http
DELETE /api/v1/budgets/{budget_id}
```

### 6.6 激活预算

```http
POST /api/v1/budgets/{budget_id}/activate
```

### 6.7 停用预算

```http
POST /api/v1/budgets/{budget_id}/deactivate
```

---

## 七、预算审批模块

### 7.1 创建预算申请

```http
POST /api/v1/budget-approvals
```

**请求参数**
```json
{
    "budget_id": "string",            // 关联预算ID (选填, 新建预算时留空)
    "name": "string",                 // 预算名称
    "type": "monthly",
    "category": "shopping",
    "amount": 5000.00,
    "period_start": "2024-01-01",
    "period_end": "2024-12-31",
    "reason": "string",               // 申请原因
    "note": "string"                  // 备注
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "approval_id": "string",
        "budget_id": "string",        // 审批通过后创建的预算ID
        "applicant": {
            "user_id": "string",
            "username": "string",
            "avatar": "string"
        },
        "requested_amount": 5000.00,
        "approved_amount": null,      // 审批后才有值
        "status": "pending",          // pending: 待审批, approved: 已通过, rejected: 已拒绝
        "reason": "string",
        "note": "string",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 7.2 获取审批列表

```http
GET /api/v1/budget-approvals
```

**查询参数**
```
?status=pending           // 按状态筛选
&role=applicant           // applicant: 我申请的, approver: 待我审批
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "pending_count": 3,            // 待审批数量
        "approvals": [
            {
                "approval_id": "string",
                "budget": {
                    "name": "string",
                    "category": "shopping",
                    "category_name": "购物"
                },
                "applicant": {
                    "user_id": "string",
                    "username": "string",
                    "avatar": "string"
                },
                "requested_amount": 5000.00,
                "approved_amount": null,
                "status": "pending",
                "reason": "string",
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 7.3 审批预算申请

```http
POST /api/v1/budget-approvals/{approval_id}/approve
```

**权限**: 仅管理员可操作

**请求参数**
```json
{
    "action": "approve",               // approve: 通过, reject: 拒绝
    "amount": 4500.00,                 // 修改后的金额 (选填)
    "comment": "string"                // 审批意见 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "approval_id": "string",
        "budget_id": "string",        // 审批通过后创建的预算
        "status": "approved",
        "approved_amount": 4500.00,
        "approver": {
            "user_id": "string",
            "username": "string"
        },
        "comment": "string",
        "approved_at": "2024-01-01T00:00:00Z"
    }
}
```

### 7.4 获取审批详情

```http
GET /api/v1/budget-approvals/{approval_id}
```

---

## 八、理财管理模块

### 8.1 创建理财账户

```http
POST /api/v1/investments
```

**请求参数**
```json
{
    "name": "string",                 // 账户名称
    "product_type": "stock",          // 产品类型: stock/fund/gold/silver/bond/regular/other
    "product_code": "string",         // 产品代码 (选填, 如股票代码/基金代码)
    "principal": 10000.00,            // 本金
    "current_value": 10500.00,        // 当前市值 (选填, 默认等于本金)
    "quantity": 1000,                 // 持仓数量/份额 (选填)
    "cost_price": 10.50,              // 成本价 (选填)
    "current_price": 11.00,           // 当前价 (选填)
    "platform": "string",             // 平台 (选填, 如券商/基金公司)
    "start_date": "2024-01-01",       // 起息日 (选填, 定期专用)
    "end_date": "2024-12-31",         // 到期日 (选填, 定期专用)
    "interest_rate": 3.5,             // 利率 (选填, 定期专用, 单位%)
    "reminder_days": 3,               // 更新提醒周期 (选填, 默认按产品类型)
    "note": "string"                  // 备注 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "investment_id": "string",
        "name": "string",
        "product_type": "stock",
        "product_type_name": "股票",
        "product_code": "600519",
        "principal": 10000.00,
        "current_value": 10500.00,
        "total_profit": 500.00,
        "profit_rate": 5.00,
        "quantity": 200,
        "cost_price": 50.00,
        "current_price": 52.50,
        "platform": "华泰证券",
        "status": "active",
        "last_updated_at": "2024-01-01T00:00:00Z",
        "days_since_update": 0,
        "reminder_days": 3,
        "overdue_update": false,
        "note": "string",
        "created_at": "2024-01-01T00:00:00Z"
    }
}
```

### 8.2 获取理财账户列表

```http
GET /api/v1/investments
```

**查询参数**
```
?product_type=stock          // 按产品类型筛选
&status=active               // 按状态筛选: active/closed
&overdue_update=true         // 筛选逾期未更新的账户
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "summary": {
            "total_principal": 50000.00,
            "total_current_value": 52500.00,
            "total_profit": 2500.00,
            "total_profit_rate": 5.00,
            "overdue_update_count": 2      // 逾期未更新的账户数量
        },
        "investments": [
            {
                "investment_id": "string",
                "name": "string",
                "product_type": "stock",
                "product_type_name": "股票",
                "product_code": "600519",
                "principal": 10000.00,
                "current_value": 10500.00,
                "total_profit": 500.00,
                "profit_rate": 5.00,
                "quantity": 200,
                "current_price": 52.50,
                "platform": "华泰证券",
                "status": "active",
                "last_updated_at": "2024-01-01T00:00:00Z",
                "days_since_update": 5,
                "reminder_days": 3,
                "overdue_update": true,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 8.3 获取理财账户详情

```http
GET /api/v1/investments/{investment_id}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "investment_id": "string",
        "name": "string",
        "product_type": "fund",
        "principal": 10000.00,
        "current_value": 10500.00,
        "total_profit": 500.00,
        "profit_rate": 5.00,
        "platform": "string",
        "note": "string",
        "created_at": "2024-01-01T00:00:00Z",
        "records": [...]            // 收益记录
    }
}
```

### 8.4 更新理财账户市值

```http
PUT /api/v1/investments/{investment_id}/value
```

**请求参数**
```json
{
    "current_value": 11000.00,      // 当前市值
    "current_price": 55.00,         // 当前价 (选填)
    "note": "string"                // 备注 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "investment_id": "string",
        "current_value": 11000.00,
        "current_price": 55.00,
        "total_profit": 1000.00,
        "profit_rate": 10.00,
        "last_updated_at": "2024-01-15T10:30:00Z"
    }
}
```

### 8.5 更新理财账户信息

```http
PUT /api/v1/investments/{investment_id}
```

**请求参数**
```json
{
    "name": "string",
    "platform": "string",
    "quantity": 250,
    "reminder_days": 7,             // 修改提醒周期
    "note": "string"
}
```

### 8.6 删除理财账户

```http
DELETE /api/v1/investments/{investment_id}
```

### 8.7 记录收益

```http
POST /api/v1/investments/{investment_id}/records
```

**请求参数**
```json
{
    "type": "profit",               // 类型: buy(买入)/sell(卖出)/profit(收益)/loss(亏损)/dividend(分红)/interest(利息)
    "amount": 500.00,
    "price": 10.50,                 // 单价/净值 (选填)
    "quantity": 100,                // 数量/份额 (选填)
    "recorded_at": "2024-01-01",    // 记录日期 (选填, 默认当天)
    "note": "string"                // 备注 (选填)
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "record_id": "string",
        "investment_id": "string",
        "type": "profit",
        "amount": 500.00,
        "price": 10.50,
        "quantity": 100,
        "note": "string",
        "recorded_at": "2024-01-01T00:00:00Z"
    }
}
```

### 8.8 获取收益记录列表

```http
GET /api/v1/investments/{investment_id}/records
```

### 8.9 获取投资统计

```http
GET /api/v1/investments/statistics
```

**查询参数**
```
?investment_id=xxx            // 指定账户 (选填)
&period=month                 // 统计周期: week/month/year/all (默认all)
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "period": "month",
        "total_profit": 500.00,
        "profit_rate": 2.50,
        "daily_profit": [
            {"date": "2024-01-01", "profit": 50.00, "value": 10500.00},
            {"date": "2024-01-02", "profit": -20.00, "value": 10480.00}
        ],
        "asset_distribution": [
            {"type": "stock", "type_name": "股票", "amount": 30000.00, "percentage": 60},
            {"type": "fund", "type_name": "基金", "amount": 20000.00, "percentage": 40}
        ],
        "profit_ranking": [
            {"investment_id": "xxx", "name": "贵州茅台", "profit": 1000.00, "profit_rate": 10.00},
            {"investment_id": "yyy", "name": "易方达蓝筹", "profit": 500.00, "profit_rate": 5.00}
        ]
    }
}
```

### 8.10 获取投资专项统计

```http
GET /api/v1/statistics/investments
```

**查询参数**
```
&start_date=2024-01-01
&end_date=2024-12-31
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total_principal": 100000.00,
        "total_current_value": 108000.00,
        "total_profit": 8000.00,
        "total_profit_rate": 8.00,
        "by_type": [
            {
                "type": "stock",
                "type_name": "股票",
                "principal": 50000.00,
                "current_value": 55000.00,
                "profit": 5000.00,
                "profit_rate": 10.00,
                "percentage": 50
            },
            {
                "type": "fund",
                "type_name": "基金",
                "principal": 30000.00,
                "current_value": 31500.00,
                "profit": 1500.00,
                "profit_rate": 5.00,
                "percentage": 30
            },
            {
                "type": "gold",
                "type_name": "黄金",
                "principal": 20000.00,
                "current_value": 21500.00,
                "profit": 1500.00,
                "profit_rate": 7.50,
                "percentage": 20
            }
        ],
        "monthly_trend": [
            {
                "month": "2024-01",
                "principal": 100000.00,
                "value": 102000.00,
                "profit": 2000.00,
                "profit_rate": 2.00
            }
        ]
    }
}
```

---

## 九、统计报表模块

### 9.1 获取首页概览

```http
GET /api/v1/statistics/overview
```

**查询参数**
```
?date=2024-01-15            // 指定日期 (选填, 默认今天)
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total_assets": 50000.00,
        "month_income": 8000.00,
        "month_expense": 3500.00,
        "month_balance": 4500.00,
        "budgets": [
            {
                "budget_id": "string",
                "name": "string",
                "category": "shopping",
                "percentage": 80,
                "is_over_threshold": false
            }
        ],
        "investment": {
            "month_profit": 200.00,
            "profit_rate": 2.50
        },
        "recent_transactions": [...]
    }
}
```

### 9.2 获取收支统计

```http
GET /api/v1/statistics/transactions
```

**查询参数**
```
&start_date=2024-01-01
&end_date=2024-12-31
&group_by=month              // 分组方式: day/week/month/year
&type=all                    // 类型: income/expense/all
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total_income": 50000.00,
        "total_expense": 35000.00,
        "net_balance": 15000.00,
        "by_category": [
            {
                "category": "shopping",
                "category_name": "购物",
                "amount": 5000.00,
                "percentage": 14.29,
                "count": 25
            }
        ],
        "by_account": [
            {
                "account_id": "string",
                "account_name": "微信钱包",
                "income": 5000.00,
                "expense": 3000.00
            }
        ],
        "trend": [
            {"date": "2024-01", "income": 5000.00, "expense": 3000.00},
            {"date": "2024-02", "income": 4500.00, "expense": 3200.00}
        ]
    }
}
```

### 9.3 获取电商专项统计

```http
GET /api/v1/statistics/ecommerce
```

**查询参数**
```
&start_date=2024-01-01
&end_date=2024-12-31
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total_revenue": 50000.00,          // 总收入
        "total_cost": 30000.00,             // 总成本(进货)
        "total_advertising": 5000.00,       // 总广告费
        "gross_profit": 15000.00,           // 毛利
        "gross_profit_rate": 30.00,         // 毛利率
        "by_supplier": [                    // 按供应商统计
            {
                "supplier": "xxx供应商",
                "cost": 10000.00,
                "percentage": 33.33
            }
        ],
        "by_platform": [                    // 按广告平台统计
            {
                "platform": "taobao",
                "advertising_cost": 3000.00,
                "percentage": 60.00
            }
        ],
        "monthly_trend": [
            {
                "month": "2024-01",
                "revenue": 5000.00,
                "cost": 3000.00,
                "advertising": 500.00,
                "profit": 1500.00
            }
        ]
    }
}
```

### 9.4 获取投资专项统计

```http
GET /api/v1/statistics/investments
```

**查询参数**
```
&start_date=2024-01-01
&end_date=2024-12-31
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total_principal": 100000.00,
        "total_current_value": 108000.00,
        "total_profit": 8000.00,
        "total_profit_rate": 8.00,
        "by_type": [...],
        "monthly_trend": [...]
    }
}
```

### 9.5 导出报表

```http
GET /api/v1/statistics/export
```

**查询参数**
```
&type=excel                    // 导出格式: excel/pdf
&start_date=2024-01-01
&end_date=2024-12-31
&content=all                   // 内容: transactions/budgets/investments/all
```

**响应**: 返回文件下载流

---

## 十、通知模块

### 10.1 获取通知列表

```http
GET /api/v1/notifications
```

**查询参数**
```
?type=budget_alert            // 通知类型筛选
&is_read=false                // 已读筛选
&page=1
&page_size=20
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "unread_count": 5,
        "notifications": [
            {
                "notification_id": "string",
                "type": "investment_update_reminder",
                "title": "投资市值更新提醒",
                "content": "您的投资账户「贵州茅台」已5天未更新市值，请及时更新",
                "data": {
                    "investment_id": "string",
                    "investment_name": "贵州茅台",
                    "days_since_update": 5
                },
                "is_read": false,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "notification_id": "string",
                "type": "regular_due_reminder",
                "title": "定期存款到期提醒",
                "content": "您的定期存款「一年定期」将于7天后到期，本金10000元，预计收益350元",
                "data": {
                    "investment_id": "string",
                    "investment_name": "一年定期",
                    "end_date": "2024-12-31",
                    "principal": 10000.00,
                    "expected_profit": 350.00
                },
                "is_read": false,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### 10.2 标记通知已读

```http
PUT /api/v1/notifications/{notification_id}/read
```

### 10.3 标记所有通知已读

```http
PUT /api/v1/notifications/read-all
```

### 10.4 删除通知

```http
DELETE /api/v1/notifications/{notification_id}
```

---

## 十一、推送配置模块

### 11.1 获取推送配置

```http
GET /api/v1/push-config
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "daily_report_enabled": true,
        "daily_report_time": "20:00",
        "channels": [
            {
                "type": "email",
                "target": "family@example.com",
                "enabled": true
            },
            {
                "type": "wechat",
                "target": "wxid_xxxxx",
                "enabled": true
            }
        ]
    }
}
```

### 11.2 更新推送配置

```http
PUT /api/v1/push-config
```

**请求参数**
```json
{
    "daily_report_enabled": true,      // 是否启用每日报告
    "daily_report_time": "20:00",      // 推送时间 (HH:mm 格式)
    "channels": [
        {
            "type": "email",           // 推送类型: email/wechat
            "target": "family@example.com",  // 邮箱地址或微信号
            "enabled": true            // 是否启用
        }
    ]
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "daily_report_enabled": true,
        "daily_report_time": "20:00",
        "channels": [...]
    }
}
```

### 11.3 发送测试报告

```http
POST /api/v1/push-config/test
```

**请求参数**
```json
{
    "type": "email"               // 推送类型: email/wechat/all
}
```

**响应数据**
```json
{
    "code": 0,
    "message": "测试报告已发送",
    "data": {
        "send_time": "2024-01-15T10:30:00Z"
    }
}
```

### 11.4 获取推送记录

```http
GET /api/v1/push-logs
```

**查询参数**
```
?page=1
&page_size=20
&status=success              // 筛选状态: success/failed
```

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total": 100,
        "logs": [
            {
                "log_id": "string",
                "type": "email",
                "status": "success",
                "content": "每日资产报告 - 2024年1月15日",
                "error": null,
                "sent_at": "2024-01-15T20:00:00Z"
            },
            {
                "log_id": "string",
                "type": "wechat",
                "status": "failed",
                "content": "每日资产报告 - 2024年1月14日",
                "error": "用户未关注公众号",
                "sent_at": "2024-01-14T20:00:00Z"
            }
        ]
    }
}
```

---

## 十二、文件上传模块

### 12.1 上传图片

```http
POST /api/v1/upload/image
```

**请求**: multipart/form-data

| 参数 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 |

**响应数据**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "url": "https://xxx.com/images/xxx.jpg",
        "filename": "xxx.jpg",
        "size": 102400
    }
}
```

---

## 十三、WebSocket 实时通知

### 13.1 连接

```
wss://domain/ws?token={JWT_TOKEN}
```

### 13.2 消息格式

**服务端推送**
```json
{
    "type": "budget_approval",
    "data": {
        "approval_id": "string",
        "applicant": "string",
        "amount": 5000.00,
        "reason": "string"
    }
}
```

**消息类型**
- `budget_approval`: 新预算申请
- `budget_approved`: 预算审批结果
- `budget_alert`: 预算预警
- `budget_exceeded`: 预算超支
- `new_transaction`: 新账单记录
- `investment_update_reminder`: 投资市值更新提醒
- `regular_due_reminder`: 定期存款到期提醒

---

## 十四、数据字典

### 14.1 账户类型

| 值 | 说明 | 图标 |
|----|------|------|
| wechat | 微信钱包 | 💬 |
| alipay | 支付宝 | 💰 |
| bank | 银行卡 | 💳 |
| cash | 现金 | 💵 |
| other | 其他 | 📦 |

### 14.2 收支分类

**收入分类**
| 值 | 说明 |
|----|------|
| salary | 工资收入 |
| side_hustle | 副业收入 |
| ecommerce | 电商收入 |
| investment | 理财收益 |
| other | 其他收入 |

**支出分类**
| 值 | 说明 |
|----|------|
| food | 餐饮 |
| shopping | 购物 |
| transport | 交通 |
| housing | 居住 |
| entertainment | 娱乐 |
| medical | 医疗 |
| education | 教育 |
| stock | 进货成本 |
| commission | 平台抽佣 |
| traffic_fee | 投流费用 |
| sharing | 合作分成 |
| advertising | 广告费 |
| other | 其他支出 |

### 14.3 账户归属人

| 值 | 说明 |
|----|------|
| husband | 丈夫 |
| wife | 妻子 |
| joint | 共同 |

### 14.4 银行卡类型

| 值 | 说明 |
|----|------|
| type1 | 一类卡 (全功能账户，无限额限制) |
| type2 | 二类卡 (理财账户，有转账限额) |

### 14.5 预算类型

| 值 | 说明 |
|----|------|
| monthly | 月度预算 |
| yearly | 年度预算 |
| project | 项目预算 |

### 14.6 预算状态

| 值 | 说明 |
|----|------|
| draft | 草稿 |
| active | 生效中 |
| exceeded | 已超支 |
| ended | 已结束 |

### 14.7 审批状态

| 值 | 说明 |
|----|------|
| pending | 待审批 |
| approved | 已通过 |
| rejected | 已拒绝 |

### 14.8 理财产品类型

| 值 | 说明 | 默认提醒周期 |
|----|------|-------------|
| stock | 股票 | 3天 |
| fund | 基金 | 7天 |
| gold | 黄金 | 7天 |
| silver | 白银 | 7天 |
| bond | 债券 | 30天 |
| regular | 定期存款 | 到期前7天 |
| other | 其他 | 7天 |

### 14.9 理财记录类型

| 值 | 说明 |
|----|------|
| buy | 买入 |
| sell | 卖出 |
| profit | 收益更新 |
| loss | 亏损记录 |
| dividend | 分红 |
| interest | 利息 |

### 14.10 通知类型

| 值 | 说明 |
|----|------|
| budget_approval | 预算审批通知 |
| budget_alert | 预算预警通知 |
| budget_exceeded | 预算超支通知 |
| large_expense | 大额支出提醒 |
| investment_update_reminder | 投资市值更新提醒 |
| regular_due_reminder | 定期存款到期提醒 |
| investment_profit | 理财收益提醒 |

### 14.11 推送类型

| 值 | 说明 |
|----|------|
| email | 邮件推送 |
| wechat | 微信推送 (服务号/企业微信) |
| dingtalk | 钉钉推送 (可选扩展) |

### 14.12 推送状态

| 值 | 说明 |
|----|------|
| success | 推送成功 |
| failed | 推送失败 |
| pending | 待推送 |

### 14.13 推送频率

| 值 | 说明 |
|----|------|
| daily | 每日推送 |
| weekly | 每周推送 |
| monthly | 每月推送 |
| never | 不推送 |

---

## 十五、每日资产报告模板

### 报告生成逻辑

1. **定时任务**: 每天（或用户指定时间）自动执行
2. **数据收集**: 汇总家庭所有资产、收支、投资、预算数据
3. **异常检测**: 检查逾期未更新的投资账户
4. **内容生成**: 根据模板生成报告内容
5. **多渠道推送**: 同时推送到邮件、微信等配置的渠道

### 报告内容结构

```json
{
    "report_date": "2024-01-15",
    "family_name": "温馨小家",
    "overview": {
        "total_assets": 500000.00,
        "month_income": 15000.00,
        "month_expense": 8000.00,
        "month_balance": 7000.00
    },
    "accounts": [
        {"name": "微信钱包", "balance": 5000.00, "type": "wechat"},
        {"name": "支付宝", "balance": 10000.00, "type": "alipay"},
        {"name": "工商银行(1234)", "balance": 50000.00, "type": "bank"}
    ],
    "investments": {
        "total_principal": 400000.00,
        "total_value": 435000.00,
        "total_profit": 35000.00,
        "profit_rate": 8.75,
        "by_type": [
            {"type": "股票", "value": 250000.00, "profit": 25000.00, "rate": 11.11},
            {"type": "基金", "value": 150000.00, "profit": 8000.00, "rate": 5.63},
            {"type": "黄金", "value": 35000.00, "profit": 2000.00, "rate": 6.06}
        ]
    },
    "budgets": [
        {"name": "生活支出", "used": 4000.00, "total": 5000.00, "percentage": 80},
        {"name": "进货成本", "used": 2000.00, "total": 10000.00, "percentage": 20}
    ],
    "overdue_updates": [
        {"name": "贵州茅台", "days": 5, "type": "股票"},
        {"name": "易方达蓝筹", "days": 8, "type": "基金"}
    ]
}
```

### 邮件模板 (HTML)

```
Subject: 【每日资产报告】2024年1月15日 - 温馨小家

<div style="font-family: Arial, sans-serif;">
    <h2>📊 每日资产报告</h2>
    <p>日期：2024年1月15日</p>
    <hr>

    <h3>💰 资产概览</h3>
    <table>
        <tr><td>家庭总资产</td><td align="right"><strong>¥500,000.00</strong></td></tr>
        <tr><td>本月收入</td><td align="right" style="color:green;">+¥15,000.00</td></tr>
        <tr><td>本月支出</td><td align="right" style="color:red;">-¥8,000.00</td></tr>
        <tr><td>本月结余</td><td align="right"><strong>¥7,000.00</strong></td></tr>
    </table>

    <h3>💳 账户分布</h3>
    <table>
        <tr><td>微信钱包</td><td align="right">¥5,000.00</td></tr>
        <tr><td>支付宝</td><td align="right">¥10,000.00</td></tr>
        <tr><td>工商银行(1234)</td><td align="right">¥50,000.00</td></tr>
    </table>

    <h3>📈 投资收益</h3>
    <table>
        <tr><td>总本金</td><td align="right">¥400,000.00</td></tr>
        <tr><td>当前市值</td><td align="right">¥435,000.00</td></tr>
        <tr><td>总收益</td><td align="right" style="color:green;">+¥35,000.00</td></tr>
        <tr><td>收益率</td><td align="right"><strong>+8.75%</strong></td></tr>
    </table>

    <h3>📊 预算状态</h3>
    <table>
        <tr>
            <td>生活支出</td>
            <td>
                <div style="background:#e0e0e0;width:100px;height:16px;">
                    <div style="background:#4caf50;width:80%;height:100%;"></div>
                </div>
            </td>
            <td>80%</td>
        </tr>
        <tr>
            <td>进货成本</td>
            <td>
                <div style="background:#e0e0e0;width:100px;height:16px;">
                    <div style="background:#4caf50;width:20%;height:100%;"></div>
                </div>
            </td>
            <td>20%</td>
        </tr>
    </table>

    <h3 style="color:orange;">⚠️ 待更新项</h3>
    <ul>
        <li>贵州茅台 (股票) - 已5天未更新市值</li>
        <li>易方达蓝筹 (基金) - 已8天未更新市值</li>
    </ul>
    <p><em>请及时更新投资账户市值，以便准确掌握资产情况。</em></p>
</div>
```

### 微信推送模板

```
【每日资产报告】2024年1月15日

📊 资产概览
家庭总资产：¥500,000.00
本月收入：+¥15,000.00
本月支出：-¥8,000.00
本月结余：¥7,000.00

💰 账户分布
微信钱包：¥5,000.00
支付宝：¥10,000.00
工商银行(1234)：¥50,000.00

📈 投资收益
总本金：¥400,000.00
当前市值：¥435,000.00
总收益：+¥35,000.00 (+8.75%)

📊 预算状态
生活支出：80% (已用¥4,000/预算¥5,000)
进货成本：20% (已用¥2,000/预算¥10,000)

⚠️ 待更新项
• 贵州茅台 - 已5天未更新市值
• 易方达蓝筹 - 已8天未更新市值

点击查看详情 >>
```
