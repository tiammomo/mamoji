package com.mamoji.repository;

import com.mamoji.entity.LedgerMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerMemberRepository extends JpaRepository<LedgerMember, Long> {
    List<LedgerMember> findByLedgerIdAndStatus(Long ledgerId, Integer status);

    Optional<LedgerMember> findByLedgerIdAndUserId(Long ledgerId, Long userId);

    boolean existsByLedgerIdAndUserIdAndStatus(Long ledgerId, Long userId, Integer status);

    List<LedgerMember> findByUserIdAndStatus(Long userId, Integer status);
}
