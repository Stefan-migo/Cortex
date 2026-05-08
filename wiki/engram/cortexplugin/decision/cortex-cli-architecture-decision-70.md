---
id: 70
type: decision
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 14:36:56"
updated_at: "2026-05-08 14:36:56"
revision_count: 1
tags:
  - cortexplugin
  - decision
aliases:
  - "Cortex CLI architecture decision"
---

# Cortex CLI architecture decision

**What**: Decided to build a `cortex` CLI tool — not a standalone harness, but a project manager + context curator that wraps OpenCode. Commands: init, start, close, update, install, analyze, status.

**Why**: OpenCode is a powerful engine but lacks structured project setup, session lifecycle automation, and intelligent context curation. The CLI packages the existing CortexPlugin brain into a reusable template, automates start/close session lifecycle, and provides dynamic context assembly from Engram + Graphify + Spec-Kit. This gives 90% of the ARCHITECTURE.md vision at 10% of the cost of building a full harness.

**Where**: New package in this repo or dedicated repo. TypeScript/Node.js CLI using commander + esbuild. Distributed via npm.

**Key constraints**: Not building: Go TUI, custom agent loop, sandbox engine, LLM provider, MCP protocol. Template is the source of truth — the CLI bundles the same files from CortexPlugin.

**Phases**: 
1. Core scaffolding (cortex init) — Week 1
2. Session lifecycle (cortex start/close) — Week 2
3. Dynamic context assembly — Week 3
4. Brain evolution (cortex update/analyze) — Week 4+

---
*Session*: [[session-manual-save-cortexplugin]]
