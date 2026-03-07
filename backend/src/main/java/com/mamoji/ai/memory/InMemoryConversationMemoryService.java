package com.mamoji.ai.memory;

import org.springframework.stereotype.Service;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnMissingBean(ConversationMemoryService.class)
public class InMemoryConversationMemoryService implements ConversationMemoryService {

    private static final int MAX_STORED_TURNS = 40;
    private final Map<String, Deque<ConversationTurn>> sessions = new ConcurrentHashMap<>();

    @Override
    public void append(String sessionKey, String role, String content) {
        if (sessionKey == null || sessionKey.isBlank() || content == null || content.isBlank()) {
            return;
        }
        Deque<ConversationTurn> turns = sessions.computeIfAbsent(sessionKey, key -> new ArrayDeque<>());
        synchronized (turns) {
            turns.addLast(new ConversationTurn(role, content, Instant.now()));
            while (turns.size() > MAX_STORED_TURNS) {
                turns.removeFirst();
            }
        }
    }

    @Override
    public List<ConversationTurn> recent(String sessionKey, int maxTurns) {
        if (sessionKey == null || sessionKey.isBlank()) {
            return List.of();
        }
        Deque<ConversationTurn> turns = sessions.get(sessionKey);
        if (turns == null || turns.isEmpty()) {
            return List.of();
        }
        synchronized (turns) {
            int size = Math.min(Math.max(maxTurns, 0), turns.size());
            List<ConversationTurn> all = new ArrayList<>(turns);
            return all.subList(all.size() - size, all.size());
        }
    }
}
