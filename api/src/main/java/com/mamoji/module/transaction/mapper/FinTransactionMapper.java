package com.mamoji.module.transaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.transaction.entity.FinTransaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction Mapper Interface
 */
@Mapper
public interface FinTransactionMapper extends BaseMapper<FinTransaction> {

    /**
     * Sum amount by conditions
     */
    @Select("SELECT COALESCE(SUM(amount), 0) FROM fin_transaction WHERE user_id = #{userId} AND status = 1 AND type = #{type}")
    BigDecimal sumAmountByUserAndType(@Param("userId") Long userId, @Param("type") String type);

    /**
     * Sum amount by conditions with date range
     */
    @Select("SELECT COALESCE(SUM(amount), 0) FROM fin_transaction WHERE user_id = #{userId} AND status = 1 AND type = #{type} AND occurred_at >= #{startDate} AND occurred_at <= #{endDate}")
    BigDecimal sumAmountByUserTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Sum expense amount for budget
     */
    @Select("SELECT COALESCE(SUM(amount), 0) FROM fin_transaction WHERE budget_id = #{budgetId} AND status = 1 AND type = 'expense' AND occurred_at >= #{startDate} AND occurred_at <= #{endDate}")
    BigDecimal sumExpenseByBudgetId(
            @Param("budgetId") Long budgetId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
