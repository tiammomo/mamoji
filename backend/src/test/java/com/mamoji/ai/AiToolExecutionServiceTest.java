package com.mamoji.ai;

import com.mamoji.ai.tool.AiToolExecutionService;
import com.mamoji.ai.tool.AiToolHandler;
import com.mamoji.ai.tool.AiToolResult;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Map;

class AiToolExecutionServiceTest {

    @Test
    void shouldTimeoutSlowTool() {
        AiProperties properties = new AiProperties();
        properties.getToolExecOps().setTimeoutMs(100);
        properties.getToolExecOps().setFailureThreshold(1);
        properties.getToolExecOps().setCircuitOpenSeconds(1);
        AiToolExecutionService service = new AiToolExecutionService(properties);

        AiToolHandler slow = new AiToolHandler() {
            @Override
            public String name() {
                return "slowTool";
            }

            @Override
            public AiToolResult execute(Long userId, Map<String, Object> params) {
                try {
                    Thread.sleep(300);
                } catch (InterruptedException ignored) {
                }
                return AiToolResult.ok(name(), "{}");
            }
        };

        AiToolResult result = service.execute(slow, 1L, Map.of("k", "v"));
        Assertions.assertFalse(result.success());
        Assertions.assertEquals("tool_timeout", result.error());
    }

    @Test
    void shouldReturnCachedResultForSameRequest() {
        AiProperties properties = new AiProperties();
        properties.getToolExecOps().setTimeoutMs(500);
        AiToolExecutionService service = new AiToolExecutionService(properties);

        final int[] calls = {0};
        AiToolHandler handler = new AiToolHandler() {
            @Override
            public String name() {
                return "cacheTool";
            }

            @Override
            public AiToolResult execute(Long userId, Map<String, Object> params) {
                calls[0]++;
                return AiToolResult.ok(name(), "{\"n\":" + calls[0] + "}");
            }
        };

        AiToolResult first = service.execute(handler, 2L, Map.of("x", 1));
        AiToolResult second = service.execute(handler, 2L, Map.of("x", 1));

        Assertions.assertTrue(first.success());
        Assertions.assertTrue(second.success());
        Assertions.assertEquals(first.payload(), second.payload());
        Assertions.assertEquals(1, calls[0]);
    }
}
