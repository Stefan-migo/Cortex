---
id: 71
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 14:49:34"
updated_at: "2026-05-08 14:49:34"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Cortex CLI — Phase 1 Scaffolding"
---

# Cortex CLI — Phase 1 Scaffolding

**What**: Built Phase 1 of the Cortex CLI tool (cortex-brain) at cli/
**Why**: Provides `cortex init` and `cortex install` commands for scaffolding new Cortex projects
**Where**: cli/ — src/{index.ts,commands/{init.ts,install.ts},engine/{template.ts,manifest.ts,deps.ts},utils/{logger.ts,config.ts}} plus full template directory
**Learned**: 
- esbuild bundles code but template directory needs separate copy step at build time
- `.opencode/.gitignore` in original repo ignores package.json files which need special handling in template
- `homedir()` is from `os` not `path` in modern Node.js
- Template files need careful variable substitution with `{PROJECT_NAME}`, `{DATE}`, `{YEAR}` placeholders
- SHA256 hashes in manifest work well for tracking file changes across template versions

---
*Session*: [[session-manual-save-cortexplugin]]
