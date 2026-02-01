package com.mamoji.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.ledger.entity.FinInvitation;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface FinInvitationMapper extends BaseMapper<FinInvitation> {

    @Select("SELECT * FROM fin_invitation WHERE invite_code = #{inviteCode} AND status = 1")
    Optional<FinInvitation> findByCode(@Param("inviteCode") String inviteCode);

    @Select("SELECT * FROM fin_invitation WHERE ledger_id = #{ledgerId} AND status = 1")
    List<FinInvitation> findByLedgerId(@Param("ledgerId") Long ledgerId);

    @Update("UPDATE fin_invitation SET used_count = used_count + 1 WHERE invite_id = #{inviteId}")
    void incrementUsedCount(@Param("inviteId") Long inviteId);

    @Update("UPDATE fin_invitation SET status = 0 WHERE invite_id = #{inviteId}")
    void disable(@Param("inviteId") Long inviteId);

    @Update("UPDATE fin_invitation SET status = 0 WHERE ledger_id = #{ledgerId}")
    void disableByLedgerId(@Param("ledgerId") Long ledgerId);
}
