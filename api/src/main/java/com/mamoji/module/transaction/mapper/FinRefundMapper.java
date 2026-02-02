package com.mamoji.module.transaction.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mamoji.module.transaction.entity.FinRefund;

/**
 * 退款记录 Mapper 接口
 * 继承 BaseMapper，提供退款记录的基础数据库操作
 */
@Mapper
public interface FinRefundMapper extends BaseMapper<FinRefund> {}
