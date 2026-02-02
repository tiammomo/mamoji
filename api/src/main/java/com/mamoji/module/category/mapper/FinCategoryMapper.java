package com.mamoji.module.category.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.category.entity.FinCategory;

/**
 * 分类 Mapper 接口
 * 继承 BaseMapper，提供分类的基础数据库操作
 */
@Mapper
public interface FinCategoryMapper extends BaseMapper<FinCategory> {}
