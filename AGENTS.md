# Rapsodia 2.5 — Tool-Driven Executive Reasoning

## Brain Lobe Architecture

```
Frontal Lobe (Planning)     → rapso-session + ODD — odd/tasks/<feature>.md
Parietal Lobe (Spatial)     → Graphify — codebase graph before editing
Hippocampus (Memory)        → Engram — persistent SQLite memory via MCP
Occipital Lobe (Archive)    → wiki/ — Obsidian-readable snapshot exported from Engram
```

## Two Identities

| Agent | Role | Permissions |
|-------|------|-------------|
| `@Rapso-Planner` | Human interaction, spec drafting, research, knowledge management | Read-only + webfetch + task |
| `@Rapso-Developer` | Technical execution, code writing, testing, quality gates | Full (edit, bash, write, task) |

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

These commands remain available when explicitly requested; ODD is the default continuation.

| Command | Purpose |
|---------|---------|
| `rapso-session` skill | Discuss and structure planning work with the user |
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
1. `rapso start` → creates session, pre-loads context from Engram + Graphify, launches OpenCode
2. Agent detects `.rapsodia-code/prelude.md` and uses it as working context

### Work
1. Planner uses `rapso-session` to seed `odd/tasks/<feature>.md`, then creates the worktree with `rapso worktree create <slug>`
2. Planner hands the ODD task doc to Developer via `@Rapso-Developer`
3. Developer runs graphify check before editing code
4. Developer executes modified 5-Step Gate per task

### 5-Step Execution Gate (MANDATORY)
```
Step 1: GRAPH CHECK — query_graph before editing
Step 2: ATOMIC COMMIT — one concern per commit, ≤5 files
Step 3: VERIFY — lint + typecheck + tests (block on failure)
Step 4: SPEC CHECK — /sdd-verify after completion
Step 5: FINALIZE — mem_save + rapso close --message "<summary>"
```

### End (Agent handles finalization)
1. `@Rapso-Developer` calls mem_save for all discoveries
2. `@Rapso-Developer` runs: bash("rapso close --message "<summary>"")
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

## Defect-Report Privacy Contract

`cli/src/utils/defect.ts` builds a payload the CLI invites a user to paste into a **public GitHub
issue**, and `gga` reviews that file as a whole. This is the bounded contract it must satisfy, so a
review has a finite bar instead of an open-ended privacy demand.

`scrub` **must** redact:

- Credentials in named assignments — `--flag=value`, `--flag value`, and `NAME=value` — when the name
  carries a credential word (`token`, `secret`, `password`, `passwd`, `pass`, `pwd`, `apikey`,
  `privatekey`, `auth`, `credential`, `credentials`, `creds`) as any `-`/`_`-separated segment. A
  quoted value counts as the whole value.
- The credential following an auth scheme (`Bearer`, `Token`, `Basic`, optionally after
  `Authorization:`). The scheme keyword stays visible; the credential does not.
- Absolute paths, and the `cwd`/`HOME` prefixes, as a whitespace-delimited value, as the value of a
  named assignment, or embedded in a quoted value.
- The path, query and fragment of every scheme URL (`https://…`, `file://…`).

`scrub` deliberately **does not** redact, and a review must not require it to:

- **The scheme and host of a URL.** That is the endpoint, and the endpoint is the diagnostic the
  report exists to carry. Full URL redaction was considered and rejected.
- **A value shorter than 8 characters after an auth scheme, or any word of ordinary prose.** The
  length gate is what keeps "the token file is missing" readable. It is a deliberate false negative,
  not an oversight.
- **Unmarked secrets.** A bare credential with no name, no auth scheme and no URL is out of scope.

The report string must stay honest: it may say the payload was scrubbed on a best-effort basis, and
must never claim the payload is "already scrubbed".

## Ponytail — Post-Write Simplification Check

Ponytail operates on code that already exists and asks whether the same behavior can be expressed more simply. It never decides whether a feature should exist, which dependency gets added, which pattern is used, or how the system is structured.

- Never remove, reduce, or alter behavior the task authorized. Report it as a finding instead; the human decides.
- When deletion and addition both work and the authorized behavior stays identical, delete.
- If the simpler form requires changing the design, dependencies, or structure, that is a finding for the human, not an edit.
- Apply these rules during implementation only; they are not an approval checkbox, a receipt, a line-count target, or a replacement for RDD/native review.

## ODD Worktrees

During ODD's `Classify` step, substantial work means two or more meaningful implementation steps or progress worth recovering. Code work is born in a sibling worktree (`../<Project>-odd-<slug>`, where `<Project>` is the main worktree's directory name) on branch `odd/<slug>`, not in main. Human consent is explicit and per-feature before invoking `rapso worktree create`; `--yes` is only the consequence of that approval, never a shortcut around it. The ODD task doc `odd/tasks/<feature>.md` is committed on the branch and reaches main through the PR, so it must never live inside a `gentle-ai` managed block. After the merge, rebuild `cli/dist/` in main before dogfooding the CLI because `cli/dist/` is gitignored and the merge does not update it.

## Pull Request Policy

This repository declares its own policy, and **it is the source of truth: where an installed generic
skill contradicts what is written here, this repository wins.**

What is actually enforced, measured rather than assumed:

| Rule | Enforced by |
|------|-------------|
| Atomicity Gate — at most 5 staged files per commit | `.githooks/pre-commit` — hard block |
| No direct code commits in the main worktree (only `.rapsodia-code/sessions/**` is exempt) | `.githooks/pre-commit` step 1b — hard block |
| `gga` review of staged `*.go,*.mod,*.ts,*.tsx,*.yaml,*.json` | `.githooks/pre-commit` — blocks on failure |
| Conventional commit messages | **Convention only** — there is no `commit-msg` hook |
| Exactly one `type:*` label | **Convention only** — no CI |
| Linked issue (`Closes #N`) | **Convention only** — no CI; issues are the human's to open |
| PR body structure | `.github/PULL_REQUEST_TEMPLATE.md` — a review aid, not validated |

- This repository has **no `.github/workflows`**. Never report a gate, check, or block that does not
  exist here. When an installed skill asserts one, say so plainly instead of inventing it.
- Skills such as `branch-pr` are **third-party defaults**, not this repository's policy. Do not patch
  them locally to fit: policy belongs in this file, versioned with the code.
- `shellcheck` is not installed in this environment. Use `bash -n` for shell syntax, and report it as
  the check actually run.

## Reporting Rapsodia Defects

Rapsodia is a tool you are USING, not the project you are working on.

When you identify a failure that belongs to Rapsodia itself — not to this project, its
configuration, or its environment — say so, and **suggest** opening an issue at
https://github.com/Stefan-migo/rapsodia-code/issues with the evidence: what you ran, what happened,
and the smallest reproduction you have.

- Suggest only. Never open the issue, never run `gh`, and never write to the Rapsodia
  repository from a project workflow. The human decides.
- Only for an identified defect. Do not speculate, and do not suggest an issue for expected
  refusals, for this project's own bugs, or for environment and dependency failures.
- If you cannot tell whether the cause is Rapsodia, say that instead of filing.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
