<div align="center">
  <h1>Cortex 2.5</h1>
  <p><strong>Tool-Driven Executive Reasoning — Brain Lobe Architecture for OpenCode</strong></p>
  <p>
    <a href="https://opencode.ai"><img src="https://img.shields.io/badge/OpenCode-Ready-2563EB?style=flat-square" alt="OpenCode Ready"></a>
    <a href="https://github.com/Stefan-migo/Cortex/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
  </p>
  <p>
    <a href="#-what-is-cortex">What is Cortex</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-architecture">Architecture</a>
  </p>
</div>

---

Cortex 2.5 is a **tool-driven executive reasoning system** for AI coding agents. It turns [OpenCode](https://opencode.ai) into a self-aware system with four brain lobes: **Frontal** (Spec-Kit planning), **Parietal** (Graphify code understanding), **Hippocampus** (Engram persistent memory), and **Occipital** (Obsidian wiki archive).

Built on [github/spec-kit](https://github.com/github/spec-kit) (93k★), [Gentleman-Programming/engram](https://github.com/Gentleman-Programming/engram) (3.3k★), and [Graphify](https://github.com/safishamsi/graphify).

---

## Quick Start

```bash
git clone https://github.com/Stefan-migo/Cortex.git
cd Cortex
./scripts/install-deps.sh             # Install Engram + Spec-Kit + Graphify
# ⚠ Post-clone: review "First-Time Setup" below
opencode                              # Launch agent
# Switch between @Cortex-Planner (Tab) and @Cortex-Developer (Tab)
```

### First-Time Setup (Post-Clone)

After cloning, you must fix 3 things before Cortex works correctly:

#### 1. Merge OpenCode config (⚠ Required)
The config is split between two files. OpenCode prioritizes `.opencode/opencode.json`,
but the canonical config lives in root `opencode.json`. After cloning:
```bash
# Copy the full config into the correct location
cp opencode.json .opencode/opencode.json
# Then reduce root to a delegator (see .opencode/opencode.json for actual config)
```
This merges agents, MCP servers, and permissions into the file OpenCode actually reads.

#### 2. Install Spec-Kit (`speckit`)
The Spec-Kit commands (`/speckit.specify`, `/speckit.plan`, etc.) require the `speckit`
GitHub CLI extension. If `install-deps.sh` didn't do it:
```bash
gh extension install github/spec-kit
```
Verify: `speckit --version`

#### 3. Add `mode: primary` to agent files
The agent markdown files in `.opencode/agents/` need `mode: primary` in their frontmatter
to be recognized as Tab-switchable primary agents. If `install-deps.sh` didn't do it:
```bash
# Add to each agent .md file after the description line:
#   description: "..."
#   mode: primary
```
Without this, agents may not appear in the Tab cycle.

### What's In the Repo vs What Needs Installing

| Already in repo | Needs install (per machine) |
|-----------------|----------------------------|
| GSD commands (66 files) | Graphify Python package (`pip install graphifyy`) |
| GSD agents (33 files) | Graphify OpenCode hooks (`graphify install --platform opencode`) |
| GSD runtime (245 files) | Planning with Files global install (handled by install-deps.sh) |
| 8 core agents | Custom tools npm dependencies (handled by install-deps.sh) |
| 8 skills + Planning with Files skill | Node.js >= 18 (prerequisite) |
| Graphify skill + plugin | Python >= 3.10 (prerequisite) |
| 3 custom TypeScript tools | |
| | Spec-Kit (`gh extension install github/spec-kit`) |
| | Post-clone config merge (see First-Time Setup) |
| | Agent frontmatter fix (see First-Time Setup) |
| DESIGN.md, SYSTEM-MAP.md, USER-GUIDE.md | |
| Obsidian vault config | |

### Prerequisites

| Tool | Version | Required by |
|------|---------|-------------|
| [OpenCode](https://opencode.ai) | >= 2.0 | The agent runtime |
| [Python](https://python.org) | >= 3.10 | Graphify, Spec-Kit |
| [Node.js](https://nodejs.org) | >= 18 | Custom tools, execute_script |

---

## Architecture (Brain Lobe Model)

```
                         ┌──────────────────────────┐
                         │  FRONTAL LOBE (Planning)  │
                         │     Spec-Kit /speckit.*   │
                         │     .specify/ artifacts   │
                         │     @Cortex-Planner       │
                         └──────────┬───────────────┘
                                    │ hands off spec
          ┌─────────────────────────┼──────────────────────────┐
          │                         │                          │
   ┌──────▼──────────┐    ┌───────▼──────────┐    ┌─────────▼─────────┐
   │  PARIETAL LOBE   │    │  HIPPOCAMPUS     │    │ OCCIPITAL LOBE    │
   │  (Spatial)       │    │  (Memory)        │    │ (Archive)         │
   │                   │    │                   │    │                   │
   │  Graphify        │    │  Engram MCP      │    │  wiki/ (export)   │
   │  query_graph     │    │  mem_save/search │    │  .md snapshots    │
   │  god_nodes       │    │  mem_judge       │    │  from Engram      │
   │  graph.json      │    │  session lifecycle│   │                   │
   └──────────────────┘    └───────────────────┘    └──────────────────┘

   @Cortex-Developer executes across all lobes via the mandatory 5-Step Gate
```

### Two Identities

| Agent | Role | Permissions |
|-------|------|-------------|
| `@Cortex-Planner` | Human interaction, spec drafting, research, memory | Read-only + webfetch + task |
| `@Cortex-Developer` | Technical execution, coding, testing, quality | Full (edit, bash, write, task) |

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
## Daily Workflow

### Starting a Session
1. `@Cortex-Planner` runs `mem_session_start` and `mem_context` to restore recent activity
2. Planner discusses current goal with you

### Building a Feature (Spec-Driven)
```
1. /speckit.specify       → Planner writes feature spec (WHAT)
2. /speckit.clarify        → Resolve ambiguities (optional but recommended)
3. /speckit.plan           → Planner creates tech plan (HOW)
4. /speckit.tasks          → Break into executable tasks
   → Hand spec to @Cortex-Developer
5. Developer runs 5-Step Gate per task:
   - GRAPH CHECK → query_graph before editing
   - ATOMIC COMMIT → one concern per commit
   - VERIFY → lint + typecheck + tests
   - SPEC CHECK → /speckit.analyze
   - MEMORY → mem_save learnings
6. /speckit.checklist      → Developer validates quality
```

### Session End
1. `@Cortex-Developer` calls `mem_save` for all discoveries
2. `@Cortex-Planner` calls `mem_session_summary` + `mem_session_end`
3. Run `scripts/engram-export-wiki.sh` to sync to Obsidian vault

---

## File Structure

```
root/
├── AGENTS.md                       # Rules loaded every session
├── SYSTEM-MAP.md                   # Component reference guide
├── USER-GUIDE.md                   # Usage guide
├── DESIGN.md                       # Design system specification
├── opencode.json                   # Agent/permission/MCP config
├── .opencode/
│   ├── agents/                     # 2 agents: cortex-planner, cortex-developer
│   ├── skills/                     # 3 skills: graphify, design-system, bootstrap
│   └── tools/                      # 3 custom tools (wiki-search, wiki-link, execute_script)
├── .specify/                       # Spec-Kit structured planning
│   ├── memory/constitution.md      # Project principles
│   ├── templates/                  # Spec/plan/task templates
│   └── workflows/                  # Automation workflows
├── .git/hooks/pre-commit           # Atomicity gate (≤5 files per commit)
├── scripts/
│   ├── engram-export-wiki.sh       # Session-end Obsidian export
│   ├── migrate-wiki-to-engram.sh   # One-time log → Engram seed
│   └── setup.sh                    # Project initialization
├── wiki/                           # Engram snapshot (Obsidian-readable)
│   ├── index.md                    # Content catalog
│   ├── log.md                      # Export log (archived; memory in Engram)
│   ├── engram/                     # Auto-exported observations
│   ├── graph/                      # Graphify outputs
│   ├── concepts/                   # Technology concept pages
│   └── ... (other static content)
├── raw/                            # Immutable source materials
├── schema/                         # Editorial policies (wiki-schema, editor-policy)
└── .obsidian/                      # Obsidian vault config
```

---

## Built On

| Project | Role |
|---------|------|
| [github/spec-kit](https://github.com/github/spec-kit) | Spec-Driven Development (93k★) |
| [Gentleman-Programming/engram](https://github.com/Gentleman-Programming/engram) | Persistent memory, 19 MCP tools (3.3k★) |
| [Graphify](https://github.com/safishamsi/graphify) | Knowledge graph extraction |
| [OpenCode](https://opencode.ai) | AI coding agent runtime |

---

## Dual Runtime

cortex funciona con dos runtimes de agente:

### OpenCode (default)
Runtime principal para desarrollo diario. Usa la configuración en `.opencode/`.

### OpenHarness (alternativo)
Runtime standalone para producción o cuando no quieres depender de OpenCode.
```bash
pip install openharness-ai
oh --config openharness/config.yml
```
Usa la configuración en `openharness/`.

Ambos runtimes comparten:
- **Engram** — memoria persistente (MCP)
- **Graphify** — knowledge graph (MCP)
- **Spec-Kit** — SDD workflow (`.specify/`)
- **Wiki** — export a Obsidian (`wiki/`)
- **Lobe Architecture** — planner/developer split

---

### New Components (v3.0)

| Component | Location | Purpose |
|-----------|----------|---------|
| SDD Skill | `.opencode/skills/sdd/` | 8-phase Spec-Driven Development |
| GGA Guardian | `.githooks/pre-commit` + `scripts/gga-pre-commit.sh` | Pre-commit code review |
| Backup | `scripts/backup.sh` | Config snapshot before changes |
| Rollback | `scripts/rollback.sh` | Restore config from snapshot |
| OpenHarness | `openharness/` | Alternative agent runtime |

### SDD Workflow

The 8-phase Spec-Driven Development cycle:
```
Explore → Propose → Spec → Design → Tasks → Apply → Verify → Archive
```
Start a new feature: `./scripts/sdd-init.sh <feature-name>`

---

## License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
  <p>Built with OpenCode. Brain lobes, not subagents.</p>
  <p>
    <a href="https://github.com/Stefan-migo/Cortex/issues">Report Issue</a> •
    <a href="https://opencode.ai">OpenCode</a>
  </p>
</div>
