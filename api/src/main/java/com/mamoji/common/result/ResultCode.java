package com.mamoji.common.result;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.AllArgsConstructor;
import lombok.Getter;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** Result Code Enumeration */
@Getter
@AllArgsConstructor
public enum ResultCode {

    /** Success */
    SUCCESS(200, "操作成功"),

    /** Fail */
    FAIL(500, "操作失败"),

    /** Bad Request */
    BAD_REQUEST(400, "请求参数错误"),

    /** Unauthorized */
    UNAUTHORIZED(401, "未登录或登录已过期"),

    /** Forbidden */
    FORBIDDEN(403, "没有操作权限"),

    /** Not Found */
    NOT_FOUND(404, "资源不存在"),

    /** Validation Error */
    VALIDATION_ERROR(422, "参数验证失败"),

    /** Username already exists */
    USERNAME_EXISTS(1001, "用户名已存在"),

    /** User not found */
    USER_NOT_FOUND(1002, "用户不存在"),

    /** Invalid credentials */
    INVALID_CREDENTIALS(1003, "用户名或密码错误"),

    /** Account locked */
    ACCOUNT_LOCKED(1004, "账户已被锁定，请稍后重试"),

    /** Category not found */
    CATEGORY_NOT_FOUND(2001, "分类不存在"),

    /** Account not found */
    ACCOUNT_NOT_FOUND(3001, "账户不存在"),

    /** Transaction not found */
    TRANSACTION_NOT_FOUND(4001, "交易记录不存在"),

    /** Budget not found */
    BUDGET_NOT_FOUND(5001, "预算不存在");

    private final Integer code;
    private final String message;
}
