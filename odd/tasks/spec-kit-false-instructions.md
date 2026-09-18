# ODD Task — spec-kit-false-instructions

**Branch:** `odd/spec-kit-false-instructions` · **Worktree:** `../Cortex-odd-spec-kit-false-instructions`

**Origin:** `.cortex-sessions/ready-for-sdd/2026-09-15-spec-kit-decommission/report.md` — Group A (the "urgent minimal fix") of that handoff, widened to cover the template.

## Objective

Remove every `/speckit.*` instruction from every surface that instructs an agent or a consumer, because none of those commands exists.

## Problem

No `/speckit.*` command is installed anywhere:

- `~/.config/opencode/commands/` holds only `cortex-init.md`, the `sdd-*.md` family, `skill-creator.md`, and `skill-registry.md`.
- The repository's `.opencode/commands/` holds only `cortex-init.md`.

Yet six instruction surfaces tell agents to run them. `AGENTS.md` is injected into every session through `opencode.json.instructions`, so this is a false instruction shipped on every single session, not inert cruft. The template surfaces ship the same false instruction into every project created with `cortex init`.

## Why

Two reasons, one immediate and one about distribution:

1. **False instructions are live now.** `AGENTS.md` tells agents to run `/speckit.specify` for planning and `/speckit.analyze` as a mandatory gate step. Neither exists.
2. **It is the first sync blocker.** The template cannot be distributed until it stops instructing consumers to run commands that do not exist in their installation.

## Scope

Authorized, eight files:

| Surface | File |
|---|---|
| Root | `AGENTS.md` |
| Root | `.opencode/agents/cortex-planner.md` |
| Root | `.opencode/agents/cortex-developer.md` |
| Template | `cli/src/template/AGENTS.md` |
| Template | `cli/src/template/.opencode/agents/cortex-planner.md` |
| Template | `cli/src/template/.opencode/agents/cortex-developer.md` |
| Template | `cli/src/template/SYSTEM-MAP.md` |
| Template | `cli/src/template/USER-GUIDE.md` |

The replacement authority is the repository's own `README.md:76`, which already declares the substitution: `| Spec-Kit /speckit.* commands | Gentle AI SDD (/sdd-*) |`.

**Out of scope** (the remaining groups of the full decommission): deleting `.specify/**` from the root, from `cli/src/template/`, and their build copy; the CLI references (`cli/src/commands/status.ts`, `analyze.ts`, `cli/src/engine/session.ts`, `cli/src/commands/close.ts`, `cli/src/engine/deps.ts`); the shell scripts (`scripts/install-deps.sh`, `scripts/sdd-init.sh`); `docs/COMPETITIVE-ANALYSIS.md`; and the local gitignored `.specify/` working directory.

## Constraints

- **Only name commands that actually exist.** The verified set is `~/.config/opencode/commands/`: `cortex-init`, `sdd-apply`, `sdd-archive`, `sdd-continue`, `sdd-explore`, `sdd-ff`, `sdd-init`, `sdd-new`, `sdd-onboard`, `sdd-research`, `sdd-status`, `sdd-verify`, `skill-creator`, `skill-registry`. Also legitimate: the `cortex-session` skill, Engram, Graphify, and the `cortex` CLI subcommands. Do not invent anything else.
- **Replace, do not leave a hole.** Deleting the brain-lobe line or a section header without a truthful replacement leaves the document incoherent. The frontal lobe keeps a planning owner; it is simply the real one.
- **Preserve each file's structure, heading levels, table formatting, and tone.** No opportunistic rewrites.
- Do not touch the `## ODD Worktrees` section recently added to `AGENTS.md`.
- Do not touch anything under `.specify/`, any TypeScript file, or any shell script.
- Generated artifacts stay in English.

## TDD

Mode: **off**. This change touches only Markdown instruction files; there is no code path to test and the repository has no test harness (zero test files, `npm test` exits 1).

## Tasks

- [x] **T01** — Root surfaces: remove every `/speckit.*` reference from `AGENTS.md`, `.opencode/agents/cortex-planner.md`, and `.opencode/agents/cortex-developer.md`, replacing each with the real command that exists.
- [x] **T02** — Template surfaces: apply the identical treatment to `cli/src/template/AGENTS.md`, `cli/src/template/.opencode/agents/cortex-planner.md`, and `cli/src/template/.opencode/agents/cortex-developer.md`, keeping the template consistent with the root.
- [x] **T03** — Template documentation: apply the identical treatment to `cli/src/template/SYSTEM-MAP.md` and `cli/src/template/USER-GUIDE.md`.
- [x] **T04** — Verify, commit as two reviewable work units (root, then template), and open the PR. **Delivered by PR #11** (`docs: replace non-existent /speckit.* instructions with the installed SDD commands`, merged 2026-09-16); its files and body match the eight documented instruction surfaces.

