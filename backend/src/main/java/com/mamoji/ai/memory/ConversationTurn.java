package com.mamoji.ai.memory;

import java.time.Instant;

public record ConversationTurn(
    String role,
    String content,
    Instant timestamp
) {
}

