package com.mamoji.ai;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class AiModelRouterTest {

    @Test
    void shouldSelectAssistantSpecificModel() {
        AiProperties properties = new AiProperties();
        properties.setModel("default-model");
        properties.getRoutingOps().setEnabled(true);
        properties.getRoutingOps().setFinanceModel("finance-model");
        properties.getRoutingOps().setStockModel("stock-model");
        AiModelRouter router = new AiModelRouter(properties);

        Assertions.assertEquals("finance-model", router.pickPrimaryModel("finance", "预算建议"));
        Assertions.assertEquals("stock-model", router.pickPrimaryModel("stock", "600519"));
    }

    @Test
    void shouldSelectHighComplexityModelByQuestionLength() {
        AiProperties properties = new AiProperties();
        properties.setModel("default-model");
        properties.getRoutingOps().setEnabled(true);
        properties.getRoutingOps().setHighComplexityModel("complex-model");
        properties.getRoutingOps().setHighComplexityQuestionChars(50);
        AiModelRouter router = new AiModelRouter(properties);

        String longQuestion = "a".repeat(120);
        Assertions.assertEquals("complex-model", router.pickPrimaryModel("finance", longQuestion));
    }
}
