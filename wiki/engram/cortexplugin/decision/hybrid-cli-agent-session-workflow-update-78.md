---
id: 78
type: decision
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 16:14:09"
updated_at: "2026-05-08 16:14:09"
revision_count: 1
tags:
  - cortexplugin
  - decision
aliases:
  - "Hybrid CLI + agent session workflow update"
---

# Hybrid CLI + agent session workflow update

**What**: Updated all agent prompts and template files to reflect new hybrid CLI + agent session management workflow. `cortex start` handles session creation/context pre-loading/OpenCode launch; `cortex close` handles finalization/summary/wiki export. Agents still own content decisions via mem_save.

**Why**: The cortex CLI now handles session lifecycle infrastructure, removing the need for agents to manually call mem_session_start/end. Agents focus on what discoveries to save and when a session is done.

**Where**: 
- .opencode/agents/cortex-developer.md (live)
- .opencode/agents/cortex-planner.md (live)
- AGENTS.md (live)
- cli/src/template/.opencode/agents/cortex-developer.md (build source)
- cli/src/template/.opencode/agents/cortex-planner.md (build source)
- cli/src/template/AGENTS.md (build source)
- cli/template/.opencode/agents/cortex-developer.md (runtime)
- cli/template/.opencode/agents/cortex-planner.md (runtime)
- cli/template/AGENTS.md (runtime)

**Learned**: There are 3 layers of template files: live `.opencode/` agents, `cli/src/template/` build sources, and `cli/template/` runtime copies loaded by the dist bundle. All 3 need updating for changes to take effect.

---
*Session*: [[session-manual-save-cortexplugin]]
