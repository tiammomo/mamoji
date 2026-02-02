package com.mamoji.module.budget.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.budget.entity.FinBudget;

/**
 * 预算 Mapper 接口
 * 定义预算相关的数据库操作
 */
@Mapper
public interface FinBudgetMapper extends BaseMapper<FinBudget> {

    /**
     * 根据ID查询预算（忽略逻辑删除过滤）
     * 用于需要忽略状态值获取预算的场景
     * @param budgetId 预算ID
     * @return 预算实体
     */
    @Select("SELECT * FROM fin_budget WHERE budget_id = #{budgetId}")
    FinBudget selectByIdIgnoreLogicDelete(@Param("budgetId") Long budgetId);
}
