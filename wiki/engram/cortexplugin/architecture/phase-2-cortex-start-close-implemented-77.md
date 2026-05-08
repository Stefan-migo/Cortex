---
id: 77
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 15:33:22"
updated_at: "2026-05-08 15:33:22"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 2: cortex start/close implemented"
---

# Phase 2: cortex start/close implemented

**What**: Implemented Phase 2 of the cortex CLI — `cortex start` and `cortex close` commands. Adds full session lifecycle automation: Engram MCP session start/end, dynamic context prelude assembly, OpenCode launch, and wiki export.

**Why**: Automates the session lifecycle that previously required manual agent steps. `cortex start` prepares context from Engram + Graphify + Spec-Kit before OpenCode even launches. `cortex close` auto-finalizes the session and exports to wiki.

**Where**:
- src/utils/mcp.ts — Minimal MCP client for Engram JSON-RPC communication
- src/engine/session.ts — Session lifecycle (openSession, closeSession, getSessionInfo)
- src/engine/context.ts — Context assembly pipeline (Engram context, Graphify report, Spec-Kit tasks)
- src/commands/start.ts — cortex start (validate, session start, prelude, opencode launch)
- src/commands/close.ts — cortex close (session end, wiki export, cleanup)

**Key architectural decisions**:
- MCP client only implements what's needed (initialize + callTool) — not a full framework
- Engram context fetched via CLI `engram context <project>` for simplicity
- Session lifecycle via MCP (mem_session_start/summary/end) since no CLI equivalents exist
- Every component degrades gracefully — if Engram or Graphify unavailable, it warns and continues
- --no-open flag for non-interactive preparation without launching OpenCode TUI
- opencode.json instructions are temporarily modified to inject .cortex/prelude.md and restored on close

---
*Session*: [[session-manual-save-cortexplugin]]
