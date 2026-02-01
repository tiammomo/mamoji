package com.mamoji.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.ledger.entity.FinLedger;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface FinLedgerMapper extends BaseMapper<FinLedger> {

    @Update("UPDATE fin_ledger SET is_default = 0 WHERE owner_id = #{ownerId}")
    void clearDefaultByOwner(@Param("ownerId") Long ownerId);

    @Update("UPDATE fin_ledger SET is_default = 1 WHERE ledger_id = #{ledgerId}")
    void setDefault(@Param("ledgerId") Long ledgerId);

    @Update("UPDATE fin_ledger SET status = #{status} WHERE ledger_id = #{ledgerId}")
    void updateStatus(@Param("ledgerId") Long ledgerId, @Param("status") Integer status);
}
