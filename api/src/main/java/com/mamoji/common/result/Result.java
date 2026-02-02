/**
 * 项目名称: Mamoji 记账系统
 * 文件名: Result.java
 * 功能描述: 统一 API 响应结果封装类，提供标准化的 REST API 响应格式
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.common.result;

import java.io.Serial;
import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统一 API 响应结果封装类
 * 用于所有 REST API 的统一响应格式封装，包含状态码、消息、数据和成功标志
 * 遵循业界通用的 API 响应规范，便于前端统一处理
 *
 * @param <T> 响应数据的泛型类型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 响应状态码，200 表示成功，其他值表示不同类型的错误 */
    private Integer code;

    /** 响应消息，用于前端展示给用户的提示信息 */
    private String message;

    /** 响应数据，泛型类型，可以是任意 JSON 可序列化的对象 */
    private T data;

    /** 请求是否成功，true 表示成功，false 表示失败 */
    private Boolean success;

    // ==================== 成功响应工厂方法 ====================

    /**
     * 创建成功响应（带数据）
     *
     * @param data 响应数据
     * @param <T>  数据类型
     * @return 统一响应结果对象
     */
    public static <T> Result<T> success(T data) {
        return Result.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .data(data)
                .success(true)
                .build();
    }

    /**
     * 创建成功响应（无数据）
     *
     * @param <T> 泛型类型
     * @return 统一响应结果对象
     */
    public static <T> Result<T> success() {
        return Result.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .success(true)
                .build();
    }

    // ==================== 失败响应工厂方法 ====================

    /**
     * 创建失败响应（仅消息）
     *
     * @param message 错误消息
     * @param <T>     泛型类型
     * @return 统一响应结果对象
     */
    public static <T> Result<T> fail(String message) {
        return Result.<T>builder()
                .code(ResultCode.FAIL.getCode())
                .message(message)
                .success(false)
                .build();
    }

    /**
     * 创建失败响应（使用预设的错误码）
     *
     * @param resultCode 预设的错误码枚举
     * @param <T>        泛型类型
     * @return 统一响应结果对象
     */
    public static <T> Result<T> fail(ResultCode resultCode) {
        return Result.<T>builder()
                .code(resultCode.getCode())
                .message(resultCode.getMessage())
                .success(false)
                .build();
    }

    /**
     * 创建失败响应（自定义错误码和消息）
     *
     * @param code    错误码
     * @param message 错误消息
     * @param <T>     泛型类型
     * @return 统一响应结果对象
     */
    public static <T> Result<T> fail(Integer code, String message) {
        return Result.<T>builder().code(code).message(message).success(false).build();
    }
}
