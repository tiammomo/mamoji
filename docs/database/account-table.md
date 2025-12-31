# 账户表 (biz_account) 设计文档

## 表结构

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| account_id | BIGINT UNSIGNED | 是 | AUTO_INCREMENT | 账户ID，主键 |
| enterprise_id | BIGINT UNSIGNED | 是 | - | 企业ID，外键关联 biz_enterprise |
| unit_id | BIGINT UNSIGNED | 是 | - | 记账单元ID，外键关联 biz_accounting_unit |
| type | VARCHAR(20) | 是 | - | 账户类型：wechat-微信 alipay-支付宝 bank-银行卡 credit_card-信用卡 cash-现金 other-其他 |
| name | VARCHAR(50) | 是 | - | 账户名称 |
| account_no | VARCHAR(50) | 否 | NULL | 账号(银行卡后四位) |
| bank_card_type | VARCHAR(20) | 否 | NULL | 银行卡类型：type1-一类卡 type2-二类卡 |
| available_balance | DECIMAL(18,2) | 是 | 0.00 | 可支配金额 |
| invested_amount | DECIMAL(18,2) | 是 | 0.00 | 投资中金额 |
| status | TINYINT | 是 | 1 | 状态：0-停用 1-正常 |
| created_at | DATETIME | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 是 | CURRENT_TIMESTAMP | 更新时间 |

## 字段说明

### 金额计算规则

- **总金额 (Total Balance)** = 可支配金额 (Available Balance) + 投资中金额 (Invested Amount)
- `available_balance`: 可随时支配的流动资金
- `invested_amount`: 已投入理财/投资的资金

### 账户类型枚举

| 类型值 | 说明 | 典型场景 |
|--------|------|----------|
| wechat | 微信钱包 | 个人微信余额 |
| alipay | 支付宝 | 支付宝账户余额 |
| bank | 银行卡 | 储蓄卡、活期账户 |
| credit_card | 信用卡 | 信用卡欠款（通常为负数） |
| cash | 现金 | 现金库存 |
| other | 其他 | 其他资产类型 |

## 索引信息

| 索引名 | 包含字段 | 类型 | 说明 |
|--------|----------|------|------|
| PRIMARY | account_id | 主键 | 聚簇索引 |
| idx_enterprise_id | enterprise_id | 普通索引 | 按企业查询 |
| idx_unit_id | unit_id | 普通索引 | 按单元查询 |
| idx_type | type | 普通索引 | 按类型筛选 |
| idx_status | status | 普通索引 | 按状态筛选 |

## 关联关系

```
biz_accounting_unit (1) <---> (N) biz_account
  └─ 一个记账单元可以有多个账户

biz_account (1) <---> (N) biz_transaction
  └─ 一个账户可以有多笔交易记录

biz_account (1) <---> (N) biz_account_flow
  └─ 一个账户可以有多条流水记录
```

## 业务规则

1. **余额变动规则**:
   - 收入交易：增加 `available_balance`
   - 支出交易：减少 `available_balance`
   - 转账到投资：减少 `available_balance`，增加 `invested_amount`
   - 投资赎回：减少 `invested_amount`，增加 `available_balance`

2. **账户状态**:
   - 状态为0（停用）的账户不参与余额汇总计算
   - 停用账户仍可查看历史交易记录

3. **金额精度**:
   - 所有金额字段保留2位小数
   - 金额计算需考虑浮点精度问题，建议使用 Decimal 类型

## 示例数据

| account_id | name | type | available_balance | invested_amount |
|------------|------|------|-------------------|-----------------|
| 1 | 微信钱包 | wechat | 12580.50 | 0.00 |
| 2 | 支付宝 | alipay | 35880.00 | 0.00 |
| 3 | 工商银行(1234) | bank | 88888.88 | 40000.00 |
| 4 | 招商银行信用卡 | credit_card | -5200.00 | 0.00 |

## 历史变更

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1.0 | 2024-01-01 | 初始版本，使用单一 balance 字段 |
| v2.0 | 2024-12-31 | 拆分为 available_balance 和 invested_amount 两个字段 |
