package com.mamoji.common.result;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Pagination Result */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    /** Current page number */
    private Long current;

    /** Page size */
    private Long size;

    /** Total records */
    private Long total;

    /** Total pages */
    private Long pages;

    /** Data list */
    private List<T> records;

    /** Create a page result */
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
