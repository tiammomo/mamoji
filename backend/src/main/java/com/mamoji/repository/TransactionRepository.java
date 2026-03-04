package com.mamoji.repository;

import com.mamoji.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByUserIdOrderByDateDesc(Long userId, Pageable pageable);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.userId = :userId AND t.type = :type AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumByUserIdAndTypeAndDateBetween(
        @Param("userId") Long userId,
        @Param("type") Integer type,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date DESC")
    List<Transaction> findByUserIdAndDateBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT t.categoryId, SUM(t.amount) FROM Transaction t WHERE t.userId = :userId AND t.type = :type AND t.date BETWEEN :startDate AND :endDate GROUP BY t.categoryId")
    List<Object[]> sumByCategoryAndType(
        @Param("userId") Long userId,
        @Param("type") Integer type,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    Page<Transaction> findByUserIdAndTypeOrderByDateDesc(Long userId, Integer type, Pageable pageable);

    Page<Transaction> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<Transaction> findByUserIdAndTypeAndDateBetweenOrderByDateDesc(Long userId, Integer type, LocalDate startDate, LocalDate endDate, Pageable pageable);
}
