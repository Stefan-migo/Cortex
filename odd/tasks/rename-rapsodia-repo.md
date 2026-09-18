# ODD Tasks — rename-rapsodia-repo

Worktree: `/home/stefan/rapsodia-code-odd-rename-rapsodia-repo`
Branch: `odd/rename-rapsodia-repo`
Base: `23a1881`
TDD: OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Close the last **identity** surface the rename left behind: the repository identity
(`Stefan-migo/Cortex`) and the defect-reporting prose that names it, so no live surface still
claims the tool is called Cortex — while every **persisted matching key** keeps its current value.

The folder rename (`/home/stefan/Cortex` → `/home/stefan/rapsodia-code`) and the symlink re-point
are **not** this work unit. They cannot happen from a worktree and are sequenced afterwards; see
## Sequencing.

## Problem

Slices 1–3 renamed what the user *consumes*: npm package (`rapsodia-code`), binary (`rapso`),
state dir (`.rapsodia-code/`), skill pack (`rapso-*`). They deliberately left the **repository
identity** because `rename-rapsodia-brand.md:91-97` established that the heading
`## Reporting Cortex Defects` is a *matching key*, not branding: `injectSections`
(`cli/src/engine/adopt.ts:49`) decides whether to inject a section by comparing the heading line
to what is already present in an adopted project's `AGENTS.md`. Renaming the heading without
teaching the matcher the legacy name injects a **duplicate section into every already-adopted
project**.

That constraint is real and stays. It is a reason to add alias support, not a reason to keep the
Cortex wording forever.

## Why now

The repository rename is now the *only* remaining lever, and the moment matters:
`rapsodia-code` is **not yet published on npm** (`npm view rapsodia-code` → E404 on 2026-09-17),
so no external consumer is pinned to either URL. Renaming a GitHub repository in place redirects
the old URL automatically — old web links, `git fetch`/`git push`, and every PR/issue number keep
resolving — so the change is additive rather than breaking. Doing this after publish would mean
migrating real consumers instead of zero.

## In scope (measured 2026-09-17, not estimated)

`grep -rn "Cortex" cli/src cli/package.json cli/README.md AGENTS.md README.md commands
cortex-init.sh` → **38 occurrences across 9 files**. Of those, the following are in scope:

