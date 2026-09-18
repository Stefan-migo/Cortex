# ODD Tasks — rename-rapsodia-repo

Worktree: `/home/stefan/Cortex-odd-rename-rapsodia-repo`
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
2. **GitHub rename** `Stefan-migo/Cortex` → `Stefan-migo/rapsodia-code`. **Decided 2026-09-17: the
   human performs this rename manually before implementation resumes.** It is not executed from this
   worktree and not delegated to the agent. T02–T06 stay blocked until the human confirms it is done.
3. **Folder rename in `main`, with zero registered worktrees.** `git worktree` stores its gitdir by
   absolute path, so renaming the main with live sibling worktrees breaks them. Measured
   blast radius for the folder move:
   - 6 symlinks pointing into the folder — 5 `ponytail-*` under the repo's gitignored
     `.opencode/skills/` (recreated by `cortex-init.sh`) and `~/.local/bin/cortex` (one `ln -sf`).
     The earlier "~8 absolute symlinks across 10 projects" premise was measured as 6 in 1 project.
   - `.git/config` holds **no** absolute paths — verified.
   - `graphify-out/.graphify_root` contains `.` and `graph.json` has **0** absolute-path fields —
     verified; a `graphify update` refresh is a nicety, not a repair.
   - `.atl/skill-registry.md` is generated and must be regenerated.

## Tasks

- [ ] **T01** — `cli/src/engine/adopt.ts`: teach the defect-section matcher the legacy heading.
      `markdownSections` must emit the **new** heading while `injectSections` treats either the new
      or the legacy heading as already satisfied. Add a named legacy-alias constant rather than an
      inline string, so the excluded-marker list stays in one place.
- [ ] **T02** — `cli/src/template/AGENTS.md`: rename the heading to `## Reporting Rapsodia Defects`,
      update the prose and the issue URL.
- [ ] **T03** — root `AGENTS.md`: same heading, prose and URL as T02, keeping the two files in sync
      (T02 is the template that `adopt` reads).
- [ ] **T04** — `cli/src/utils/defect.ts:56`: defect prose and both issue URLs.
- [ ] **T05** — `cli/package.json`: `repository.url`, `homepage`, `bugs.url`.
- [ ] **T06** — `README.md:5` and `cli/README.md:38`: the identity sentence and the issue URL.
- [ ] **T07** — `commands/cortex-init.md:27`: the line
      `` - `cortex-init.sh` is the single entry point — lives at `/home/stefan/Cortex/cortex-init.sh` ``
      hardcodes the author's absolute home path in a **tracked, published** file that is installed
      globally and into every project. It is wrong for every other user today, independently of any
      rename. Remove the absolute path; keep the entry-point statement.
- [ ] **T08** — Observable checks (see ## Checks), and confirm no in-scope `Cortex` identity
      reference remains.

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
- **2026-09-17 — session paused for continuation the next day.** This doc is **uncommitted** in the
  worktree `../Cortex-odd-rename-rapsodia-repo` on branch `odd/rename-rapsodia-repo`; no commit was
  requested and none was made. Resume by reading this file and its mirror at Engram topic
  `odd/rename-rapsodia-repo/tasks`.
- **Next step** — after the human confirms the GitHub rename is done, land T01 (matcher alias)
  **before** T02/T03, then T04–T07, then T08's observable checks.
