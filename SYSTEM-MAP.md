# Cortex — System Map

How every component of the Cortex multi-agent system works, when to use it, and how to maintain it.

---

## How to Start a New Project from Cortex

**Step 1:** Clone the Cortex repo into your new project directory
```bash
git clone <cortex-repo> my-new-project
cd my-new-project
rm -rf .git
git init
```

**Step 2:** Run the setup script (optional — handles boilerplate files)
```bash
./scripts/setup.sh
```

**Step 3:** Open OpenCode and tell the agent to adapt
```
I just set up a new project called MyApp. It's a web app built with TypeScript and React.
Adapt this system for my project.
```

**Step 4:** The agent reads the bootstrap skill, asks you questions, and self-modifies.

## Architecture Overview

```
                        ┌──────────────────────┐
                        │       THE BRAIN       │
                        │    AGENTS.md (rules)  │
                        │  opencode.json (cfg)  │
                        │  schema/ (policies)   │
                        └──────┬───────────────┘
                               │ loads every session
          ┌────────────────────┼────────────────────┬──────────────────┐
          │                    │                    │                  │
   ┌──────▼──────┐    ┌───────▼───────┐    ┌───────▼───────┐  ┌──────▼───────┐
   │   PLANNER   │    │  DISCIPLINE   │    │  KNOWLEDGE    │  │ CODE MAPPER │
   │             │    │               │    │               │  │              │
   │  GSD cmds   │    │Planning-Files │    │  wiki/        │  │  Graphify    │
   │  .planning/ │    │ re-read plan  │    │  @ingest      │  │  /graphify   │
   │             │    │ log errors    │    │  @lint        │  │              │
   └─────────────┘    │ verify before │    └───────┬───────┘  └──────────────┘
          │           │  stopping     │           │                    │
          │           └───────────────┘           │                    │
          │                    │             ┌─────▼──────┐           │
          │                    │             │  MEMORY    │           │
          │                    │             │            │           │
          └────────────────────┼─────────────┤ STATE.md   ├───────────┘
                               │             │ log.md     │
                               │             │ sessions/  │
                               │             └────────────┘
                               │
                         ┌─────▼──────┐
                         │   DESIGN   │
                         │ DESIGN.md  │
                         └────────────┘
```

---

## 1. THE BRAIN (AGENTS.md + opencode.json + schema/)

**What it is:** The configuration that loads every session. It tells the agent:
- What the project is about
- What files exist and what they mean
- What agents/skills/tools are available
- How to behave

**How to use it:** It loads automatically when OpenCode starts. You don't invoke it directly.

**When to use it:** Every session. The agent reads it without you asking.

**How to maintain it:**
- Run `/init` in OpenCode to regenerate AGENTS.md
- Edit `schema/wiki-schema.md`, `schema/agent-behavior.md`, `schema/editor-policy.md` to change policies
- Edit `opencode.json` to add/modify agents, permissions, MCP servers

---

## 2. PLANNER (GSD commands)

**What it is:** An automated system for planning and building features using slash commands.

**Tools installed:** 65 commands in `.opencode/command/`, 33 subagents in `.opencode/agents/`

### How to use it:

| Step | Command | What it does |
|------|---------|-------------|
| Start | `/gsd-new-project` | Creates PROJECT.md, ROADMAP.md, STATE.md |
| Discuss | `/gsd-discuss-phase 1` | Captures your preferences before planning |
| Plan | `/gsd-plan-phase 1` | Researches + creates task plans |
| Build | `/gsd-execute-phase 1` | Implements in parallel waves, atomic commits |
| Verify | `/gsd-verify-work 1` | Walks through testable deliverables |
| Ship | `/gsd-ship 1` | Creates PR |

### When to use it:
- **New features** that need multiple steps
- **Complex tasks** where you want automated planning
- **Brownfield projects** — first run `/gsd-map-codebase` to analyze existing code

### When NOT to use it:
- Simple 1-2 file changes (use Build mode directly)
- Research/knowledge work (use agents directly)

### How to maintain it:
```
/gsd-update
```

---

