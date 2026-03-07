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
}

