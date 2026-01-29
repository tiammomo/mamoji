package com.mamoji.module.auth.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.auth.entity.SysUser;

/** User Mapper Interface */
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {}
