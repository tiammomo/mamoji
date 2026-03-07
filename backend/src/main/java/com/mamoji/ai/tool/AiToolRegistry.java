package com.mamoji.ai.tool;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class AiToolRegistry {

    private final Map<String, AiToolHandler> handlers = new HashMap<>();

    public AiToolRegistry(List<AiToolHandler> handlers) {
        for (AiToolHandler handler : handlers) {
            this.handlers.put(handler.name(), handler);
        }
    }

    public Optional<AiToolHandler> find(String name) {
        return Optional.ofNullable(handlers.get(name));
    }

    public Set<String> allNames() {
        return handlers.keySet();
    }
}