## Acceptance criteria

- `git grep -n "/speckit" -- AGENTS.md .opencode cli/src/template` returns nothing.
- Every command named in the eight edited files exists in `~/.config/opencode/commands/` or is a `cortex` CLI subcommand.
- No file outside the eight authorized paths is modified.
- The root and the template stay consistent with each other.

## Verification evidence

`git grep -n "/speckit" -- AGENTS.md .opencode cli/src/template`:

```text
cli/src/template/.specify/extensions/git/extension.yml:13:        file: commands/speckit.git.feature.md
cli/src/template/.specify/extensions/git/extension.yml:15:        file: commands/speckit.git.validate.md
cli/src/template/.specify/extensions/git/extension.yml:17:        file: commands/speckit.git.remote.md
cli/src/template/.specify/extensions/git/extension.yml:19:        file: commands/speckit.git.initialize.md
cli/src/template/.specify/extensions/git/extension.yml:21:        file: commands/speckit.git.commit.md
cli/src/template/SYSTEM-MAP.md:12:                         │     Spec-Kit /speckit.*   │
cli/src/template/SYSTEM-MAP.md:41:│   Primary tool   │  /speckit.specify    │ /speckit.implement │
cli/src/template/SYSTEM-MAP.md:58:| `/speckit.constitution` | Define project principles | `.specify/memory/constitution.md` |
cli/src/template/SYSTEM-MAP.md:59:| `/speckit.specify` | Write feature spec | `.specify/specs/<n>-<name>.md` |
cli/src/template/SYSTEM-MAP.md:60:| `/speckit.clarify` | Resolve ambiguities | Clarifications section added |
cli/src/template/SYSTEM-MAP.md:61:| `/speckit.plan` | Create tech plan | `.specify/plans/<n>-<name>.md` |
cli/src/template/SYSTEM-MAP.md:62:| `/speckit.tasks` | Break into tasks | `.specify/tasks/<n>-<name>.md` |
cli/src/template/SYSTEM-MAP.md:63:| `/speckit.implement` | Execute all tasks | Built code |
cli/src/template/SYSTEM-MAP.md:64:| `/speckit.analyze` | Consistency check | Analysis report |
cli/src/template/SYSTEM-MAP.md:65:| `/speckit.checklist` | Quality validation | Checklist |
cli/src/template/SYSTEM-MAP.md:66:| `/speckit.taskstoissues` | Export as GitHub issues | Issues |
cli/src/template/SYSTEM-MAP.md:138:Step 4: SPEC CHECK — /speckit.analyze after completion
cli/src/template/SYSTEM-MAP.md:173:│ SPEC-KIT         │ /speckit.*           │ Every feature task   │
cli/src/template/USER-GUIDE.md:32:1. /speckit.specify         → Write feature spec (Planner)
cli/src/template/USER-GUIDE.md:33:2. /speckit.clarify         → Resolve ambiguities (Planner, optional)
cli/src/template/USER-GUIDE.md:34:3. /speckit.plan            → Create tech plan (Planner)
cli/src/template/USER-GUIDE.md:35:4. /speckit.tasks           → Break into tasks (Planner)
cli/src/template/USER-GUIDE.md:39:6. /speckit.checklist       → Quality validation (Developer)
cli/src/template/USER-GUIDE.md:64:| `/speckit.constitution` | Define project principles |
cli/src/template/USER-GUIDE.md:65:| `/speckit.specify` | Write feature spec (WHAT) |
cli/src/template/USER-GUIDE.md:66:| `/speckit.clarify` | Resolve ambiguities |
cli/src/template/USER-GUIDE.md:67:| `/speckit.plan` | Write tech plan (HOW) |
cli/src/template/USER-GUIDE.md:68:| `/speckit.tasks` | Break into tasks |
cli/src/template/USER-GUIDE.md:69:| `/speckit.implement` | Execute all tasks |
cli/src/template/USER-GUIDE.md:70:| `/speckit.analyze` | Consistency check |
cli/src/template/USER-GUIDE.md:71:| `/speckit.checklist` | Quality validation |
cli/src/template/USER-GUIDE.md:91:4. **SPEC CHECK** — /speckit.analyze after completion
```

