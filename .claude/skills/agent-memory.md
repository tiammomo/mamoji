---
name: agent-memory
description: 'Persistent memory and knowledge management for cross-session context retention.'
---

# Agent Memory

Manage persistent memory and knowledge across sessions using Claude Code's memory capabilities.

## Memory System

### Auto Memory
- Located at `C:\Users\pearf\.claude\projects\D--projects-shuai-mamoji\memory\`
- `MEMORY.md` - Main memory file (loaded in context)
- Separate topic files for detailed notes

### What to Save

**Project Knowledge**
- Stable patterns and conventions
- Key architectural decisions
- Important file paths
- Project structure

**User Preferences**
- Preferred tools and workflows
- Communication style
- Coding preferences

**Solutions & Insights**
- Debugging techniques that work
- Recurring problem solutions
- Important findings

### What NOT to Save

- Session-specific context
- Temporary state
- Incomplete information
- Duplicate information

## Best Practices

1. **Organize semantically** - Group by topic, not chronologically
2. **Keep concise** - MEMORY.md limited to ~200 lines
3. **Use topic files** - Detailed notes in separate files
4. **Update regularly** - Remove outdated info
5. **Link references** - Reference topic files from MEMORY.md

## Usage with MCP

This project has memory MCP configured:
- `mcp__memory__create_entities` - Create knowledge nodes
- `mcp__memory__create_relations` - Link related entities
- `mcp__memory__search_nodes` - Search knowledge graph
- `mcp__memory__read_graph` - Read all stored knowledge
