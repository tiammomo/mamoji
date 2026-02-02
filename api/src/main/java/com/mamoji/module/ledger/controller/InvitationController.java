package com.mamoji.module.ledger.controller;

import com.mamoji.common.result.Result;
import com.mamoji.module.ledger.service.LedgerService;
import com.mamoji.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 邀请控制器
 * 提供通过邀请码加入账本的相关接口
 */
@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final LedgerService ledgerService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 使用邀请码加入账本
     * @param bearerToken 授权令牌
     * @param code 邀请码
     * @return 加入成功的账本ID
     */
    @PostMapping("/{code}/join")
    public Result<Long> joinByInvitation(
            @RequestHeader(value = "Authorization", required = false) String bearerToken,
            @PathVariable String code) {
        // 验证用户已登录
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            return Result.fail(401, "请先登录后再加入账本");
        }

        String token = bearerToken.substring(7);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        Long ledgerId = ledgerService.joinByInvitation(code, userId);
        return Result.success(ledgerId);
    }
}
