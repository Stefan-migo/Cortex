---
id: 81
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 16:30:50"
updated_at: "2026-05-08 16:30:50"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 3: Dynamic Context Assembly implemented"
---

# Phase 3: Dynamic Context Assembly implemented

**What**: Implemented Phase 3 of the cortex CLI — smart context ranking with scoring algorithm (recency*0.4 + type*0.3 + relevance*0.3), token budget allocation (4000 default, configurable), Graphify MCP integration with static fallback, Engram MCP integration for live context, and `cortex status` command with JSON output.

**Why**: The previous context prelude just appended everything without prioritization. Phase 3 makes it intelligent — ranks memories by relevance, prunes low-value content, and queries live MCP servers for current data instead of reading stale files.

**Where**:
- src/engine/context.ts — Rewritten with ContextItem interface, scoring, token budget, MCP integrations for Engram + Graphify
- src/commands/status.ts — New: brain health overview (project, session, engram, graphify, speckit, wiki, tools)
- src/index.ts — Updated with status command

**Key architectural decisions**:
- Score transparency: each prelude item shows source, score, and type
- Graceful degradation: MCP-first → CLI fallback → static file fallback
- Rough token counting (len/4) sufficient for budget allocation
- Budget footer shows "X more items truncated" when exceeding limit

---
*Session*: [[session-manual-save-cortexplugin]]