Result: **partial** — these references are in out-of-scope template documentation and `.specify/` files.

`grep -rn "/speckit" AGENTS.md .opencode/agents cli/src/template/AGENTS.md cli/src/template/.opencode/agents`:

```text
(no output)
```

Result: **pass** — all six authorized instruction surfaces are clear.

`git status --short`:

```text
 M .opencode/agents/cortex-developer.md
 M .opencode/agents/cortex-planner.md
 M AGENTS.md
 M cli/src/template/.opencode/agents/cortex-developer.md
 M cli/src/template/.opencode/agents/cortex-planner.md
 M cli/src/template/AGENTS.md
?? .opencode/package-lock.json
?? .opencode/package.json
?? .opencode/tools/package-lock.json
?? odd/tasks/spec-kit-false-instructions.md
```

Result: **partial** — the six authorized files are modified; the worktree also contains pre-existing untracked provisioning files and this task document.

`grep -rn "sdd-" AGENTS.md .opencode/agents cli/src/template/AGENTS.md cli/src/template/.opencode/agents | head -30`:

```text
AGENTS.md:6:Frontal Lobe (Planning)     → cortex-session + Gentle AI SDD — /sdd-*
AGENTS.md:48:| `/sdd-new` | Start a new structured change |
AGENTS.md:49:| `/sdd-ff` | Fast-forward a change through its planning phases |
AGENTS.md:50:| `/sdd-status` | Check change state and available next steps |
AGENTS.md:51:| `/sdd-apply` | Implement the change tasks |
AGENTS.md:52:| `/sdd-verify` | Run diagnostics against the implementation and artifacts |
AGENTS.md:53:| `/sdd-archive` | Close and preserve a completed change |
AGENTS.md:54:| `/sdd-init` | Initialize SDD context for a project |
AGENTS.md:55:| `/sdd-onboard` | Walk through the SDD workflow on an existing project |
AGENTS.md:69:1. Planner discusses with user through the `cortex-session` skill, then drafts the change with `/sdd-new`
AGENTS.md:79:Step 4: SPEC CHECK — /sdd-verify after completion
.opencode/agents/cortex-developer.md:15:/sdd-apply    — Build features per the change tasks
.opencode/agents/cortex-developer.md:16:/sdd-verify   — Run diagnostics against the implementation and artifacts
.opencode/agents/cortex-developer.md:17:/sdd-archive  — Close and preserve a completed change
.opencode/agents/cortex-developer.md:49:  → After all tasks: run /sdd-verify
.opencode/agents/cortex-planner.md:18:| New change | `/sdd-new` | Propose a structured change |
.opencode/agents/cortex-planner.md:19:| Fast-forward | `/sdd-ff` | Advance the change through its planning phases |
.opencode/agents/cortex-planner.md:20:| Status | `/sdd-status` | Check change state and available next steps |
.opencode/agents/cortex-planner.md:22:Then hand off to `@Cortex-Developer` for `/sdd-apply`.
cli/src/template/AGENTS.md:6:Frontal Lobe (Planning)     → cortex-session + Gentle AI SDD — /sdd-*
cli/src/template/AGENTS.md:48:| `/sdd-new` | Start a new structured change |
cli/src/template/AGENTS.md:49:| `/sdd-ff` | Fast-forward a change through its planning phases |
cli/src/template/AGENTS.md:50:| `/sdd-status` | Check change state and available next steps |
cli/src/template/AGENTS.md:51:| `/sdd-apply` | Implement the change tasks |
```

Result: **pass** — every concrete `/sdd-*` command referenced above is in the verified installed set: `/sdd-new`, `/sdd-ff`, `/sdd-status`, `/sdd-apply`, `/sdd-verify`, `/sdd-archive`, `/sdd-init`, and `/sdd-onboard`.

### Extended-scope verification

`git grep -n "/speckit" -- .`:

