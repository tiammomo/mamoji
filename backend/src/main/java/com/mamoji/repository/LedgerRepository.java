package com.mamoji.repository;

import com.mamoji.entity.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerRepository extends JpaRepository<Ledger, Long> {
    List<Ledger> findByOwnerIdAndStatus(Long ownerId, Integer status);
    long countByOwnerIdAndStatus(Long ownerId, Integer status);

    @Query("SELECT l FROM Ledger l WHERE l.id IN (SELECT lm.ledgerId FROM LedgerMember lm WHERE lm.userId = :userId AND lm.status = 1) AND l.status = 1")
    List<Ledger> findByMemberId(Long userId);

    Optional<Ledger> findByIdAndOwnerId(Long id, Long ownerId);

    @Query("SELECT l FROM Ledger l WHERE l.ownerId = :userId AND l.isDefault = true AND l.status = 1")
    Optional<Ledger> findDefaultLedger(Long userId);

    @Modifying
    @Query("UPDATE Ledger l SET l.isDefault = false WHERE l.ownerId = :userId")
    void clearDefaultLedger(Long userId);
}