| File | Sites | What changes |
|---|---|---|
| `cli/src/engine/adopt.ts` | L41, L44 | the defect-heading regex and the heading key; plus legacy-alias support in the matcher |
| `cli/src/template/AGENTS.md` | L134, L136, L138, L140, L143, L147 | heading, prose, defect URL |
| `AGENTS.md` (this repository's own) | L135, L137, L139, L141, L144, L148 | heading, prose, defect URL |
| `cli/src/utils/defect.ts` | L56 | defect prose and both issue URLs |
| `cli/package.json` | L8, L11, L13 | `repository.url`, `homepage`, `bugs.url` |
| `README.md` | L5 | the sentence asserting "the repository keeps its existing identity" becomes false |
| `cli/README.md` | L38 | issue-tracking URL |
| `commands/cortex-init.md` | L27 | see T07 — independent defect |

## Scope expansion (2026-09-18)

The measurement above was **incomplete**, and so was the first correction of it. The original
`grep -rn "Cortex"` is **case-sensitive**, and its path list omitted `scripts/`, `skills/`, and
`docs/`. Lowercase references such as `cortex close` and `cortex worktree create`, and whole
directories, were therefore invisible. A repo-wide case-insensitive scan is the corrected
measurement.

The remaining work was split into four buckets. Only Bucket 1 belongs to this work unit.

**Bucket 1 — prose and stale commands (this work unit).** Human-facing `Cortex` prose, plus
commands and paths that are now factually wrong because the binary is `rapso`:

| File | What changed |
|---|---|
| `AGENTS.md` | H1 → `Rapsodia 2.5`; `cortex start` / `cortex close` / `cortex worktree create` → `rapso …`; worktree pattern `../Cortex-odd-<slug>` → `../<Project>-odd-<slug>` |
| `commands/cortex-init.md` | prose only |
| `cortex-init.sh` | human-facing prose only |
| `scripts/setup.sh`, `rollback.sh`, `install-deps.sh`, `backup.sh`, `cortex-sync.sh`, `migrate-wiki-to-engram.sh`, `engram-export-wiki.sh` | prose only |
| `skills/rapso-persona/SKILL.md` | all 14 refs: identity, defect heading, defect prose, URLs, `source:` |
| `skills/rapso-session/SKILL.md` | only `source:` and the `(Cortex memory standard)` parenthetical |
| `docs/COMPETITIVE-ANALYSIS.md`, `DESIGN.md` | prose only |
| `cli/scripts/generate-retrospective.sh` | stale `cortex close` → `rapso close` |

**Bucket 2 — agent identity (deferred to its own change).** `@Cortex-Planner` / `@Cortex-Developer`
in `AGENTS.md` and `skills/rapso-session/SKILL.md`, the `agent` keys in `opencode.json`, and the
tracked `.opencode/agents/cortex-{planner,developer}.md` filenames with their contents. These
cannot be renamed alone: `AGENTS.md` would point at agents that `opencode.json` does not define.
The root files are a stale copy of `cli/src/template/**`, which already ships `rapso-*`, so this is
a sync rather than new authoring. It requires an OpenCode restart, because agent keys are read at
session start.

**Bucket 3 — command names and identifiers (deferred to its own decision).** The filenames
`cortex-init.sh`, `commands/cortex-init.md`, and `scripts/cortex-sync.sh` define the user-visible
command `/cortex-init`; renaming them changes an API, not prose. Also the internal identifiers
`CORTEX_PACK_DIR`, `CORTEX_SRC`, `CORTEX_WORKTREE_PROVISION`, `cortex_dir`, `_cortex_mcp_tmp.json`,
and `cortexVersion` in `cli/src/utils/defect.ts`.

**Bucket 4 — deliberate compatibility (never renamed).** `cli/src/utils/state.ts`
(`GLOBAL_STATE_DIR_NAME = '.cortex'`, `LEGACY_SESSIONS_DIR_NAME = '.cortex-sessions'`), the
`# Cortex managed entries` / `# cortex:start` / `# cortex:end` markers and `__managed_by: 'cortex'`
in `cli/src/engine/adopt.ts`, the `cortex-session/*` Engram topic keys, and
`scripts/migrate-wiki-to-engram.sh`'s `PROJECT="cortex-plugin"`.

## Exclusions

Recorded so they are not "helpfully" renamed. Every one of these is compared against content that
is **already written** in adopted projects, exactly like the heading:

1. **`# Cortex managed entries`** — `cli/src/engine/adopt.ts:68`. Block header inside the managed
   region.
2. **`# cortex:start` / `# cortex:end`** — `cli/src/engine/adopt.ts:69`. The `injectMarked`
   delimiters in every adopted project's `.gitignore`. Renaming them makes the marker regex miss
   and append a second managed block.
3. **`__managed_by: 'cortex'`** — `cli/src/engine/adopt.ts:82,83`. Persisted ownership metadata in
   every adopted project's `opencode.json`; it is what stops `adopt` from clobbering a project's
   own agent. Renaming it makes `adopt` re-claim entries it already owns.
4. **The Engram `topic_key` namespace and the `cortex-*` observation project name** — persisted
   memory, not source references.
5. **Historical records** — `odd/tasks/*.md`, `wiki/**`, `.rapsodia-code/sessions/**`,
   `openspec/changes/archive/**`. 171 files contain the literal path and ~21 distinct PR numbers
   are cited as evidence across `odd/tasks/*.md`. **Rewriting these falsifies the evidence trail.**
   They are read-only for this change.
6. **`cli/src/template/.opencode/opencode.json`, `mcp-template.json`** — no `Cortex` identity refs;
   verified by the grep above.

## Deferred — pending decision

**This repository's own agent identities.** `opencode.json` declares `cortex-planner` /
`cortex-developer`, and `.opencode/agents/cortex-planner.md` / `cortex-developer.md` exist under
those names. `adopt` already writes `rapso-planner` / `rapso-developer`
(`cli/src/engine/adopt.ts:78`) into newly adopted projects, so this repository is in the *legacy*
state: it was adopted before the rename. Consequences of leaving it: running `rapso adopt` here
would add a second pair of agents alongside the existing ones.

Renaming them is **new scope**, not part of slices 1–3 — slice 1 explicitly scoped the agent
identity rename to `cli/src/template/**` only. It also requires an OpenCode restart to take effect
(agent keys are read at session start). Not started; awaiting a decision.

## Constraints

- **The matcher must accept both headings before the heading is renamed.** T01 lands before T02/T03,
  or already-adopted projects receive a duplicate section.
- **No URL may be changed before the GitHub repository is renamed**, or the published metadata
  points at a 404 for the interim. Order: rename the repository, then land these source edits.
- Do not touch any file under `odd/tasks/**` except this one.
- Never stage the worktree's untracked `.opencode/` install artifacts (`package.json`,
  `package-lock.json`, `tools/package-lock.json`); use explicit paths when staging.
