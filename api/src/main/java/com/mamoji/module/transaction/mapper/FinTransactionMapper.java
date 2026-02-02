package com.mamoji.module.transaction.mapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.transaction.entity.FinTransaction;

/**
 * 交易记录 Mapper 接口
 * 定义交易记录相关的数据库操作
 */
@Mapper
public interface FinTransactionMapper extends BaseMapper<FinTransaction> {

    /**
     * 根据用户ID和类型统计金额总和
     * @param userId 用户ID
     * @param type 交易类型
     * @return 金额总和
     */
    @Select(
            "SELECT COALESCE(SUM(amount), 0) FROM fin_transaction WHERE user_id = #{userId} AND status = 1 AND UPPER(type) = UPPER(#{type})")
    BigDecimal sumAmountByUserAndType(@Param("userId") Long userId, @Param("type") String type);

    /**
     * 根据用户ID、类型和日期范围统计金额总和
     * @param userId 用户ID
     * @param type 交易类型
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @return 金额总和
     */
    @Select(
            "SELECT COALESCE(SUM(amount), 0) FROM fin_transaction WHERE user_id = #{userId} AND status = 1 AND UPPER(type) = UPPER(#{type}) AND occurred_at >= #{startDate} AND occurred_at <= #{endDate}")
    BigDecimal sumAmountByUserTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("type") String type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 统计预算时间范围内的支出总额
     * @param budgetId 预算ID
     * @param startDate 开始时间
     * @param endDate 结束时间
     * @return 支出总额
     */
    @Select(
            "SELECT COALESCE(SUM(amount), 0) FROM fin_transaction WHERE budget_id = #{budgetId} AND status = 1 AND UPPER(type) = 'EXPENSE' AND occurred_at >= #{startDate} AND occurred_at <= #{endDate}")
    BigDecimal sumExpenseByBudgetId(
            @Param("budgetId") Long budgetId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
