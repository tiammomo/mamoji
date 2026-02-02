package com.mamoji.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.ledger.entity.FinLedger;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

/**
 * 账本 Mapper 接口
 * 定义账本相关的数据库操作
 */
@Mapper
public interface FinLedgerMapper extends BaseMapper<FinLedger> {

    /**
     * 清除用户的所有默认账本标记
     * @param ownerId 所有者ID
     */
    @Update("UPDATE fin_ledger SET is_default = 0 WHERE owner_id = #{ownerId}")
    void clearDefaultByOwner(@Param("ownerId") Long ownerId);

    /**
     * 设置账本为默认账本
     * @param ledgerId 账本ID
     */
    @Update("UPDATE fin_ledger SET is_default = 1 WHERE ledger_id = #{ledgerId}")
    void setDefault(@Param("ledgerId") Long ledgerId);

    /**
     * 更新账本状态
     * @param ledgerId 账本ID
     * @param status 新状态
     */
    @Update("UPDATE fin_ledger SET status = #{status} WHERE ledger_id = #{ledgerId}")
    void updateStatus(@Param("ledgerId") Long ledgerId, @Param("status") Integer status);
}
