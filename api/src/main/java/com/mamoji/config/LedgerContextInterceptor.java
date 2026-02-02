package com.mamoji.config;

import com.mamoji.common.context.LedgerContextHolder;
import com.mamoji.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 账本上下文拦截器
 * 解析请求头中的 X-Ledger-Id 并设置到上下文
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LedgerContextInterceptor implements HandlerInterceptor {

    private static final String LEDGER_ID_HEADER = "X-Ledger-Id";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            // 获取用户ID
            String authHeader = request.getHeader("Authorization");
            Long userId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                userId = jwtTokenProvider.getUserIdFromToken(authHeader.substring(7));
            }

            // 获取账本ID
            String ledgerIdStr = request.getHeader(LEDGER_ID_HEADER);
            Long ledgerId = null;
            if (ledgerIdStr != null && !ledgerIdStr.isEmpty()) {
                try {
                    ledgerId = Long.parseLong(ledgerIdStr);
                } catch (NumberFormatException e) {
                    log.warn("Invalid X-Ledger-Id header: {}", ledgerIdStr);
                }
            }

            // 设置上下文
            if (userId != null && ledgerId != null) {
                LedgerContextHolder.setContext(ledgerId, userId);
                log.debug("Set ledger context: ledgerId={}, userId={}", ledgerId, userId);
            }

        } catch (Exception e) {
            log.warn("Failed to set ledger context", e);
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // 请求完成后清除上下文
        LedgerContextHolder.clear();
    }
}
