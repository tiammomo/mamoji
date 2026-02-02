package com.mamoji.module.ledger.controller;

import com.mamoji.common.result.Result;
import com.mamoji.module.ledger.dto.*;
import com.mamoji.module.ledger.service.LedgerService;
import com.mamoji.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 账本管理控制器
 */
@RestController
@RequestMapping("/api/v1/ledgers")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;
    private final JwtTokenProvider jwtTokenProvider;

    private String extractToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return bearerToken;
    }

    /**
     * 获取当前用户的账本列表
     */
    @GetMapping
    public Result<List<LedgerVO>> getLedgers(
            @RequestHeader("Authorization") String bearerToken) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<LedgerVO> ledgers = ledgerService.getLedgers(userId);
        return Result.success(ledgers);
    }

    /**
     * 获取账本详情
     */
    @GetMapping("/{id}")
    public Result<LedgerVO> getLedger(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        LedgerVO ledger = ledgerService.getLedger(id, userId);
        return Result.success(ledger);
    }

    /**
     * 创建账本
     */
    @PostMapping
    public Result<Long> createLedger(
            @RequestHeader("Authorization") String bearerToken,
            @RequestBody @Valid CreateLedgerRequest request) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        Long ledgerId = ledgerService.createLedger(request, userId);
        return Result.success(ledgerId);
    }

    /**
     * 更新账本
     */
    @PutMapping("/{id}")
    public Result<Void> updateLedger(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id,
            @RequestBody @Valid CreateLedgerRequest request) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.updateLedger(id, request, userId);
        return Result.success();
    }

    /**
     * 删除账本
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteLedger(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.deleteLedger(id, userId);
        return Result.success();
    }

    /**
     * 设置默认账本
     */
    @PutMapping("/{id}/default")
    public Result<Void> setDefault(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.setDefaultLedger(id, userId);
        return Result.success();
    }

    /**
     * 获取账本成员列表
     */
    @GetMapping("/{id}/members")
    public Result<List<MemberVO>> getMembers(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<MemberVO> members = ledgerService.getMembers(id, userId);
        return Result.success(members);
    }

    /**
     * 修改成员角色
     */
    @PutMapping("/{id}/members/{targetUserId}/role")
    public Result<Void> updateMemberRole(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id,
            @PathVariable Long targetUserId,
            @RequestBody @Valid UpdateRoleRequest request) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.updateMemberRole(id, targetUserId, request.getRole(), userId);
        return Result.success();
    }

    /**
     * 移除成员
     */
    @DeleteMapping("/{id}/members/{targetUserId}")
    public Result<Void> removeMember(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id,
            @PathVariable Long targetUserId) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.removeMember(id, targetUserId, userId);
        return Result.success();
    }

    /**
     * 退出账本
     */
    @DeleteMapping("/{id}/members/me")
    public Result<Void> quitLedger(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.quitLedger(id, userId);
        return Result.success();
    }

    /**
     * 创建邀请码
     */
    @PostMapping("/{id}/invitations")
    public Result<InvitationVO> createInvitation(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id,
            @RequestBody @Valid CreateInvitationRequest request) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        InvitationVO invitation = ledgerService.createInvitation(id, request, userId);
        return Result.success(invitation);
    }

    /**
     * 获取邀请码列表
     */
    @GetMapping("/{id}/invitations")
    public Result<List<InvitationVO>> getInvitations(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<InvitationVO> invitations = ledgerService.getInvitations(id, userId);
        return Result.success(invitations);
    }

    /**
     * 撤销邀请码
     */
    @DeleteMapping("/{id}/invitations/{code}")
    public Result<Void> revokeInvitation(
            @RequestHeader("Authorization") String bearerToken,
            @PathVariable Long id,
            @PathVariable String code) {
        String token = extractToken(bearerToken);
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        ledgerService.revokeInvitation(id, code, userId);
        return Result.success();
    }
}
