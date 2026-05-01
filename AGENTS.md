# Cortex — Multi-Agent Development System

## System Overview

This is a **generic multi-agent coding framework** that covers the full development lifecycle:

| Capability | How it works | Components |
|------------|-------------|------------|
| **Long-term memory** | Persistent markdown wiki + append-only log + session summaries | `wiki/`, `@ingest-agent`, `@lint-agent`, session-memory skill |
| **Information query** | Catalog-driven search, graph navigation, cross-referenced knowledge | `wiki/index.md`, wiki-search tool, `@researcher`, wiki-query skill |
| **Task planning** | Spec-driven phase lifecycle with atomic execution | GSD (65 commands), `planning` skill, `.planning/` artifacts |
| **Context discipline** | File-based working memory, error logging, plan re-reading | `planning-with-files` skill, 3-file pattern, hook guards |
| **Code understanding** | Knowledge graph from AST + semantic extraction | Graphify (`/graphify .`), `wiki/graph/` |
| **Auto-maintenance** | Self-linting, contradiction detection, proactive suggestions | `AGENTS.md` self-maint rules, `@lint-agent`, schema/ policies |
| **Code quality** | Review, debug, security audit agents | `@reviewer`, `@debugger`, `@sec-auditor` |
| **Design system** | Token-based UI generation, brand consistency | `DESIGN.md`, design-system skill |
| **Cross-session** | STATE.md + log.md restore context after /clear | session-memory skill, session-recover tool |
| **Obsidian integration** | Visual graph view, [[wikilinks]], Dataview dashboards | `.obsidian/` config, wiki schema |

This is a **template**, not a fixed project. You clone it to start any new project, then specialize it.

## Project Architecture
This project uses a three-layer knowledge architecture:
- `raw/` — Immutable source documents. The LLM reads from here but never modifies.
- `wiki/` — A maintained markdown wiki. The LLM owns this layer: creates, updates, cross-references.
- `schema/` — Configuration files that define wiki structure, agent behavior, and editorial policies.

## Directory Structure
```
root/
├── AGENTS.md                       # This file — rules loaded every session
├── SYSTEM-MAP.md                   # Visual reference of all tools and when to use them
├── USER-GUIDE.md                   # Complete usage guide
├── DESIGN.md                       # Design system specification
├── opencode.json                   # OpenCode agent/permission/MCP config
├── .opencode/
│   ├── agents/                     # 8 core + 33 GSD subagent definitions
│   ├── command/                    # 65 GSD commands (/gsd-*)
│   ├── skills/                     # 8 SKILL.md workflow guides
│   ├── tools/                      # 3 custom TypeScript tools
│   └── plugins/                    # Graphify hook plugin
├── scripts/                        # CLI setup & utility scripts
├── .planning/                      # Planning artifacts (shared with GSD)
│   ├── PROJECT.md                  # Project vision & goals
│   ├── ROADMAP.md                  # Phase roadmap with status
│   ├── STATE.md                    # Current position, decisions, blockers
│   ├── ARCHIVE.md                  # Completed milestones
│   ├── templates/                  # Plan & research templates
│   └── sessions/                   # Per-session plan files
├── wiki/                           # Knowledge base (the "compounding artifact")
│   ├── index.md                    # Content-oriented catalog of all pages
│   ├── log.md                      # Append-only chronological record
│   ├── concepts/                   # Technology & domain concept pages
│   ├── entities/                   # Code entities (classes, functions, modules)
│   ├── sources/                    # Source document summaries
│   ├── sessions/                   # Session summaries & knowledge capture
│   ├── decisions/                  # Architecture Decision Records (ADRs)
│   ├── dashboards/                 # Automated dashboards
│   └── graph/                      # Knowledge graph outputs
├── raw/                            # Immutable source materials
│   └── assets/                     # Local images/media
├── schema/
│   ├── wiki-schema.md              # Wiki structure conventions
│   ├── agent-behavior.md           # Cross-agent coordination
│   └── editor-policy.md            # Source quality thresholds
└── .obsidian/                      # Obsidian vault config
```

## Self-Maintenance: How This System Manages Itself

This system is self-aware. You have access to specific tools and should use them proactively.

### Toolkit Summary

| Tool | Type | How to invoke | Use for |
|------|------|---------------|---------|
| GSD planner | 65 commands | `/gsd-*` | Feature development, planning, execution |
| Planning discipline | Skill + hooks | `skill({name:"planning-with-files"})` | Context discipline: re-read plan, save findings, log errors |
| Knowledge base | wiki/ + agents | `@ingest-agent`, `@lint-agent`, `@researcher` | Ingesting, querying, maintaining wiki |
| Code mapper | Slash command | `/graphify .` | Understanding codebase structure |
| Design system | File + skill | `skill({name:"design-system"})` + DESIGN.md | UI generation |
| Code quality | 3 agents | `@reviewer`, `@debugger`, `@sec-auditor` | Review, debug, security audit |
| Memory | Files + skill | `skill({name:"session-memory"})` | Cross-session persistence |
| Project bootstrap | Skill | `skill({name:"bootstrap"})` | Initialize template for a new project |
| Planning knowledge | Skill | `skill({name:"planning"})` | Structured planning guidance |
| Wiki operations | 3 skills | `skill({name:"wiki-*"})` | Ingest, query, lint procedures |

