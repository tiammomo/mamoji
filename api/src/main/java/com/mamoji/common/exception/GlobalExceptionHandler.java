/**
 * 项目名称: Mamoji 记账系统
 * 文件名: GlobalExceptionHandler.java
 * 功能描述: 全局异常处理器，统一捕获和处理应用中抛出的各类异常
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
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

/**
 * 全局异常处理器
 * <p>
 * 统一捕获和处理应用中抛出的各类异常，将异常信息转换为统一的 API 响应格式。
 * 支持业务异常、参数校验异常、认证异常、权限异常等多种异常类型。
 * </p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==================== 业务异常处理 ====================

    /**
     * 处理业务异常
     *
     * @param ex 业务异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException ex) {
        log.error("业务异常: {}", ex.getMessage());
        return Result.fail(ex.getCode(), ex.getMessage());
    }

    // ==================== 参数校验异常处理 ====================

    /**
     * 处理参数校验异常（@Valid 注解校验失败）
     *
     * @param ex 参数校验异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(MethodArgumentNotValidException ex) {
        return buildValidationError(ex.getBindingResult().getFieldErrors());
    }

    /**
     * 处理绑定异常（表单参数绑定失败）
     *
     * @param ex 绑定异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException ex) {
        return buildValidationError(ex.getBindingResult().getFieldErrors());
    }

    /**
     * 处理缺少请求参数异常
     *
     * @param ex 缺少参数异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex) {
        log.warn("缺少请求参数: {}", ex.getParameterName());
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), "缺少必要参数: " + ex.getParameterName());
    }

    // ==================== 认证授权异常处理 ====================

    /**
     * 处理认证异常（登录失败、token 无效等）
     *
     * @param ex 认证异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result<Void> handleAuthenticationException(AuthenticationException ex) {
        log.warn("认证失败: {}", ex.getMessage());
        if (ex instanceof BadCredentialsException) {
            return Result.fail(ResultCode.INVALID_CREDENTIALS);
        }
        return Result.fail(ResultCode.UNAUTHORIZED);
    }

    /**
     * 处理权限不足异常（已登录但无权限访问）
     *
     * @param ex 权限异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Result<Void> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("访问被拒绝: {}", ex.getMessage());
        return Result.fail(ResultCode.FORBIDDEN);
    }

    // ==================== HTTP 协议异常处理 ====================

    /**
     * 处理不支持的请求方法异常
     *
     * @param ex HTTP 方法不支持异常
     * @return 统一响应结果
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Result<Void> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex) {
        log.warn("不支持的请求方法: {}", ex.getMethod());
        return Result.fail(ResultCode.BAD_REQUEST.getCode(), "不支持的请求方法: " + ex.getMethod());
    }

    /**
     * 处理404异常（接口不存在）
     *
     * @param ex 资源未找到异常
     * @return 统一响应结果
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNoHandlerFoundException(NoHandlerFoundException ex) {
        log.warn("接口不存在: {}", ex.getRequestURL());
        return Result.fail(ResultCode.NOT_FOUND);
    }

    // ==================== 系统异常处理 ====================

    /**
     * 处理运行时异常（未预期的程序错误）
     *
     * @param ex 运行时异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException ex) {
        log.error("运行时异常", ex);
        String message = ex.getMessage() != null ? ex.getMessage() : "系统繁忙，请稍后重试";
        return Result.fail(ResultCode.FAIL.getCode(), message);
    }

    /**
     * 处理所有未捕获的异常（兜底处理）
     *
     * @param ex 异常对象
     * @return 统一响应结果
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception ex) {
        log.error("系统异常", ex);
        return Result.fail(ResultCode.FAIL.getCode(), "系统繁忙，请稍后重试");
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 构建参数校验错误信息
     *
     * @param fieldErrors 字段错误列表
     * @return 统一的错误响应
     */
    private Result<Void> buildValidationError(java.util.List<FieldError> fieldErrors) {
        String message =
                fieldErrors.stream()
                        .map(FieldError::getDefaultMessage)
                        .collect(Collectors.joining(", "));
        log.warn("参数校验失败: {}", message);
        return Result.fail(ResultCode.VALIDATION_ERROR.getCode(), message);
    }
}