## 3. PLANNING DISCIPLINE (Planning with Files)

**What it is:** A behavioral layer that tells the agent *how* to work during planning sessions — not *what* to build, but *how* to behave. It complements GSD by adding context discipline.

**Skill:** `skill({name:"planning-with-files"})`

### Core Principles

| Rule | What it means |
|------|---------------|
| **Create Plan First** | Never start a complex task without a `task_plan.md` |
| **2-Action Rule** | Save findings to `findings.md` after every 2 view/browser operations |
| **Log ALL Errors** | Every error goes into the plan file — they help avoid repetition |
| **Never Repeat Failures** | Track attempts, mutate approach |

### How it works
When loaded, the skill adds these behaviors to planning sessions:

1. Create 3 files for every complex task:
   - `task_plan.md` → Track phases and progress with checkboxes
   - `findings.md` → Store research and findings
   - `progress.md` → Session log and test results

2. Re-read the plan before major decisions (PreToolUse behavior)
3. Remind to update status after file writes (PostToolUse behavior)
4. Verify completion before stopping (Stop behavior)

### When to use it:
- **Multi-step tasks** (3+ steps)
- **Research tasks** that span many tool calls
- **Building/creating** complex features
- **Tasks spanning multiple sessions**

### When NOT to use it:
- Simple questions
- Single-file edits
- Quick lookups

### How to maintain it:
The skill is loaded on-demand — no maintenance needed. Update via:
```
npx skills add OthmanAdi/planning-with-files --skill planning-with-files -g
```

---

## 4. KNOWLEDGE BASE (wiki/)

**What it is:** A persistent markdown wiki that compounds knowledge over time. The agent writes it; you read it.

**Files:**
| File | Purpose |
|------|---------|
| `wiki/index.md` | Catalog of all wiki pages |
| `wiki/log.md` | Chronological activity log |
| `wiki/concepts/` | Technology and domain concepts |
| `wiki/sources/` | Source document summaries |
| `wiki/sessions/` | Session summaries |
| `wiki/decisions/` | Architecture decisions (ADRs) |

### How to use it:

| Action | How | What happens |
|--------|-----|-------------|
| Add knowledge | `@ingest-agent Ingest this article from raw/` | Agent reads source, writes wiki pages, updates index + log |
| Find knowledge | Ask naturally: "What do we know about auth?" | Agent uses wiki-query skill, searches index.md, drills into pages |
| Health check | `@lint-agent Run a full wiki lint` | Agent checks contradictions, orphans, broken links, stale claims |

### When to use it:
- **Ingest**: After every significant work session or when you add a source document
- **Query**: Whenever you need context about the project
- **Lint**: Weekly, or when you notice wiki is getting messy

### How to maintain it:
```
@lint-agent Run a full wiki lint
```
Then ask:
```
@ingest-agent Fix the issues found by lint
```

---

## 5. CODE MAPPER (Graphify)

**What it is:** A tool that reads your codebase and builds a knowledge graph showing how everything connects.

**Command:** `/graphify .`

**Output:**
| File | What it is |
|------|------------|
| `wiki/graph/graph.html` | Interactive visualization (open in browser) |
| `wiki/graph/GRAPH_REPORT.md` | Text summary with god nodes, communities, surprises |
| `wiki/graph/graph.json` | Machine-readable graph data |

### How to use it:

| Action | Command | When |
|--------|---------|------|
| First run | `/graphify .` | Project start, to understand the codebase |
| Update | `/graphify . --update` | After major code changes |
| Focus | `/graphify ./packages/core` | To analyze a specific area |
| Query | `/graphify query "how does auth work?"` | To ask specific questions |

### When to use it:
- **Starting a new project** you didn't write
- **After major refactors** to see the new structure
- **Before planning** to understand what exists
- **When exploring** an unfamiliar module

### How to maintain it:
Re-run periodically. The SHA256 cache means it only reprocesses changed files.

---

## 6. DESIGN SYSTEM (DESIGN.md)

**What it is:** A markdown file that defines how the UI should look.

**File:** `DESIGN.md`