```text
.specify/extensions/git/extension.yml:21:      file: commands/speckit.git.feature.md
.specify/extensions/git/extension.yml:24:      file: commands/speckit.git.validate.md
.specify/extensions/git/extension.yml:27:      file: commands/speckit.git.remote.md
.specify/extensions/git/extension.yml:30:      file: commands/speckit.git.initialize.md
.specify/extensions/git/extension.yml:33:      file: commands/speckit.git.commit.md
.specify/scripts/bash/check-prerequisites.sh:118:    echo "Run /speckit.specify first to create the feature structure." >&2
.specify/scripts/bash/check-prerequisites.sh:124:    echo "Run /speckit.plan first to create the implementation plan." >&2
.specify/scripts/bash/check-prerequisites.sh:131:    echo "Run /speckit.tasks first to create the task list." >&2
.specify/scripts/bash/common.sh:189:# and matches the resolved active FEATURE_DIR (so /speckit.plan can skip git branch pattern checks).
.specify/scripts/bash/common.sh:265:    #   2. .specify/feature.json "feature_directory" key (persisted by /speckit.specify)
.specify/scripts/bash/setup-tasks.sh:38:    echo "Run /speckit.plan first to create the implementation plan." >&2
.specify/scripts/bash/setup-tasks.sh:44:    echo "Run /speckit.specify first to create the feature structure." >&2
.specify/templates/checklist-template.md:7:**Note**: This checklist is generated by the `/speckit.checklist` command based on feature context and requirements.
.specify/templates/checklist-template.md:13:  The /speckit.checklist command MUST replace these with actual items based on:
.specify/templates/plan-template.md:6:**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.
.specify/templates/plan-template.md:42:├── plan.md              # This file (/speckit.plan command output)
.specify/templates/plan-template.md:43:├── research.md          # Phase 0 output (/speckit.plan command)
.specify/templates/plan-template.md:44:├── data-model.md        # Phase 1 output (/speckit.plan command)
.specify/templates/plan-template.md:45:├── quickstart.md        # Phase 1 output (/speckit.plan command)
.specify/templates/plan-template.md:46:├── contracts/           # Phase 1 output (/speckit.plan command)
.specify/templates/plan-template.md:47:└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
.specify/templates/tasks-template.md:32:  The /speckit.tasks command MUST replace these with actual tasks based on:
README.md:76:| Spec-Kit `/speckit.*` commands | Gentle AI SDD (`/sdd-*`) |
cli/src/commands/analyze.ts:131:      suggestions.push('Use `/speckit.specify` before starting complex features');
cli/src/engine/session.ts:185:    suggestions.push('Use `/speckit.specify` before starting complex features');
cli/src/template/.specify/extensions/git/extension.yml:13:        file: commands/speckit.git.feature.md
cli/src/template/.specify/extensions/git/extension.yml:15:        file: commands/speckit.git.validate.md
cli/src/template/.specify/extensions/git/extension.yml:17:        file: commands/speckit.git.remote.md
cli/src/template/.specify/extensions/git/extension.yml:19:        file: commands/speckit.git.initialize.md
cli/src/template/.specify/extensions/git/extension.yml:21:        file: commands/speckit.git.commit.md
```

Result: **pass** — remaining hits are only in `.specify/`, `cli/src/template/.specify/`, `README.md`, and the two out-of-scope CLI files.

`git status --short`:

```text
 M .opencode/agents/cortex-developer.md
 M .opencode/agents/cortex-planner.md
 M AGENTS.md
 M cli/src/template/.opencode/agents/cortex-developer.md
 M cli/src/template/.opencode/agents/cortex-planner.md
 M cli/src/template/AGENTS.md
 M cli/src/template/SYSTEM-MAP.md
 M cli/src/template/USER-GUIDE.md
?? .opencode/package-lock.json
?? .opencode/package.json
?? .opencode/tools/package-lock.json
?? odd/tasks/spec-kit-false-instructions.md
```

Result: **partial** — the eight authorized files are modified; pre-existing untracked provisioning files and this task document are also present.

`git grep -n "sdd-" -- AGENTS.md .opencode/agents cli/src/template/AGENTS.md cli/src/template/.opencode/agents cli/src/template/SYSTEM-MAP.md cli/src/template/USER-GUIDE.md | head -40`:

