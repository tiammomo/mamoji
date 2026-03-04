---
name: github-integration
description: 'Complete GitHub integration for repository management, issues, pull requests, and code operations.'
---

# GitHub Integration

Complete GitHub operations including repository management, issues, pull requests, and code operations.

## Available Operations

### Repository Management
- Create new repositories
- Fork repositories
- List repositories
- Search repositories
- Get repository contents

### Issue Management
- Create issues
- List issues (open/closed/all)
- Update issue status
- Add comments to issues
- Search issues

### Pull Requests
- Create pull requests
- List pull requests
- Get pull request details
- Add reviews and comments
- Merge pull requests
- View pull request files and changes

### Code Operations
- Search code across repositories
- Get file contents
- Create/update files
- Manage branches

## Best Practices

- Always verify before making destructive operations
- Use descriptive titles and detailed descriptions
- Link related issues in PRs
- Review changes before committing
- Maintain clear commit messages

## Usage with MCP

This project has GitHub MCP configured. Use the following tools:
- `mcp__github__*` - All GitHub operations
- Always authenticate before operations
- Handle rate limiting gracefully