### How to use it:
The agent reads DESIGN.md automatically when generating UI. To use it:
```
Build me a settings page using the design system in DESIGN.md
```

### When to use it:
Whenever you ask the agent to build UI components, pages, or interfaces.

### How to maintain it:
Edit `DESIGN.md` to change colors, typography, spacing, component styles.

---

## 7. CODE QUALITY (Reviewer + Debugger + Sec-auditor)

**What they are:** Specialized agents for reviewing, debugging, and auditing code.

| Agent | Command | What it does |
|-------|---------|-------------|
| Reviewer | `@reviewer Review the auth changes` | Checks for bugs, security, performance, style |
| Debugger | `@debugger Login fails when email unverified` | Root cause analysis and fix |
| Sec-auditor | `@sec-auditor Audit our API endpoints` | Finds vulnerabilities |

### When to use them:
| Agent | Use before... | Use when... |
|-------|---------------|-------------|
| Reviewer | Committing code | You want a second pair of eyes |
| Debugger | Fixing a bug | You don't know what's causing it |
| Sec-auditor | Releasing | Handling auth, data, payments |

### How to maintain them:
Edit the `.md` files in `.opencode/agents/` to change their behavior or focus areas.

---

## 8. MEMORY (wiki/log.md + .planning/STATE.md + wiki/sessions/)

**What it is:** The system that remembers what happened across sessions.

| File | What it remembers |
|------|-------------------|
| `.planning/STATE.md` | Current position, decisions, blockers |
| `wiki/log.md` | Chronological activity (grep-parseable) |
| `wiki/sessions/` | Detailed session summaries |

### How to use it:
The agent should read STATE.md and log.md at session start automatically. If it doesn't:
```
Read STATE.md and log.md to restore context
```

### When to use it:
- **Session start**: Agent reads memory files
- **Session end**: Agent should write to log.md, STATE.md, and sessions/

### How to maintain it:
```
@ingest-agent Before I finish, update STATE.md and append to log.md
```

---

## 9. RESEARCH (Researcher agent)

**What it is:** A subagent specialized for deep investigation.

**Command:** `@researcher <question>`

**Example:**
```
@researcher Compare Redis vs PostgreSQL for session storage
```

**Output:** Research saved to `wiki/sessions/` or can be used inline.

### When to use it:
- Before making architecture decisions
- When choosing between libraries or approaches
- When you need to understand a new technology

### How to maintain it:
Edit `.opencode/agents/researcher.md` to change research depth or output format.

---

## Quick Reference Card

```
┌────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│   COMPONENT    │     HOW TO USE       │     WHEN TO USE      │  HOW TO MAINTAIN     │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ THE BRAIN      │ Loads automatically  │ Every session        │ /init or edit files  │
│ AGENTS.md      │                      │                      │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ PLANNER        │ /gsd-new-project     │ New features,        │ /gsd-update          │
│ GSD            │ then phase cycle     │ complex tasks        │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ DISCIPLINE     │ skill({name:         │ Multi-step tasks,    │ No maintenance       │
│ Planning-with  │ "planning-with-      │ research sessions    │ (loaded on-demand)   │
│ -Files         │ files"})             │                      │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ KNOWLEDGE      │ @ingest-agent        │ After any work       │ @lint-agent          │
│ wiki/          │ Ask questions        │ session              │ weekly               │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ CODE MAPPER    │ /graphify .          │ Project start,       │ Re-run --update      │
│ Graphify       │                      │ after refactors      │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ DESIGN         │ Reference in prompts │ When building UI     │ Edit DESIGN.md       │
│ DESIGN.md      │                      │                      │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ REVIEWER       │ @reviewer            │ Before commits       │ Edit agent .md file  │
│ DEBUGGER       │ @debugger            │ When debugging       │                      │
│ SEC-AUDITOR    │ @sec-auditor         │ Before release       │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ MEMORY         │ Auto-reads on start  │ Every session        │ Write on session end │
│ STATE.md/log   │                      │                      │                      │
├────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ RESEARCHER     │ @researcher          │ Before decisions     │ Edit agent .md file  │
│                │ <question>           │                      │                      │
└────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```