```text
.opencode/agents/cortex-developer.md:15:/sdd-apply    — Build features per the change tasks
.opencode/agents/cortex-developer.md:16:/sdd-verify   — Run diagnostics against the implementation and artifacts
.opencode/agents/cortex-developer.md:17:/sdd-archive  — Close and preserve a completed change
.opencode/agents/cortex-developer.md:49:  → After all tasks: run /sdd-verify
.opencode/agents/cortex-planner.md:18:| New change | `/sdd-new` | Propose a structured change |
.opencode/agents/cortex-planner.md:19:| Fast-forward | `/sdd-ff` | Advance the change through its planning phases |
.opencode/agents/cortex-planner.md:20:| Status | `/sdd-status` | Check change state and available next steps |
.opencode/agents/cortex-planner.md:22:Then hand off to `@Cortex-Developer` for `/sdd-apply`.
AGENTS.md:6:Frontal Lobe (Planning)     → cortex-session + Gentle AI SDD — /sdd-*
AGENTS.md:48:| `/sdd-new` | Start a new structured change |
AGENTS.md:49:| `/sdd-ff` | Fast-forward a change through its planning phases |
AGENTS.md:50:| `/sdd-status` | Check change state and available next steps |
AGENTS.md:51:| `/sdd-apply` | Implement the change tasks |
AGENTS.md:52:| `/sdd-verify` | Run diagnostics against the implementation and artifacts |
AGENTS.md:53:| `/sdd-archive` | Close and preserve a completed change |
AGENTS.md:54:| `/sdd-init` | Initialize SDD context for a project |
AGENTS.md:55:| `/sdd-onboard` | Walk through the SDD workflow on an existing project |
AGENTS.md:69:1. Planner discusses with user through the `cortex-session` skill, then drafts the change with `/sdd-new`
AGENTS.md:79:Step 4: SPEC CHECK — /sdd-verify after completion
cli/src/template/.opencode/agents/cortex-developer.md:14:/sdd-apply    — Build features per the change tasks
cli/src/template/.opencode/agents/cortex-developer.md:15:/sdd-verify   — Run diagnostics against the implementation and artifacts
cli/src/template/.opencode/agents/cortex-developer.md:16:/sdd-archive  — Close and preserve a completed change
cli/src/template/.opencode/agents/cortex-developer.md:48:  → After all tasks: run /sdd-verify
cli/src/template/.opencode/agents/cortex-planner.md:17:| New change | `/sdd-new` | Propose a structured change |
cli/src/template/.opencode/agents/cortex-planner.md:18:| Fast-forward | `/sdd-ff` | Advance the change through its planning phases |
cli/src/template/.opencode/agents/cortex-planner.md:19:| Status | `/sdd-status` | Check change state and available next steps |
cli/src/template/.opencode/agents/cortex-planner.md:21:Then hand off to `@Cortex-Developer` for `/sdd-apply`.
cli/src/template/AGENTS.md:6:Frontal Lobe (Planning)     → cortex-session + Gentle AI SDD — /sdd-*
cli/src/template/AGENTS.md:48:| `/sdd-new` | Start a new structured change |
cli/src/template/AGENTS.md:49:| `/sdd-ff` | Fast-forward a change through its planning phases |
cli/src/template/AGENTS.md:50:| `/sdd-status` | Check change state and available next steps |
cli/src/template/AGENTS.md:51:| `/sdd-apply` | Implement the change tasks |
cli/src/template/AGENTS.md:52:| `/sdd-verify` | Run diagnostics against the implementation and artifacts |
cli/src/template/AGENTS.md:53:| `/sdd-archive` | Close and preserve a completed change |
cli/src/template/AGENTS.md:54:| `/sdd-init` | Initialize SDD context for a project |
cli/src/template/AGENTS.md:55:| `/sdd-onboard` | Walk through the SDD workflow on an existing project |
cli/src/template/AGENTS.md:69:1. Planner discusses with user through the `cortex-session` skill, then drafts the change with `/sdd-new`
cli/src/template/AGENTS.md:79:Step 4: SPEC CHECK — /sdd-verify after completion
cli/src/template/SYSTEM-MAP.md:12:                          │     Gentle AI SDD (/sdd-*)│
```

Result: **pass** — every concrete command shown is in the verified installed set.

## Progress

Worktree created and provisioned by the current CLI; it was born with `cli/node_modules` already present, which dogfoods the `provision-cli-deps` fix merged today. PR #11 delivered T01–T04; its files and body match the implementation and verification above.

## Next step

None. PR #11 delivered the root and template instruction surfaces.

## Rationale log

- **The template is in scope, not deferred.** The same false instruction ships to every consumer project; fixing only the root would leave the distribution surface lying and the sync blocker in place.
- **Step 4 of the 5-Step Gate is repointed, not deleted.** Its intent is a post-completion consistency check, and `/sdd-verify` is the installed command that serves it. Deleting the step would silently drop a gate the user established.
- **The handoff stays in the inbox.** It owns the full decommission (Groups A–F), of which this is one slice; archiving it now would discard the inventory for the rest.
- **The first pass caught a scope miss.** Its verification found false instructions in the template's own `SYSTEM-MAP.md` and `USER-GUIDE.md`; the criterion is every surface that instructs an agent or a consumer, not a fixed file list.
