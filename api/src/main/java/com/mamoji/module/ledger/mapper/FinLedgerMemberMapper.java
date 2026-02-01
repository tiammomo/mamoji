package com.mamoji.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.ledger.entity.FinLedgerMember;
import org.apache.ibatis.annotations.*;

import java.util.Optional;

@Mapper
public interface FinLedgerMemberMapper extends BaseMapper<FinLedgerMember> {

    @Select("SELECT COUNT(*) FROM fin_ledger_member WHERE ledger_id = #{ledgerId} AND status = 1")
    int countActiveMembers(@Param("ledgerId") Long ledgerId);

    @Select("SELECT EXISTS(SELECT 1 FROM fin_ledger_member WHERE ledger_id = #{ledgerId} AND user_id = #{userId} AND status = 1)")
    boolean existsByLedgerAndUser(@Param("ledgerId") Long ledgerId, @Param("userId") Long userId);

    @Select("SELECT role FROM fin_ledger_member WHERE ledger_id = #{ledgerId} AND user_id = #{userId} AND status = 1")
    Optional<String> findRoleByLedgerAndUser(@Param("ledgerId") Long ledgerId, @Param("userId") Long userId);

    @Update("UPDATE fin_ledger_member SET status = 0 WHERE ledger_id = #{ledgerId}")
    void updateStatusByLedgerId(@Param("ledgerId") Long ledgerId);

    @Update("UPDATE fin_ledger_member SET status = 0 WHERE ledger_id = #{ledgerId} AND user_id = #{userId}")
    void removeMember(@Param("ledgerId") Long ledgerId, @Param("userId") Long userId);
}
