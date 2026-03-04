package com.mamoji.repository;

import com.mamoji.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserIdAndStatus(Long userId, Integer status);

    List<Account> findByLedgerIdAndStatus(Long ledgerId, Integer status);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.userId = :userId AND a.status = 1 AND a.includeInNetWorth = true")
    BigDecimal getTotalAssets(Long userId);

    @Query("SELECT COALESCE(SUM(CASE WHEN a.type = 'debt' THEN ABS(a.balance) ELSE 0 END), 0) FROM Account a WHERE a.userId = :userId AND a.status = 1")
    BigDecimal getTotalLiabilities(Long userId);
}
