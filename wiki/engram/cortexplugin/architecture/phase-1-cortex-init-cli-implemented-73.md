---
id: 73
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 14:52:50"
updated_at: "2026-05-08 14:52:50"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 1: cortex init CLI implemented"
---

# Phase 1: cortex init CLI implemented

**What**: Implemented Phase 1 of the cortex CLI tool — `cortex init` and `cortex install` commands. Created at /home/stefan/CortexPlugin/cli/

**Why**: Automates the "set up a brain for every new project" pain point. One command creates a fully functional Cortex project with AGENTS.md, MCP config, agents, tools, Spec-Kit, wiki, and scripts.

**Where**: /home/stefan/CortexPlugin/cli/ — TypeScript CLI with commander, esbuild bundling. Template source at src/template/ (74 files).

**Architecture**:
- src/commands/init.ts — Template copy + var substitution + manifest + git init
- src/commands/install.ts — Dependency checker (Engram, Graphify, Spec-Kit, Node)
- src/engine/template.ts — File copier with {PROJECT_NAME}, {DATE}, {YEAR}, {PROJECT_NAME_KEBAB} substitution
- src/engine/manifest.ts — .cortex/manifest.json with SHA256 tracking
- src/engine/deps.ts — Binary/package presence checks

**Learned**: esbuild bundles code but template files need separate copy step. Git needs user.name/user.email config fallback for the initial commit. homedir() is from 'os' module, not 'path'.

---
*Session*: [[session-manual-save-cortexplugin]]
