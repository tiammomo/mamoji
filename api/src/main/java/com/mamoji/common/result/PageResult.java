package com.mamoji.common.result;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 分页结果封装类
 * 用于分页查询的统一响应格式，包含当前页、页大小、总记录数、总页数和数据列表
 *
 * @param <T> 数据列表元素类型
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** 当前页码，从1开始 */
    private Long current;

    /** 每页显示的记录数 */
    private Long size;

    /** 总记录数 */
    private Long total;

    /** 总页数 */
    private Long pages;

    /** 数据列表 */
    private List<T> records;

    /**
     * 创建分页结果对象
     *
     * @param current 当前页码
     * @param size 每页大小
     * @param total 总记录数
     * @param records 数据列表
     * @param <T> 元素类型
     * @return 分页结果对象
     */
    public static <T> PageResult<T> of(Long current, Long size, Long total, List<T> records) {
        Long pages = (total + size - 1) / size;
        return PageResult.<T>builder()
                .current(current)
                .size(size)
                .total(total)
                .pages(pages)
                .records(records)
                .build();
    }
}
