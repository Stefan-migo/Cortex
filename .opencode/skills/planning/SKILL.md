---
name: planning
description: GSD-style Discuss → Plan → Execute → Verify lifecycle for feature development
license: MIT
compatibility: opencode
metadata:
  workflow: development
  audience: all agents
---

## What It Does
Manages the full feature development lifecycle using persistent markdown files in `.planning/`.

## Lifecycle Stages

### 1. Discuss
Before any planning, capture the user's vision and preferences. This shapes everything downstream.
- Ask clarifying questions about the feature
- Surface gray areas based on what's being built
- Write the output as `{phase_num}-CONTEXT.md`

### 2. Research (optional)
Investigate implementation approaches, library options, and pitfalls.
- Use `@researcher` agent for deep investigation
- Save findings as `{phase_num}-RESEARCH.md`

### 3. Plan
Create atomic, verifiable task plans.
- Each plan must be small enough for a fresh context window
- Structure plans using XML format
- Include verification steps and done criteria
- Save as `{phase_num}-{N}-PLAN.md`

### 4. Execute
Run plans in parallel waves (independent plans run together).
- Group plans into waves by dependency
- Each plan runs in a subagent with fresh context
- Atomic commits per task
- Save summary as `{phase_num}-{N}-SUMMARY.md`

### 5. Verify
Human confirmation that the work actually works.
- Extract testable deliverables
- Walk through each one with the user
- If issues found, create fix plans
- Save as `{phase_num}-VERIFICATION.md`

## Phase File Structure
```
.planning/
├── PROJECT.md           # Vision, goals, tech stack
├── ROADMAP.md           # Phases with status: [planned|active|done]
├── STATE.md             # Current position, decisions, blockers
├── ARCHIVE.md           # Completed milestone summaries
├── templates/
│   ├── task-plan.md     # XML task plan template
│   ├── phase-research.md
│   └── phase-plan.md
└── sessions/
    └── 001-{feature}/   # Per-feature session files
```

## File Conventions
- `STATE.md` updated after every significant change
- `ROADMAP.md` phases marked [active] when working, [done] when complete
- `ARCHIVE.md` appended on milestone completion, then tagged
- Plans written as XML for precise instruction parsing
