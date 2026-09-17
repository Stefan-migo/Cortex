# ODD Task — worktree-session-root

**Branch:** `odd/worktree-session-root` · **Worktree:** `../Cortex-odd-worktree-session-root`

## Objective

Make a provisioned ODD worktree a recognized Cortex project root, so the full session lifecycle works inside it (`cortex start` → prelude + Engram session → `cortex close` → wiki export).

## Problem

`provisionWorktree` writes `.cortex/worktree.json` and **nothing in the CLI ever reads it**. Project detection is triplicated as a private `findProjectRoot` in `start.ts`, `status.ts`, and `analyze.ts`, and each one accepts only `.cortex/manifest.json` and/or `.cortex/session.json`. A provisioned worktree has neither, so all three refuse.

Observed, from inside the existing worktree `../Cortex-odd-cortex-defect-reporting`:

```
$ node /home/stefan/Cortex/cli/dist/index.js start --dry-run
✖ Not inside a Cortex project. Run `cortex init <name>` first.
```

The worktree is self-sufficient for bare `opencode` — it carries `.opencode/`, `AGENTS.md`, a `graphify-out/` snapshot, symlinked canonical skills, and installed dependencies — but it cannot run the session lifecycle: no prelude, no `mem_session_start`, no `close`/wiki export. Only `cortex close` works there today, because it uses `process.cwd()` and never detects the project.

## Why

`AGENTS.md` defines the worktree as the place where code is born, and `.githooks/pre-commit` enforces it by allowing only `.cortex-sessions/**` commits in main. The transition into the worktree therefore drops the session plumbing exactly when the work starts. The marker file already records the missing link — `source` — so the fix is to read what provisioning already writes.

## Scope

Authorized: `cli/src/engine/project.ts` (new), `cli/src/commands/start.ts`, `cli/src/commands/status.ts`, `cli/src/commands/analyze.ts`, `odd/tasks/worktree-session-root.md`.

Out of scope: `cli/src/commands/close.ts` (already works in a worktree via `process.cwd()`), the dead opencode.json "restore" branch in `close.ts` (nothing ever adds the prelude reference to `instructions`), `engine/worktree.ts` provisioning, and the worktree branch/directory naming.

## Constraints

- `close.ts` uses `process.cwd()` with no detection and must keep working unchanged.
- The worktree must **not** gain a duplicated `manifest.json`. Project metadata is owned by main; the worktree only points at it. A copied manifest would go stale on the first edit and would make `cortex update` in a worktree compare main's hashes against edited files.
- `readProjectName` must stay non-throwing: an absent or corrupt manifest cannot abort a session.
- Reuse the existing `Manifest` type from `engine/manifest.ts`. A third manifest shape is not acceptable — `ManifestInfo` in `context.ts` is already a second one.

## TDD

Mode: **off** (resolved from project configuration `AGENTS.md`: this repository has no test harness — zero test files, `npm test` exits 1 with "No test files found"). No runner. Functional verification is `npm run typecheck`, `npm run build`, and concrete manual shell scenarios.

## Tasks

- [x] **T01** — Add `cli/src/engine/project.ts` with `findProjectRoot` (recognizes `manifest.json`, `session.json`, and `worktree.json`), `resolveProjectManifest` (local manifest, else the `source` recorded in `worktree.json` via the existing `Manifest` type), and `readProjectName` built on top of it.
- [x] **T02** — Migrate `start.ts`: delete its private `findProjectRoot` and `readProjectName`, import both from the new module.
- [x] **T03** — Migrate `status.ts`: delete its private `findProjectRoot`, use `resolveProjectManifest` so name, template version, and tracked-file count resolve through the worktree's source.
- [x] **T04** — Migrate `analyze.ts`: delete its private `findProjectRoot` and `readProjectName`, import both from the new module.
- [x] **T05** — Verify with `npm run typecheck`, `npm run build`, and a real scenario inside the worktree: `cortex start --dry-run` from a provisioned worktree must succeed, and the pre-change bundle must still refuse in the same directory (differential control).
- [x] **T06** — Commit as reviewable work units on this branch. The PR is opened separately by the parent.

## Acceptance criteria

- `cortex start --dry-run` succeeds from inside a provisioned worktree — proved in Scenario A, on the real worktree. The project resolving **through `worktree.json`** is proved in Scenario B's isolated fixture, not in this repository: here the name stays `unknown` because main itself has no `.cortex/manifest.json`. That is pre-existing and unchanged by this work; it is not claimed as a new success.
- The same command with the pre-change bundle still refuses in the same directory — proving the change causes the difference, not the directory.
- `cortex start` in a plain directory with no Cortex state still refuses (no false positive from the widened predicate).
- `readProjectName` returns `unknown` instead of throwing when the manifest is absent or corrupt.
- `npm run typecheck` and `npm run build` pass with the real observed output reported.
- No access to a missing `manifest.json` path can crash any of the three migrated commands.

## Verification evidence

TDD mode is off and this repository has no harness, so the evidence below is functional: typecheck, build, and real command runs. Machine: this workstation, base `545fe58`.

### Static checks

