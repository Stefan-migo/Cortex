---
id: 83
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 17:44:23"
updated_at: "2026-05-08 17:44:23"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Phase 4: Brain Evolution commands"
---

# Phase 4: Brain Evolution commands

**What**: Implemented Phase 4 (Brain Evolution) of the Cortex CLI — cortex update, cortex analyze, cortex close --retrospective

**Why**: Self-improving brain with template updates, session analysis, and retrospective generation

**Where**:
- src/commands/update.ts — cortex update command (template diff/apply with --dry-run, --force, --check)
- src/commands/analyze.ts — cortex analyze command (session pattern analysis with --json, --sessions, --dry-run)
- src/commands/close.ts — added --retrospective flag for post-session retrospective generation
- src/engine/session.ts — added generateRetrospective() and saveRetrospective() functions
- src/engine/manifest.ts — added detectChanges() function for template comparison
- src/engine/template.ts — exported collectFiles()
- src/index.ts — registered update and analyze commands, added retrospective flag to close
- scripts/generate-retrospective.sh — convenience bash wrapper
- src/template/scripts/generate-retrospective.sh — same script bundled in template
- package.json — updated description, added preferGlobal

**Learned**: TEMPLATE_DIR path resolution in bundled code uses __dirname from dist/ so join(__dirname, '..', 'template') resolves correctly. Commander options with default values need --sessions <n> not --sessions <count>. typecheck + esbuild both pass cleanly.

---
*Session*: [[session-manual-save-cortexplugin]]
