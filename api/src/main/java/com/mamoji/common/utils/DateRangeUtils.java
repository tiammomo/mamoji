package com.mamoji.common.utils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Date range utility class for common date operations. Eliminates duplicate `.atStartOfDay()` and
 * `.atTime(23, 59, 59)` patterns.
 */
public final class DateRangeUtils {

    private static final LocalTime END_OF_DAY = LocalTime.of(23, 59, 59);

    private DateRangeUtils() {
        // Utility class, no instantiation
    }

    /**
     * Convert LocalDate to start of day LocalDateTime.
     *
     * @param date the date
     * @return start of day (00:00:00)
     */
    public static LocalDateTime startOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }

    /**
     * Convert LocalDate to end of day LocalDateTime.
     *
     * @param date the date
     * @return end of day (23:59:59)
     */
    public static LocalDateTime endOfDay(LocalDate date) {
        return date != null ? date.atTime(END_OF_DAY) : null;
    }

    /**
     * Create a map with default day data (income and expense as zero).
     *
     * @return map with "income" and "expense" keys set to BigDecimal.ZERO
     */
    public static Map<String, BigDecimal> createDefaultDayData() {
        Map<String, BigDecimal> dayData = new HashMap<>();
        dayData.put("income", BigDecimal.ZERO);
        dayData.put("expense", BigDecimal.ZERO);
        return dayData;
    }

    /**
     * Create a date range filter string for query logging/debugging.
     *
     * @param startDate start date
     * @param endDate end date
     * @return formatted string
     */
    public static String toQueryString(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "all time";
        }
        if (startDate == null) {
            return "until " + endDate;
        }
        if (endDate == null) {
            return "from " + startDate;
        }
        return startDate + " to " + endDate;
    }
}
