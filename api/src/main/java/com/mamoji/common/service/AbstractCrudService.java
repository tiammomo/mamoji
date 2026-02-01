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
 * Abstract CRUD service providing common operations for all entities. Uses Template Method Pattern
 * to reduce boilerplate code.
 *
 * @param <M> the mapper type extending BaseMapper
 * @param <E> the entity type
 * @param <VO> the response VO type
 */
@Slf4j
public abstract class AbstractCrudService<M extends BaseMapper<E>, E, VO>
        extends ServiceImpl<M, E> {

    /**
     * Convert entity to VO.
     *
     * @param entity the entity to convert
     * @return the VO
     */
    protected abstract VO toVO(E entity);

    /**
     * Validate that the entity belongs to the specified user.
     *
     * @param userId the user ID
     * @param entity the entity to validate
     * @throws BusinessException if entity doesn't belong to user or doesn't exist
     */
    protected abstract void validateOwnership(Long userId, E entity);

    /**
     * Get entity by ID and validate ownership.
     *
     * @param userId the user ID
     * @param id the entity ID
     * @return the entity
     * @throws BusinessException if not found or ownership invalid
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
     * Get a single record by user ID and ID.
     *
     * @param userId the user ID
     * @param id the record ID
     * @return the VO or null if not found
     */
    public VO get(Long userId, Long id) {
        E entity = getByIdWithValidation(userId, id);
        return toVO(entity);
    }

    /**
     * Paginate records with pagination.
     *
     * @param page the page number (1-based)
     * @param size the page size
     * @param queryWrapper the query wrapper
     * @return paginated result
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
