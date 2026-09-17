# Cortex 2.5 — Tool-Driven Executive Reasoning

## Brain Lobe Architecture

```
Frontal Lobe (Planning)     → cortex-session + Gentle AI SDD — /sdd-*
Parietal Lobe (Spatial)     → Graphify — codebase graph before editing
Hippocampus (Memory)        → Engram — persistent SQLite memory via MCP
Occipital Lobe (Archive)    → wiki/ — Obsidian-readable snapshot exported from Engram
```

## Two Identities

| Agent | Role | Permissions |
|-------|------|-------------|
| `@Cortex-Planner` | Human interaction, spec drafting, research, knowledge management | Read-only + webfetch + task |
| `@Cortex-Developer` | Technical execution, code writing, testing, quality gates | Full (edit, bash, write, task) |

Switch with Tab: Planner (read-only) / Developer (full tools).

## Tool-Belt (MCP + CLI + Custom Tools)

### Engram (Hippocampus — Memory)
| Tool | Purpose |
|------|---------|
| `mem_save` | Save structured observation (decision, architecture, bugfix, pattern, discovery, learning) |
| `mem_search` | FTS5 full-text search across all memory |
| `mem_judge` | Resolve conflict candidates returned by mem_save |
| `mem_session_start` | Register session start |
| `mem_session_end` | Mark session complete |
| `mem_session_summary` | Save comprehensive session summary |
| `mem_context` | Recent context from previous sessions |
| `mem_get_observation` | Full untruncated observation content |
| `mem_stats` | Memory system statistics |

### Graphify (Parietal Lobe — Code Understanding)
| Tool | Purpose |
|------|---------|
| `query_graph` | Query knowledge graph for relevant nodes |
| `god_nodes` | Find highest-degree concepts |
| `python3 -m graphify.serve <graph>` | MCP server for graph queries |
| `/graphify . --update` | Rebuild graph after code changes |

### Gentle AI SDD (Frontal Lobe — Planning)
| Command | Purpose |
|---------|---------|
| `cortex-session` skill | Discuss and structure planning work with the user |
| `/sdd-new` | Start a new structured change |
| `/sdd-ff` | Fast-forward a change through its planning phases |
| `/sdd-status` | Check change state and available next steps |
| `/sdd-apply` | Implement the change tasks |
| `/sdd-verify` | Run diagnostics against the implementation and artifacts |
| `/sdd-archive` | Close and preserve a completed change |
| `/sdd-init` | Initialize SDD context for a project |
| `/sdd-onboard` | Walk through the SDD workflow on an existing project |

### Code-Sandbox (Execution)
| Tool | Purpose |
|------|---------|
| `execute_script` | Run TypeScript/JavaScript in Node.js sandbox for multi-step logic |

## Session Flow

### Start (CLI handles this)
1. `cortex start` → creates session, pre-loads context from Engram + Graphify, launches OpenCode
2. Agent detects `.cortex/prelude.md` and uses it as working context

### Work
1. Planner discusses with user through the `cortex-session` skill, then drafts the change with `/sdd-new`
2. Planner hands spec to Developer via `@Cortex-Developer`
3. Developer runs graphify check before editing code
4. Developer executes modified 5-Step Gate per task

### 5-Step Execution Gate (MANDATORY)
```
Step 1: GRAPH CHECK — query_graph before editing
Step 2: ATOMIC COMMIT — one concern per commit, ≤5 files
Step 3: VERIFY — lint + typecheck + tests (block on failure)
Step 4: SPEC CHECK — /sdd-verify after completion
Step 5: FINALIZE — mem_save + cortex close --message "<summary>"
```

### End (Agent handles finalization)
1. `@Cortex-Developer` calls mem_save for all discoveries
2. `@Cortex-Developer` runs: bash("cortex close --message "<summary>"")
   → This calls mem_session_summary + wiki export + cleanup

## Active MCP Servers
| Server | Purpose | Status |
|--------|---------|--------|
| Engram | Persistent memory (19 tools) | Enabled |
| Graphify | Codebase knowledge graph | Enabled |

Optional: sequential-thinking, context7, github — enable in `opencode.json` as needed.

## Skills
| Skill | When to load |
|-------|-------------|
| `skill({name:"graphify"})` | Before any code editing |
| `skill({name:"design-system"})` | When building UI |

## Knowledge Capture Discipline
Save to Engram immediately when you encounter:
- **decision**: Architecture or design decisions with rationale
- **bugfix**: Root cause and fix for bugs
- **pattern**: Reusable patterns discovered
- **architecture**: System architecture insights
- **discovery**: Unexpected findings
- **learning**: Lessons learned during development

## Coding Standards
- Run `npm run typecheck` (from `cli/`) before considering work complete. This repository has **no lint script**.
- Follow existing project conventions
- Atomic commits: one concern per commit, descriptive messages
- This repository has **no test harness**. `vitest` is configured in `cli/`, but there are zero test files, so `npm test` exits 1 with "No test files found". Do not claim test coverage that does not exist, and do not require tests for a change until a harness is deliberately introduced.
- Verify code changes with `npm run typecheck`, `npm run build`, and concrete manual shell scenarios. Report the exact commands and their real output — never infer a pass from intent.
- NEVER commit secrets or credentials

## Ponytail — Code-Writing Discipline

Ponytail governs HOW code is written. It does not decide authorization, tracking, or review.

- Prefer the standard library or an already-installed dependency before adding a dependency.
- Do not add an abstraction with one implementation and no second use.
- When deletion and addition both work, delete.
- Apply these rules during implementation only; they are not an approval checkbox, a receipt, a line-count target, or a replacement for RDD/native review.

## ODD Worktrees

During ODD's `Classify` step, substantial work means two or more meaningful implementation steps or progress worth recovering. Code work is born in a sibling worktree (`../Cortex-odd-<slug>`) on branch `odd/<slug>`, not in main. Human consent is explicit and per-feature before invoking `cortex worktree create`; `--yes` is only the consequence of that approval, never a shortcut around it. The ODD task doc `odd/tasks/<feature>.md` is committed on the branch and reaches main through the PR, so it must never live inside a `gentle-ai` managed block. After the merge, rebuild `cli/dist/` in main before dogfooding the CLI because `cli/dist/` is gitignored and the merge does not update it.

## Reporting Cortex Defects

Cortex is a tool you are USING, not the project you are working on.

When you identify a failure that belongs to Cortex itself — not to this project, its
configuration, or its environment — say so, and **suggest** opening an issue at
https://github.com/Stefan-migo/Cortex/issues with the evidence: what you ran, what happened,
and the smallest reproduction you have.

- Suggest only. Never open the issue, never run `gh`, and never write to the Cortex
  repository from a project workflow. The human decides.
- Only for an identified defect. Do not speculate, and do not suggest an issue for expected
  refusals, for this project's own bugs, or for environment and dependency failures.
- If you cannot tell whether the cause is Cortex, say that instead of filing.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
