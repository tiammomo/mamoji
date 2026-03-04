package com.mamoji.service;

import com.mamoji.dto.LedgerDTO;
import com.mamoji.dto.LedgerMemberDTO;
import com.mamoji.entity.Ledger;
import com.mamoji.entity.LedgerMember;
import com.mamoji.entity.User;
import com.mamoji.repository.LedgerMemberRepository;
import com.mamoji.repository.LedgerRepository;
import com.mamoji.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LedgerService {
    private final LedgerRepository ledgerRepository;
    private final LedgerMemberRepository ledgerMemberRepository;
    private final UserRepository userRepository;

    public List<LedgerDTO> getLedgers(Long userId) {
        // Get ledgers owned by user
        List<Ledger> ownedLedgers = ledgerRepository.findByOwnerIdAndStatus(userId, 1);

        // Get ledgers where user is a member
        List<Ledger> memberLedgers = ledgerRepository.findByMemberId(userId);

        // Combine and remove duplicates
        return ownedLedgers.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public LedgerDTO getLedger(Long id, Long userId) {
        Ledger ledger = ledgerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ledger not found"));

        // Check if user is owner or member
        boolean isMember = ledgerMemberRepository.existsByLedgerIdAndUserIdAndStatus(id, userId, 1);
        if (!ledger.getOwnerId().equals(userId) && !isMember) {
            throw new RuntimeException("Unauthorized");
        }

        return toDTO(ledger);
    }

    @Transactional
    public LedgerDTO createLedger(LedgerDTO dto, Long userId) {
        Ledger ledger = new Ledger();
        ledger.setName(dto.getName());
        ledger.setDescription(dto.getDescription());
        ledger.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "CNY");
        ledger.setOwnerId(userId);
        ledger.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);
        ledger.setStatus(1);

        // If this is the first ledger or isDefault is true, set as default
        if (dto.getIsDefault() != null && dto.getIsDefault()) {
            ledgerRepository.clearDefaultLedger(userId);
            ledger.setIsDefault(true);
        }

        Ledger savedLedger = ledgerRepository.save(ledger);

        // Add owner as member with owner role
        LedgerMember ownerMember = new LedgerMember();
        ownerMember.setLedgerId(savedLedger.getId());
        ownerMember.setUserId(userId);
        ownerMember.setRole("owner");
        ownerMember.setStatus(1);
        ledgerMemberRepository.save(ownerMember);

        return toDTO(savedLedger);
    }

    @Transactional
    public LedgerDTO updateLedger(Long id, LedgerDTO dto, Long userId) {
        Ledger ledger = ledgerRepository.findByIdAndOwnerId(id, userId)
                .orElseThrow(() -> new RuntimeException("Ledger not found or unauthorized"));

        if (dto.getName() != null) ledger.setName(dto.getName());
        if (dto.getDescription() != null) ledger.setDescription(dto.getDescription());
        if (dto.getIsDefault() != null && dto.getIsDefault()) {
            ledgerRepository.clearDefaultLedger(userId);
            ledger.setIsDefault(true);
        }

        return toDTO(ledgerRepository.save(ledger));
    }

    @Transactional
    public void deleteLedger(Long id, Long userId) {
        Ledger ledger = ledgerRepository.findByIdAndOwnerId(id, userId)
                .orElseThrow(() -> new RuntimeException("Ledger not found or unauthorized"));
        ledger.setStatus(0);
        ledgerRepository.save(ledger);
    }

    public List<LedgerMemberDTO> getMembers(Long ledgerId, Long userId) {
        Ledger ledger = ledgerRepository.findById(ledgerId)
                .orElseThrow(() -> new RuntimeException("Ledger not found"));

        boolean isMember = ledgerMemberRepository.existsByLedgerIdAndUserIdAndStatus(ledgerId, userId, 1);
        if (!ledger.getOwnerId().equals(userId) && !isMember) {
            throw new RuntimeException("Unauthorized");
        }

        return ledgerMemberRepository.findByLedgerIdAndStatus(ledgerId, 1)
                .stream()
                .map(this::toMemberDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LedgerMemberDTO addMember(Long ledgerId, Long memberUserId, String role, Long userId) {
        Ledger ledger = ledgerRepository.findById(ledgerId)
                .orElseThrow(() -> new RuntimeException("Ledger not found"));

        // Only owner and admin can add members
        LedgerMember requesterMember = ledgerMemberRepository.findByLedgerIdAndUserId(ledgerId, userId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this ledger"));

        if (!ledger.getOwnerId().equals(userId) && !requesterMember.getRole().equals("admin")) {
            throw new RuntimeException("Unauthorized to add members");
        }

        if (ledgerMemberRepository.existsByLedgerIdAndUserIdAndStatus(ledgerId, memberUserId, 1)) {
            throw new RuntimeException("User is already a member");
        }

        LedgerMember member = new LedgerMember();
        member.setLedgerId(ledgerId);
        member.setUserId(memberUserId);
        member.setRole(role != null ? role : "viewer");
        member.setStatus(1);

        return toMemberDTO(ledgerMemberRepository.save(member));
    }

    @Transactional
    public void removeMember(Long ledgerId, Long memberId, Long userId) {
        Ledger ledger = ledgerRepository.findById(ledgerId)
                .orElseThrow(() -> new RuntimeException("Ledger not found"));

        LedgerMember member = ledgerMemberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Only owner can remove members
        if (!ledger.getOwnerId().equals(userId)) {
            throw new RuntimeException("Only owner can remove members");
        }

        // Cannot remove owner
        if (member.getRole().equals("owner")) {
            throw new RuntimeException("Cannot remove owner");
        }

        member.setStatus(0);
        ledgerMemberRepository.save(member);
    }

    public Long getDefaultLedgerId(Long userId) {
        return ledgerRepository.findDefaultLedger(userId)
                .map(Ledger::getId)
                .orElse(null);
    }

    private LedgerDTO toDTO(Ledger ledger) {
        LedgerDTO dto = new LedgerDTO();
        dto.setId(ledger.getId());
        dto.setName(ledger.getName());
        dto.setDescription(ledger.getDescription());
        dto.setCurrency(ledger.getCurrency());
        dto.setOwnerId(ledger.getOwnerId());
        dto.setIsDefault(ledger.getIsDefault());
        dto.setStatus(ledger.getStatus());

        // Get members
        List<LedgerMemberDTO> members = ledgerMemberRepository
                .findByLedgerIdAndStatus(ledger.getId(), 1)
                .stream()
                .map(this::toMemberDTO)
                .collect(Collectors.toList());
        dto.setMembers(members);

        return dto;
    }

    private LedgerMemberDTO toMemberDTO(LedgerMember member) {
        LedgerMemberDTO dto = new LedgerMemberDTO();
        dto.setId(member.getId());
        dto.setLedgerId(member.getLedgerId());
        dto.setUserId(member.getUserId());
        dto.setRole(member.getRole());
        dto.setStatus(member.getStatus());

        // Get user info
        userRepository.findById(member.getUserId()).ifPresent(user -> {
            dto.setNickname(user.getNickname());
            dto.setEmail(user.getEmail());
        });

        return dto;
    }
}
