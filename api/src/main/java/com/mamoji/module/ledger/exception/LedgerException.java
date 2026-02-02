package com.mamoji.module.ledger.exception;

import com.mamoji.common.exception.BusinessException;
import lombok.Getter;

/**
 * 账本业务异常类
 * 继承 BusinessException，用于抛出账本相关的业务异常
 */
@Getter
public class LedgerException extends BusinessException {

    /**
     * 通过错误码构造异常
     * @param errorCode 错误码枚举
     */
    public LedgerException(LedgerErrorCode errorCode) {
        super(Integer.parseInt(errorCode.getCode()), errorCode.getMessage());
    }

    /**
     * 通过错误码和消息构造异常
     * @param code 错误码
     * @param message 错误消息
     */
    public LedgerException(String code, String message) {
        super(Integer.parseInt(code), message);
    }
}
