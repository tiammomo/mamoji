package com.mamoji.ai.tool;

import com.mamoji.ai.AiProperties;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AiToolExecutionService {

    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Map<String, Semaphore> semaphores = new ConcurrentHashMap<>();
    private final Map<String, CircuitState> circuits = new ConcurrentHashMap<>();
    private final Map<String, CachedResult> idempotentCache = new ConcurrentHashMap<>();
    private final AiProperties aiProperties;

    public AiToolExecutionService(AiProperties aiProperties) {
        this.aiProperties = aiProperties;
    }

    public AiToolResult execute(AiToolHandler handler, Long userId, Map<String, Object> params) {
        String tool = handler.name();
        String requestKey = buildRequestKey(tool, userId, params);
        CachedResult cached = idempotentCache.get(requestKey);
        if (cached != null && cached.expireAtMs > System.currentTimeMillis()) {
            return cached.result;
        }

        CircuitState circuitState = circuits.computeIfAbsent(tool, k -> new CircuitState());
        long now = System.currentTimeMillis();
        if (circuitState.openUntilMs > now) {
            return AiToolResult.fail(tool, "tool_circuit_open");
        }

        Semaphore semaphore = semaphores.computeIfAbsent(
            tool,
            k -> new Semaphore(Math.max(1, aiProperties.getToolExecOps().getMaxConcurrentPerTool()))
        );
        if (!semaphore.tryAcquire()) {
            return AiToolResult.fail(tool, "tool_concurrency_limited");
        }

        try {
            Future<AiToolResult> future = executor.submit(() -> handler.execute(userId, params));
            long timeout = Math.max(200, aiProperties.getToolExecOps().getTimeoutMs());
            AiToolResult result = future.get(timeout, TimeUnit.MILLISECONDS);
            resetCircuit(circuitState);
            idempotentCache.put(requestKey, new CachedResult(result, System.currentTimeMillis() + 60_000));
            return result;
        } catch (TimeoutException ex) {
            markFailure(circuitState);
            return AiToolResult.fail(tool, "tool_timeout");
        } catch (Exception ex) {
            markFailure(circuitState);
            return AiToolResult.fail(tool, ex.getMessage() != null ? ex.getMessage() : "tool_execution_failed");
        } finally {
            semaphore.release();
        }
    }

    private void markFailure(CircuitState state) {
        int threshold = Math.max(1, aiProperties.getToolExecOps().getFailureThreshold());
        int openSeconds = Math.max(1, aiProperties.getToolExecOps().getCircuitOpenSeconds());
        if (state.failures.incrementAndGet() >= threshold) {
            state.openUntilMs = System.currentTimeMillis() + (openSeconds * 1000L);
            state.failures.set(0);
        }
    }

    private void resetCircuit(CircuitState state) {
        state.failures.set(0);
        state.openUntilMs = 0L;
    }

    private static class CircuitState {
        private final AtomicInteger failures = new AtomicInteger();
        private volatile long openUntilMs = 0L;
    }

    private String buildRequestKey(String tool, Long userId, Map<String, Object> params) {
        int paramHash = params == null ? 0 : params.toString().hashCode();
        return tool + ":" + (userId == null ? "anonymous" : userId) + ":" + paramHash;
    }

    private record CachedResult(AiToolResult result, long expireAtMs) {
    }
}
