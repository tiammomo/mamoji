package com.mamoji.module.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.auth.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;

/**
 * User Mapper Interface
 */
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
}
