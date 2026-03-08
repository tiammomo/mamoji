package com.mamoji.ai;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Flux;

import java.util.List;

class EngineSwitchAiGatewayTest {

    @Test
    void shouldUseLegacyGatewayWhenEngineIsLegacy() {
        AiProperties properties = new AiProperties();
        properties.setEngine("legacy");

        LegacyAiGateway legacyAiGateway = Mockito.mock(LegacyAiGateway.class);
        Mockito.when(legacyAiGateway.chat("sys", "user", null, "finance")).thenReturn("legacy-answer");

        EngineSwitchAiGateway gateway = new EngineSwitchAiGateway(properties, legacyAiGateway);
        String answer = gateway.chat("sys", "user", null, "finance");

        Assertions.assertEquals("legacy-answer", answer);
    }

    @Test
    void shouldFallbackToLegacyGatewayWhenEngineUnsupported() {
        AiProperties properties = new AiProperties();
        properties.setEngine("spring-ai");

        LegacyAiGateway legacyAiGateway = Mockito.mock(LegacyAiGateway.class);
        Mockito.when(legacyAiGateway.streamChat("sys", "user", null, null))
            .thenReturn(Flux.just("a", "b"));

        EngineSwitchAiGateway gateway = new EngineSwitchAiGateway(properties, legacyAiGateway);
        List<String> chunks = gateway.streamChat("sys", "user", null, null).collectList().block();

        Assertions.assertEquals(List.of("a", "b"), chunks);
    }
}
