package com.mamoji.module.auth.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.auth.entity.SysUser;

/**
 * 用户 Mapper 接口
 * 继承 BaseMapper，提供用户的基础数据库操作
 */
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {}
