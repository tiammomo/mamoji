package com.mamoji.repository;

import com.mamoji.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserIdAndStatus(Long userId, Integer status);
    long countByUserIdAndStatus(Long userId, Integer status);

    List<Budget> findByLedgerIdAndStatus(Long ledgerId, Integer status);

    @Query("SELECT b FROM Budget b WHERE b.userId = :userId AND b.startDate <= :date AND b.endDate >= :date AND b.status = 1")
    List<Budget> findActiveBudgets(Long userId, LocalDate date);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT b FROM Budget b WHERE b.userId = :userId AND b.startDate <= :date AND b.endDate >= :date AND b.status = 1 AND b.categoryId IS NULL")
    Optional<Budget> findActiveBudgetWithoutCategory(Long userId, LocalDate date);
}
