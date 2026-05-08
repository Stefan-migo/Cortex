---
id: 10
type: config
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 11:13:24"
updated_at: "2026-05-08 11:13:24"
revision_count: 1
tags:
  - cortexplugin
  - config
aliases:
  - "Graphify MCP server setup and fix"
---

# Graphify MCP server setup and fix

**What**: Fixed Graphify MCP server to make it available. Created graph.json, installed 'mcp' Python package, built a document-level knowledge graph from markdown files, and installed git hooks.

**Why**: The graphify MCP was configured in opencode.json but couldn't start because:
1. `wiki/graph/graph.json` didn't exist (empty directory with only .gitkeep)
2. The `mcp` Python package wasn't installed (graphify.serve requires it)

**Where**: 
- `wiki/graph/graph.json` — created with 21 nodes (markdown docs) and 61 edges (co-location + cross-references)
- `wiki/graph/GRAPH_REPORT.md` — generated graph report
- `graphify-out/` — compatibility copy for standard graphify output paths
- `AGENTS.md` — graphify section appended by `graphify opencode install`
- `.git/hooks/post-commit`, `.git/hooks/post-checkout` — graphify git hooks installed

**Learned**: This Cortex project is a meta-configuration project with markdown-heavy content (no source code files with recognized extensions like .py, .ts, .js). The graphify AST extraction can't process markdown natively (only code files), so a custom document graph was built. The MCP server was verified to start correctly.

---
*Session*: [[session-manual-save-cortexplugin]]
