# ODD Task — spec-kit-decommission

**Branch:** `odd/spec-kit-decommission` · **Worktree:** `../Cortex-odd-spec-kit-decommission`

**Origin:** `.cortex-sessions/ready-for-sdd/2026-09-15-spec-kit-decommission/report.md` — the remaining surface of that handoff, re-verified against `main` @ `42ce127`.

**TDD mode:** OFF — source: this repository has no test harness and no lint script (`AGENTS.md`; `npm test` exits 1 with "No test files found"). Checks are `npm run typecheck`, `npm run build`, grep criteria, and manual shell scenarios.

---

## Objective

Remove the last live Spec-Kit surface from Cortex: the CLI report/guard fields, the shell installers, the retired template scaffolding, the vestigial ignore rule, and the tracked `.specify/` tree at the repository root.

## Why

`.specify/` is GitHub Spec-Kit v0.8.7 installed **for GitHub Copilot** (`"ai": "copilot"`). No `/speckit.*` command is installed anywhere — `.opencode/commands/` holds only `cortex-init.md`. Spec-Kit is dead at runtime but still wired into live CLI code, shell scripts, and shipped scaffolding.

The **urgent** half of this handoff is already landed (`42bb488` removed the false instructions from `AGENTS.md`, which is injected into every session). What remains is surface debt: a `cortex status` report field that can never be populated, a `close` guard that reads a directory being deleted, a dependency probe that demands a tool we no longer use, installers that still install it, and scaffolding that ships it into every new project.

## Already landed — DO NOT REDO

| Commit | What it closed |
|---|---|
| `42bb488` | Group A — `AGENTS.md` + `.opencode/agents/*`. `git grep -c "/speckit" -- AGENTS.md .opencode` → **0** |
| `9ec7295` | `cli/src/commands/analyze.ts` + `cli/src/engine/session.ts` retargeted from `speckit` to SDD |

The origin report still lists the Group A line numbers as pending. **They do not exist.** Consuming that report verbatim produces phantom tasks.

Already clean, verified, not in scope: `cli/src/template/{AGENTS,SYSTEM-MAP,USER-GUIDE}.md` (no `/speckit`; `SYSTEM-MAP.md:136` already reads `Step 4: SPEC CHECK — /sdd-verify after completion`). `README.md:76` is the **intentional** replacement table and stays.

## Scope — in

Line numbers verified at `42ce127`.

| ID | Surface | Change |
|---|---|---|
| T01 | `cli/src/commands/status.ts` | Drop the `speckit` report fields (32, 89), the `.specify/tasks` + `.specify/plans` reads (116-125), and the `Spec-Kit:` output line (201-204) |
| T02 | `cli/src/commands/close.ts:123` | Drop the `.specify` existence check |
| T03 | `cli/src/engine/deps.ts:53,56-57` | Drop the `speckit`/`specify` binary probe and its dependency entry |
| T04 | `scripts/install-deps.sh:97-114,149` | Drop the `speckit` gh-extension install and its status line |
| T05 | `scripts/sdd-init.sh`, `scripts/setup.sh:93` | Delete the script and its help-banner line |
| T06 | `cli/src/template/.specify/**` (34 tracked files) | Delete the retired scaffolding |
| T07 | `cli/src/template/.gitignore:22-23` | Delete the stale "Spec-Kit integration manifests" comment |
| T08 | `docs/COMPETITIVE-ANALYSIS.md:13,22` | Remove Spec-Kit as a claimed differentiator |
| T09 | `.specify/**` (repository root, **34 tracked files, 0 untracked**) | Delete — see the corrected fact below |
| T10 | `.gitignore:7` (`/.specify/`) | Delete the now-vestigial ignore rule |

## Scope — out

- **`cli/template/**` is NOT part of this change.** It is gitignored by `cli/.gitignore:3` (`/template/`) and has **0 tracked files**. It is a local leftover from before PR #25 and it does not exist in the worktree. Deleting it is a local cleanup in `main`, owned by the orchestrator — it can never appear in this PR's diff or in review. Do not attempt it here.
- Rebuilding the two template trees into one. T06 deletes the retired scaffolding only.
- The `.cortex` path-constant extraction, and the rename itself.
- `cli/src/template/.opencode/` and any other scaffolding not named above.

