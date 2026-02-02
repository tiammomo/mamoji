/**
 * 项目名称: Mamoji 记账系统
 * 文件名: LedgerServiceImpl.java
 * 功能描述: 账本服务实现类，提供账本的 CRUD、成员管理、邀请码等业务逻辑
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */
package com.mamoji.module.ledger.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.auth.mapper.SysUserMapper;
import com.mamoji.module.ledger.dto.CreateInvitationRequest;
import com.mamoji.module.ledger.dto.CreateLedgerRequest;
import com.mamoji.module.ledger.dto.InvitationVO;
import com.mamoji.module.ledger.dto.LedgerVO;
import com.mamoji.module.ledger.dto.MemberVO;
import com.mamoji.module.ledger.entity.FinInvitation;
import com.mamoji.module.ledger.entity.FinLedger;
import com.mamoji.module.ledger.entity.FinLedgerMember;
import com.mamoji.module.ledger.exception.LedgerErrorCode;
import com.mamoji.module.ledger.exception.LedgerException;
import com.mamoji.module.ledger.mapper.FinInvitationMapper;
import com.mamoji.module.ledger.mapper.FinLedgerMapper;
import com.mamoji.module.ledger.mapper.FinLedgerMemberMapper;
import com.mamoji.module.ledger.service.LedgerPermissionChecker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 账本服务实现类
 *
 * 负责处理多用户共享账本的业务逻辑：
 * - 账本管理：创建、更新、删除、设置默认
 * - 成员管理：查看成员、修改角色、移除成员、退出账本
 * - 邀请管理：创建邀请码、使用邀请码加入、撤销邀请
 *
 * 账本角色说明：
 * - owner: 账本所有者，拥有所有权限
 * - admin: 管理员，可管理成员和邀请
 * - editor: 编辑者，可编辑账本数据
 * - viewer: 查看者，仅能查看数据
 *
 * @see LedgerService 账本服务接口
 * @see LedgerPermissionChecker 权限检查器
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    /** 账本 Mapper */
    private final FinLedgerMapper ledgerMapper;

    /** 账本成员 Mapper */
    private final FinLedgerMemberMapper memberMapper;

    /** 邀请记录 Mapper */
    private final FinInvitationMapper invitationMapper;

    /** 用户 Mapper，用于获取用户信息 */
    private final SysUserMapper userMapper;

    /** 权限检查器 */
    private final LedgerPermissionChecker permissionChecker;

    /** 应用域名，用于生成邀请链接 */
    @Value("${app.domain:http://localhost:43000}")
    private String appDomain;

    // ==================== 账本查询方法 ====================

    /**
     * 获取当前用户的所有账本列表
     *
     * 返回用户所属的所有账本信息，
     * 包括账本名称、角色、成员数量等
     *
     * @param userId 当前用户ID
     * @return 账本列表
     */
    @Override
    public List<LedgerVO> getLedgers(Long userId) {
        // 获取用户所属的所有账本
        List<FinLedgerMember> memberships = memberMapper.selectList(
            new LambdaQueryWrapper<FinLedgerMember>()
                .eq(FinLedgerMember::getUserId, userId)
                .eq(FinLedgerMember::getStatus, 1)
        );

        if (memberships.isEmpty()) {
            return List.of();
        }

        List<Long> ledgerIds = memberships.stream()
            .map(FinLedgerMember::getLedgerId)
            .collect(Collectors.toList());

        List<FinLedger> ledgers = ledgerMapper.selectBatchIds(ledgerIds);

        // 获取默认账本ID
        Long defaultLedgerId = ledgers.stream()
            .filter(l -> Integer.valueOf(1).equals(l.getIsDefault()))
            .map(FinLedger::getLedgerId)
            .findFirst()
            .orElse(ledgerIds.get(0));

        // 获取所有用户信息
        Set<Long> allUserIds = new HashSet<>();
        allUserIds.add(userId);
        memberships.forEach(m -> {
            if (m.getInvitedBy() != null) {
                allUserIds.add(m.getInvitedBy());
            }
        });
        Map<Long, String> userNames = getUserNames(allUserIds);

        return ledgers.stream()
            .map(ledger -> {
                FinLedgerMember membership = memberships.stream()
                    .filter(m -> m.getLedgerId().equals(ledger.getLedgerId()))
                    .findFirst()
                    .orElse(null);

                return LedgerVO.builder()
                    .ledgerId(ledger.getLedgerId())
                    .name(ledger.getName())
                    .description(ledger.getDescription())
                    .ownerId(ledger.getOwnerId())
                    .isDefault(ledger.getIsDefault())
                    .currency(ledger.getCurrency())
                    .role(membership != null ? membership.getRole() : null)
                    .memberCount(memberMapper.countActiveMembers(ledger.getLedgerId()))
                    .createdAt(ledger.getCreatedAt())
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * 获取单个账本详情
     *
     * @param ledgerId 账本ID
     * @param userId   当前用户ID
     * @return 账本详情
     * @throws LedgerException 账本不存在或无权限
     */
    @Override
    public LedgerVO getLedger(Long ledgerId, Long userId) {
        // 校验访问权限
        permissionChecker.checkAccess(ledgerId, userId);

        FinLedger ledger = ledgerMapper.selectById(ledgerId);
        if (ledger == null || !Integer.valueOf(1).equals(ledger.getStatus())) {
            throw new LedgerException(LedgerErrorCode.LEDGER_NOT_FOUND);
        }

        String role = permissionChecker.getUserRole(ledgerId, userId);

        return LedgerVO.builder()
            .ledgerId(ledger.getLedgerId())
            .name(ledger.getName())
            .description(ledger.getDescription())
            .ownerId(ledger.getOwnerId())
            .isDefault(ledger.getIsDefault())
            .currency(ledger.getCurrency())
            .role(role)
            .memberCount(memberMapper.countActiveMembers(ledgerId))
            .createdAt(ledger.getCreatedAt())
            .build();
    }

    // ==================== 账本 CRUD 方法 ====================

    /**
     * 创建新账本
     *
     * 创建流程：
     * 1. 创建账本记录
     * 2. 创建者自动成为 owner 角色
     *
     * @param request 创建请求（账本名称、描述、货币）
     * @param userId  当前用户ID
     * @return 创建成功的账本ID
     */
    @Override
    @Transactional
    public Long createLedger(CreateLedgerRequest request, Long userId) {
        // 创建账本
        FinLedger ledger = FinLedger.builder()
            .name(request.getName())
            .description(request.getDescription())
            .ownerId(userId)
            .currency(request.getCurrency() != null ? request.getCurrency() : "CNY")
            .isDefault(0)
            .status(1)
            .build();

        ledgerMapper.insert(ledger);

        // 创建者自动成为 owner
        FinLedgerMember member = FinLedgerMember.builder()
            .ledgerId(ledger.getLedgerId())
            .userId(userId)
            .role("owner")
            .invitedBy(userId)
            .joinedAt(LocalDateTime.now())
            .status(1)
            .build();

        memberMapper.insert(member);

        log.info("用户 {} 创建账本 {}", userId, ledger.getLedgerId());
        return ledger.getLedgerId();
    }

    /**
     * 更新账本信息
     *
     * 可更新字段：名称、描述
     * 仅 owner 或 admin 可执行此操作
     *
     * @param ledgerId 账本ID
     * @param request  更新请求
     * @param userId   当前用户ID
     * @throws LedgerException 无权限或账本不存在
     */
    @Override
    @Transactional
    public void updateLedger(Long ledgerId, CreateLedgerRequest request, Long userId) {
        // 校验权限
        permissionChecker.checkPermission(ledgerId, userId, "ledger:admin");

        FinLedger ledger = ledgerMapper.selectById(ledgerId);
        if (ledger == null) {
            throw new LedgerException(LedgerErrorCode.LEDGER_NOT_FOUND);
        }

        if (request.getName() != null) {
            ledger.setName(request.getName());
        }
        if (request.getDescription() != null) {
            ledger.setDescription(request.getDescription());
        }

        ledgerMapper.updateById(ledger);
    }

    /**
     * 删除账本
     *
     * 仅 owner 可删除账本。
     * 删除规则：
     * - 仅当账本只有 owner 一个成员时可删除
     * - 使用软删除（状态改为 0）
     *
     * @param ledgerId 账本ID
     * @param userId   当前用户ID
     * @throws LedgerException 无权限或有其他成员
     */
    @Override
    @Transactional
    public void deleteLedger(Long ledgerId, Long userId) {
        // 校验权限
        permissionChecker.checkOwner(ledgerId, userId);

        // 检查是否还有其他成员
        int memberCount = memberMapper.countActiveMembers(ledgerId);
        if (memberCount > 1) {
            throw new LedgerException(LedgerErrorCode.CANNOT_DELETE_LEDGER_WITH_MEMBERS);
        }

        // 软删除账本
        ledgerMapper.updateStatus(ledgerId, 0);
        memberMapper.updateStatusByLedgerId(ledgerId);

        log.info("用户 {} 删除账本 {}", userId, ledgerId);
    }

    /**
     * 设置默认账本
     *
     * 将指定账本设为用户的默认账本
     *
     * @param ledgerId 账本ID
     * @param userId   当前用户ID
     * @throws LedgerException 无权限
     */
    @Override
    @Transactional
    public void setDefaultLedger(Long ledgerId, Long userId) {
        // 校验访问权限
        permissionChecker.checkAccess(ledgerId, userId);

        // 清除用户原有的默认账本
        List<FinLedgerMember> memberships = memberMapper.selectList(
            new LambdaQueryWrapper<FinLedgerMember>()
                .eq(FinLedgerMember::getUserId, userId)
                .eq(FinLedgerMember::getStatus, 1)
        );

        Set<Long> ledgerIds = memberships.stream()
            .map(FinLedgerMember::getLedgerId)
            .collect(Collectors.toSet());

        // 获取这些账本的所有者ID，相同者的账本才需要清除默认
        for (Long id : ledgerIds) {
            FinLedger ledger = ledgerMapper.selectById(id);
            if (ledger != null && ledger.getOwnerId().equals(userId)) {
                ledgerMapper.clearDefaultByOwner(userId);
                break;
            }
        }

        // 设置新的默认账本
        ledgerMapper.setDefault(ledgerId);
    }

    // ==================== 成员管理方法 ====================

    /**
     * 获取账本成员列表
     *
     * @param ledgerId 账本ID
     * @param userId   当前用户ID
     * @return 成员列表
     * @throws LedgerException 无权限
     */
    @Override
    public List<MemberVO> getMembers(Long ledgerId, Long userId) {
        // 校验访问权限
        permissionChecker.checkAccess(ledgerId, userId);

        List<FinLedgerMember> members = memberMapper.selectList(
            new LambdaQueryWrapper<FinLedgerMember>()
                .eq(FinLedgerMember::getLedgerId, ledgerId)
                .eq(FinLedgerMember::getStatus, 1)
                .orderByAsc(FinLedgerMember::getJoinedAt)
        );

        // 获取用户信息
        Set<Long> userIds = new HashSet<>();
        userIds.addAll(members.stream().map(FinLedgerMember::getUserId).collect(Collectors.toSet()));
        members.stream()
            .filter(m -> m.getInvitedBy() != null)
            .forEach(m -> userIds.add(m.getInvitedBy()));

        Map<Long, String> userNames = getUserNames(userIds);

        return members.stream()
            .map(m -> MemberVO.builder()
                .memberId(m.getMemberId())
                .userId(m.getUserId())
                .username(userNames.getOrDefault(m.getUserId(), "未知用户"))
                .role(m.getRole())
                .joinedAt(m.getJoinedAt())
                .invitedBy(m.getInvitedBy())
                .invitedByUsername(m.getInvitedBy() != null ? userNames.get(m.getInvitedBy()) : null)
                .build())
            .collect(Collectors.toList());
    }

    /**
     * 修改成员角色
     *
     * 仅 admin 以上权限可执行。
     * 注意：不能修改 owner 的角色
     *
     * @param ledgerId     账本ID
     * @param targetUserId 目标用户ID
     * @param newRole      新角色
     * @param operatorId   操作者ID
     * @throws LedgerException 无权限或不能修改 owner
     */
    @Override
    @Transactional
    public void updateMemberRole(Long ledgerId, Long targetUserId, String newRole, Long operatorId) {
        // 校验权限
        permissionChecker.canManageMembers(ledgerId, operatorId);

        // 不能修改 owner 的角色
        FinLedger ledger = ledgerMapper.selectById(ledgerId);
        if (ledger != null && ledger.getOwnerId().equals(targetUserId)) {
            throw new LedgerException(LedgerErrorCode.CANNOT_MODIFY_OWNER_ROLE);
        }

        // 目标用户必须存在
        if (!memberMapper.existsByLedgerAndUser(ledgerId, targetUserId)) {
            throw new LedgerException(LedgerErrorCode.NO_ACCESS);
        }

        FinLedgerMember member = memberMapper.selectOne(
            new LambdaQueryWrapper<FinLedgerMember>()
                .eq(FinLedgerMember::getLedgerId, ledgerId)
                .eq(FinLedgerMember::getUserId, targetUserId)
                .eq(FinLedgerMember::getStatus, 1)
        );

        if (member != null) {
            member.setRole(newRole);
            memberMapper.updateById(member);
        }

        log.info("用户 {} 在账本 {} 中将用户 {} 角色更新为 {}",
            operatorId, ledgerId, targetUserId, newRole);
    }

    /**
     * 移除成员
     *
     * 仅 admin 以上权限可执行。
     * 注意：不能移除 owner
     *
     * @param ledgerId     账本ID
     * @param targetUserId 要移除的用户ID
     * @param operatorId   操作者ID
     * @throws LedgerException 无权限或不能移除 owner
     */
    @Override
    @Transactional
    public void removeMember(Long ledgerId, Long targetUserId, Long operatorId) {
        // 校验权限
        permissionChecker.canManageMembers(ledgerId, operatorId);

        // 不能移除 owner
        FinLedger ledger = ledgerMapper.selectById(ledgerId);
        if (ledger != null && ledger.getOwnerId().equals(targetUserId)) {
            throw new LedgerException(LedgerErrorCode.CANNOT_REMOVE_OWNER);
        }

        memberMapper.removeMember(ledgerId, targetUserId);
        log.info("用户 {} 将用户 {} 从账本 {} 中移除", operatorId, targetUserId, ledgerId);
    }

    /**
     * 退出账本
     *
     * 普通成员可主动退出账本。
     * 注意：owner 不能退出，需要先转移所有权或删除账本
     *
     * @param ledgerId 账本ID
     * @param userId   当前用户ID
     * @throws LedgerException owner 不能退出
     */
    @Override
    @Transactional
    public void quitLedger(Long ledgerId, Long userId) {
        // 不能退出 owner
        FinLedger ledger = ledgerMapper.selectById(ledgerId);
        if (ledger != null && ledger.getOwnerId().equals(userId)) {
            throw new LedgerException(LedgerErrorCode.CANNOT_QUIT_OWNER);
        }

        memberMapper.removeMember(ledgerId, userId);
        log.info("用户 {} 退出账本 {}", userId, ledgerId);
    }

    // ==================== 邀请管理方法 ====================

    /**
     * 创建邀请码
     *
     * 生成邀请链接，支持设置角色和使用次数
     *
     * @param ledgerId 账本ID
     * @param request  邀请请求（角色、最大使用次数、过期时间）
     * @param userId   创建者ID
     * @return 邀请信息
     * @throws LedgerException 无邀请权限
     */
    @Override
    @Transactional
    public InvitationVO createInvitation(Long ledgerId, CreateInvitationRequest request, Long userId) {
        // 校验权限
        permissionChecker.canInvite(ledgerId, userId);

        // 生成邀请码
        String inviteCode = generateInviteCode();

        FinInvitation invitation = FinInvitation.builder()
            .ledgerId(ledgerId)
            .inviteCode(inviteCode)
            .role(request.getRole() != null ? request.getRole() : "editor")
            .maxUses(request.getMaxUses() != null ? request.getMaxUses() : 0)
            .usedCount(0)
            .expiresAt(request.getExpiresAt())
            .createdBy(userId)
            .status(1)
            .build();

        invitationMapper.insert(invitation);

        String inviteUrl = appDomain + "/join/" + inviteCode;

        return InvitationVO.builder()
            .inviteCode(inviteCode)
            .inviteUrl(inviteUrl)
            .role(invitation.getRole())
            .maxUses(invitation.getMaxUses())
            .usedCount(invitation.getUsedCount())
            .expiresAt(invitation.getExpiresAt())
            .createdAt(invitation.getCreatedAt())
            .build();
    }

    /**
     * 获取邀请列表
     *
     * @param ledgerId 账本ID
     * @param userId   当前用户ID
     * @return 邀请列表
     * @throws LedgerException 无权限
     */
    @Override
    public List<InvitationVO> getInvitations(Long ledgerId, Long userId) {
        // 校验权限
        permissionChecker.checkAccess(ledgerId, userId);

        List<FinInvitation> invitations = invitationMapper.findByLedgerId(ledgerId);

        String baseUrl = appDomain + "/join/";

        return invitations.stream()
            .map(inv -> InvitationVO.builder()
                .inviteCode(inv.getInviteCode())
                .inviteUrl(baseUrl + inv.getInviteCode())
                .role(inv.getRole())
                .maxUses(inv.getMaxUses())
                .usedCount(inv.getUsedCount())
                .expiresAt(inv.getExpiresAt())
                .createdAt(inv.getCreatedAt())
                .build())
            .collect(Collectors.toList());
    }

    /**
     * 撤销邀请码
     *
     * 将邀请码设为无效（软删除）
     *
     * @param ledgerId   账本ID
     * @param inviteCode 邀请码
     * @param userId     操作者ID
     * @throws LedgerException 无权限或邀请不存在
     */
    @Override
    @Transactional
    public void revokeInvitation(Long ledgerId, String inviteCode, Long userId) {
        // 校验权限
        permissionChecker.canInvite(ledgerId, userId);

        FinInvitation invitation = invitationMapper.findByCode(inviteCode)
            .orElseThrow(() -> new LedgerException(LedgerErrorCode.INVITATION_NOT_FOUND));

        if (!invitation.getLedgerId().equals(ledgerId)) {
            throw new LedgerException(LedgerErrorCode.INVITATION_NOT_FOUND);
        }

        invitationMapper.disable(invitation.getInviteId());
        log.info("用户 {} 撤销账本 {} 中的邀请 {}", userId, ledgerId, inviteCode);
    }

    /**
     * 使用邀请码加入账本
     *
     * 验证邀请码有效性后将用户添加为账本成员
     *
     * @param inviteCode 邀请码
     * @param userId     用户ID
     * @return 加入的账本ID
     * @throws LedgerException 邀请不存在/已禁用/已过期/已达上限/已是成员
     */
    @Override
    @Transactional
    public Long joinByInvitation(String inviteCode, Long userId) {
        // 查找邀请码
        FinInvitation invitation = invitationMapper.findByCode(inviteCode)
            .orElseThrow(() -> new LedgerException(LedgerErrorCode.INVITATION_NOT_FOUND));

        // 检查状态
        if (!Integer.valueOf(1).equals(invitation.getStatus())) {
            throw new LedgerException(LedgerErrorCode.INVITATION_DISABLED);
        }

        // 检查过期时间
        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new LedgerException(LedgerErrorCode.INVITATION_EXPIRED);
        }

        // 检查使用次数
        if (invitation.getMaxUses() > 0 && invitation.getUsedCount() >= invitation.getMaxUses()) {
            throw new LedgerException(LedgerErrorCode.INVITATION_MAX_USES_REACHED);
        }

        // 检查是否已是成员
        boolean alreadyMember = memberMapper.existsByLedgerAndUser(invitation.getLedgerId(), userId);
        if (alreadyMember) {
            throw new LedgerException(LedgerErrorCode.ALREADY_MEMBER);
        }

        // 检查账本状态
        FinLedger ledger = ledgerMapper.selectById(invitation.getLedgerId());
        if (ledger == null || !Integer.valueOf(1).equals(ledger.getStatus())) {
            throw new LedgerException(LedgerErrorCode.LEDGER_NOT_FOUND);
        }

        // 添加成员
        FinLedgerMember member = FinLedgerMember.builder()
            .ledgerId(invitation.getLedgerId())
            .userId(userId)
            .role(invitation.getRole())
            .invitedBy(invitation.getCreatedBy())
            .joinedAt(LocalDateTime.now())
            .status(1)
            .build();

        memberMapper.insert(member);

        // 更新邀请使用次数
        invitationMapper.incrementUsedCount(invitation.getInviteId());

        log.info("用户 {} 通过邀请加入账本 {}", userId, invitation.getLedgerId());
        return invitation.getLedgerId();
    }

    // ==================== 权限查询方法 ====================

    /**
     * 检查用户是否有账本访问权限
     *
     * @param ledgerId 账本ID
     * @param userId   用户ID
     * @return true 表示有权限
     */
    @Override
    public boolean hasAccess(Long ledgerId, Long userId) {
        return permissionChecker.hasAccess(ledgerId, userId);
    }

    /**
     * 获取用户在账本中的角色
     *
     * @param ledgerId 账本ID
     * @param userId   用户ID
     * @return 角色名称
     */
    @Override
    public String getUserRole(Long ledgerId, Long userId) {
        return permissionChecker.getUserRole(ledgerId, userId);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 生成邀请码
     *
     * 生成 8 位随机邀请码，
     * 排除易混淆的字符（0、O、I、1、L）
     *
     * @return 邀请码
     */
    private String generateInviteCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * 批量获取用户名
     *
     * @param userIds 用户ID 集合
     * @return 用户ID 到用户名的映射
     */
    private Map<Long, String> getUserNames(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<SysUser> users = userMapper.selectBatchIds(userIds);
        return users.stream()
            .collect(Collectors.toMap(SysUser::getUserId, SysUser::getUsername));
    }
}
