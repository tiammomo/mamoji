package com.mamoji.ai.quality;

import com.mamoji.ai.AiProperties;
import com.mamoji.ai.metrics.AiMetricsService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AiQualityGateService {

    private final AiProperties aiProperties;
    private final AiMetricsService aiMetricsService;

    public AiQualityGateService(AiProperties aiProperties, AiMetricsService aiMetricsService) {
        this.aiProperties = aiProperties;
        this.aiMetricsService = aiMetricsService;
    }

    public List<String> validate(String assistantType, String question, String answer) {
        String type = normalizeAssistantType(assistantType);
        AiProperties.QualityOps qualityOps = aiProperties.getQualityOps();
        List<String> warnings = new ArrayList<>();

        applyRule(answer == null || answer.isBlank(), warnings, type, "empty_answer");
        if (!warnings.isEmpty()) {
            return warnings;
        }

        applyRule(answer.length() < Math.max(1, qualityOps.getMinAnswerLength()), warnings, type, "too_short");
        applyRule(
            question != null && question.length() > Math.max(100, qualityOps.getMaxQuestionLength()),
            warnings,
            type,
            "question_too_long"
        );

        if ("stock".equals(type) && qualityOps.isStockRiskRequired()) {
            applyRule(!containsRiskWarning(answer), warnings, type, "missing_risk_warning");
        }
        if ("finance".equals(type) && qualityOps.isFinanceActionableRequired()) {
            applyRule(!containsActionableHint(answer), warnings, type, "missing_actionable_advice");
        }
        if (qualityOps.isRecencyStatementRequired() && !containsRecencyStatement(answer)) {
            applyRule(true, warnings, type, "missing_recency_statement");
        }

        return warnings;
    }

    private void applyRule(boolean condition, List<String> warnings, String assistantType, String rule) {
        if (!condition) {
            return;
        }
        warnings.add(rule);
        aiMetricsService.recordQualityRuleHit(assistantType, rule);
    }

    private boolean containsRiskWarning(String answer) {
        String text = normalize(answer);
        return text.contains("风险") || text.contains("谨慎") || text.contains("不构成投资建议");
    }

    private boolean containsActionableHint(String answer) {
        String text = normalize(answer);
        return text.contains("建议") || text.contains("可以") || text.contains("步骤");
    }

    private boolean containsRecencyStatement(String answer) {
        String text = normalize(answer);
        return text.contains("截至") || text.contains("数据") || text.contains("时间") || text.contains("as of");
    }

    private String normalize(String text) {
        return text == null ? "" : text.toLowerCase(Locale.ROOT);
    }

    private String normalizeAssistantType(String assistantType) {
        if ("stock".equalsIgnoreCase(assistantType)) {
            return "stock";
        }
        return "finance";
    }
}