## Constraints

- **CORRECTED FACT — the origin report and my first reading were both wrong about T09.** The report claims the root `.specify/` is "gitignored, no git history, deletion not revertible through git". Verified false: `git ls-files .specify` → **34 tracked files committed in `ee53228`**, and `git ls-files -o --exclude-standard .specify` → **0 untracked**. The whole tree is tracked, so T09 is an **ordinary tracked deletion**: fully revertible with `git revert`, present in the PR diff, and reviewable. The `/.gitignore:7` entry never applied to them — gitignore does not govern tracked files — which is exactly why T10 removes it as vestigial.
- **T06 shrinks `cortex init`.** The scaffolding file count drops from 69. That is the intent: the scaffolding is what is being retired. Do not preserve the count as an invariant, and do not treat the drop as a regression.
- **Decision — T05 deletes rather than renames.** `scripts/sdd-init.sh` writes `.specify/features/$FEATURE_NAME` (line 9), so T01–T03 and T09 break it outright; and its name collides with gentle-ai's `/sdd-init`, which `cortex-init.sh` already tells users to run. Deleting is the only coherent end state. `scripts/setup.sh:93` must lose the matching banner line.
- Do not touch `README.md:76`.
- No `/speckit`, `Spec-Kit`, or `.specify` reference may remain in any shipped surface that a user or agent can read.

## Acceptance criteria

1. `git grep -n "speckit\|Spec-Kit\|\.specify" -- cli/src scripts docs AGENTS.md .opencode` returns nothing.
2. `git grep -c "/speckit" -- AGENTS.md .opencode` is `0` (guard against regression of already-landed work).
3. `npm run typecheck` (from `cli/`) exits 0.
4. `npm run build` (from `cli/`) exits 0, and `grep -c "speckit" cli/dist/index.js` is `0`.
5. `.specify` and `cli/src/template/.specify` are absent from the worktree.
6. Manual scenario: `cortex init` into a scratch directory scaffolds no `.specify/`, and `cortex status` prints no `Spec-Kit:` line.

## Tasks

- [x] **T01** — `status.ts`: drop the speckit fields, reads, and output line
- [x] **T02** — `close.ts`: drop the `.specify` existence check
- [x] **T03** — `deps.ts`: drop the speckit/specify probe
- [x] **T04** — `install-deps.sh`: drop the speckit install and status line
- [x] **T05** — delete `scripts/sdd-init.sh` + its `setup.sh:93` banner line
- [x] **T06** — delete `cli/src/template/.specify/**`
- [x] **T07** — delete the `cli/src/template/.gitignore:22-23` comment
- [x] **T08** — `docs/COMPETITIVE-ANALYSIS.md`: remove Spec-Kit as a differentiator
- [x] **T09** — delete root `.specify/**` (34 tracked files)
- [x] **T10** — delete the vestigial `/.specify/` rule from `.gitignore:7`

## Graph check

Consulted before editing (worktree graph, copied from `main` @ `42ce127`):

- **God nodes:** `closeCommand()` (16 edges) and `initCommand()` (13 edges) — both directly on this change's blast radius.
- **Queried areas:** `cortex status command, session engine, and dependency probing` → communities `info`, `Worktree Command Lifecycle`.
- **Nodes consulted:** `cli/src/commands/status.ts`, `cli/src/commands/close.ts` (L1), `cli/src/engine/deps.ts`, `cli/src/engine/template.ts` (community `engine/adopt.ts`), `cli/src/commands/init.ts`, `cli/src/engine/session.ts`, `generateRetrospective()` (`session.ts` L156), `Template @Cortex-Planner Definition` (`cli/src/template/.opencode/agents/cortex-planner.md`).
- **Edges relied on:** `initCommand()` → `template.ts` → `TEMPLATE_DIR` scaffolding; `closeCommand()` → `closeSession()` → `session.ts`; `deps.ts` external-binary probe → `README.md` "Graphify Dependency".

## Progress

