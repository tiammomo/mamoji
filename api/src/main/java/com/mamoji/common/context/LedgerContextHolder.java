package com.mamoji.common.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

/**
 * 账本上下文持有者
 * 用于在请求线程中存储当前账本信息
 */
public class LedgerContextHolder {

    private static final ThreadLocal<Context> CONTEXT = new ThreadLocal<>();

    /**
     * 设置当前账本上下文
     */
    public static void setContext(Long ledgerId, Long userId) {
        CONTEXT.set(Context.builder()
                .ledgerId(ledgerId)
                .userId(userId)
                .build());
    }

    /**
     * 获取当前账本ID
     */
    public static Long getLedgerId() {
        Context context = CONTEXT.get();
        return context != null ? context.getLedgerId() : null;
    }

    /**
     * 获取当前用户ID
     */
    public static Long getUserId() {
        Context context = CONTEXT.get();
        return context != null ? context.getUserId() : null;
    }

    /**
     * 检查是否有账本上下文
     */
    public static boolean hasContext() {
        return CONTEXT.get() != null;
    }

    /**
     * 清除上下文
     */
    public static void clear() {
        CONTEXT.remove();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Context implements Serializable {
        @Serial
        private static final long serialVersionUID = 1L;

        private Long ledgerId;
        private Long userId;
    }
}
