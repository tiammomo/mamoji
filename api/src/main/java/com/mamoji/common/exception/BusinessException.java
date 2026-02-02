package com.mamoji.common.exception;

import com.mamoji.common.result.ResultCode;

import lombok.Getter;

/**
 * 业务异常类
 * 用于抛出业务逻辑相关的异常，包含错误码和错误信息
 */
@Getter
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 错误码 */
    private final Integer code;

    /** 错误信息 */
    private final String message;

    /**
     * 使用预设的错误码构造异常
     *
     * @param resultCode 预设的错误码枚举
     */
    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
        this.message = resultCode.getMessage();
    }

    /**
     * 使用自定义错误码和消息构造异常
     *
     * @param code 错误码
     * @param message 错误信息
     */
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
        this.message = message;
    }

    /**
     * 仅使用消息构造异常
     *
     * @param message 错误信息
     */
    public BusinessException(String message) {
        super(message);
        this.code = ResultCode.FAIL.getCode();
        this.message = message;
    }
}
