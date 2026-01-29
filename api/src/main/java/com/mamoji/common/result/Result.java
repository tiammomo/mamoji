package com.mamoji.common.result;

import java.io.Serial;
import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Unified API Response Result */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Response code */
    private Integer code;

    /** Response message */
    private String message;

    /** Response data */
    private T data;

    /** Whether the request was successful */
    private Boolean success;

    /** Create a successful response with data */
    public static <T> Result<T> success(T data) {
        return Result.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .data(data)
                .success(true)
                .build();
    }

    /** Create a successful response without data */
    public static <T> Result<T> success() {
        return Result.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .success(true)
                .build();
    }

    /** Create a failed response */
    public static <T> Result<T> fail(String message) {
        return Result.<T>builder()
                .code(ResultCode.FAIL.getCode())
                .message(message)
                .success(false)
                .build();
    }

    /** Create a failed response with code */
    public static <T> Result<T> fail(ResultCode resultCode) {
        return Result.<T>builder()
                .code(resultCode.getCode())
                .message(resultCode.getMessage())
                .success(false)
                .build();
    }

    /** Create a failed response with code and message */
    public static <T> Result<T> fail(Integer code, String message) {
        return Result.<T>builder().code(code).message(message).success(false).build();
    }
}
