package com.mamoji.module.account.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.account.entity.FinAccount;

/**
 * 账户 Mapper 接口
 * 继承 BaseMapper，提供账户的基础数据库操作
 */
@Mapper
public interface FinAccountMapper extends BaseMapper<FinAccount> {}