- [x] Worktree created (`../Cortex-odd-spec-kit-decommission`, base `42ce127`), provisioned (`cli/node_modules`, `graphify-out/`)
- [x] Surface re-verified against `42ce127` (the origin report is ~60% stale)
- [x] T09 deletion approved explicitly by the founder
- [x] Corrected the false "one-way door" premise about T09 after verifying tracked status
- [x] Implementation (T01–T10)
- [x] Verification

## Evidence log

_(appended as tasks complete — real command output only)_

```text
$ git grep -n "speckit\|Spec-Kit\|\.specify" -- cli/src scripts docs AGENTS.md .opencode
(no output; exit 1 because no matches)

$ git grep -c "/speckit" -- AGENTS.md .opencode
(no output; exit 1 because no matches)

$ cd cli && npm run typecheck
> cortex-brain@1.0.0 typecheck
> tsc --noEmit
(exit 0)

$ cd cli && npm run build
> cortex-brain@1.0.0 build
> node esbuild.config.js
(exit 0)
$ grep -c "speckit" cli/dist/index.js
0

$ test ! -e .specify && test ! -e cli/src/template/.specify && echo gone
gone

$ ls /tmp/opencode >/dev/null && scratch=$(mktemp -d /tmp/opencode/spec-kit-check.XXXXXX) && (cd "$scratch" && node /home/stefan/Cortex-odd-spec-kit-decommission/cli/dist/index.js init sample --no-git --yes >init.out 2>&1) && test ! -e "$scratch/sample/.specify" && printf 'scratch=%s\n' "$scratch" && printf 'init output:\n' && cat "$scratch/init.out" && printf 'scaffold .specify: absent\n' && (cd "$scratch/sample" && node /home/stefan/Cortex-odd-spec-kit-decommission/cli/dist/index.js status >"$scratch/status.out" 2>&1) && printf 'status output:\n' && cat "$scratch/status.out" && if grep -q 'Spec-Kit:' "$scratch/status.out"; then printf 'Spec-Kit line: present\n'; exit 1; else printf 'Spec-Kit line: absent\n'; fi
scratch=/tmp/opencode/spec-kit-check.LRMOOW
Copied 35 files
.cortex/manifest.json created
Skipping git init (--no-git)
Project "/tmp/opencode/spec-kit-check.LRMOOW/sample" created
scaffold .specify: absent
Project:     sample
Template:    1.0.0 (35 files tracked)
Session:     — (none active)
Engram:      ✅ Connected (vengram 1.20.0, 3894 observations in project)
Graphify:    ⚠️ No graph found — run `graphify .`
Wiki:        ✅ Last export: 2026-09-17 15:50
OpenCode:    ✅ v1.18.31
Node:        ✅ v22.22.2
Spec-Kit line: absent
(exit 0)

## Next step

Implementation and verification complete.

### Defect correction re-verification

```text
$ git grep -n "speckit\|Spec-Kit\|\.specify" -- cli/src scripts docs AGENTS.md .opencode
(no output; exit 1 because no matches)

$ grep -rn "sdd-init.sh" -- scripts README.md
(no output; exit 1 because no matches)

$ cd cli && npm run typecheck
> cortex-brain@1.0.0 typecheck
> tsc --noEmit
(exit 0)

$ cd cli && npm run build
> cortex-brain@1.0.0 build
> node esbuild.config.js
(exit 0)
$ grep -c "speckit" cli/dist/index.js
0

$ git diff --check
(no output; exit 0)

$ read cli/src/commands/start.ts dryRun block
  if (options.dryRun) {
    heading('Dry Run — No Actions Taken');
    info('The following would happen:');
    info('  1. Generate session ID');
    info('  2. Open Engram session via MCP (mem_session_start)');
    info('  3. Write .cortex/session.json');
    if (options.prelude !== false) {
      info('  4. Build context prelude (.cortex/prelude.md):');
      info('     - Engram recent context');
      info('     - Graphify codebase report');
      info('     - Project manifest info');
      info('  5. Keep the prelude in ignored .cortex/ local state');
    } else {
      info('  4. Skip context prelude (--no-prelude)');
    }
    info(`  ${options.prelude !== false ? 6 : 5}. Launch opencode in project directory`);
    info('  7. After opencode exits, print finalization instructions');
    return;
  }
```
