package com.mamoji.common.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.mamoji.common.exception.BusinessException;
import com.mamoji.common.result.PageResult;
import com.mamoji.common.result.ResultCode;

import lombok.extern.slf4j.Slf4j;

/**
 * 抽象 CRUD 服务基类
 * 使用模板方法模式封装通用的实体操作，减少重复代码
 *
 * @param <M> Mapper 类型，继承自 BaseMapper
 * @param <E> 实体类型
 * @param <VO> 响应 VO 类型
 */
@Slf4j
public abstract class AbstractCrudService<M extends BaseMapper<E>, E, VO>
        extends ServiceImpl<M, E> {

    /**
     * 将实体转换为 VO 对象
     *
     * @param entity 实体对象
     * @return VO 对象
     */
    protected abstract VO toVO(E entity);

    /**
     * 验证实体归属权
     * 确保用户有权操作该实体
     *
     * @param userId 用户ID
     * @param entity 待验证的实体
     * @throws BusinessException 实体不属于该用户或不存在
     */
    protected abstract void validateOwnership(Long userId, E entity);

    /**
     * 根据 ID 获取实体并验证归属权
     *
     * @param userId 用户ID
     * @param id 实体ID
     * @return 实体对象
     * @throws BusinessException 记录不存在或归属权验证失败
     */
    protected E getByIdWithValidation(Long userId, Long id) {
        E entity = getById(id);
        if (entity == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "记录不存在");
        }
        validateOwnership(userId, entity);
        return entity;
    }

    /**
     * 根据用户 ID 和记录 ID 获取单条记录
     *
     * @param userId 用户ID
     * @param id 记录ID
     * @return VO 对象，记录不存在时返回 null
     */
    public VO get(Long userId, Long id) {
        E entity = getByIdWithValidation(userId, id);
        return toVO(entity);
    }

    /**
     * 分页查询
     *
     * @param page 当前页码，从1开始
     * @param size 每页大小
     * @param queryWrapper 查询条件包装器
     * @return 分页结果
     */
    protected PageResult<VO> paginate(int page, int size, LambdaQueryWrapper<E> queryWrapper) {
        IPage<E> ipage = this.page(new Page<>(page, size), queryWrapper);
        PageResult<VO> result = new PageResult<>();
        result.setCurrent(ipage.getCurrent());
        result.setSize(ipage.getSize());
        result.setTotal(ipage.getTotal());
        result.setRecords(ipage.getRecords().stream().map(this::toVO).toList());
        return result;
    }
}
