# MCP 配置说明

本项目已配置的 MCP 服务器（全局设置）：

## 已启用
- `mcp__context7__*` - 文档查询（Spring Boot, Next.js 等）
- `mcp__github__*` - GitHub 操作
- `mcp__sqlite__*` - SQLite 数据库操作
- `mcp__filesystem__*` - 文件系统操作
- `mcp__fetch__*` - HTTP 请求
- `mcp__memory__*` - 知识图谱
- `mcp__playwright__*` - 浏览器自动化

## 推荐添加（需在 Claude Code 设置中配置）

### 1. 数据库连接 (MySQL)
```json
{
  "mysql": {
    "command": "uvx",
    "args": ["mcp-server-mysql", "--host", "localhost", "--port", "3306", "--user", "root", "--password", "${env:DB_PASSWORD}"]
  }
}
```

### 2. 代码搜索
```json
{
  "searchcode": {
    "command": "npx",
    "args": ["-y", "@modelcontexttool/server-search"]
  }
}
```

### 3. 实用工具集合
```json
{
  "everart": { "command": "npx", "args": ["-y", "@modelcontexttool/server-everart"] },
  "time": { "command": "npx", "args": ["-y", "@modelcontexttool/server-time"] },
  "aws-kb-retrieval": { "command": "npx", "args": ["-y", "@modelcontexttool/server-aws-kb-retrieval-server"] }
}
```

## 启用方式
在 Claude Code 设置中添加 `mcpServers` 配置块。
