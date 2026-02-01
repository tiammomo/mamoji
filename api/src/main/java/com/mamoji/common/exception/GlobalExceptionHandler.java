package com.mamoji.common.exception;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.mamoji.common.result.Result;
import com.mamoji.common.result.ResultCode;

import lombok.extern.slf4j.Slf4j;
import lombok.extern.slf4j.Slf4j;

import lombok.extern.slf4j.Slf4j;

/** Global Exception Handler */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException ex) {
        log.error("Business exception: {}", ex.getMessage());
        return Result.fail(ex.getCode(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException ex) {
        return buildValidationError(ex.getBindingResult().getFieldErrors());
    }

    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException ex) {
        return buildValidationError(ex.getBindingResult().getFieldErrors());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex) {
        log.warn("Missing parameter: {}", ex.getParameterName());
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), "缺少必要参数: " + ex.getParameterName());
    }

    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result<Void> handleAuthenticationException(AuthenticationException ex) {
        log.warn("Authentication error: {}", ex.getMessage());
        if (ex instanceof BadCredentialsException) {
            return Result.fail(ResultCode.INVALID_CREDENTIALS);
        }
        return Result.fail(ResultCode.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Result<Void> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return Result.fail(ResultCode.FORBIDDEN);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Result<Void> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex) {
        log.warn("Method not supported: {}", ex.getMethod());
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), "不支持的请求方法: " + ex.getMethod());
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNoHandlerFoundException(NoHandlerFoundException ex) {
        log.warn("Handler not found: {}", ex.getRequestURL());
        return Result.fail(ResultCode.NOT_FOUND);
    }

    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime exception", ex);
        String message = ex.getMessage() != null ? ex.getMessage() : "系统繁忙，请稍后重试";
        return Result.fail(ResultCode.FAIL.getCode(), message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception ex) {
        log.error("Unexpected error", ex);
        return Result.fail(ResultCode.FAIL.getCode(), "系统繁忙，请稍后重试");
    }

    private Result<Void> buildValidationError(java.util.List<FieldError> fieldErrors) {
        String message =
                fieldErrors.stream()
                        .map(FieldError::getDefaultMessage)
                        .collect(Collectors.joining(", "));
        log.warn("Validation error: {}", message);
        return Result.fail(ResultCode.VALIDATION_ERROR.getCode(), message);
    }
}
