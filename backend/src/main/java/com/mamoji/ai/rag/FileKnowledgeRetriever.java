package com.mamoji.ai.rag;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mamoji.ai.AiProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
@ConditionalOnProperty(prefix = "ai.rag-ops", name = "file-enabled", havingValue = "true", matchIfMissing = true)
public class FileKnowledgeRetriever implements KnowledgeRetriever {

    private final List<KnowledgeDocument> knowledgeBase;

    public FileKnowledgeRetriever(
        AiProperties aiProperties,
        ResourceLoader resourceLoader,
        ObjectMapper objectMapper
    ) {
        this.knowledgeBase = loadKnowledgeBase(aiProperties.getRagOps().getKnowledgePath(), resourceLoader, objectMapper);
    }

    @Override
    public List<KnowledgeSnippet> retrieve(String assistantType, String question, int topK) {
        int limit = Math.max(0, topK);
        if (limit == 0 || knowledgeBase.isEmpty()) {
            return List.of();
        }

        String type = normalizeType(assistantType);
        Set<String> tokens = tokenize(question);
        if (tokens.isEmpty()) {
            tokens = Set.of(type);
        }

        List<ScoredDocument> scored = new ArrayList<>();
        for (KnowledgeDocument document : knowledgeBase) {
            if (!supportsType(document.assistantType(), type)) {
                continue;
            }
            int score = score(document, tokens);
            if (score > 0) {
                scored.add(new ScoredDocument(document, score));
            }
        }

        scored.sort(Comparator.comparingInt(ScoredDocument::score).reversed());
        List<KnowledgeSnippet> results = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, scored.size()); i++) {
            KnowledgeDocument doc = scored.get(i).document();
            results.add(new KnowledgeSnippet(doc.source(), doc.title(), doc.content()));
        }
        return results;
    }

    private List<KnowledgeDocument> loadKnowledgeBase(String path, ResourceLoader resourceLoader, ObjectMapper objectMapper) {
        if (path == null || path.isBlank()) {
            return List.of();
        }
        try {
            Resource resource = resourceLoader.getResource(path);
            if (!resource.exists()) {
                return List.of();
            }
            try (InputStream input = resource.getInputStream()) {
                List<KnowledgeDocument> docs = objectMapper.readValue(input, new TypeReference<List<KnowledgeDocument>>() {
                });
                return docs != null ? docs : List.of();
            }
        } catch (Exception ex) {
            return List.of();
        }
    }

    private boolean supportsType(String docType, String queryType) {
        if (docType == null || docType.isBlank()) {
            return true;
        }
        String normalized = docType.toLowerCase(Locale.ROOT).trim();
        return "all".equals(normalized) || normalized.equals(queryType);
    }

    private int score(KnowledgeDocument document, Set<String> tokens) {
        String haystack = (safe(document.title()) + " " + safe(document.content()) + " " + safe(document.tags()))
            .toLowerCase(Locale.ROOT);
        int score = 0;
        for (String token : tokens) {
            if (token.length() >= 2 && haystack.contains(token)) {
                score++;
            }
        }
        return score;
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        String[] split = text.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{Nd}]+");
        Set<String> tokens = new LinkedHashSet<>();
        for (String token : split) {
            if (!token.isBlank()) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private String normalizeType(String assistantType) {
        if ("stock".equalsIgnoreCase(assistantType)) {
            return "stock";
        }
        return "finance";
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private record ScoredDocument(KnowledgeDocument document, int score) {
    }

    private record KnowledgeDocument(
        String assistantType,
        String source,
        String title,
        String content,
        String tags
    ) {
    }
}