- `cli/dist/` is gitignored and must be rebuilt in `main` after the merge before dogfooding.

## Sequencing

1. **This work unit** (worktree + PR): the reviewable source changes above.
2. **GitHub rename** `Stefan-migo/Cortex` → `Stefan-migo/rapsodia-code`. **Done 2026-09-18 by the
   human, manually.** The old URL redirects and `git fetch` still resolves, so nothing broke.
   T02–T06 are unblocked. The local `origin` URL was deliberately left on the old name: Engram
   derives the project from the local remote, and updating it would split the persisted `cortex`
   memory project.
3. **Folder rename in `main`, with zero registered worktrees.** `git worktree` stores its gitdir by
   absolute path, so renaming the main with live sibling worktrees breaks them. **Done 2026-09-18:
   `/home/stefan/Cortex` → `/home/stefan/rapsodia-code`.** Measured blast radius for the folder move:
   - 6 symlinks pointing into the folder — 5 `ponytail-*` under the repo's gitignored
     `.opencode/skills/` (recreated by `cortex-init.sh`) and `~/.local/bin/cortex` (one `ln -sf`).
     The earlier "~8 absolute symlinks across 10 projects" premise was measured as 6 in 1 project.
   - `.git/config` holds **no** absolute paths — verified.
   - `graphify-out/.graphify_root` contains `.` and `graph.json` has **0** absolute-path fields —
     verified; a `graphify update` refresh is a nicety, not a repair.
   - `.atl/skill-registry.md` is generated and must be regenerated.
   **Outcome:** the 5 `ponytail-*` links were re-pointed to relative `../../skills/...`; the
   `~/.local/bin/cortex` shim and the `~/.npm-global` links were converged to `rapso`. No `cortex`
   shim remains. `.atl/skill-registry.md` was regenerated.

## Tasks

- [x] **T01** — `cli/src/engine/adopt.ts`: teach the defect-section matcher the legacy heading.
      `markdownSections` must emit the **new** heading while `injectSections` treats either the new
      or the legacy heading as already satisfied. Add a named legacy-alias constant rather than an
      inline string, so the excluded-marker list stays in one place.
- [x] **T02** — `cli/src/template/AGENTS.md`: rename the heading to `## Reporting Rapsodia Defects`,
      update the prose and the issue URL.
- [x] **T03** — root `AGENTS.md`: same heading, prose and URL as T02, keeping the two files in sync
      (T02 is the template that `adopt` reads).
