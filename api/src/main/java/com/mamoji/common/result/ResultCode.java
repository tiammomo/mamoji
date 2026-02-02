package com.mamoji.common.result;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 响应状态码枚举
 * 定义系统中使用的所有响应状态码及其对应的提示信息
 */
@Getter
@AllArgsConstructor
public enum ResultCode {

    /** 操作成功 */
    SUCCESS(200, "操作成功"),

    /** 操作失败 */
    FAIL(500, "操作失败"),

    /** 请求参数错误 */
    BAD_REQUEST(400, "请求参数错误"),

    /** 未登录或登录已过期 */
    UNAUTHORIZED(401, "未登录或登录已过期"),

    /** 没有操作权限 */
    FORBIDDEN(403, "没有操作权限"),

    /** 资源不存在 */
    NOT_FOUND(404, "资源不存在"),

    /** 参数验证失败 */
    VALIDATION_ERROR(422, "参数验证失败"),

    /** 用户名已存在 */
    USERNAME_EXISTS(1001, "用户名已存在"),

    /** 用户不存在 */
    USER_NOT_FOUND(1002, "用户不存在"),

    /** 用户名或密码错误 */
    INVALID_CREDENTIALS(1003, "用户名或密码错误"),

    /** 账户已被锁定，请稍后重试 */
    ACCOUNT_LOCKED(1004, "账户已被锁定，请稍后重试"),

    /** 分类不存在 */
    CATEGORY_NOT_FOUND(2001, "分类不存在"),

    /** 账户不存在 */
    ACCOUNT_NOT_FOUND(3001, "账户不存在"),

    /** 交易记录不存在 */
    TRANSACTION_NOT_FOUND(4001, "交易记录不存在"),

    /** 预算不存在 */
    BUDGET_NOT_FOUND(5001, "预算不存在");

    /** 状态码 */
    private final Integer code;

    /** 提示信息 */
    private final String message;
}
