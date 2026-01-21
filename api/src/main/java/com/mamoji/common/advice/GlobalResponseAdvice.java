package com.mamoji.common.advice;

import com.mamoji.common.result.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Global Response Advice - Wraps all controller return values in Result
 */
@Slf4j
@ControllerAdvice
public class GlobalResponseAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        // Apply to all responses
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {

        // If already Result, return as-is
        if (body instanceof Result) {
            return body;
        }

        // Skip for void methods
        if (returnType.getParameterType().equals(Void.TYPE)) {
            return Result.success();
        }

        // Wrap other return values in Result
        log.debug("Wrapping response: {} -> Result", body.getClass().getSimpleName());
        return Result.success(body);
    }
}
