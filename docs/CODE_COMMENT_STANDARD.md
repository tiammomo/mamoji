# Mamoji 代码注释规范

## 1. 文件头部注释

所有 `.java` 和 `.ts/.tsx` 文件必须在文件顶部包含以下格式的注释：

```java
/**
 * 项目名称: Mamoji 记账系统
 * 文件名: Result.java
 * 功能描述: 统一 API 响应结果封装类
 *
 * 创建日期: 2024-01-01
 * 作者: Your Name
 * 版本: 1.0.0
 */
```

```typescript
/**
 * 项目名称: Mamoji 记账系统
 * 文件名: api.ts
 * 功能描述: API 请求封装和拦截器
 *
 * 创建日期: 2024-01-01
 * 作者: Your Name
 * 版本: 1.0.0
 */
```

## 2. 类/接口注释

```java
/**
 * 统一 API 响应结果封装类
 * <p>
 * 用于所有 REST API 的统一响应格式封装，包含状态码、消息、数据和成功标志。
 * </p>
 */
public class Result<T> {
    // ...
}
```

```typescript
/**
 * 账本状态管理
 * <p>
 * 使用 Zustand 管理当前选中的账本信息，包括账本列表切换、成员管理等功能。
 * </p>
 */
interface LedgerState {
    // ...
}
```

## 3. 方法注释

```java
/**
 * 创建成功响应（带数据）
 *
 * @param data 响应数据
 * @param <T>  数据类型
 * @return 统一响应结果对象
 */
public static <T> Result<T> success(T data) {
    // ...
}
```

```typescript
/**
 * 切换当前账本
 * <p>
 * 当用户切换账本时，更新全局状态并重新获取对应账本的数据。
 * 同时会清除之前账本的缓存数据。
 * </p>
 *
 * @param ledgerId 要切换到的账本 ID
 * @returns Promise<void>
 */
async switchLedger(ledgerId: number): Promise<void> {
    // ...
}
```

## 4. 字段注释

```java
/** 响应状态码，200 表示成功 */
private Integer code;

/** 响应消息，用于前端展示 */
private String message;

/** 响应数据，泛型类型 */
private T data;
```

```typescript
/** 当前选中的账本 ID，为 null 时表示未选择 */
currentLedgerId: number | null;

/** 账本列表，用于侧边栏选择 */
ledgers: Ledger[];
```

## 5. 枚举/常量注释

```java
/**
 * 账本成员角色枚举
 */
public enum LedgerRole {
    /** 所有者，拥有全部权限 */
    OWNER("owner", "所有者"),

    /** 管理员，拥有大部分权限 */
    ADMIN("admin", "管理员"),

    /** 编辑者，可以编辑账本数据 */
    EDITOR("editor", "编辑者"),

    /** 查看者，只能查看数据 */
    VIEWER("viewer", "查看者");

    // ...
}
```

## 6. 行内注释

复杂逻辑需要在代码行尾添加注释说明：

```java
// 使用 ThreadLocal 存储当前请求的账本上下文
LedgerContextHolder.setContext(ledgerId, userId);

try {
    // 执行业务逻辑
    processTransaction(transaction);
} finally {
    // 清理 ThreadLocal 上下文，防止内存泄漏
    LedgerContextHolder.clear();
}
```

## 7. TODO 注释

```java
// TODO: 待实现 - 批量导入功能 (计划版本: 1.2.0)
// TODO: 优化 - 性能调优，当数据量 > 10000 时启用缓存
```

## 8. 注释语言规范

| 类型 | 语言要求 |
|------|----------|
| 类/接口注释 | 中文（功能描述）+ 英文（特殊术语） |
| 方法注释 | 中文（描述）+ 英文（JSDoc 标签） |
| 字段注释 | 中文（含义说明） |
| 行内注释 | 中文（业务逻辑）或 英文（技术说明） |
| TODO 注释 | 中文（待办说明） |

## 9. 特殊标记

| 标记 | 含义 |
|------|------|
| `TODO:` | 待实现功能 |
| `FIXME:` | 已知缺陷，需要修复 |
| `NOTE:` | 重要说明/注意事项 |
| `XXX:` | 警告/危险代码 |

## 10. 不需要注释的情况

- 明显的 Getter/Setter 方法
- 简单的数据封装类（字段名自解释）
- 继承或实现的标准接口方法
- 一目了然的表达式

## 示例完整文件

```java
/**
 * 项目名称: Mamoji 记账系统
 * 文件名: TransactionService.java
 * 功能描述: 交易记录服务层，提供交易的增删改查等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: Your Name
 * 版本: 1.0.0
 */
package com.mamoji.module.transaction.service;

import java.util.List;

/**
 * 交易记录服务接口
 * <p>
 * 定义交易记录的核心业务操作，包括单笔交易管理、批量操作、统计分析等功能。
 * </p>
 */
public interface TransactionService {

    /**
     * 创建交易记录
     *
     * @param transactionDTO 交易请求数据
     * @param userId         当前用户ID
     * @return 创建成功的交易记录ID
     */
    Long createTransaction(TransactionDTO transactionDTO, Long userId);

    /**
     * 查询交易记录列表
     *
     * @param queryDTO 查询条件
     * @param userId   当前用户ID
     * @return 交易记录列表
     */
    List<TransactionVO> getTransactions(TransactionQueryDTO queryDTO, Long userId);
}
```
