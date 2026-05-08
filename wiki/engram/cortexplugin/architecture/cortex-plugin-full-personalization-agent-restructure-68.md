---
id: 68
type: architecture
project: cortexplugin
scope: project
topic_key: ""
session_id: manual-save-cortexplugin
created_at: "2026-05-08 13:26:32"
updated_at: "2026-05-08 13:26:32"
revision_count: 1
tags:
  - cortexplugin
  - architecture
aliases:
  - "Cortex Plugin — Full personalization + agent restructure"
---

# Cortex Plugin — Full personalization + agent restructure

**What**: Complete personalization of the Cortex Plugin to work with the Mariachi Union Documentation project, plus agent architecture restructure.

**Documentation Personalization**:
1. Ingested all 3 Documentation files into Engram memory: Course1.md (#65), AttempterGuidelines.md (#66), CommonErrors.md (#67)
2. Copied source files to raw/ for version tracking
3. Added 3 Document nodes + 12 links to Graphify knowledge graph
4. Created scripts/reingest-docs.sh for future documentation updates

**Agent Restructure (4 primary → 2 primary + 2 subagents)**:
- opencode.json: Removed mu-attempter and mu-qc-reviewer as primary agents. Now only mu-planner and mu-architect
- @MU-Planner (Tab 1): Read-only, research, planning. Now spawns @MU-Attempter and @MU-QC-Reviewer via task()
- @MU-Architect (Tab 2): Full access, blueprint design. Can also spawn @MU-Attempter
- @MU-Attempter (subagent): Role definition preserved in .opencode/agents/mu-attempter.md, spawned via task()
- @MU-QC-Reviewer (subagent): Role definition preserved in .opencode/agents/mu-qc-reviewer.md, spawned via task()
- Updated: AGENTS.md, SYSTEM-MAP.md, USER-GUIDE.md, mu-planner.md, mu-architect.md, mu-attempter.md, mu-qc-reviewer.md

**Why**: The Cortex plugin was only partially integrated with the Documentation (wiki content was hand-created, no systematic ingestion). The 4-agent Tab system was overengineered when 2 primary agents + subagent spawning suffices.

**Where**: CortexPlugin/ root files + .opencode/agents/ + raw/ + wiki/graph/graph.json + scripts/

**Learned**: Subagent delegation via task() is more flexible than having 4 primary Tab agents. The spawning agent includes the subagent's role definition in the task() prompt. No changes needed to the OpenCode platform itself.

---
*Session*: [[session-manual-save-cortexplugin]]
