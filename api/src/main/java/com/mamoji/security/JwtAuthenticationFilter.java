package com.mamoji.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * JWT 认证过滤器
 * 拦截每个请求，验证 JWT Token 并设置用户认证信息
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            log.debug("JWT from request: {}", jwt != null ? "present (" + jwt.length() + " chars)" : "null");

            if (StringUtils.hasText(jwt)) {
                boolean isValid = jwtTokenProvider.validateToken(jwt);
                log.debug("Token validation result: {}", isValid);

                if (isValid) {
                    Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
                    String username = jwtTokenProvider.getUsernameFromToken(jwt);
                    log.debug("Authenticated user: {} (ID: {})", username, userId);

                    // 创建认证令牌
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    new UserPrincipal(userId, username),
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // 在安全上下文中设置认证信息
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("Security context authentication set for user: {}", username);
                }
            }
        } catch (Exception ex) {
            log.error("无法在安全上下文中设置用户认证", ex);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 从请求头中提取 JWT Token
     * @param request HTTP 请求
     * @return JWT Token 字符串
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
