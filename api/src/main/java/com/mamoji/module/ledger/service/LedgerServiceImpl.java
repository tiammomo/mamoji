package com.mamoji.module.ledger.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mamoji.module.auth.entity.SysUser;
import com.mamoji.module.auth.mapper.SysUserMapper;
import com.mamoji.module.ledger.dto.*;
import com.mamoji.module.ledger.entity.*;
import com.mamoji.module.ledger.exception.LedgerErrorCode;
import com.mamoji.module.ledger.exception.LedgerException;
import com.mamoji.module.ledger.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 账本服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final FinLedgerMapper ledgerMapper;
    private final FinLedgerMemberMapper memberMapper;
    private final FinInvitationMapper invitationMapper;
    private final SysUserMapper userMapper;
    private final LedgerPermissionChecker permissionChecker;

    @Value("${app.domain:http://localhost:43000}")
    private String appDomain;

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

        // 获取默认账本
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

        log.info("User {} created ledger {}", userId, ledger.getLedgerId());
        return ledger.getLedgerId();
    }

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

        log.info("User {} deleted ledger {}", userId, ledgerId);
    }

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

        log.info("User {} updated role of user {} in ledger {} to {}",
            operatorId, targetUserId, ledgerId, newRole);
    }

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
        log.info("User {} removed user {} from ledger {}", operatorId, targetUserId, ledgerId);
    }

    @Override
    @Transactional
    public void quitLedger(Long ledgerId, Long userId) {
        // 不能退出 owner
        FinLedger ledger = ledgerMapper.selectById(ledgerId);
        if (ledger != null && ledger.getOwnerId().equals(userId)) {
            throw new LedgerException(LedgerErrorCode.CANNOT_QUIT_OWNER);
        }

        memberMapper.removeMember(ledgerId, userId);
        log.info("User {} quit ledger {}", userId, ledgerId);
    }

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
        log.info("User {} revoked invitation {} in ledger {}", userId, inviteCode, ledgerId);
    }

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

        log.info("User {} joined ledger {} via invitation", userId, invitation.getLedgerId());
        return invitation.getLedgerId();
    }

    @Override
    public boolean hasAccess(Long ledgerId, Long userId) {
        return permissionChecker.hasAccess(ledgerId, userId);
    }

    @Override
    public String getUserRole(Long ledgerId, Long userId) {
        return permissionChecker.getUserRole(ledgerId, userId);
    }

    /**
     * 生成邀请码
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
