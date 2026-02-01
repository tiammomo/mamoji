package com.mamoji.module.ledger.service;

import com.mamoji.module.ledger.dto.*;
import java.util.List;

public interface LedgerService {

    // 账本 CRUD
    List<LedgerVO> getLedgers(Long userId);

    LedgerVO getLedger(Long ledgerId, Long userId);

    Long createLedger(CreateLedgerRequest request, Long userId);

    void updateLedger(Long ledgerId, CreateLedgerRequest request, Long userId);

    void deleteLedger(Long ledgerId, Long userId);

    void setDefaultLedger(Long ledgerId, Long userId);

    // 成员管理
    List<MemberVO> getMembers(Long ledgerId, Long userId);

    void updateMemberRole(Long ledgerId, Long targetUserId, String newRole, Long operatorId);

    void removeMember(Long ledgerId, Long targetUserId, Long operatorId);

    void quitLedger(Long ledgerId, Long userId);

    // 邀请管理
    InvitationVO createInvitation(Long ledgerId, CreateInvitationRequest request, Long userId);

    List<InvitationVO> getInvitations(Long ledgerId, Long userId);

    void revokeInvitation(Long ledgerId, String inviteCode, Long userId);

    Long joinByInvitation(String inviteCode, Long userId);

    // 权限校验
    boolean hasAccess(Long ledgerId, Long userId);

    String getUserRole(Long ledgerId, Long userId);
}
