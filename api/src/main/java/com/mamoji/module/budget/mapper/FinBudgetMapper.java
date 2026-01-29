package com.mamoji.module.budget.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.budget.entity.FinBudget;

/** Budget Mapper Interface */
@Mapper
public interface FinBudgetMapper extends BaseMapper<FinBudget> {

    /**
     * Select budget by ID ignoring logic delete filter Used when we need to get budgets regardless
     * of status value
     */
    @Select("SELECT * FROM fin_budget WHERE budget_id = #{budgetId}")
    FinBudget selectByIdIgnoreLogicDelete(@Param("budgetId") Long budgetId);
}
