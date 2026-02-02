package com.mamoji.module.ledger.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.ledger.entity.FinLedgerMember;
import org.apache.ibatis.annotations.*;

import java.util.Optional;

/**
 * 账本成员 Mapper 接口
 * 定义账本成员相关的数据库操作
 */
@Mapper
public interface FinLedgerMemberMapper extends BaseMapper<FinLedgerMember> {

    /**
     * 统计账本的活跃成员数量
     * @param ledgerId 账本ID
     * @return 成员数量
     */
    @Select("SELECT COUNT(*) FROM fin_ledger_member WHERE ledger_id = #{ledgerId} AND status = 1")
    int countActiveMembers(@Param("ledgerId") Long ledgerId);

    /**
     * 检查用户是否在账本中
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 是否存在
     */
    @Select("SELECT EXISTS(SELECT 1 FROM fin_ledger_member WHERE ledger_id = #{ledgerId} AND user_id = #{userId} AND status = 1)")
    boolean existsByLedgerAndUser(@Param("ledgerId") Long ledgerId, @Param("userId") Long userId);

    /**
     * 查询用户在账本中的角色
     * @param ledgerId 账本ID
     * @param userId 用户ID
     * @return 角色名称
     */
    @Select("SELECT role FROM fin_ledger_member WHERE ledger_id = #{ledgerId} AND user_id = #{userId} AND status = 1")
    Optional<String> findRoleByLedgerAndUser(@Param("ledgerId") Long ledgerId, @Param("userId") Long userId);

    /**
     * 更新账本所有成员状态
     * @param ledgerId 账本ID
     */
    @Update("UPDATE fin_ledger_member SET status = 0 WHERE ledger_id = #{ledgerId}")
    void updateStatusByLedgerId(@Param("ledgerId") Long ledgerId);

    /**
     * 移除账本中的指定成员
     * @param ledgerId 账本ID
     * @param userId 用户ID
     */
    @Update("UPDATE fin_ledger_member SET status = 0 WHERE ledger_id = #{ledgerId} AND user_id = #{userId}")
    void removeMember(@Param("ledgerId") Long ledgerId, @Param("userId") Long userId);
}
