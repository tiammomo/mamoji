package com.mamoji.ai;

import org.springframework.stereotype.Service;

@Service
public class AiModelRouter {

    private final AiProperties aiProperties;

    public AiModelRouter(AiProperties aiProperties) {
        this.aiProperties = aiProperties;
    }

    public String pickPrimaryModel(String assistantType, String question) {
        AiProperties.RoutingOps routingOps = aiProperties.getRoutingOps();
        if (!routingOps.isEnabled()) {
            return aiProperties.getModel();
        }

        if (isHighComplexity(question, routingOps) && notBlank(routingOps.getHighComplexityModel())) {
            return routingOps.getHighComplexityModel().trim();
        }

        if ("stock".equalsIgnoreCase(assistantType) && notBlank(routingOps.getStockModel())) {
            return routingOps.getStockModel().trim();
        }

        if ("finance".equalsIgnoreCase(assistantType) && notBlank(routingOps.getFinanceModel())) {
            return routingOps.getFinanceModel().trim();
        }

        return aiProperties.getModel();
    }

    private boolean isHighComplexity(String question, AiProperties.RoutingOps routingOps) {
        if (question == null) {
            return false;
        }
        return question.length() >= Math.max(100, routingOps.getHighComplexityQuestionChars());
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