### Proactive Behavior Rules

**At session start, do this automatically:**
1. Read `.planning/STATE.md` for current position
2. Read `wiki/log.md` for recent activity (last 5 entries)
3. Read `.planning/ROADMAP.md` for phase status
4. Present a brief session-start summary: current phase, last activity, suggested next action

**During the session, proactively:**
- If the user mentions a new codebase → suggest running `/graphify .`
- If the wiki has >10 pages and lint hasn't run recently → suggest `@lint-agent`
- If the user describes a complex task → suggest `/gsd-new-project` or `/gsd-quick`
- If the user mentions a bug → suggest `@debugger`
- If building UI → read DESIGN.md and apply design-system skill
- If user asks about decisions → check `wiki/decisions/` for ADRs
- If the project just started (no project context in AGENTS.md) → suggest running the bootstrap skill
- If the user says "start a new project" or "adapt this system" → load the bootstrap skill automatically

**At session end (before /clear or closing), do this:**
1. Summarize what was accomplished
2. Write session summary to `wiki/sessions/{date}-{slug}.md`
3. Append to `wiki/log.md`
4. Update `.planning/STATE.md` with latest position

### Maintenance Schedule

| Task | Frequency | How |
|------|-----------|-----|
| Wiki lint | Weekly | `@lint-agent Full lint` |
| Graphify update | After major refactors | `/graphify . --update` |
| GSD update | Monthly | `/gsd-update` |
| Index cleanup | Monthly | Check wiki/index.md covers all existing pages |
| AGENTS.md review | Per milestone | Run `/init` to refresh |

## Workflow

### 1. New Feature / Task
Discuss → Plan → Execute → Verify → Ingest

### 2. Knowledge Management
Ingest → Query → Lint (periodic loop)

### 3. Daily Session
1. Read `.planning/STATE.md` and `wiki/log.md` to restore context
2. Read `.planning/ROADMAP.md` for current phase
3. Check `wiki/index.md` for relevant knowledge
4. Work on current phase
5. Update `.planning/STATE.md` and `wiki/log.md` before closing

## Agent Invocation
Use `@agent-name` to invoke subagents:
- `@researcher` — Deep research on technical topics
- `@architect` — System design and architecture decisions
- `@reviewer` — Code review and quality assurance
- `@implementer` — Focused implementation from structured plans
- `@debugger` — Bug investigation and root cause analysis
- `@sec-auditor` — Security vulnerability scanning
- `@ingest-agent` — Wiki ingestion pipeline
- `@lint-agent` — Wiki health checks

Switch primary agents with Tab key: Build (full tools) / Plan (read-only).

## Skill Invocation
Skills are loaded on-demand via the skill tool. Key skills:
- `bootstrap` — Initialize template for a new project (ask questions, self-modify)
- `planning` — GSD-style Discuss → Plan → Execute → Verify lifecycle
- `wiki-ingest` — Guide for ingesting sources into the wiki
- `wiki-query` — Query patterns for navigating the wiki
- `wiki-lint` — Health checks and contradiction detection
- `graphify` — Knowledge graph integration
- `design-system` — UI/UX design intelligence
- `session-memory` — Cross-session persistence and recovery

## Wiki Management
- The wiki is a persistent, compounding artifact. Always update it after significant work.
- `wiki/index.md` is the content catalog — update it when pages are added or changed.
- `wiki/log.md` is the chronological record — append to it after every session.
- Use [[Obsidian wikilinks]] for cross-references between wiki pages.
- Source claims in wiki pages must cite the original source in `raw/` or `wiki/sources/`.
- Save useful answers back to the wiki so knowledge compounds instead of disappearing into chat history.
- Run `wiki-lint` periodically to check for contradictions, orphans, and stale claims.

## Planning Conventions
- Use `.planning/` for all planning artifacts — never keep plans only in context.
- Each phase: Discuss → Research → Plan → Execute → Verify.
- Plans should be small enough to fit in a fresh context window.
- Every task gets its own atomic commit.
- Update `.planning/STATE.md` after every significant change.

## Coding Standards
- Run lint/typecheck before considering work complete.
- Follow the project's existing code conventions.
- Atomic commits: one concern per commit, descriptive messages.
- Write tests alongside implementation.
