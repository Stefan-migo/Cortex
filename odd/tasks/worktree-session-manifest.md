# ODD Task — worktree-session-manifest

## Objective

Make a Cortex session running inside a provisioned ODD worktree resolve the same
project identity as the main worktree, without requiring a `.cortex/manifest.json`
to exist.

## Problem

`findProjectRoot` (fixed in PR #20) correctly detects a provisioned worktree, so
`cortex start` now enters the session path instead of refusing. But the *name*
resolution behind it still degrades to the literal string `unknown`.

Two independent causes:

1. **Direct reads bypassing the shared resolver.** `resolveProjectManifest` exists
   (`cli/src/engine/project.ts:47`) and falls back to the `.cortex/worktree.json`
   `source`, but three call sites still read `.cortex/manifest.json` straight off
   the project directory, where a worktree never has one:
   - `cli/src/engine/session.ts:30` — `openSession` writes `projectName: 'unknown'`
     into `.cortex/session.json`.
   - `cli/src/engine/context.ts:300` — `fetchManifestContext` emits no project
     section in the prelude.
   - `cli/src/commands/status.ts:117` — the graph-staleness mtime comparison never
     finds the file.
2. **No fallback when nothing resolves.** `readProjectName` returns the literal
   `'unknown'`. With no manifest in the worktree *or* in `source`, the correct
   answer is unavailable even through the resolver.

## Why

A worktree session must not resolve differently from the main worktree. Today it
does, and it fails **silently**: `cortex start` proceeds and looks healthy, while
the session state and every Engram query go to the wrong project namespace.

`context.ts:341` forwards this name to `fetchEngramContext`, so the prelude asks
Engram for `project: 'unknown'`. Observed evidence: `unknown` is a real,
already-populated project in Engram's project list.

## Baseline (captured before any change)

```
$ cortex start --dry-run          # inside ../Cortex-odd-worktree-session-manifest
ℹ Project: unknown
ℹ Directory: /home/stefan/Cortex-odd-worktree-session-manifest
```

`findProjectRoot` succeeds (root detection from PR #20 works). The name is the
defect.

## Scope

**In scope** — the three call sites above, plus the name fallback in `project.ts`.

**Out of scope**
- `cortex adopt` defects found while investigating (destructive `--yes`, duplicated
  AGENTS.md block, JSON re-serialization churn). Recorded in Engram as
  `cortex/adopt-self-defects`; not touched here.
- Running `cortex adopt` on this repository. Not needed for this fix and unsafe.
- `wiki/graph/graph.json` vs `graphify-out/graph.json` mismatch in `status.ts:113`
  and `context.ts:135` (pre-existing, tracked separately).
- The `basename` naming convention itself. `adopt`/`init` name a project after its
  directory, so this fix matches that convention rather than replacing it.

## Constraints

- No new dependency. No new abstraction beyond the path/content split of the
  existing resolver.
- Preserve the existing tolerant behaviour: a corrupt or absent manifest must never
  abort a session.
- The invariant to hold: **a worktree and its `source` resolve to the same project
  name.**

## Tasks

- [x] **T1** — `cli/src/engine/project.ts`: extract `resolveProjectManifestPath(root)`
      (root → `source` fallback, returns the first existing manifest path) and rebuild
      `resolveProjectManifest` on top of it. Add a project-home fallback so
      `readProjectName` returns `basename(projectHome)` instead of `'unknown'` when no
      manifest resolves, where `projectHome` is `source ?? root`.
- [x] **T2** — `cli/src/engine/session.ts`: `openSession` uses `readProjectName`
      instead of parsing the manifest inline; delete the duplicated parsing.
- [x] **T3** — `cli/src/engine/context.ts`: `fetchManifestContext` uses
      `resolveProjectManifest`; drop its unused `projectName` parameter and update the
      call site.
- [x] **T4** — `cli/src/commands/status.ts`: use the resolved manifest path for the
      staleness mtime; use `readProjectName` for `report.project.name` so one function
      owns the name.
- [x] **T5** — Verify: `npm run typecheck` and `npm run build` in `cli/`, then a real
      non-dry-run session inside this worktree, and a control negative on main.

## Acceptance Criteria

1. A session inside a provisioned worktree records the same `projectName` as its
   `source` — the real repository name, never `unknown`.
2. `cortex start` inside the worktree shows the same `Project:` value as resolution
   from the main worktree.
3. The prelude contains the project/manifest section when a manifest resolves through
   `source`, and the session still starts cleanly when none exists anywhere.
4. No behaviour change for a normal adopted project that has its own manifest.

## Applicable Checks

- **TDD mode: OFF.** Resolved from `AGENTS.md`: this repository has no test harness
  (`vitest` is configured in `cli/`, zero test files, `npm test` exits 1). No test
  may be claimed. TDD is not enabled for this feature.
- **Runner / functional checks:** `npm run typecheck` and `npm run build`, both from
  `cli/`, plus concrete manual shell scenarios with their real output recorded.
- Verify against the worktree's **own** built bundle
  (`cli/dist/index.js`), not the globally installed `cortex`, so the change under
  test is the change just built.

## Authorized Scope

Sibling worktree `/home/stefan/Cortex-odd-worktree-session-manifest`, branch
`odd/worktree-session-manifest`. Main worktree is off limits for code.

## Progress

- [x] Baseline captured — `Project: unknown` inside the worktree.
- [x] Worktree provisioned; `.cortex/worktree.json` records `source`.
- [x] T1 · T2 · T3 · T4 — implemented, 4 files, +61/−50.
- [x] T5 — verified; see Verification Evidence.

## Verification Evidence

Bundle under test: `cli/dist/index.js` **of this worktree**, rebuilt after the change.
`npm run typecheck` → `tsc --noEmit`, exit 0. `npm run build` → 13:17, 221606 bytes.

### A — real session inside the provisioned worktree

```
$ node cli/dist/index.js start --no-open        # cwd: worktree root
ℹ Project: Cortex
ℹ Directory: /home/stefan/Cortex-odd-worktree-session-manifest
→ Opening Engram session via MCP
✔ Engram session started
→ Writing session metadata
✔ Session cortex-2026-09-17-bed031c0 opened
→ Building context prelude
ℹ Engram context loaded via MCP
ℹ Graphify context loaded via MCP
✔ Prelude written to .../.cortex/prelude.md
```

`.cortex/session.json` → `"projectName": "Cortex"`. Before the change, the same cwd
reported `Project: unknown`.

### B — differential control

Same cwd, two bundles — the bundle is the only variable:

| bundle | output |
| --- | --- |
| this worktree's `cli/dist/index.js` (with the fix) | `ℹ Project: Cortex` |
| main's `cli/dist/index.js` (without it) | `ℹ Project: unknown` |

### C — manifest resolved through `source` (isolated fixture)

Fixture `/tmp/opencode/ods-fix-fixture/mainproj{,-odd-demo}`: the manifest exists in the
`source` only, `worktree.json` in the worktree.

```
$ node <this-worktree-bundle> start --no-open
ℹ Project manifest loaded
✔ Prelude written to .../mainproj-odd-demo/.cortex/prelude.md

$ cat .cortex/session.json        → "projectName": "FakeProject"
$ grep "^## \|Project Name" .cortex/prelude.md
7:## Previous Sessions Context
13:## Project Info
19:- **Project Name**: FakeProject
```

### D — no regression for a normal adopted project

Fixture `/tmp/opencode/ods-fix-fixture/plainproj` (own manifest, no `worktree.json`) →
`ℹ Project: PlainProject`. The root's own manifest wins before any fallback.

### E — corrupt manifest in `source` does not crash

Fixture `/tmp/opencode/ods-fix-fixture/badwt` with invalid JSON in
`badsource/.cortex/manifest.json` → `ℹ Project: badsource`. The session starts and falls
back to the directory name, as designed.

### Not claimed

No automated test covers this change. This repository has no test harness, so the feature
is verified only by the static checks and manual scenarios above. TDD was off.

### Residual finding — reported, not fixed

The fallback name follows the `adopt`/`init` convention: the project's directory name, so
`Cortex` with a capital C. Engram's key for this repository, derived from the git remote,
is `cortex` lowercase, and **both namespaces exist**. A Cortex worktree session therefore
now resolves a stable identity but pulls its prelude from `Cortex`, not `cortex`. `unknown`
is itself an already-populated Engram project — evidence this defect has been silently
writing memory into wrong namespaces. Reconciling the naming model is a separate change.

## Next Step

Commit on `odd/worktree-session-manifest`, then open the PR for review.
