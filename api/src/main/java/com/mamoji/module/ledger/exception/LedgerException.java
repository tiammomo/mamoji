package com.mamoji.module.ledger.exception;

import com.mamoji.common.exception.BusinessException;
import lombok.Getter;

@Getter
public class LedgerException extends BusinessException {

    public LedgerException(LedgerErrorCode errorCode) {
        super(Integer.parseInt(errorCode.getCode()), errorCode.getMessage());
    }

    public LedgerException(String code, String message) {
        super(Integer.parseInt(code), message);
    }
}
