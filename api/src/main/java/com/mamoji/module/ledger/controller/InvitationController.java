package com.mamoji.module.ledger.controller;

import com.mamoji.common.result.Result;
import com.mamoji.module.ledger.service.LedgerService;
import com.mamoji.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 邀请相关控制器
 */
@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final LedgerService ledgerService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 使用邀请码加入账本
     */
    @PostMapping("/{code}/join")
    public Result<Long> joinByInvitation(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable String code) {
        // 验证用户已登录
        if (token == null || !token.startsWith("Bearer ")) {
            return Result.fail(401, "请先登录后再加入账本");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        Long ledgerId = ledgerService.joinByInvitation(code, userId);
        return Result.success(ledgerId);
    }
}
