package com.mamoji.ai.rag;

import java.util.List;

public interface KnowledgeRetriever {

    List<KnowledgeSnippet> retrieve(String assistantType, String question, int topK);
}

