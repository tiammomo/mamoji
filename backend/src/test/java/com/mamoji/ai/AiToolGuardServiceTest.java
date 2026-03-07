package com.mamoji.ai;

import com.mamoji.ai.tool.AiToolGuardService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

class AiToolGuardServiceTest {

    @Test
    void shouldDenyBlockedTool() {
        AiProperties properties = new AiProperties();
        properties.getToolOps().setEnabled(true);
        properties.getToolOps().setBlockedTools(List.of("stock"));

        AiToolGuardService guardService = new AiToolGuardService(properties);
        AiToolGuardService.GuardDecision decision = guardService.checkAndConsume(1L, "stock");

        Assertions.assertFalse(decision.allowed());
        Assertions.assertEquals("tool_blocked", decision.reason());
    }

    @Test
    void shouldRateLimitAfterConfiguredThreshold() {
        AiProperties properties = new AiProperties();
        properties.getToolOps().setEnabled(true);
        properties.getToolOps().setPerUserToolPerMinute(2);

        AiToolGuardService guardService = new AiToolGuardService(properties);

        Assertions.assertTrue(guardService.checkAndConsume(1L, "finance").allowed());
        Assertions.assertTrue(guardService.checkAndConsume(1L, "finance").allowed());
        AiToolGuardService.GuardDecision denied = guardService.checkAndConsume(1L, "finance");

        Assertions.assertFalse(denied.allowed());
        Assertions.assertEquals("tool_rate_limited", denied.reason());
    }
}
