package com.mamoji.ai.quality;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiQualityGateService {

    public List<String> validate(String assistantType, String question, String answer) {
        List<String> warnings = new ArrayList<>();
        if (answer == null || answer.isBlank()) {
            warnings.add("empty_answer");
            return warnings;
        }

        if (answer.length() < 10) {
            warnings.add("too_short");
        }

        if ("stock".equals(assistantType) && !containsRiskWarning(answer)) {
            warnings.add("missing_risk_warning");
        }

        if ("finance".equals(assistantType) && !containsActionableHint(answer)) {
            warnings.add("missing_actionable_advice");
        }

        if (question != null && question.length() > 2000) {
            warnings.add("question_too_long");
        }

        return warnings;
    }

    private boolean containsRiskWarning(String answer) {
        String text = answer.toLowerCase();
        return text.contains("风险") || text.contains("谨慎") || text.contains("不构成投资建议");
    }

    private boolean containsActionableHint(String answer) {
        String text = answer.toLowerCase();
        return text.contains("建议") || text.contains("可以") || text.contains("步骤");
    }
}

