package com.mamoji.common.validator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.regex.Pattern;

import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.ResultCode;

/**
 * Entity validation utilities. Uses Validator Pattern for reusable validation logic.
 */
public final class EntityValidator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final int USERNAME_MIN_LENGTH = 3;
    private static final int USERNAME_MAX_LENGTH = 50;
    private static final int PASSWORD_MIN_LENGTH = 6;
    private static final int NAME_MAX_LENGTH = 100;
    private static final int NOTE_MAX_LENGTH = 500;

    private EntityValidator() {}

    public static void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "用户名不能为空");
        }
        if (username.length() < USERNAME_MIN_LENGTH || username.length() > USERNAME_MAX_LENGTH) {
            throw new BusinessException(
                    ResultCode.VALIDATION_ERROR.getCode(),
                    "用户名长度必须在" + USERNAME_MIN_LENGTH + "-" + USERNAME_MAX_LENGTH + "之间");
        }
        if (!username.matches("^[a-zA-Z0-9_]+$")) {
            throw new BusinessException(
                    ResultCode.VALIDATION_ERROR.getCode(), "用户名只能包含字母、数字和下划线");
        }
    }

    public static void validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "密码不能为空");
        }
        if (password.length() < PASSWORD_MIN_LENGTH) {
            throw new BusinessException(
                    ResultCode.VALIDATION_ERROR.getCode(),
                    "密码长度至少" + PASSWORD_MIN_LENGTH + "位");
        }
    }

    public static void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "金额不能为空");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "金额不能为负数");
        }
    }

    public static void validateDateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "日期范围不能为空");
        }
        if (end.isBefore(start)) {
            throw new BusinessException(ResultCode.VALIDATION_ERROR.getCode(), "结束日期不能早于开始日期");
        }
    }

    public static void validateName(String name, String fieldName) {
        if (name == null || name.trim().isEmpty()) {
            throw new BusinessException(
                    ResultCode.VALIDATION_ERROR.getCode(), fieldName + "不能为空");
        }
        if (name.length() > NAME_MAX_LENGTH) {
            throw new BusinessException(
                    ResultCode.VALIDATION_ERROR.getCode(),
                    fieldName + "长度不能超过" + NAME_MAX_LENGTH + "字符");
        }
    }

    public static void validateId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new BusinessException(
                    ResultCode.VALIDATION_ERROR.getCode(), "无效的" + fieldName + "ID");
        }
    }
}
