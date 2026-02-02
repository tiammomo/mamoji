package com.mamoji.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.ledger.entity.FinInvitation;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

/**
 * 邀请码 Mapper 接口
 * 定义邀请码相关的数据库操作
 */
@Mapper
public interface FinInvitationMapper extends BaseMapper<FinInvitation> {

    /**
     * 根据邀请码查询邀请信息
     * @param inviteCode 邀请码
     * @return 邀请信息
     */
    @Select("SELECT * FROM fin_invitation WHERE invite_code = #{inviteCode} AND status = 1")
    Optional<FinInvitation> findByCode(@Param("inviteCode") String inviteCode);

    /**
     * 查询账本的所有有效邀请
     * @param ledgerId 账本ID
     * @return 邀请列表
     */
    @Select("SELECT * FROM fin_invitation WHERE ledger_id = #{ledgerId} AND status = 1")
    List<FinInvitation> findByLedgerId(@Param("ledgerId") Long ledgerId);

    /**
     * 增加邀请使用次数
     * @param inviteId 邀请ID
     */
    @Update("UPDATE fin_invitation SET used_count = used_count + 1 WHERE invite_id = #{inviteId}")
    void incrementUsedCount(@Param("inviteId") Long inviteId);

    /**
     * 禁用邀请
     * @param inviteId 邀请ID
     */
    @Update("UPDATE fin_invitation SET status = 0 WHERE invite_id = #{inviteId}")
    void disable(@Param("inviteId") Long inviteId);

    /**
     * 禁用账本的所有邀请
     * @param ledgerId 账本ID
     */
    @Update("UPDATE fin_invitation SET status = 0 WHERE ledger_id = #{ledgerId}")
    void disableByLedgerId(@Param("ledgerId") Long ledgerId);
}
