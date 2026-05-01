# Cortex — User Guide

Your complete guide to using the Cortex multi-agent development system with OpenCode.

---

## Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [How It Works](#how-it-works)
3. [Daily Workflow](#daily-workflow)
4. [Agent Reference](#agent-reference)
5. [Skills Reference](#skills-reference)
6. [Planning Cycle](#planning-cycle)
7. [GSD (Get Shit Done) Integration](#gsd-get-shit-done-integration)
8. [Wiki Operations](#wiki-operations)
9. [Session Memory](#session-memory)
10. [Graphify Integration](#graphify-integration)
11. [GSD + Graphify + Wiki — Full Workflow](#gsd--graphify--wiki--full-workflow)
12. [Obsidian Usage](#obsidian-usage)
13. [Team Collaboration](#team-collaboration)
14. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- [OpenCode](https://opencode.ai) installed
- (Optional) [Graphify](https://github.com/safishamsi/graphify) installed — already done
- (Optional) [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) — already installed

### Step 1: Initialize the environment
```bash
cd your-project
opencode
```

Once inside OpenCode, run:
```
/init
```
This reads AGENTS.md and loads the multi-agent configuration.

### Step 2: Set up the project
```
@architect Help me set up the project architecture in .planning/PROJECT.md
```

### Step 3: Map the codebase (if graphify is installed)
```
/graphify .
```
This creates a knowledge graph in `wiki/graph/`.

### Step 4: Start your first feature

#### Option A: Use GSD (automated, recommended for features)
```
/gsd-new-project
```
GSD will ask questions, research the domain, and create a full roadmap with phases.

Then work through each phase:
```
/gsd-discuss-phase 1
/gsd-plan-phase 1
/gsd-execute-phase 1
/gsd-verify-work 1
```

#### Option B: Use native planning (manual, lighter weight)
Switch to Plan mode (Tab key), then:
```
Let's plan Phase 1. Start with a discussion about what we're building.
```

---

## How It Works

### The Three-Layer Architecture

```
raw/              wiki/              schema/
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Source   │ →  │Persistent│ ←  │ Agent    │
│ Documents│    │ Knowledge│    │Instructions│
│(immutable)│   │  Base    │    │(rules)    │
└──────────┘    └──────────┘    └──────────┘
     │               │               │
     │          ┌─────┴─────┐        │
     │          │ Obsidian  │        │
     │          │  (visual) │        │
     │          └───────────┘        │
     │                               │
     └─────────── AGENTS.md ─────────┘
                 (always loaded)
```

**Raw sources** (`raw/`) are your source documents — articles, papers, notes, images. The LLM reads from them but never modifies them.

**The wiki** (`wiki/`) is the knowledge base the LLM builds and maintains — pages for concepts, entities, sources, sessions, decisions. This is where knowledge compounds over time. The LLM writes it; you read it.

**The schema** (`schema/`) tells the LLM *how* to maintain the wiki — structure conventions, editorial policies, and behavior rules.

### Development Cycle
```
                ┌──────────┐
                │  Discuss │
                └────┬─────┘
                     │
                ┌────▼─────┐
                │ Research │ (optional, @researcher)
                └────┬─────┘
                     │
                ┌────▼─────┐
                │   Plan   │
                └────┬─────┘
                     │
                ┌────▼───────┐
                │  Execute   │ (parallel waves)
                └────┬───────┘
                     │
                ┌────▼──────┐
                │  Verify   │ (human check)
                └────┬──────┘
                     │
                ┌────▼──────┐
                │   Ingest  │ → wiki/
                └───────────┘
```

---

## Daily Workflow

### Starting a session
When you open OpenCode for a new session:

1. The agent reads `AGENTS.md` automatically
2. It should read `.planning/STATE.md` and `wiki/log.md` to restore context
3. If it doesn't, prompt: "Read STATE.md and log.md to restore context"

### A typical session
```
1. "Read STATE.md and log.md to continue from last session"
2. Switch to Plan mode (Tab)
3. "Let's work on Phase 2 — discuss the approach"
4. "Research the best library for X" → @researcher does this
5. "Plan the implementation" → creates task plans
6. Switch to Build mode (Tab)
7. "Execute Phase 2" → @implementer builds it
8. "Verify the work" → checks everything works
9. "Save this session to the wiki" → @ingest-agent
10. "Update STATE.md with latest progress"
```

### Ending a session
Before closing OpenCode or running /clear:
1. Summarize what was done
2. The agent should write to `wiki/log.md` and update `.planning/STATE.md`
3. If it doesn't, prompt: "Update STATE.md and append to log.md"

---

## Agent Reference

### Primary Agents (switch with Tab)

| Agent | When to Use | What It Can Do |
|-------|-------------|----------------|
| **Build** (default) | Implementation, editing, running commands | Everything — edit files, run bash, create tools |
| **Plan** | Analysis, design, code review, research | Read-only — no edits, no bash execution (except safe commands) |

### Subagents (invoke with @name)

#### Core (defined in this setup)
| Agent | Invocation | Purpose | Best Used For |
|-------|-----------|---------|---------------|
| Researcher | `@researcher` | Deep research | Investigating libraries, comparing approaches, studying docs |
| Architect | `@architect` | System design | Creating ADRs, evaluating trade-offs, designing interfaces |
| Reviewer | `@reviewer` | Code review | Checking PRs, finding bugs, auditing quality |
| Implementer | `@implementer` | Focused coding | Executing task plans, building features from specs |
| Debugger | `@debugger` | Bug fixing | Root cause analysis, fixing test failures |
| Sec-auditor | `@sec-auditor` | Security audit | Finding vulnerabilities, checking auth flows |
| Ingest-agent | `@ingest-agent` | Wiki knowledge | Reading sources, writing wiki pages, updating index |
| Lint-agent | `@lint-agent` | Wiki health | Finding contradictions, orphans, stale content |

#### GSD (installed by Get Shit Done — used internally by GSD commands)
| Agent | Purpose |
|-------|---------|
| `@gsd-planner` | Creates XML-structured task plans |
| `@gsd-executor` | Runs implementation waves |
| `@gsd-code-reviewer` | Reviews code quality |
| `@gsd-codebase-mapper` | Analyzes repo structure for `/gsd-map-codebase` |
| `@gsd-debugger` | Debug session investigation |
| `@gsd-security-auditor` | Security scanning |
| `@gsd-domain-researcher` | Deep domain research for phases |

33 GSD subagents are available. They're automatically dispatched by GSD commands but can also be invoked directly via `@gsd-agent-name`.

### Usage examples
```
@researcher Compare React Server Components vs traditional SSR for our use case
@architect Design the authentication flow and write an ADR
@reviewer Review the changes in src/auth/
@implementer Execute task plan 3 from Phase 2
@debugger The login flow fails when the user has no email verified
@sec-auditor Audit our API endpoint security
@ingest-agent Ingest the article I just added to raw/
@lint-agent Check the wiki for contradictions
```

---

## Skills Reference

Skills provide detailed workflow instructions. The agent loads them on-demand via the `skill` tool.

| Skill | Load With | What It Provides |
|-------|-----------|------------------|
| planning | `skill({name:"planning"})` or agent auto-loads | GSD lifecycle: discuss → research → plan → execute → verify |
| wiki-ingest | `skill({name:"wiki-ingest"})` | Step-by-step ingestion guide with templates |
| wiki-query | `skill({name:"wiki-query"})` | Query patterns for navigating and synthesizing |
| wiki-lint | `skill({name:"wiki-lint"})` | Health check procedures and formats |
| graphify | `skill({name:"graphify"})` | Graph extraction, interpretation, workflow |
| design-system | `skill({name:"design-system"})` | Design generation rules and validation |
| session-memory | `skill({name:"session-memory"})` | Cross-session persistence and recovery |

Skills activate automatically when relevant. For example, when you say "let's plan", the agent loads the `planning` skill. When you say "ingest this", it loads `wiki-ingest`.

---

## Planning Cycle

The full development cycle for a feature or phase:

### Step 1: Define
```
In Plan mode: "Let's define Phase 1. We need user authentication."
```
The agent creates `PROJECT.md` if it doesn't exist, sets up `ROADMAP.md` with phases.

### Step 2: Discuss
```
"Let's discuss the approach for Phase 1."
```
The agent asks about your preferences (UI style, error handling, edge cases) and writes them to a context file.

### Step 3: Research (optional)
```
@researcher Investigate JWT vs session-based auth for our stack
```
Findings saved to a research document.

### Step 4: Plan
```
"Plan Phase 1 in detail."
```
The agent creates XML-structured task plans with verification steps. Plans are saved to `.planning/templates/`.

### Step 5: Execute
Switch to Build mode:
```
"Execute Phase 1."
```
The implementer executes plans in parallel waves:
- **Wave 1**: Independent tasks run simultaneously
- **Wave 2**: Tasks that depend on Wave 1
- **Each task**: Fresh context → implement → commit

### Step 6: Verify
```
"Verify Phase 1 works."
```
The agent walks through testable deliverables. If issues found, creates fix plans.

### Step 7: Ingest
```
@ingest-agent Save the knowledge from this phase to the wiki
```

### Quick Mode (for small tasks)
```
In Build mode: "Add dark mode toggle to settings"
```
No full planning — the agent loads the `planning` skill in quick mode for ad-hoc work.

---

## GSD (Get Shit Done) Integration

GSD is an automated planning and execution system installed as OpenCode commands. It provides a structured **Discuss → Plan → Execute → Verify → Ship** workflow through slash commands, with built-in context engineering, multi-agent orchestration, and atomic git commits.

### When to Use GSD vs the Native Planning Cycle

| Situation | Use |
|-----------|-----|
| New feature from scratch | **GSD** — `/gsd-new-project` sets up everything |
| Exploring an existing codebase | **GSD** — `/gsd-map-codebase` analyzes it first |
| Large multi-step phase | **GSD** — plans are small enough for fresh contexts |
| Quick task (1-2 files) | **Native cycle** — just describe it in Build mode |
| Simple bug fix | **Native cycle** — faster without ceremony |
| Design/architecture discussion | **Native cycle** + `@architect` — lighter weight |
| Knowledge work (research, ingest) | **Native cycle** — use agents directly |

Think of **GSD as the heavy machinery** for building features. Think of the **native planning cycle as the daily driver** for quick tasks, research, and knowledge management.

### GSD Workflow

```
1. /gsd-new-project         →  Initialize: questions → research → requirements → roadmap
2. /gsd-map-codebase        →  Analyze existing code before planning (brownfield projects)
3. /gsd-discuss-phase <N>   →  Capture implementation decisions before planning
4. /gsd-plan-phase <N>      →  Research + plan + verify
5. /gsd-execute-phase <N>   →  Execute plans in parallel waves, verify when complete
6. /gsd-verify-work <N>     →  Manual user acceptance testing
7. /gsd-ship <N>            →  Create PR from verified work
8. /gsd-complete-milestone  →  Archive milestone, tag release
```

### Full GSD Command Reference

GSD installs 65 commands in `.opencode/command/`. The most important ones:

#### Project Setup
| Command | Description |
|---------|-------------|
| `/gsd-new-project` | Full initialization: questions → research → requirements → roadmap |
| `/gsd-map-codebase` | Analyze existing codebase before planning |
| `/gsd-ingest-docs` | Import ADRs, PRDs, SPECs into planning structure |
| `/gsd-new-milestone` | Start next version cycle |

#### Core Loop
| Command | Description |
|---------|-------------|
| `/gsd-discuss-phase <N>` | Capture implementation decisions per phase |
| `/gsd-plan-phase <N>` | Research + plan + verify for a phase |
| `/gsd-execute-phase <N>` | Execute all plans in parallel waves, atomic commits |
| `/gsd-verify-work <N>` | Manual acceptance testing |
| `/gsd-ship <N>` | Create PR from verified work |

#### Task Management
| Command | Description |
|---------|-------------|
| `/gsd-quick` | Ad-hoc task without full planning cycle |
| `/gsd-fast <text>` | Inline trivial task — skip planning entirely |
| `/gsd-spike` | Throwaway experiment to validate feasibility |
| `/gsd-sketch` | Throwaway HTML mockups |
| `/gsd-debug` | Targeted debugging session |
| `/gsd-review` | Code review session |
| `/gsd-capture` | Capture ideas and tasks for later |

#### Phase Management
| Command | Description |
|---------|-------------|
| `/gsd-add-phase` | Append phase to roadmap |
| `/gsd-insert-phase <N>` | Insert urgent work between phases |
| `/gsd-edit-phase <N>` | Modify an existing phase |
| `/gsd-remove-phase <N>` | Remove future phase |
| `/gsd-progress` | Where you are, what's next |
| `/gsd-next` | Auto-detect and run next step |

#### Session & Context
| Command | Description |
|---------|-------------|
| `/gsd-pause-work` | Create handoff when stopping mid-phase |
| `/gsd-resume-work` | Restore from last session |
| `/gsd-help` | Show all commands |
| `/gsd-update` | Update GSD to latest version |
| `/gsd-manager` | Interactive command center |

#### GSD + Graphify
| Command | Description |
|---------|-------------|
| `/gsd-graphify` | Run graphify within a GSD context and inject GRAPH_REPORT.md into the planner |

### How GSD Integrates With This Setup

GSD uses the same `.planning/` directory:
- `/gsd-new-project` creates/updates `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
- `/gsd-discuss-phase` creates `{phase}-CONTEXT.md`
- `/gsd-plan-phase` creates `{phase}-RESEARCH.md` and `{phase}-PLAN.md`
- `/gsd-execute-phase` creates `{phase}-SUMMARY.md` and `{phase}-VERIFICATION.md`

After GSD work, use the native wiki pipeline:
```
@ingest-agent Save the knowledge from this phase to the wiki
```

This bridges GSD's execution output into the persistent wiki knowledge base.

### GSD Subagents

GSD also installs 33 subagents in `.opencode/agents/` with `gsd-` prefix. These are used internally by GSD commands:

| Agent | Used By | Purpose |
|-------|---------|---------|
| `@gsd-planner` | plan-phase | Creates XML-structured task plans |
| `@gsd-executor` | execute-phase | Runs implementation wave |
| `@gsd-code-reviewer` | review | Reviews code quality |
| `@gsd-codebase-mapper` | map-codebase | Analyzes repo structure |
| `@gsd-debugger` | debug | Investigates bugs |
| `@gsd-security-auditor` | secure-phase | Security scanning |
| `@gsd-roadmapper` | new-project | Creates roadmap from requirements |

You generally don't invoke these directly — GSD commands dispatch them automatically. But you can if you need their specific capability:
```
@gsd-codebase-mapper Analyze the auth module
```

## Wiki Operations

### Ingest (add knowledge)
```
@ingest-agent I dropped a new article into raw/. Process it.
```
This triggers:
1. Read the source
2. Discuss key takeaways with you
3. Write wiki/sources/ summary page
4. Update wiki/concepts/ pages
5. Add cross-references
6. Update wiki/index.md
7. Append to wiki/log.md
8. Flag any contradictions

### Query (find knowledge)
```
"What do we know about our auth system?"
```
The agent uses the `wiki-query` pattern:
1. Check wiki/index.md for relevant pages
2. Drill into specific pages
3. Synthesize with citations
4. Save the answer back to wiki/ if valuable

### Lint (health check)
```
@lint-agent Run a full wiki lint
```
Checks for:
- Contradictions between pages
- Orphan pages with no inbound links
- Broken [[wikilinks]]
- Missing pages for mentioned concepts
- Stale claims from old sources
- Pages missing from index.md

---

## Session Memory

### How sessions persist across /clear

When you run `/clear` or start a new terminal, context is lost. The session-memory system restores it:

1. **On session start**: The agent reads `.planning/STATE.md` and `wiki/log.md`
2. **On session end**: The agent should write to `wiki/sessions/` and update `STATE.md`

### Manual recovery
If the agent doesn't automatically restore context:
```
Read STATE.md and the latest session from wiki/sessions/
```

### Session summary format
When ending a session, prompt:
```
Write a session summary to wiki/sessions/ and update STATE.md and log.md
```

---

## Graphify Integration

### Installation
```bash
pip install graphifyy
graphify install --platform opencode
```

### Initial codebase analysis
Once installed, inside OpenCode:
```
/graphify .
```
This produces:
- `wiki/graph/graph.html` — Interactive visualization (open in browser)
- `wiki/graph/GRAPH_REPORT.md` — Knowledge graph summary
- `wiki/graph/graph.json` — Queryable graph data

### After major changes
```
/graphify . --update
```

### Querying the graph
```
/graphify query "how does the auth flow connect to the database?"
```

### Reading the graph report
```
Read wiki/graph/GRAPH_REPORT.md
```
The report shows:
- **God nodes**: Most connected concepts
- **Communities**: Clusters of related code
- **Surprising connections**: Cross-domain links
- **Token savings**: How much context you saved

---

## GSD + Graphify + Wiki — Full Workflow

How all three systems work together in a real project:

### Starting a Greenfield Project
```
1. /gsd-new-project           → GSD creates PROJECT.md, ROADMAP.md, STATE.md
2. /gsd-discuss-phase 1       → Capture your vision for Phase 1
3. /gsd-plan-phase 1          → Research + create task plans
4. /gsd-execute-phase 1       → Build Phase 1 with atomic commits
5. /gsd-verify-work 1         → You confirm it works
6. @ingest-agent              → Save what you learned to wiki/
```

### Starting a Brownfield Project (existing codebase)
```
1. /graphify .                → Graphify builds knowledge graph
2. Read wiki/graph/GRAPH_REPORT.md   → Understand architecture
3. /gsd-map-codebase          → GSD analyzes stack, patterns, concerns
4. /gsd-new-project           → GSD creates roadmap informed by analysis
5. /gsd-discuss-phase 1 → plan → execute → verify
6. @ingest-agent              → Save to wiki
```

### Adding a Feature Mid-Project
```
1. @researcher Investigate best approach    → Research saved to wiki/sessions/
2. /gsd-quick "Add X feature"               → Quick GSD execution
3. @ingest-agent Save the decisions          → Update wiki/
```

### Debugging a Bug
```
1. @debugger Investigate the login failure   → Root cause analysis
2. /gsd-debug "Fix the login race condition" → Targeted fix
3. @ingest-agent Log the investigation       → wiki/sessions/ + wiki/log.md
```

---

## Obsidian Usage

### Setting up the vault
1. Open Obsidian
2. Click "Open folder as vault"
3. Select your project root (the same directory as AGENTS.md)
4. Obsidian will read the `.obsidian/` config automatically

### Navigating the wiki
- Open `wiki/index.md` for the content catalog
- Click [[wikilinks]] to follow connections
- Open the Graph View (Ctrl+G) to see the knowledge graph
- Check `wiki/log.md` for recent activity

### Best Practices
- Keep Obsidian open alongside OpenCode
- When the agent writes to the wiki, you see the changes in real-time
- Use Graph View to spot orphan pages and weak connections
- Use Dataview (plugin) for dynamic dashboards

### Recommended Obsidian Plugins
- **Dataview** (query wiki page frontmatter)
- **Graphviz** (code architecture diagrams)
- **Obsidian Git** (auto-commit wiki changes)

---

## Team Collaboration

### Git workflow
The entire setup is git-friendly:
```
git add .
git commit -m "feat: implement user authentication (Phase 2)"
```

### Sharing the wiki
Since the wiki is plain markdown in the repo, teammates can:
1. Clone the repo
2. Open the folder in OpenCode
3. Open the folder in Obsidian
4. Start collaborating

### Merge conflicts
Wiki files may have merge conflicts. Resolve them like normal markdown conflicts.
The `@lint-agent` can detect and fix broken links after merges.

### CI Integration
You can run wiki linting in CI:
```
opencode --ci -c "run wiki-lint"
```

---

## Troubleshooting

### Agent doesn't load context
```
# Prompt manually:
Read STATE.md and log.md to restore session context
```

### Agent makes changes without planning
```
# Switch to Plan mode:
<Tab>
# Then:
"Let's plan before implementing"
```

### Wiki pages accumulating without structure
```
# Run lint:
@lint-agent Full wiki lint and fix suggestions
```

### Lost session after /clear
```
# When you return:
"Restore my session context"
# The agent should read STATE.md and latest session
```

### Agent not using the right agent
```
# Explicitly invoke:
@reviewer Review this code
# Not: "Review this code" (might use the current agent)
```

### Graphify outputs not showing
```
# Run graphify first:
/graphify .
# Then:
Read wiki/graph/GRAPH_REPORT.md
```

### Custom tools not working
```
cd .opencode/tools && npm install
# Then restart OpenCode
```

---

## File Reference

```
opencode.json            → Agent definitions, permissions, MCP config
AGENTS.md                → Always-loaded rules and conventions
DESIGN.md                → Design system for UI generation
.opencode/agents/        → 8 core + 33 GSD subagent definitions
.opencode/command/       → 65 GSD commands (/gsd-*)
.opencode/skills/        → 7 SKILL.md workflow guides
.opencode/tools/         → 3 custom OpenCode tools
.opencode/plugins/       → Graphify hook plugin
.planning/               → Project planning and state (shared with GSD)
wiki/                    → Persistent knowledge base
schema/                  → Wiki conventions and policies
raw/                     → Source documents
.obsidian/               → Obsidian vault config
```
