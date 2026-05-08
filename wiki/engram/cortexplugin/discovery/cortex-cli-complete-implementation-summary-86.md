---
id: 86
type: discovery
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 18:01:35"
updated_at: "2026-05-08 18:01:35"
revision_count: 1
tags:
  - cortexplugin
  - discovery
aliases:
  - "Cortex CLI: Complete implementation summary"
---

# Cortex CLI: Complete implementation summary

**What**: Built the complete cortex CLI tool across 4 phases in a single session. 8 commands, 15 source files, ~2500 lines of TypeScript, 74-file template bundle. Running at /home/stefan/CortexPlugin/cli/

**Key architectural decisions made this session**:
1. NOT building a full harness — wrapping OpenCode instead saves months of work while getting 90% of the value
2. MCP client is minimal (only initialize + callTool) rather than a full framework — sufficient for Engram + Graphify communication
3. Smart context ranking (recency*0.4 + type*0.3 + relevance*0.3) is simple but effective for v1
4. Template evolution via SHA256 manifest tracking enables the self-improving brain without complex diffing
5. Every component degrades gracefully — no single point of failure

**What was built**:
- Phase 1: cortex init + install — project scaffolding
- Phase 2: cortex start + close — session lifecycle 
- Phase 3: cortex status + smart prelude — dynamic context assembly
- Phase 4: cortex update + analyze — brain evolution + retrospectives

**Notable gotchas**:
- Engram MCP responses need JSON unwrapping (content array → text field)
- Force overwrite needs .git directory cleanup
- esbuild bundles code but template files need separate copy step
- OpenCode TUI breaks in non-TTY environments — need --no-open flag

---
*Session*: [[session-manual-save-cortexplugin]]
