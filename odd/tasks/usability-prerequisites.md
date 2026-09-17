# ODD Task — usability-prerequisites

**Branch:** `odd/usability-prerequisites` · **Worktree:** `../Cortex-odd-usability-prerequisites`
**Base:** `main` @ `f6cdd88` (includes PR #24)
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed.

## Objective

Make Cortex's **published** package actually work. A published install currently cannot scaffold
a project, and the failure is silent — it reports success while producing nothing.

The change is deliberately minimal: one defect, one fix. See "Withdrawn" below for a second
change that was designed, implemented, and then dropped on verification.

## WU1 — the published package omits the runtime template

### Verified findings

1. `cli/esbuild.config.js` bundles the CLI into `dist/index.js` with `bundle: true`, so every
   module's `__dirname` at runtime is the **bundle's** directory: `<pkg>/dist`.
2. Three call sites resolved the template as `join(__dirname, '..', 'template')`:
   - `cli/src/commands/update.ts:21`
   - `cli/src/commands/adopt.ts:8`
   - `cli/src/engine/template.ts:12`

   In a published install that expression evaluates to `<pkg>/template`.
3. `cli/package.json` declares `files: ["dist", "src/template"]`. **`template` was not listed**, so
   the published tarball had no `<pkg>/template`.
4. `npm pack --dry-run` confirmed the tarball contents: `dist/index.js`, `dist/index.js.map`,
   `package.json`, and `src/template/**` — 71 files, no `template/`.
5. **Reproduction (verified).** Copying `cli/dist` and `cli/package.json` into a clean directory —
   the layout of an installed package at that time — and running
   `node dist/index.js init demo --no-git --yes` produced:

   ```
   → Copying template files
   ✔ Copied 0 files
   → Generating manifest
   ✔ .cortex/manifest.json created
   Done!
   ```

   The created project contained exactly one file: `demo/.cortex/manifest.json`.
6. **Why it was silent.** `esbuild.config.js:21` — `if (!existsSync(src)) return;` — a missing
   template directory yielded zero files with no exception, and `init` reported ✅ and `Done!`.

This affected every template-consuming command: `init`, `adopt`, and `update` — the entire
scaffolding path, and the first thing a new user runs.

### Design decision

**D1 — resolve the template from a location that exists both in the repo and in the tarball.**
`src/template` satisfies both: it is present in a development checkout and it IS published
(`files` already lists it). The three call sites now resolve
`join(__dirname, '..', 'src', 'template')`.

Preferred over adding `"template"` to `files` because it removes the need for the build's copy
step entirely rather than publishing a second, generated copy of the same tree. The copy step
(`esbuild.config.js:16-41`, previously `-29` lines) was **deleted** after verification confirmed
it was dead: post-build, `cli/template` was absent and the package-layout simulation still
scaffolded correctly from `src/template`.

### Status

**Landed in `a5b4a4e`** — `fix(cli): resolve templates from published source`.

## Withdrawn: the project-identity change (WU2)

A second change was designed, implemented as commit `23b58d8`
(`fix(cli): persist project identity across sessions`), and then **dropped** after verification
showed it was dead logic. It is recorded here because the negative result is worth more than the
patch: it prevents anyone from re-introducing the same reasoning.

### The original claim

`cortex status` reports `Project: unknown` in `/home/stefan/Cortex` even though
`graphify-out/graph.json` and `wiki/` exist. The diagnosis was that `findProjectRoot`
(`cli/src/engine/project.ts:28-41`) accepts `.cortex/session.json` as a recognition marker, while
`closeSession` **deletes** that file (`session.ts:126-134`) — so identity was said to be derived
from ephemeral session state, and to "flicker": recognized during a session, unrecognized after
`close`.

### Why that was wrong

The claim requires `session.json` to be able to act as the deciding marker. It cannot:

- `openSession` (`cli/src/engine/session.ts:27`) is the only writer of `session.json`
  (`session.ts:59`).
- It has exactly **one caller**: `cli/src/commands/start.ts:71`, which receives the `projectDir`
  produced at `start.ts:16` by `findProjectRoot(process.cwd())`.
- `start.ts:18` **aborts** when `findProjectRoot` returns `null`.

Therefore `session.json` can only exist in a project that was **already recognized** by another
marker. It can never be the first one.

Verified empirically: `cortex start --dry-run` in `/home/stefan/Cortex` prints
`✖ Not inside a Cortex project. Run \`cortex init <name>\` first.` The guard runs before the
dry-run branch. No parent directory (`/home/stefan`, `/`) carries a marker either.

### Consequence

- The `session.json` entry in `findProjectRoot` is **dead logic** — it can never decide anything.
- Adding a durable `.cortex/project.json` written from `openSession` is **also dead logic**, for
  the same reason: the write only happens where the project is already recognized. It changes no
  outcome in any case — adopted projects have `manifest.json`, worktrees have `worktree.json`,
  and an unrecognized directory aborts before writing.
- The new build was run against `/home/stefan/Cortex` and **still reports `Project: unknown`**,
  confirming it did not fix the symptom it claimed to fix.

### Corrected model

Recognition depends on two **durable** markers: `manifest.json` (written by `init`/`adopt`) and
`worktree.json` (written by worktree provisioning). There is no ephemeral-marker defect.

The real cause of the symptom is simpler: `/home/stefan/Cortex` was **never initialized or
adopted**, so it is legitimately not a Cortex project.

### Unresolved side finding

`/home/stefan/Cortex/.cortex/` exists but is **empty** (mtime 2026-09-17 14:11), and nothing in
the code can create it without prior recognition. Origin not determined. If some path does create
an empty `.cortex/` in an unrecognized directory, it leaves a misleading directory behind. Does
not change the conclusion above, but worth investigating separately.

## Tasks

- [x] **WU1** — resolve the runtime template from `src/template`; delete the now-dead build copy
      step (D1). Landed in `a5b4a4e`.
- [ ] **VERIFY** — full functional verification against the scenarios below.
- [ ] **DELIVER** — review at the boundary, then PR.

## Acceptance criteria

1. `npm run typecheck` and `npm run build` pass in `cli/`.
2. `npm pack --dry-run` shows the tarball still contains `src/template/**`.
3. A faithful install-layout simulation (below) scaffolds a project containing the template —
   not only `.cortex/manifest.json`.
4. `cortex init`, `cortex adopt`, and `cortex update` resolve the template without error.
5. No regression: `cortex status`, `cortex worktree list`, and `cortex adopt --dry-run` behave as
   before.

## Verification scenarios

Run from the worktree with a freshly built bundle.

1. **Build** — `cd cli && npm run typecheck && npm run build`.
2. **Tarball** — `cd cli && npm pack --dry-run` lists `src/template/**`.
3. **Install layout (faithful).** `files: ["dist", "src/template"]` means the published package
   holds `dist/` and `src/template/` — nothing else. Simulate exactly that, not the old layout:

   ```
   rm -rf /tmp/opencode/pkgsim && mkdir -p /tmp/opencode/pkgsim/src
   cp -r cli/dist cli/package.json /tmp/opencode/pkgsim/
   cp -r cli/src/template /tmp/opencode/pkgsim/src/
   cd /tmp/opencode/pkgsim && node dist/index.js init demo --no-git --yes
   find /tmp/opencode/pkgsim/demo -type f | wc -l
   find /tmp/opencode/pkgsim/demo -type f | head
   ```

   Baseline of the defect was `✔ Copied 0 files` and a single `manifest.json`. Expected now:
   a non-zero file count and real template files. Report the actual numbers.
   - Note: the earlier reproduction that copied only `dist/` and `package.json` is invalid for the
     post-fix layout — it omits `src/template`, so `findProjectRoot`-independent template
     resolution correctly finds nothing. Use the faithful layout above.
4. **Other consumers** — `cortex adopt --dry-run` and `cortex update --dry-run` resolve the
   template without "Template directory not found".
5. **Regression** — `cortex status`, `cortex worktree list` behave as before.

## Out of scope / follow-ups

- **The rename to `rapsodia-code`.** Planned as three chained PRs (~640 changed lines); it builds
  on this work because `findProjectRoot` is one of the functions it must change. Do not start it
  here.
- **What makes a directory a Cortex project?** The real follow-up to the withdrawn WU2. Recognition
  currently keys on **state** (`manifest.json`, `worktree.json`), which excludes the Cortex source
  repo itself. A better model may be to recognize Cortex by **installation** — for example the
  presence of `.opencode/agents/cortex-planner.md` or the managed blocks. That would also
  recognize projects installed through `cortex-init.sh`. This deserves its own change with its own
  analysis; do not bolt it on here.
- **`cli/template/**` after WU1.** The build no longer writes it and nothing reads it. A prior
  note claimed it was byte-identical to `src/template` and unread at runtime; both claims were
  wrong at the time (it had diverged in six files, and it *was* the runtime directory). After
  WU1 it is genuinely unused. Evaluate for deletion separately.
- **`.opencode/.gitignore` does not reach worktrees.** Verified: untracked in `main`
  (`git ls-files` returns nothing) because it ignores itself, so no checkout or worktree receives
  it. Consequence: a freshly provisioned worktree has a dirty tree
  (`?? .opencode/package.json`, `?? .opencode/package-lock.json`), and `git add -A` there would
  stage files `main` deliberately ignores. Not fixed here. **Do not stage those files.**
- **Placeholder junk in `~/.cortex/config.json`** — 18 entries, 17 of them test artifacts
  (`slicebfixture`, `verify2`, `spotcheck`, …). Delete and regenerate rather than migrate.
- **Dead Spec-Kit surface** — still wired into `AGENTS.md`, `status.ts`, `deps.ts`, `close.ts`,
  `analyze.ts`, `start.ts` and both template trees. Has its own unconsumed handoff at
  `.cortex-sessions/ready-for-sdd/2026-09-15-spec-kit-decommission/`.
- **Cross-project contamination in Engram.** Project `cortex` holds 19 foreign observations;
  `Cortex` (capital, 88 obs) is entirely `pajaro-maca-web` mislabeled. Unrelated to this change.

## Baseline

```
main f6cdd88
cli/dist/index.js built 2026-09-17 14:50 local (after the PR #24 merge at 14:47)
cli/src/template — present in the repo AND published (files: ["dist", "src/template"])
cli/template — build artifact, no longer read after WU1
```

## Evidence log

**WU1 (`a5b4a4e`)**

- `cd cli && npm run typecheck` → passed
- `cd cli && npm run build` → passed
- `cd cli && npm pack --dry-run` → tarball contains `src/template/**`, 71 files, no `template/`
- Faithful install-layout simulation with `src/template` present → **69 files copied**, 70 files in
  the scaffolded project. Defect baseline was 0 files copied and 1 file produced.
- esbuild copy step deleted; `cli/template` absent after build and the simulation still succeeded

**WU2 (`23b58d8`) — DROPPED, not part of this change**

- `cortex start --dry-run` in `/home/stefan/Cortex` → `✖ Not inside a Cortex project` (the guard
  runs before the dry-run branch), proving `session.json` can never be a first marker
- New build still reported `Project: unknown` in `/home/stefan/Cortex` — the change fixed nothing
- Commit removed by reset to `a5b4a4e`; branch carried only `a5b4a4e` afterwards; no `project.json`
  reference remains in `cli/`
