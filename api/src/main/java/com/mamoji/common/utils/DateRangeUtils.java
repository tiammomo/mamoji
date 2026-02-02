package com.mamoji.common.utils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 日期范围工具类
 * 封装常用的日期转换操作，消除重复的 atStartOfDay 和 atTime 代码
 */
public final class DateRangeUtils {

    /** 一天结束时间 23:59:59 */
    private static final LocalTime END_OF_DAY = LocalTime.of(23, 59, 59);

    /** 私有构造方法，防止实例化 */
    private DateRangeUtils() {}

    /**
     * 将日期转换为当天的开始时间
     *
     * @param date 日期
     * @return 当天开始时间 00:00:00，日期为 null 时返回 null
     */
    public static LocalDateTime startOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }

    /**
     * 将日期转换为当天的结束时间
     *
     * @param date 日期
     * @return 当天结束时间 23:59:59，日期为 null 时返回 null
     */
    public static LocalDateTime endOfDay(LocalDate date) {
        return date != null ? date.atTime(END_OF_DAY) : null;
    }

    /**
     * 创建默认的每日数据对象
     *
     * @return 包含收入和支出字段的 Map，初始值都为 0
     */
    public static Map<String, BigDecimal> createDefaultDayData() {
        Map<String, BigDecimal> dayData = new HashMap<>();
        dayData.put("income", BigDecimal.ZERO);
        dayData.put("expense", BigDecimal.ZERO);
        return dayData;
    }

    /**
     * 格式化日期范围字符串，用于查询日志和调试
     *
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 格式化的日期范围字符串
     */
    public static String toQueryString(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "全部时间";
        }
        if (startDate == null) {
            return "直到 " + endDate;
        }
        if (endDate == null) {
            return "从 " + startDate + " 开始";
        }
        return startDate + " 至 " + endDate;
    }
}