- [x] **T04** — `cli/src/utils/defect.ts:56`: defect prose and both issue URLs.
- [x] **T05** — `cli/package.json`: `repository.url`, `homepage`, `bugs.url`.
- [x] **T06** — `README.md:5` and `cli/README.md:38`: the identity sentence and the issue URL.
- [x] **T07** — `commands/cortex-init.md:27`: the line
      `` - `cortex-init.sh` is the single entry point — lives at `/home/stefan/Cortex/cortex-init.sh` ``
      hardcodes the author's absolute home path in a **tracked, published** file that is installed
      globally and into every project. It is wrong for every other user today, independently of any
      rename. Remove the absolute path; keep the entry-point statement.
- [x] **T08** — Observable checks (see ## Checks). Checks 1–3 and 5 pass. Check 4 (`rg -n 'Cortex'`)
      now returns only the Bucket 2, 3, and 4 items catalogued in ## Scope expansion: the agent
      identities, the `cortex-init` / `cortex-sync` names, and the deliberate compatibility keys.
      Bucket 1 is complete; the acceptance criterion is fully met only once Buckets 2 and 3 land.

## Checks

All commands are run from this worktree; report the real output, never an inferred pass.

1. `cd cli && npm run typecheck` — must exit 0 with no diagnostics.
2. `cd cli && npm run build` — must exit 0.
3. `node cli/dist/index.js --help` — must exit 0 and list the `rapso` command surface.
4. `rg -n 'Cortex' cli/src cli/package.json cli/README.md AGENTS.md README.md commands cortex-init.sh`
   — must return only the exclusions listed above (the three managed markers in `adopt.ts`, plus
   zero remaining identity prose or URLs). Report the exact output.
5. `git diff --stat` — no path outside ## In scope.

## Acceptance criteria

- No live surface claims the tool or its repository is called Cortex, except the persisted matching
  keys in ## Exclusions, which are unchanged byte for byte.
- An already-adopted project carrying `## Reporting Cortex Defects` does **not** receive a second
  defect section from `adopt`, and a new project receives the new heading.
- `commands/cortex-init.md` contains no absolute path belonging to the author's machine.

## Progress

- **T01–T08** — not started. Doc created before the first source write, as required.
- **2026-09-17 — decision taken:** the human renames the GitHub repository **manually** before
  implementation resumes. The agent does not perform the remote rename and is not authorized to.
- **2026-09-17 — decision still open:** the agent-identity convergence under ## Deferred is
  unanswered.
- **2026-09-18 — the doc is committed, not uncommitted.** It lives on `odd/rename-rapsodia-repo` as
  `3a585de`; the old worktree was closed (so the folder rename had zero registered worktrees) and a
  new one was created at `../rapsodia-code-odd-rename-rapsodia-repo`. Mirror: Engram topic
  `odd/rename-rapsodia-repo/tasks`.
- **2026-09-18 — both blocking renames are done** (## Sequencing 2 and 3). T02–T06 are unblocked.
- **2026-09-18 — T01–T07 and Bucket 1 implemented and verified.** `npm run typecheck` exit 0,
  `npm run build` exit 0. The acceptance scenario was run against a throwaway target, not inferred:
  a project carrying `## Reporting Cortex Defects` got `Injected (2)` with its `AGENTS.md`
  untouched, and a fresh project got `Injected (3)` with the new heading.
- **2026-09-18 — scope corrected (see ## Scope expansion).** The original measurement was
  case-sensitive and omitted `scripts/`, `skills/`, and `docs/`. Bucket 1 was completed against a
  repo-wide case-insensitive scan. A final scan leaves `cortex` in exactly ten tracked files, and
  every remaining hit is Bucket 2, Bucket 3, or Bucket 4.
- **Next step** — Bucket 2 (agent identity: `opencode.json` + `.opencode/agents/cortex-*.md` + the
  `@Cortex-*` references), then Bucket 3 (the `cortex-init` / `cortex-sync` command names and the
  internal identifiers).
