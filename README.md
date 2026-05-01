<div align="center">
  <h1>Cortex</h1>
  <p><strong>Multi-Agent Development System — Memory, Planning & Code Understanding for OpenCode</strong></p>
  <p>
    <a href="https://opencode.ai"><img src="https://img.shields.io/badge/OpenCode-Ready-2563EB?style=flat-square" alt="OpenCode Ready"></a>
    <a href="https://github.com/Stefan-migo/Cortex/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
    <a href="https://github.com/Stefan-migo/Cortex/graphs/contributors"><img src="https://img.shields.io/github/stars/Stefan-migo/Cortex?style=flat-square" alt="Stars"></a>
  </p>
  <p>
    <a href="#-what-is-cortex">What is Cortex</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-capabilities">Capabilities</a> •
    <a href="#%EF%B8%8F-bootstrap-for-new-projects">Bootstrap</a>
  </p>
</div>

---

Cortex is a **bootstrappable development environment** for AI coding agents. It turns [OpenCode](https://opencode.ai) into a self-aware system with persistent memory, structured planning, codebase understanding, and automated maintenance — all using plain markdown files and OpenCode-native extensibility.

Built on the [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) by Andrej Karpathy and integrating [GSD](https://github.com/gsd-build/get-shit-done), [Graphify](https://github.com/safishamsi/graphify), and [Planning with Files](https://github.com/OthmanAdi/planning-with-files).

---

## Quick Start

```bash
# Option A: Clone into a new subdirectory (clean, recommended)
git clone https://github.com/Stefan-migo/Cortex.git my-project
cd my-project

# Option B: Clone directly into the current directory (if it's empty)
# cd /path/to/empty-folder
# git clone https://github.com/Stefan-migo/Cortex.git .

# Then:
rm -rf .git && git init           # Break from Cortex history — this is YOUR project now
./scripts/install-deps.sh         # One-time per machine (Graphify, MCPs, tools)
opencode                          # Launch the agent
# Inside OpenCode, type:
/new-project                      # Bootstrap: agent asks questions, researches, builds your team
```

### What's In the Repo vs What Needs Installing

Most of Cortex is **already committed to the repo** and works immediately after clone:

| Already in repo (works after clone) | Needs install on each machine |
|------------------------------------|-------------------------------|
| GSD commands (66 files) | Graphify Python package (`pip install graphifyy`) |
| GSD agents (33 files) | Graphify OpenCode hooks (`graphify install --platform opencode`) |
| GSD runtime (245 files) | Planning with Files global install (handled by install-deps.sh) |
| 8 core agents | Custom tools npm dependencies (handled by install-deps.sh) |
| 8 skills + Planning with Files skill | Node.js >= 18 (prerequisite) |
| Graphify skill + plugin | Python >= 3.10 (prerequisite) |
| 3 custom TypeScript tools | |
| DESIGN.md, SYSTEM-MAP.md, USER-GUIDE.md | |
| Obsidian vault config | |

**Run `./scripts/install-deps.sh` after clone** to set up everything that can't live in the repo.

### Prerequisites

| Tool | Version | Required by |
|------|---------|-------------|
| [OpenCode](https://opencode.ai) | >= 1.0 | The agent runtime itself |
| [Node.js](https://nodejs.org) | >= 18 | GSD commands runtime |
| [Python](https://python.org) | >= 3.10 | Graphify (optional but recommended) |

---

## Capabilities

| Capability | How it works | Components |
|------------|-------------|------------|
| **Long-term memory** | Persistent markdown wiki + append-only log + session summaries | `wiki/`, `@ingest-agent`, `@lint-agent`, session-memory skill |
| **Information query** | Catalog-driven search, graph navigation, cross-referenced knowledge | `wiki/index.md`, wiki-search tool, `@researcher`, wiki-query skill |
| **Task planning** | Spec-driven phase lifecycle with atomic execution | GSD (65 commands), `planning` skill, `.planning/` artifacts |
| **Context discipline** | File-based working memory, error logging, plan re-reading | planning-with-files skill, 3-file pattern, hook guards |
| **Code understanding** | Knowledge graph from AST + semantic extraction | Graphify (`/graphify .`), `wiki/graph/` |
| **Auto-maintenance** | Self-linting, contradiction detection, proactive suggestions | Self-maint rules in `AGENTS.md`, `@lint-agent`, `schema/` policies |
| **Code quality** | Review, debug, security audit agents | `@reviewer`, `@debugger`, `@sec-auditor` |
| **Design system** | Token-based UI generation, brand consistency | `DESIGN.md`, design-system skill |
| **Cross-session** | Context recovery after `/clear` | session-memory skill, session-recover tool |
| **Obsidian integration** | Visual graph view, [[wikilinks]], Dataview dashboards | `.obsidian/` config, wiki schema |

---

## Architecture

```
                        ┌──────────────────────┐
                        │     AGENTS.md         │
                        │   opencode.json       │
                        │   schema/             │
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

### Three-Layer Knowledge Architecture

```
raw/              wiki/              schema/
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Source   │ →  │Persistent│ ←  │ Agent    │
│ Documents│    │ Knowledge│    │Instructions│
│(immutable)│   │  Base    │    │(rules)    │
└──────────┘    └──────────┘    └──────────┘
```

- **`raw/`** — Immutable source documents. The LLM reads from here but never modifies.
- **`wiki/`** — The persistent, compounding knowledge base. The LLM writes it; you read it.
- **`schema/`** — Configuration that tells the LLM how the wiki is structured.

---

## Components

### 1. The Brain — AGENTS.md + opencode.json
Loaded every session. Tells the agent what tools exist, how to use them, and how to maintain itself.

### 2. Planner — GSD (65 commands)
Automated feature development pipeline. Commands like `/gsd-new-project`, `/gsd-discuss-phase`, `/gsd-execute-phase` manage the full build lifecycle with atomic commits and parallel wave execution.

### 3. Discipline — Planning with Files
Behavioral layer: re-read the plan before decisions, save findings every 2 operations, log errors, verify completion before stopping.

### 4. Knowledge Base — wiki/
Persistent markdown wiki managed by agents. `index.md` for navigation, `log.md` for history. Pages for concepts, entities, sources, sessions, and decisions.

### 5. Code Mapper — Graphify
Knowledge graph extraction. Run `/graphify .` to build a graph of your codebase showing god nodes, communities, and surprising connections.

### 6. Design System — DESIGN.md
Token-based UI generation. Defines colors, typography, spacing, and component styles. Agents read this before generating UI.

### 7. Subagents — 8 Core + 33 GSD

| Agent | Purpose |
|-------|---------|
| `@researcher` | Deep research on technical topics |
| `@architect` | System design and trade-off analysis |
| `@reviewer` | Code review and quality assurance |
| `@implementer` | Focused implementation from plans |
| `@debugger` | Bug investigation and root cause analysis |
| `@sec-auditor` | Security vulnerability scanning |
| `@ingest-agent` | Wiki ingestion pipeline |
| `@lint-agent` | Wiki health checks |
| `@gsd-*` (33) | Specialized agents used by GSD commands |

### 8. Custom Tools — TypeScript
| Tool | Purpose |
|------|---------|
| `wiki-search` | Search wiki markdown with relevance ranking |
| `wiki-link` | Analyze wikilink graph — orphans, broken links, stats |
| `session-recover` | Restore context from STATE.md, log.md, and summaries |

### 9. Memory — Cross-Session
`.planning/STATE.md` + `wiki/log.md` + `wiki/sessions/` persist state across `/clear` and terminal restarts.

---

## Bootstrap for New Projects

Cortex is designed to be cloned and adapted. To start any new project:

```bash
git clone https://github.com/Stefan-migo/Cortex.git my-project
cd my-project && rm -rf .git && git init
./scripts/install-deps.sh
opencode
```

Then inside OpenCode, run:
```
/new-project
```

The agent runs a 5-phase bootstrap:

1. **Discover** — Asks one question at a time: name, description, tech stack, domain, references, goals, scope
2. **Research** — Spawns `@researcher` to investigate best practices, industry patterns, competitor landscape, and analyzes any reference URLs you provided
3. **Synthesize** — Combines your answers + research into a structured proposal with stack recommendations, architecture, risks, and phase plan
4. **Generate** — After you approve, creates PROJECT.md, ROADMAP.md, STATE.md, updates AGENTS.md and DESIGN.md
5. **Launch** — Shows next steps: `/gsd-discuss-phase 1` to start building

---

## Daily Workflow

### Starting a Session
The agent automatically reads `.planning/STATE.md` and `wiki/log.md` at session start to restore context.

### Building a Feature
```
1. /gsd-discuss-phase 1     → Capture your preferences
2. /gsd-plan-phase 1        → Create task plans
3. /gsd-execute-phase 1     → Build with atomic commits
4. /gsd-verify-work 1       → Confirm it works
5. @ingest-agent             → Save knowledge to wiki
```

### Quick Tasks
```
Add dark mode toggle to settings    → Agent handles it ad-hoc
```

### Debugging
```
@debugger The login fails when email is unverified
```

### Wiki Maintenance
```
@lint-agent Run a full wiki lint
```

### Session End
The agent writes a summary to `wiki/sessions/`, appends to `wiki/log.md`, and updates `.planning/STATE.md`.

---

## File Structure

```
root/
├── AGENTS.md                       # Rules loaded every session
├── SYSTEM-MAP.md                   # Visual tool reference
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
│   ├── install-deps.sh             # One-time per machine: Graphify, Planning w/ Files, tools
│   └── setup.sh                    # Project boilerplate (optional)
├── .planning/                      # Planning artifacts (shared with GSD)
│   ├── PROJECT.md                  # Project vision & goals
│   ├── ROADMAP.md                  # Phase roadmap with status
│   ├── STATE.md                    # Current position, decisions, blockers
│   ├── ARCHIVE.md                  # Completed milestones
│   ├── templates/                  # Plan & research templates
│   └── sessions/                   # Per-session plan files
├── wiki/                           # Knowledge base
│   ├── index.md                    # Content-oriented catalog
│   ├── log.md                      # Append-only chronological record
│   ├── concepts/                   # Technology & domain concept pages
│   ├── entities/                   # Code entities (classes, functions, modules)
│   ├── sources/                    # Source document summaries
│   ├── sessions/                   # Session summaries & knowledge capture
│   ├── decisions/                  # Architecture Decision Records
│   ├── dashboards/                 # Automated dashboards
│   └── graph/                      # Knowledge graph outputs
├── raw/                            # Immutable source materials
├── schema/
│   ├── wiki-schema.md              # Wiki structure conventions
│   ├── agent-behavior.md           # Cross-agent coordination
│   └── editor-policy.md            # Source quality thresholds
└── .obsidian/                      # Obsidian vault config
```

---

## Self-Maintenance

The system knows about itself and proactively manages its own health:

| Event | Agent behavior |
|-------|---------------|
| Session start | Reads STATE.md + log.md, presents current phase |
| New codebase | Suggests `/graphify .` |
| Wiki growth | Suggests `@lint-agent` for health checks |
| Complex task | Suggests `/gsd-new-project` |
| Bug report | Suggests `@debugger` |
| UI request | Reads DESIGN.md autonomously |
| Session end | Writes summary, updates STATE.md, appends log.md |

### Maintenance Schedule
| Task | Frequency | How |
|------|-----------|-----|
| Wiki lint | Weekly | `@lint-agent Full lint` |
| Graphify update | After major refactors | `/graphify . --update` |
| GSD update | Monthly | `/gsd-update` |
| AGENTS.md review | Per milestone | `/init` |

---

## Built On

| Project | Role | Stars |
|---------|------|-------|
| [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Core architecture (three-layer pattern) | — |
| [GSD](https://github.com/gsd-build/get-shit-done) | Planning & execution engine | 59k+ |
| [Graphify](https://github.com/safishamsi/graphify) | Knowledge graph extraction | 39k+ |
| [Planning with Files](https://github.com/OthmanAdi/planning-with-files) | Context discipline & session hooks | 20k+ |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Design system generation patterns | 73k+ |
| [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) | Design system file format | 69k+ |
| [OpenCode](https://opencode.ai) | AI coding agent runtime | — |

---

## Contributing

Contributions are welcome. The most impactful contributions are:

- **Worked examples**: Clone Cortex, build a real project, share what you learned
- **New skills**: Add SKILL.md files for new workflows
- **Agent improvements**: Better agent prompts for existing subagents
- **Wiki schema**: Improvements to the knowledge base structure
- **Bug fixes**: Issues with hooks, permissions, or cross-platform compatibility

---

## License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
  <p>Built with OpenCode, powered by markdown.</p>
  <p>
    <a href="https://github.com/Stefan-migo/Cortex/issues">Report Issue</a> •
    <a href="https://opencode.ai">OpenCode</a> •
    <a href="https://github.com/Stefan-migo/Cortex/discussions">Discussions</a>
  </p>
</div>
