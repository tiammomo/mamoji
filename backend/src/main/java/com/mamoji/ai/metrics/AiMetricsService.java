package com.mamoji.ai.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.DistributionSummary;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class AiMetricsService {

    private final MeterRegistry meterRegistry;

    public AiMetricsService(ObjectProvider<MeterRegistry> registryProvider) {
        this.meterRegistry = registryProvider.getIfAvailable();
    }

    public void recordRequest(String provider, boolean success, long latencyMs, int estimatedTokens) {
        if (meterRegistry == null) {
            return;
        }

        Timer.builder("ai.request.latency")
            .tag("provider", provider)
            .tag("success", String.valueOf(success))
            .register(meterRegistry)
            .record(latencyMs, TimeUnit.MILLISECONDS);

        Counter.builder("ai.request.count")
            .tag("provider", provider)
            .tag("success", String.valueOf(success))
            .register(meterRegistry)
            .increment();

        DistributionSummary.builder("ai.request.tokens")
            .tag("provider", provider)
            .register(meterRegistry)
            .record(Math.max(0, estimatedTokens));
    }

    public void recordModelRoute(String assistantType, String modelName) {
        if (meterRegistry == null) {
            return;
        }
        Counter.builder("ai.model.route.count")
            .tag("assistantType", safeTag(assistantType))
            .tag("model", safeTag(modelName))
            .register(meterRegistry)
            .increment();
    }

    public void recordModelRouteReason(String assistantType, String modelName, String reason) {
        if (meterRegistry == null) {
            return;
        }
        Counter.builder("ai.model.route.reason.count")
            .tag("assistantType", safeTag(assistantType))
            .tag("model", safeTag(modelName))
            .tag("reason", safeTag(reason))
            .register(meterRegistry)
            .increment();
    }

    public void recordModelFallback(String primaryModel, String fallbackModel) {
        if (meterRegistry == null) {
            return;
        }
        Counter.builder("ai.model.fallback.count")
            .tag("primary", safeTag(primaryModel))
            .tag("fallback", safeTag(fallbackModel))
            .register(meterRegistry)
            .increment();
    }

    public void recordToolCall(String toolName, boolean success, long latencyMs) {
        if (meterRegistry == null) {
            return;
        }

        Timer.builder("ai.tool.latency")
            .tag("tool", safeTag(toolName))
            .tag("success", String.valueOf(success))
            .register(meterRegistry)
            .record(Math.max(0, latencyMs), TimeUnit.MILLISECONDS);

        Counter.builder("ai.tool.count")
            .tag("tool", safeTag(toolName))
            .tag("success", String.valueOf(success))
            .register(meterRegistry)
            .increment();
    }

    public void recordQualityWarnings(String assistantType, int warningCount) {
        if (meterRegistry == null) {
            return;
        }

        DistributionSummary.builder("ai.quality.warnings")
            .tag("assistantType", safeTag(assistantType))
            .register(meterRegistry)
            .record(Math.max(0, warningCount));
    }

    public void recordQualityRuleHit(String assistantType, String rule) {
        if (meterRegistry == null) {
            return;
        }
        Counter.builder("ai.quality.rule.hit")
            .tag("assistantType", safeTag(assistantType))
            .tag("rule", safeTag(rule))
            .register(meterRegistry)
            .increment();
    }

    public void recordCacheAccess(String layer, String cacheName, boolean hit) {
        if (meterRegistry == null) {
            return;
        }

        Counter.builder("ai.cache.access.count")
            .tag("layer", safeTag(layer))
            .tag("cache", safeTag(cacheName))
            .tag("hit", String.valueOf(hit))
            .register(meterRegistry)
            .increment();
    }

    private String safeTag(String value) {
        return (value == null || value.isBlank()) ? "unknown" : value;
    }
}
