package com.mamoji.common.utils;

import org.springframework.beans.BeanUtils;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO/VO 转换工具类
 */
public final class DtoConverter {

    private DtoConverter() {
        // 私有构造函数，防止实例化
    }

    /**
     * 单个对象转换
     *
     * @param source     源对象
     * @param targetClass 目标类
     * @param <T>        源类型
     * @param <V>        目标类型
     * @return 目标类型实例
     */
    public static <T, V> V convert(T source, Class<V> targetClass) {
        if (source == null) {
            return null;
        }
        try {
            V target = targetClass.getDeclaredConstructor().newInstance();
            BeanUtils.copyProperties(source, target);
            return target;
        } catch (Exception e) {
            throw new RuntimeException("对象转换失败: " + e.getMessage(), e);
        }
    }

    /**
     * 列表转换
     *
     * @param sourceList  源列表
     * @param targetClass 目标类
     * @param <T>         源类型
     * @param <V>         目标类型
     * @return 目标类型列表
     */
    public static <T, V> List<V> convertList(List<T> sourceList, Class<V> targetClass) {
        if (sourceList == null || sourceList.isEmpty()) {
            return Collections.emptyList();
        }
        return sourceList.stream()
                .map(source -> convert(source, targetClass))
                .collect(Collectors.toList());
    }
}
