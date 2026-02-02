package com.mamoji.module.ledger.service;

import com.mamoji.module.ledger.dto.*;
import java.util.List;

/**
 * 账本服务接口
 * 定义账本管理、成员管理、邀请管理相关的业务操作
 */
public interface LedgerService {

    // ==================== 账本 CRUD ====================

    /**
     * 获取当前用户的所有账本列表
     * @param userId 用户ID
     * @return 账本列表
     */
    List<LedgerVO> getLedgers(Long userId);

    /**
     * 获取单个账本详情
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 账本详情
     */
    LedgerVO getLedger(Long ledgerId, Long userId);

    /**
     * 创建新账本
     * @param request 创建请求
     * @param userId 用户ID
     * @return 创建成功的账本ID
     */
    Long createLedger(CreateLedgerRequest request, Long userId);

    /**
     * 更新账本信息
     * @param ledgerId 账本ID
     * @param request 更新请求
     * @param userId 用户ID
     */
    void updateLedger(Long ledgerId, CreateLedgerRequest request, Long userId);

    /**
     * 删除账本
     * @param ledgerId 账本ID
     * @param userId 用户ID
     */
    void deleteLedger(Long ledgerId, Long userId);

    /**
     * 设置默认账本
     * @param ledgerId 账本ID
     * @param userId 用户ID
     */
    void setDefaultLedger(Long ledgerId, Long userId);

    // ==================== 成员管理 ====================

    /**
     * 获取账本成员列表
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 成员列表
     */
    List<MemberVO> getMembers(Long ledgerId, Long userId);

    /**
     * 更新成员角色
     * @param ledgerId 账本ID
     * @param targetUserId 目标用户ID
     * @param newRole 新角色
     * @param operatorId 操作人ID
     */
    void updateMemberRole(Long ledgerId, Long targetUserId, String newRole, Long operatorId);

    /**
     * 移除成员
     * @param ledgerId 账本ID
     * @param targetUserId 目标用户ID
     * @param operatorId 操作人ID
     */
    void removeMember(Long ledgerId, Long targetUserId, Long operatorId);

    /**
     * 退出账本
     * @param ledgerId 账本ID
     * @param userId 用户ID
     */
    void quitLedger(Long ledgerId, Long userId);

    // ==================== 邀请管理 ====================

    /**
     * 创建邀请码
     * @param ledgerId 账本ID
     * @param request 邀请请求
     * @param userId 用户ID
     * @return 邀请信息
     */
    InvitationVO createInvitation(Long ledgerId, CreateInvitationRequest request, Long userId);

    /**
     * 获取账本的所有邀请码
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 邀请列表
     */
    List<InvitationVO> getInvitations(Long ledgerId, Long userId);

    /**
     * 撤销邀请码
     * @param ledgerId 账本ID
     * @param inviteCode 邀请码
     * @param userId 用户ID
     */
    void revokeInvitation(Long ledgerId, String inviteCode, Long userId);

    /**
     * 通过邀请码加入账本
     * @param inviteCode 邀请码
     * @param userId 用户ID
     * @return 加入成功的账本成员记录ID
     */
    Long joinByInvitation(String inviteCode, Long userId);

    // ==================== 权限校验 ====================

    /**
     * 检查用户是否有账本访问权限
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 是否有权限
     */
    boolean hasAccess(Long ledgerId, Long userId);

    /**
     * 获取用户在账本中的角色
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 角色名称
     */
    String getUserRole(Long ledgerId, Long userId);
}
