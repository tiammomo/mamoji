package com.mamoji.common.service;

import java.util.List;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Batch service using Batch Pattern. Provides efficient batch operations for CRUD.
 *
 * @param <T> Entity type
 * @param <M> Mapper type
 */
@Slf4j
@RequiredArgsConstructor
public abstract class BatchService<T, M extends BaseMapper<T>> {

    protected final M baseMapper;

    private static final int BATCH_SIZE = 500;

    /**
     * Batch insert entities using ServiceImpl's saveBatch.
     *
     * @param entities List of entities to insert
     * @return Number of inserted records
     */
    public int batchInsert(List<T> entities) {
        if (entities == null || entities.isEmpty()) {
            return 0;
        }

        // Use reflection to call saveBatch on the service
        try {
            Object service = getServiceImpl();
            if (service != null) {
                java.lang.reflect.Method saveBatchMethod =
                        service.getClass().getMethod("saveBatch", Iterable.class, int.class);
                saveBatchMethod.invoke(service, entities, BATCH_SIZE);
                return entities.size();
            }
        } catch (Exception e) {
            log.warn("Failed to use saveBatch, falling back to individual inserts: {}", e.getMessage());
        }

        // Fallback to individual inserts
        int inserted = 0;
        for (T entity : entities) {
            if (baseMapper.insert(entity) > 0) {
                inserted++;
            }
        }
        return inserted;
    }

    /**
     * Batch update entities.
     *
     * @param entities List of entities to update
     * @return Number of updated records
     */
    public int batchUpdate(List<T> entities) {
        if (entities == null || entities.isEmpty()) {
            return 0;
        }

        int totalUpdated = 0;
        for (T entity : entities) {
            if (updateEntity(entity) > 0) {
                totalUpdated++;
            }
        }
        return totalUpdated;
    }

    /**
     * Batch delete by IDs.
     *
     * @param ids List of entity IDs to delete
     * @return Number of deleted records
     */
    public int batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }

        int totalDeleted = 0;
        for (Long id : ids) {
            if (baseMapper.deleteById(id) > 0) {
                totalDeleted++;
            }
        }
        return totalDeleted;
    }

    /**
     * Batch upsert (insert or update based on existence).
     *
     * @param entities List of entities to upsert
     * @param idGetter Function to extract ID from entity
     * @return Number of processed records
     */
    public <ID> int batchUpsert(List<T> entities, java.util.function.Function<T, ID> idGetter) {
        if (entities == null || entities.isEmpty()) {
            return 0;
        }

        int totalProcessed = 0;
        for (T entity : entities) {
            ID id = idGetter.apply(entity);
            boolean exists = id != null && existsById(id);
            int result = exists ? updateEntity(entity) : baseMapper.insert(entity);
            if (result > 0) {
                totalProcessed++;
            }
        }
        return totalProcessed;
    }

    /**
     * Process entities in batches with progress callback.
     *
     * @param entities List of entities to process
     * @param processor Function to process each batch
     * @param onProgress Progress callback (current, total)
     * @return Total processed count
     */
    public int processInBatches(
            List<T> entities,
            java.util.function.Function<List<T>, Integer> processor,
            java.util.function.BiConsumer<Integer, Integer> onProgress) {
        if (entities == null || entities.isEmpty()) {
            return 0;
        }

        int totalProcessed = 0;
        int size = entities.size();

        for (int i = 0; i < size; i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, size);
            List<T> batch = entities.subList(i, end);
            int processed = processor.apply(batch);
            totalProcessed += processed;
            onProgress.accept(end, size);
        }

        return totalProcessed;
    }

    /**
     * Bulk import from data array.
     *
     * @param dataArray Array of data to import
     * @param mapper Function to map array element to entity
     * @param validator Validator function
     * @return ImportResult with success and error counts
     */
    public <D> ImportResult<T> bulkImport(
            D[] dataArray,
            java.util.function.Function<D, T> mapper,
            java.util.function.Predicate<D> validator) {
        if (dataArray == null || dataArray.length == 0) {
            return new ImportResult<>(0, 0, null);
        }

        int success = 0;
        int errors = 0;
        StringBuilder errorMessages = new StringBuilder();

        for (int i = 0; i < dataArray.length; i++) {
            D data = dataArray[i];
            if (!validator.test(data)) {
                errors++;
                errorMessages.append("Row ").append(i + 1).append(": Validation failed\n");
                continue;
            }

            try {
                T entity = mapper.apply(data);
                if (baseMapper.insert(entity) > 0) {
                    success++;
                } else {
                    errors++;
                    errorMessages.append("Row ").append(i + 1).append(": Insert failed\n");
                }
            } catch (Exception e) {
                errors++;
                errorMessages.append("Row ").append(i + 1).append(": ").append(e.getMessage()).append("\n");
            }
        }

        return new ImportResult<>(success, errors,
                errors > 0 ? errorMessages.toString() : null);
    }

    // ==================== Protected Methods ====================

    protected abstract Object getServiceImpl();

    protected abstract int updateEntity(T entity);

    protected abstract boolean existsById(Object id);

    // ==================== Import Result ====================

    public record ImportResult<T>(
            int successCount,
            int errorCount,
            String errorDetails
    ) {
        public boolean isSuccess() {
            return errorCount == 0;
        }

        public int getTotalProcessed() {
            return successCount + errorCount;
        }
    }

    // ==================== Constants ====================

    public int getBatchSize() {
        return BATCH_SIZE;
    }
}
