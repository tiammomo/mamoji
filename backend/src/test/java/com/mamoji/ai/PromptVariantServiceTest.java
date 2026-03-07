package com.mamoji.ai;

import com.mamoji.ai.prompt.PromptVariantService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class PromptVariantServiceTest {

    private final PromptVariantService service = new PromptVariantService();

    @Test
    void shouldPickStableVariantForSameSession() {
        PromptVariantService.PromptVariant first = service.pick("finance", "u1:finance:s1");
        PromptVariantService.PromptVariant second = service.pick("finance", "u1:finance:s1");
        Assertions.assertEquals(first.variant(), second.variant());
    }

    @Test
    void shouldPickStockPromptForStockAssistant() {
        PromptVariantService.PromptVariant stock = service.pick("stock", "u2:stock:s9");
        Assertions.assertTrue(stock.systemPrompt().toLowerCase().contains("stock"));
    }
}

