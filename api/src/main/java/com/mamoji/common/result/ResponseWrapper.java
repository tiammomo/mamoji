package com.mamoji.common.result;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Data;

/**
 * Unified response wrapper using Adapter Pattern. Provides consistent API response format across
 * all endpoints.
 *
 * @param <T> The data type
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponseWrapper<T> {

    /** Response code (0 = success) */
    private int code;

    /** Response message */
    private String message;

    /** Response data */
    private T data;

    /** Pagination info (if applicable) */
    private PageInfo pagination;

    /** Timestamp */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /** Additional metadata */
    private Map<String, Object> meta;

    /** Request ID for tracing */
    private String requestId;

    // ==================== Factory Methods ====================

    public static <T> ResponseWrapper<T> success(T data) {
        return ResponseWrapper.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .data(data)
                .build();
    }

    public static <T> ResponseWrapper<T> success(T data, PageInfo pagination) {
        return ResponseWrapper.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .data(data)
                .pagination(pagination)
                .build();
    }

    public static <T> ResponseWrapper<T> success() {
        return ResponseWrapper.<T>builder()
                .code(ResultCode.SUCCESS.getCode())
                .message(ResultCode.SUCCESS.getMessage())
                .build();
    }

    public static <T> ResponseWrapper<T> error(int code, String message) {
        return ResponseWrapper.<T>builder()
                .code(code)
                .message(message)
                .build();
    }

    public static <T> ResponseWrapper<T> error(ResultCode resultCode) {
        return ResponseWrapper.<T>builder()
                .code(resultCode.getCode())
                .message(resultCode.getMessage())
                .build();
    }

    public static <T> ResponseWrapper<T> error(ResultCode resultCode, String customMessage) {
        return ResponseWrapper.<T>builder()
                .code(resultCode.getCode())
                .message(customMessage)
                .build();
    }

    // ==================== Builder Extensions ====================

    public ResponseWrapper<T> withMeta(String key, Object value) {
        if (this.meta == null) {
            this.meta = new HashMap<>();
        }
        this.meta.put(key, value);
        return this;
    }

    public ResponseWrapper<T> withRequestId(String requestId) {
        this.requestId = requestId;
        return this;
    }

    public ResponseWrapper<T> withTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
        return this;
    }

    // ==================== Utility Methods ====================

    public boolean isSuccess() {
        return code == ResultCode.SUCCESS.getCode();
    }

    public boolean isError() {
        return !isSuccess();
    }

    // ==================== Pagination Info ====================

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PageInfo {
        private long total;
        private int current;
        private int size;
        private int pages;

        public static PageInfo of(long total, int current, int size) {
            int pages = (int) Math.ceil((double) total / size);
            return PageInfo.builder()
                    .total(total)
                    .current(current)
                    .size(size)
                    .pages(pages)
                    .build();
        }
    }
}
