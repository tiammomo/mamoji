package com.mamoji.common.factory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Generic builder utilities using Builder Pattern.
 */
public final class ObjectBuilder {

    private ObjectBuilder() {}

    /**
     * Create a list with initial elements.
     */
    @SafeVarargs
    public static <T> List<T> listOf(T... elements) {
        List<T> list = new ArrayList<>();
        for (T element : elements) {
            if (element != null) {
                list.add(element);
            }
        }
        return list;
    }

    /**
     * Create a non-null list, returning empty list if null.
     */
    public static <T> List<T> safeList(List<T> list) {
        return list != null ? list : new ArrayList<>();
    }

    // ==================== Numeric Builders ====================

    public static BigDecimalBuilder bigDecimal(Supplier<BigDecimal> supplier) {
        return new BigDecimalBuilder(supplier);
    }

    public static class BigDecimalBuilder {
        private final Supplier<BigDecimal> supplier;
        private BigDecimal value;
        private boolean hasValue = false;

        BigDecimalBuilder(Supplier<BigDecimal> supplier) {
            this.supplier = supplier;
        }

        public BigDecimalBuilder ifPositive(Consumer<BigDecimal> consumer) {
            this.value = supplier.get();
            if (value != null && value.compareTo(BigDecimal.ZERO) > 0) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public BigDecimalBuilder ifNotZero(Consumer<BigDecimal> consumer) {
            this.value = supplier.get();
            if (value != null && value.compareTo(BigDecimal.ZERO) != 0) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public BigDecimal orZero() {
            return hasValue && value != null ? value : BigDecimal.ZERO;
        }

        public BigDecimal orDefault(BigDecimal defaultValue) {
            return hasValue && value != null ? value : defaultValue;
        }
    }

    // ==================== Date Builders ====================

    public static DateBuilder date(Supplier<LocalDate> supplier) {
        return new DateBuilder(supplier);
    }

    public static class DateBuilder {
        private final Supplier<LocalDate> supplier;
        private LocalDate value;
        private boolean hasValue = false;

        DateBuilder(Supplier<LocalDate> supplier) {
            this.supplier = supplier;
        }

        public DateBuilder ifNotNull(Consumer<LocalDate> consumer) {
            this.value = supplier.get();
            if (value != null) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public LocalDate orNull() {
            return hasValue ? value : null;
        }

        public LocalDate orToday() {
            return hasValue ? value : LocalDate.now();
        }
    }

    // ==================== DateTime Builders ====================

    public static DateTimeBuilder dateTime(Supplier<LocalDateTime> supplier) {
        return new DateTimeBuilder(supplier);
    }

    public static class DateTimeBuilder {
        private final Supplier<LocalDateTime> supplier;
        private LocalDateTime value;
        private boolean hasValue = false;

        DateTimeBuilder(Supplier<LocalDateTime> supplier) {
            this.supplier = supplier;
        }

        public DateTimeBuilder ifNotNull(Consumer<LocalDateTime> consumer) {
            this.value = supplier.get();
            if (value != null) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public LocalDateTime orNow() {
            return hasValue ? value : LocalDateTime.now();
        }
    }

    // ==================== String Builders ====================

    public static StringBuilder string(Supplier<String> supplier) {
        return new StringBuilder(supplier);
    }

    public static class StringBuilder {
        private final Supplier<String> supplier;
        private String value;
        private boolean hasValue = false;

        StringBuilder(Supplier<String> supplier) {
            this.supplier = supplier;
        }

        public StringBuilder ifNotBlank(Consumer<String> consumer) {
            this.value = supplier.get();
            if (value != null && !value.isBlank()) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public String orEmpty() {
            return hasValue ? value : "";
        }

        public String orDefault(String defaultValue) {
            return hasValue && value != null ? value : defaultValue;
        }

        public String orNull() {
            return hasValue && value != null ? value : null;
        }
    }

    // ==================== Integer Builders ====================

    public static IntBuilder integer(Supplier<Integer> supplier) {
        return new IntBuilder(supplier);
    }

    public static class IntBuilder {
        private final Supplier<Integer> supplier;
        private Integer value;
        private boolean hasValue = false;

        IntBuilder(Supplier<Integer> supplier) {
            this.supplier = supplier;
        }

        public IntBuilder ifPositive(Consumer<Integer> consumer) {
            this.value = supplier.get();
            if (value != null && value > 0) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public IntBuilder ifNotNull(Consumer<Integer> consumer) {
            this.value = supplier.get();
            if (value != null) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public Integer orZero() {
            return hasValue && value != null ? value : 0;
        }

        public Integer orDefault(Integer defaultValue) {
            return hasValue && value != null ? value : defaultValue;
        }
    }

    // ==================== Conditional Builders ====================

    public static <T> ConditionalBuilder<T> when(Supplier<T> supplier) {
        return new ConditionalBuilder<>(supplier);
    }

    public static class ConditionalBuilder<T> {
        private final Supplier<T> supplier;
        private T value;
        private boolean hasValue = false;

        ConditionalBuilder(Supplier<T> supplier) {
            this.supplier = supplier;
        }

        public ConditionalBuilder<T> ifTrue(boolean condition, Consumer<T> consumer) {
            if (condition) {
                this.value = supplier.get();
                if (value != null) {
                    hasValue = true;
                    consumer.accept(value);
                }
            }
            return this;
        }

        public ConditionalBuilder<T> ifNotNull(Consumer<T> consumer) {
            this.value = supplier.get();
            if (value != null) {
                hasValue = true;
                consumer.accept(value);
            }
            return this;
        }

        public T orNull() {
            return hasValue ? value : null;
        }

        public T orDefault(T defaultValue) {
            return hasValue && value != null ? value : defaultValue;
        }
    }
}
