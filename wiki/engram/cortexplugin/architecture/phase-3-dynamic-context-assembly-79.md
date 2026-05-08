---
id: 79
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 16:28:39"
updated_at: "2026-05-08 16:28:39"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 3: Dynamic Context Assembly"
---

# Phase 3: Dynamic Context Assembly

**What**: Implemented Phase 3 (Dynamic Context Assembly) for the Cortex CLI — smart context ranking, token budget, Graphify MCP integration, and cortex status command.

**Why**: The old buildPrelude() appended all sources without prioritization. Phase 3 scores and prunes content using a recency/type/relevance algorithm.

**Where**: 
- cli/src/engine/context.ts — Rewritten with ContextItem interface, scoring algorithm (recency*0.4 + type*0.3 + relevance*0.3), token budget (4000 default, configurable via .cortex/config.json contextBudget), Graphify MCP integration with static fallback
- cli/src/commands/status.ts — New file: cortex status (text + --json output) showing project, session, engram, graphify, speckit, wiki, tool versions
- cli/src/index.ts — Added status command registration

**Learned**: Engram MCP mem_context returns unstructured content that needs stringify for the prelude. Graphify.serve MCP integration requires graceful fallback to static GRAPH_REPORT.md parsing when python3 -m graphify.serve is unavailable. The status command degrades gracefully when tools/components are missing.

---
*Session*: [[session-manual-save-cortexplugin]]
