# ODD Task — rename-rapsodia

**Branch:** `odd/rename-rapsodia` · **Worktree:** `../Cortex-odd-rename-rapsodia`
**Base:** `main` @ `0518a67`
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Rename Cortex to the rapsodia family so the package can be published. The npm name
`cortex-brain` is already taken by an unrelated package, so the release is blocked on identity,
not on features.

Target identity (decided 2026-09-17, not re-litigated here):

| Surface | Before | After |
|---|---|---|
| npm package | `cortex-brain` | `rapsodia-code` |
| CLI binary | `cortex` | `rapso` |
| project state dir | `.cortex/` | `.rapsodia-code/` |
| planning-session store | `.cortex-sessions/` | `.rapsodia-code/sessions/` |

## Why

The publish is blocked. Everything else the release needed already landed: Spec-Kit is
decommissioned (PR #27), the published tarball actually scaffolds (PR #25), and the worktree
layer is ODD-native (PR #9). Identity is the only remaining lever.

## Scope

Authorized, per slice:

- **Slice 1 (this PR):** `cli/src/**` EXCLUDING `cli/src/template/**`; `cli/package.json`;
  `cli/package-lock.json`; `cli/src/index.ts`.
- **Slice 2 (later PR):** `cli/src/template/**` — what ships into new projects.
- **Slice 3 (later PR):** read-compat, migration, `.gitignore`, `.githooks/pre-commit` carve-out.

Out of scope for the whole change: renaming the local folder `~/Cortex` (breaks ~8 absolute
symlinks across 10 projects **silently** — a separate, deferrable lever); relocating the 19
contaminated observations inside Engram project `cortex`; `openspec/**` (untracked, synced in
main at close).

## Constraints

- **Slice 1 flips NO value.** `STATE_DIR_NAME` stays `.cortex` and `SESSIONS_DIR_NAME` stays
  `.cortex-sessions`. Slice 1 is a refactor plus publish identity, and it MUST NOT change any
  on-disk behaviour. The value flip happens in slice 3, together with read-compat.
- **Never stage the worktree's untracked `.opencode/` install artifacts**
  (`package.json`, `package-lock.json`, `tools/package-lock.json`). They are not repo content:
  `.opencode/.gitignore` does not reach worktrees. Use explicit paths when staging.
- **Dogfooding safety:** renaming `bin.cortex` → `bin.rapso` in `package.json` does not affect
  the `cortex` binary already installed on PATH, so the session doing the work is unaffected.
- `cli/dist/` is gitignored and must be rebuilt in main after the merge before the CLI is
  dogfooded again.

## Measured surface (re-measured against `0518a67`, verified)

Identity literals, `cli/src/**` excluding `template/**`: **12 files, 35 matching lines**.

State-path call sites that must route through the new constant — **19 real, not the 3 a prior
note claimed** (`project.ts:61` is `graphDir`, not `.cortex`):

```
engine/project.ts:14,29,76      engine/session.ts:47,129,143,223
engine/context.ts:50,316        engine/manifest.ts:19
engine/worktree.ts:251,252      commands/status.ts:100
commands/close.ts:54,105        commands/update.ts:69
utils/config.ts:10              (+ non-join refs: session.ts:56, manifest.ts:28,
                                 start.ts:55,57,61, close.ts:91, init.ts:68,
                                 template.ts:101, adopt.ts:16,159,160)
```

`.cortex-sessions` literals in `cli/src`: 5 (`engine/adopt.ts:16,151`; `engine/worktree.ts:103,124,138`).

**No state-path constant exists today.** Closest existing exports: `findProjectRoot`
(`engine/project.ts:28`) and `resolveGraphifyPaths` (`engine/project.ts:59`).

**`utils/config.ts:10` is NOT the same thing.** `join(homedir(), '.cortex')` is the *global*
registry, not project state. Same name, different semantics, its own migration. Route it through
the same name constant; do not merge it into the project helper.

## Tasks — Slice 1 (this PR)

- [x] **T01** — Create one module owning the state directory names and the composed paths, and
      route all 19 `.cortex` call sites plus the 5 `.cortex-sessions` sites through it. No value
      change: `.cortex` and `.cortex-sessions` stay exactly as they are.
- [x] **T02** — Route `cli/src/utils/config.ts`'s global `CONFIG_DIR`/`CONFIG_PATH` through the
      same name constant. Semantics stay global-vs-project: this is name reuse, not a merge.
- [x] **T03** — Publish identity in `cli/package.json`: `name` → `rapsodia-code`, `bin` →
      `rapso`, `description` off "Cortex brain manager". Regenerate `cli/package-lock.json`.
- [x] **T04** — `cli/src/index.ts`: commander `.name('cortex')` → `.name('rapso')` and the
      program description, so `--help` matches the binary that ships.
- [x] **T05** — Verify with real output (see below), commit as reviewable work units, and report.

## Re-sequencing

The original folder-based Slice 2/Slice 3 layout is superseded. The visible-brand work is tracked
in [`rename-rapsodia-brand.md`](rename-rapsodia-brand.md). The remaining work follows the
three-PR blast-radius plan in that document: (1) visible brand and template coupling, (2) on-disk
state with read-compat, and (3) skill symlink migration.

## Acceptance criteria (slice 1)

1. `cd cli && npm run typecheck` passes with the real output reported.
2. `cd cli && npm run build` passes and `cli/dist/index.js` is rebuilt.
3. Zero raw `'.cortex'` / `'.cortex-sessions'` string literals remain in `cli/src` outside
   `template/**` and the constant module itself.
4. **No behaviour change:** a real dogfood cycle still works — `cortex worktree list`,
   `cortex status`, and `cortex start --dry-run` behave exactly as before, and no on-disk path
   changes.
5. `npm pack --dry-run` still lists `src/template/**` (the PR #25 fix must not regress).
6. The worktree's untracked `.opencode/` artifacts are **not** staged.

## Verification scenarios

Run from the worktree after `npm run build`.

1. **Typecheck** — `cd cli && npm run typecheck` → report exact output.
2. **Build** — `cd cli && npm run build` → report size.
3. **Constant coverage** — `rg -n "'\.cortex'" cli/src --glob '!template/**'` → only the
   constant module. Report the command and its output.
4. **No behaviour change** — `node cli/dist/index.js worktree list --root /home/stefan/Cortex`
   and `node cli/dist/index.js app <path>`-style read-only commands behave as before. Report the
   actual output.
5. **Tarball** — `cd cli && npm pack --dry-run` → `src/template/**` present.
6. **Identity** — `node cli/dist/index.js --help` shows the new program name; `package.json`
   carries `name: rapsodia-code` and `bin.rapso`.

## Verification evidence (slice 1)

Observed, not inferred. `cli/dist/index.js` was 220161 bytes after the build.

**1. Typecheck** — `cd cli && npm run typecheck`

```
> rapsodia-code@1.0.0 typecheck
> tsc --noEmit
```

No diagnostics, exit 0. Re-run by the parent after the message corrections below; still exit 0.

**2. Build** — `cd cli && npm run build` → `> rapsodia-code@1.0.0 build` / `> node esbuild.config.js`,
no errors.

**3. Constant coverage** — `rg -n '\.cortex' src --glob '!template/**'` returns exactly three
lines, all in the new module:

```
src/utils/state.ts:3:export const PROJECT_STATE_DIR_NAME = '.cortex';
src/utils/state.ts:4:export const GLOBAL_STATE_DIR_NAME = '.cortex';
src/utils/state.ts:5:export const SESSIONS_DIR_NAME = '.cortex-sessions';
```

All 19 `.cortex` path-building sites and all 5 `.cortex-sessions` sites route through the module.
`join` imports are clean — no file imports it unused.

**4. No behaviour change** — `node cli/dist/index.js worktree list --root /home/stefan/Cortex`
returns the same two entries as before (`/home/stefan/Cortex` on `main`, this worktree on
`odd/rename-rapsodia`, both at `0518a67`). `node dist/index.js start --dry-run --no-prelude`
prints the **byte-identical** lines to the base:

```
ℹ   3. Write .cortex/session.json
ℹ   4. Skip context prelude (--no-prelude)
```

**5. Tarball** — `npm pack --dry-run` lists `src/template/**` (33 entries, 37 files total). The
file count fell from 71 only because PR #27 deleted the Spec-Kit `.specify/**` tree. The PR #25
fix did not regress.

**6. Identity** — `node cli/dist/index.js --help` → `Usage: rapso [options] [command]`;
`cli/package.json` carries `"name": "rapsodia-code"` and `"bin": {"rapso": "dist/index.js"}`);
`cli/package-lock.json` was regenerated and agrees.

**7. Staging discipline** — `git ls-files` confirms the three `.opencode/` install artifacts are
untracked. The final tree is clean; nothing extra was staged.

### Parent correction during verification

The delegated writer removed information from user-facing output instead of centralizing it:
`init.ts` lost the manifest path from its success message, and `start.ts` lost two paths from its
dry-run lines. Restored through the constants, which keeps the output byte-identical to the base
**and** centralized. `close.ts` and `session.ts` use the same literal-form expression
(`` `${PROJECT_STATE_DIR_NAME}/prelude.md` ``) rather than `join()`, because that value is stored
metadata compared against `opencode.json.instructions` — a platform-dependent separator would
change it on Windows. The delegated writer had used `join()` there.

### Native review

RDD is **on** (global). The candidate was frozen and four lenses ran: `review-risk`,
`review-resilience`, `review-readability`, `review-reliability`. All four were admitted with
`inspection.status: completed`, **zero findings**, and the lineage
`review-76b3d33e4b28bc0d` closed `approved`. Acknowledgement ran and returned
`authority: "burned"`. The review is informational; it does not authorize delivery.

### Findings that are NOT this change's

Reported so they are not lost, and deliberately not fixed here:

- `cli/src/commands/close.ts:89-95` looks for a prelude reference inside
  `opencode.json.instructions` that **nothing writes**: the template ships
  `["AGENTS.md", "DESIGN.md"]` and no code appends the prelude. Pre-existing dead path, unchanged
  by this slice (the string is byte-identical). Worth its own change.
- `cli/src/engine/adopt.ts:159-160` builds display labels with `join(PROJECT_STATE_DIR_NAME, ...)`,
  so on Windows they render with a backslash. Cosmetic, Linux-invisible.
- `.opencode/.gitignore` is untracked and ignores itself (`git ls-files` returns nothing), so a
  freshly provisioned worktree starts with a dirty tree. It appeared during this session and the
  risk went away with it; the delivery of that file is a pre-existing gap.

## Progress

**Slice 1 complete and committed.** Six commits on `odd/rename-rapsodia`, each within the repo's
5-file Atomicity Gate enforced by the pre-commit hook (the gate rejected a single 13-file
commit, so the routing was split by module area):

```
0892def chore(cli): rename the package and binary to rapsodia-code
bf9e151 refactor(cli): route command state paths through the constants
d10ba46 refactor(cli): route context, worktree, template, and global config paths
2db524b refactor(cli): route project, session, manifest, and adopt state paths
167c0a9 refactor(cli): add the state directory path constants
665448b docs(odd): seed the rename-rapsodia task document
```

18 files, +231/−44 against `0518a67`. Slices 2 and 3 are untouched and unstarted.

## Next step

Open the PR for slice 1. The worktree must stay until then — `cleanup` refuses while the branch
carries unmerged work. After the merge: rebuild `cli/dist/` in main before dogfooding, and sync
any base-spec drift produced by this change (none is expected: the specs describe `odd/` and
`.cortex-sessions` paths, and no value flipped).

## Rationale log

- **Route: ODD-direct, chained PRs — not an SDD change.** The work is a measured string
  substitution across a bounded surface plus one design decision (where the constant lives).
  The decisions are already made; there is no design question for a proposal to answer.
- **Slice 1 flips no value on purpose.** Centralizing first turns slice 3's value flip into a
  one-line change and keeps the risky part (migration + read-compat) in its own reviewable PR.
- **Measured, not estimated.** The prior ~47 files / ~336 lines figure was taken against
  `42ce127` and counted edit estimates. The re-measurement against `0518a67` is literal matches:
  34 files / 150 lines repo-wide, 12 files / 35 lines for slice 1.
