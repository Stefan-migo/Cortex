---
id: 69
type: bugfix
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 13:33:36"
updated_at: "2026-05-08 13:33:36"
revision_count: 1
tags:
  - cortexplugin
  - bugfix
aliases:
  - "Fixed Graphify MCP -32000 Connection closed error"
---

# Fixed Graphify MCP -32000 Connection closed error

**What**: Fixed the Graphify MCP server "-32000: Connection closed" error in OpenCode.

**Root cause**: The `_filter_blank_stdin()` function in `graphify.serve` creates a relay thread that duplicates stdin (fd 0) through an OS pipe. This causes a deadlock when OpenCode launches the MCP server via stdio, because the pipe relay blocks the initialization handshake.

**Fix**: Created `scripts/graphify-mcp-wrapper.py` that monkey-patches `_filter_blank_stdin` to be a no-op (`lambda: None`) before calling `serve()`. The blank-line filtering is only needed for Claude Desktop (which sends empty lines between JSON-RPC messages); OpenCode doesn't need it.

**Changed**: opencode.json — graphify command changed from `["python3", "-m", "graphify.serve", ...]` to `["python3", "scripts/graphify-mcp-wrapper.py", ...]`

**Verified**: All 7 tools work (query_graph, get_node, get_neighbors, get_community, god_nodes, graph_stats, shortest_path). Graph loads with 24 nodes, 73 edges.

**Where**: CortexPlugin/scripts/graphify-mcp-wrapper.py, CortexPlugin/opencode.json

---
*Session*: [[session-manual-save-cortexplugin]]
