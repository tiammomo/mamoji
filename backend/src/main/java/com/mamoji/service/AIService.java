package com.mamoji.service;

import com.mamoji.dto.AIChatResponse;
import com.mamoji.entity.Budget;
import com.mamoji.entity.Category;
import com.mamoji.entity.Transaction;
import com.mamoji.repository.BudgetRepository;
import com.mamoji.repository.CategoryRepository;
import com.mamoji.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;

    @Value("${ai.api-key}")
    private String apiKey;

    // 财务助手 System Prompt
    private static final String FINANCE_SYSTEM_PROMPT = "You are a professional family finance assistant. " +
            "Help users analyze income/expense, create budgets, and answer finance-related questions. " +
            "Reply in Chinese, be friendly, professional and concise. " +
            "If users ask about budget execution, compare budget with actual spending and give suggestions. " +
            "If users ask about income/expense analysis, provide specific analysis and suggestions based on data. " +
            "Only answer finance-related questions. If not finance-related, politely explain you specialize in finance.";

    // 股票助手 System Prompt
    private static final String STOCK_SYSTEM_PROMPT = "You are a professional stock market analyst assistant. " +
            "Help users analyze stock trends, provide investment suggestions, and answer stock-related questions. " +
            "Reply in Chinese, be professional and provide data-driven analysis. " +
            "Always remind users that stock investment carries risks. " +
            "Only answer stock market related questions. If not stock-related, politely explain you specialize in stock market analysis.";

    public AIChatResponse chat(Long userId, String message, String assistantType) {
        // 默认使用财务助手
        if (assistantType == null || assistantType.isEmpty()) {
            assistantType = "finance";
        }

        String prompt;
        String systemPrompt;

        switch (assistantType) {
            case "stock":
                // 股票助手 - 获取股票数据
                String stockData = fetchStockData(message);
                prompt = buildStockPrompt(message, stockData);
                systemPrompt = STOCK_SYSTEM_PROMPT;
                break;
            case "finance":
            default:
                // 财务助手 - 获取用户财务数据
                Map<String, Object> context = buildFinanceContext(userId);
                prompt = buildFinancePrompt(message, context);
                systemPrompt = FINANCE_SYSTEM_PROMPT;
                break;
        }

        // 调用 LLM
        String reply = callLLM(prompt, systemPrompt);

        return new AIChatResponse(reply);
    }

    private String fetchStockData(String message) {
        StringBuilder stockData = new StringBuilder();

        // 从用户消息中提取股票代码
        // 支持格式: 股票代码(如: 600519)、上证指数、深证成指、创业板等
        List<String> stockCodes = extractStockCodes(message);

        if (stockCodes.isEmpty()) {
            // 如果没有指定股票，获取一些常用指数
            stockCodes.add("sh000001"); // 上证指数
            stockCodes.add("sz399001"); // 深证成指
        }

        for (String code : stockCodes) {
            try {
                String data = fetchStockQuote(code);
                if (data != null) {
                    stockData.append(data).append("\n");
                }
            } catch (Exception e) {
                log.error("获取股票数据失败: {}", code, e);
            }
        }

        return stockData.toString();
    }

    private List<String> extractStockCodes(String message) {
        // 简单的股票代码提取
        // 匹配 6位数字、上证(sh)、深证(sz) 等格式
        List<String> codes = new java.util.ArrayList<>();

        // 匹配 600XXX, 000XXX, 300XXX 等格式
        Pattern pattern = Pattern.compile("\\b(\\d{6})\\b");
        Matcher matcher = pattern.matcher(message);

        while (matcher.find()) {
            String code = matcher.group(1);
            // 根据代码判断交易所
            if (code.startsWith("6")) {
                codes.add("sh" + code);
            } else if (code.startsWith("0") || code.startsWith("3")) {
                codes.add("sz" + code);
            }
        }

        // 匹配中文股票名称
        Pattern namePattern = Pattern.compile("(茅台|平安|腾讯|阿里巴巴|美团|宁德时代|比亚迪|华为)");
        Matcher nameMatcher = namePattern.matcher(message);
        Map<String, String> nameToCode = new HashMap<>();
        nameToCode.put("茅台", "sh600519");
        nameToCode.put("平安", "sh601318");
        nameToCode.put("腾讯", "sz00700");
        nameToCode.put("阿里巴巴", "sz09988");
        nameToCode.put("美团", "sz03690");
        nameToCode.put("宁德时代", "sz300750");
        nameToCode.put("比亚迪", "sz002594");

        while (nameMatcher.find()) {
            String name = nameMatcher.group(1);
            if (nameToCode.containsKey(name) && !codes.contains(nameToCode.get(name))) {
                codes.add(nameToCode.get(name));
            }
        }

        return codes;
    }

    private String fetchStockQuote(String stockCode) {
        try {
            // 使用新浪财经 API
            String url = "https://hq.sinajs.cn/list=" + stockCode;

            WebClient client = WebClient.builder()
                    .baseUrl(url)
                    .defaultHeader("Referer", "https://finance.sina.com.cn/")
                    .build();

            String response = client.get()
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null && response.contains("=")) {
                // 解析返回数据
                String data = response.substring(response.indexOf("=") + 1);
                data = data.replace("\"", "").replace(";", "");

                String[] parts = data.split(",");
                if (parts.length >= 32) {
                    String name = parts[0];
                    String open = parts[1];    // 开盘价
                    String close = parts[2];    // 收盘价
                    String current = parts[3];  // 当前价
                    String high = parts[4];    // 最高价
                    String low = parts[5];      // 最低价
                    String volume = parts[8];   // 成交量

                    return String.format("%s: 当前价=%s, 开盘价=%s, 收盘价=%s, 最高=%s, 最低=%s, 成交量=%s",
                            name, current, open, close, high, low, volume);
                }
            }
        } catch (Exception e) {
            log.error("获取股票报价失败: {}", stockCode, e);
        }
        return null;
    }

    private String buildStockPrompt(String message, String stockData) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("用户问题：").append(message).append("\n\n");

        if (stockData != null && !stockData.isEmpty()) {
            prompt.append("=== 当前股票行情 ===\n");
            prompt.append(stockData);
        } else {
            prompt.append("未能获取到股票数据，请说明暂时无法获取实时行情。\n");
        }

        prompt.append("\n请根据以上股票数据回答用户问题，并给出专业的分析建议。");
        prompt.append("\n注意：提醒用户股市有风险，投资需谨慎。");

        return prompt.toString();
    }

    private Map<String, Object> buildFinanceContext(Long userId) {
        Map<String, Object> context = new HashMap<>();

        YearMonth currentMonth = YearMonth.now();
        LocalDate startDate = currentMonth.atDay(1);
        LocalDate endDate = currentMonth.atEndOfMonth();

        // 本月收入
        BigDecimal totalIncome = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                userId, 1, startDate, endDate);
        context.put("totalIncome", totalIncome != null ? totalIncome : BigDecimal.ZERO);

        // 本月支出
        BigDecimal totalExpense = transactionRepository.sumByUserIdAndTypeAndDateBetween(
                userId, 2, startDate, endDate);
        context.put("totalExpense", totalExpense != null ? totalExpense : BigDecimal.ZERO);

        // 最近交易记录
        List<Transaction> recentTransactions = transactionRepository.findByUserIdAndDateBetween(
                userId, startDate, endDate);
        context.put("recentTransactions", recentTransactions.stream()
                .limit(10)
                .map(this::formatTransaction)
                .collect(Collectors.toList()));

        // 分类支出统计
        List<Object[]> categoryExpenses = transactionRepository.sumByCategoryAndType(
                userId, 2, startDate, endDate);
        context.put("categoryExpenses", formatCategoryExpenses(categoryExpenses));

        // 活跃预算
        List<Budget> activeBudgets = budgetRepository.findActiveBudgets(userId, LocalDate.now());
        context.put("activeBudgets", activeBudgets.stream()
                .map(this::formatBudget)
                .collect(Collectors.toList()));

        return context;
    }

    private String formatTransaction(Transaction t) {
        String type = t.getType() == 1 ? "收入" : "支出";
        String categoryName = categoryRepository.findById(t.getCategoryId())
                .map(Category::getName)
                .orElse("未知");
        return String.format("%s | %s | %s | %.2f | %s",
                t.getDate(), type, categoryName, t.getAmount(),
                t.getRemark() != null ? t.getRemark() : "");
    }

    private Map<String, Object> formatBudget(Budget b) {
        Map<String, Object> budget = new HashMap<>();
        budget.put("startDate", b.getStartDate());
        budget.put("endDate", b.getEndDate());
        budget.put("amount", b.getAmount());
        budget.put("categoryId", b.getCategoryId());

        if (b.getCategoryId() != null) {
            categoryRepository.findById(b.getCategoryId())
                    .ifPresent(c -> budget.put("categoryName", c.getName()));
        } else {
            budget.put("categoryName", "总预算");
        }

        return budget;
    }

    private List<Map<String, Object>> formatCategoryExpenses(List<Object[]> categoryExpenses) {
        return categoryExpenses.stream()
                .map(row -> {
                    Map<String, Object> item = new HashMap<>();
                    Long categoryId = (Long) row[0];
                    BigDecimal amount = (BigDecimal) row[1];

                    categoryRepository.findById(categoryId).ifPresent(c ->
                            item.put("categoryName", c.getName()));

                    item.put("amount", amount);
                    return item;
                })
                .collect(Collectors.toList());
    }

    private String buildFinancePrompt(String message, Map<String, Object> context) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("用户问题：").append(message).append("\n\n");

        prompt.append("=== 用户财务数据 ===\n");
        prompt.append(String.format("本月收入：%.2f 元\n", context.get("totalIncome")));
        prompt.append(String.format("本月支出：%.2f 元\n", context.get("totalExpense")));

        List<Map<String, Object>> categoryExpenses = (List<Map<String, Object>>) context.get("categoryExpenses");
        if (categoryExpenses != null && !categoryExpenses.isEmpty()) {
            prompt.append("\n分类支出：\n");
            for (Map<String, Object> cat : categoryExpenses) {
                prompt.append(String.format("  - %s: %.2f 元\n",
                        cat.get("categoryName"), cat.get("amount")));
            }
        }

        List<Map<String, Object>> activeBudgets = (List<Map<String, Object>>) context.get("activeBudgets");
        if (activeBudgets != null && !activeBudgets.isEmpty()) {
            prompt.append("\n当前预算：\n");
            for (Map<String, Object> budget : activeBudgets) {
                prompt.append(String.format("  - %s: %.2f 元 (%s 至 %s)\n",
                        budget.get("categoryName"), budget.get("amount"),
                        budget.get("startDate"), budget.get("endDate")));
            }
        }

        List<String> recentTransactions = (List<String>) context.get("recentTransactions");
        if (recentTransactions != null && !recentTransactions.isEmpty()) {
            prompt.append("\n最近交易：\n");
            for (String tx : recentTransactions) {
                prompt.append("  ").append(tx).append("\n");
            }
        }

        prompt.append("\n请根据以上数据回答用户问题。");

        return prompt.toString();
    }

    @SuppressWarnings("unchecked")
    private String callLLM(String prompt, String systemPrompt) {
        try {
            String apiUrl = "https://api.minimaxi.com/v1/text/chatcompletion_v2";

            WebClient client = WebClient.builder()
                    .baseUrl(apiUrl)
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "abab6.5s-chat");
            requestBody.put("max_tokens", 1024);
            requestBody.put("temperature", 0.7);

            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);

            requestBody.put("messages", new Object[]{systemMessage, userMessage});

            Map<String, Object> response = client.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("AI API 响应: {}", response);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    if (choice.containsKey("message")) {
                        Map<String, Object> message = (Map<String, Object>) choice.get("message");
                        Object content = message.get("content");
                        if (content != null) {
                            return content.toString();
                        }
                    }
                }
            }

            if (response != null && response.containsKey("error")) {
                Map<String, Object> error = (Map<String, Object>) response.get("error");
                log.error("AI API 错误: {}", error);
                Object errorMessage = error.get("message");
                return "AI 服务返回错误: " + (errorMessage != null ? errorMessage : "未知错误");
            }

            return "抱歉，我暂时无法回答这个问题。";
        } catch (Exception e) {
            log.error("AI API 调用失败: {}", e.getMessage(), e);
            return "抱歉，AI 服务暂时不可用，请稍后再试。错误信息: " + e.getMessage();
        }
    }
}