```
$ npm run typecheck
> cortex-brain@1.0.0 typecheck
> tsc --noEmit
(no diagnostics — exit 0)

$ npm run build
> cortex-brain@1.0.0 build
> node esbuild.config.js
Template copied: .../cli/src/template → .../cli/template
dist/index.js  (rebuilt)
```

### Differential control — the refusal was pre-existing, not caused by this change

The **pre-change** bundle (main's `cli/dist`) run from inside the real provisioned worktree `../Cortex-odd-worktree-session-root`:

```
$ node /home/stefan/Cortex/cli/dist/index.js start --dry-run
Cortex Session Start
✖ Not inside a Cortex project. Run `cortex init <name>` first.
```

### Scenario A — the rebuilt bundle from the same real worktree

```
$ node cli/dist/index.js start --dry-run
Cortex Session Start
ℹ Project: unknown
ℹ Directory: /home/stefan/Cortex-odd-worktree-session-root
ℹ Session ID: cortex-2026-09-17-67c04106
Dry Run — No Actions Taken
```

`Project: unknown` is correct and not a defect: this repository has no `.cortex/manifest.json` in main either, so main's own `cortex start` reports the same. What changed is that the worktree is now recognized at all.

### Scenario B — the `source` fallback, proved in an isolated fixture

Fixture in `/tmp/opencode/session-root-proof`: a project `proj` with `projectName: "proof-project"` and a sibling `proj-odd-demo` carrying only `.cortex/worktree.json` (`source: .../proj`).

```
$ node .../cli/dist/index.js start --dry-run      # cwd = proj-odd-demo
ℹ Project: proof-project
ℹ Directory: /tmp/opencode/session-root-proof/proj-odd-demo

$ node .../cli/dist/index.js status               # cwd = proj-odd-demo
Project:     proof-project
Template:    1.0.0 (0 files tracked)
Engram:      ✅ Connected (vengram 1.20.0, 3766 observations in project)
```

The name and template metadata resolve through the marker's `source`, which is the whole point: `projectName` feeds `fetchEngramContext(projectName)` and `engram context "${projectName}"`, so `unknown` would have silently degraded memory recall for the entire session.

### Scenario C — negative control, no false positive from the widened predicate

```
$ node .../cli/dist/index.js start --dry-run      # cwd = /tmp/opencode/plain-control
✖ Not inside a Cortex project. Run `cortex init <name>` first.
exit=1
```

### Scenario D — corrupt and absent manifest must not abort the session

```
corrupt manifest (garbage bytes) in the source:
ℹ Project: unknown
exit=0

manifest removed entirely:
ℹ Project: unknown
```

### What was not exercised

No real session was opened in a worktree: `cortex start` without `--dry-run` launches OpenCode and writes `.cortex/session.json`, and that belongs to the user's next session, not to this verification. The follow-through path (`cortex close` in a worktree) rests on `close.ts` using `process.cwd()` with no detection, which was confirmed by reading, not by running.

## Progress

T01–T06 complete. Committed as two work units on this branch: `dd47dbe` (code, 4 files, +71/−68) and `086219d` (this record, 157 lines). Main is untouched at `545fe58`.

A third commit corrects this record after the fact: the first version of it still said the changes were uncommitted, which stopped being true the moment `dd47dbe` landed, and its first acceptance criterion claimed the real worktree resolves its project name through the marker when only the isolated fixture proves that.

## Next step

Open the PR from `odd/worktree-session-root` into main (a delivery decision, not made here). After the merge: `npm ci && npm run build` in main's `cli/`, because `cli/dist/` is gitignored and the merge does not update it — `cortex start` inside a worktree only works from a rebuilt bundle. Still unverified by design: a real non-dry-run session inside a worktree, which is the user's next action.

## Rationale log

- **Route: ODD-direct, not an SDD change.** A detection fix with no new capability and no new requirement surface does not earn an openspec change directory and four planning phases. Tracking artifact is this file plus its Engram mirror.
- **Detection-side, not provisioning-side.** Writing a synthetic `manifest.json` into each worktree (one file, every command works for free) was rejected: it duplicates the project's metadata into a second location that goes stale on first edit, lies about `files` hashes consumed by `cortex update`, and would leave already-provisioned worktrees broken until re-provisioned. Teaching detection to read the marker fixes existing worktrees too.
- **Shared module, not a fourth copy of the predicate.** The predicate was already triplicated; adding `.cortex/worktree.json` to three private copies would have made it a quadruple-sourced concept. The extraction removes three duplicated predicates and two name readers. Measured honestly: the three commands shrink by 60 lines and the new module adds 68, so this is **+8 lines net**. It buys one place to reason about what a Cortex project root is — it is not a line-count win, and it was not sold as one.
- **Project name resolves through `source`.** `projectName` feeds `fetchEngramContext(projectName)` and `engram context "${projectName}"`. Returning `unknown` inside a worktree would silently degrade memory recall for the whole session, which is the opposite of the objective.
- **No test harness introduced.** `AGENTS.md` is explicit that this repository has none and that coverage must not be claimed. A harness is its own deliberate change, not a rider on this one.
