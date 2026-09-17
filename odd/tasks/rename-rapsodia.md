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

- [ ] **T01** — Create one module owning the state directory names and the composed paths, and
      route all 19 `.cortex` call sites plus the 5 `.cortex-sessions` sites through it. No value
      change: `.cortex` and `.cortex-sessions` stay exactly as they are.
- [ ] **T02** — Route `cli/src/utils/config.ts`'s global `CONFIG_DIR`/`CONFIG_PATH` through the
      same name constant. Semantics stay global-vs-project: this is name reuse, not a merge.
- [ ] **T03** — Publish identity in `cli/package.json`: `name` → `rapsodia-code`, `bin` →
      `rapso`, `description` off "Cortex brain manager". Regenerate `cli/package-lock.json`.
- [ ] **T04** — `cli/src/index.ts`: commander `.name('cortex')` → `.name('rapso')` and the
      program description, so `--help` matches the binary that ships.
- [ ] **T05** — Verify with real output (see below), commit as reviewable work units, and report.

## Tasks — Slice 2 (later PR)

- [ ] **T06** — `cli/src/template/**`: the two `AGENTS.md`, `SYSTEM-MAP.md`, `USER-GUIDE.md`,
      `opencode.json`, `scripts/generate-retrospective.sh`, and the two
      `template/.opencode/agents/cortex-*.md`.

## Tasks — Slice 3 (later PR)

- [ ] **T07** — Flip `STATE_DIR_NAME` and `SESSIONS_DIR_NAME` to the rapsodia values with
      read-compat for the old paths. Nesting a tracked store inside an ignored dir changes git's
      behaviour: the ignore rule must be `.rapsodia-code/*` **plus** `!.rapsodia-code/sessions/`
      (git does not descend into an excluded directory), and `.githooks/pre-commit`'s carve-out
      path must follow the rename.
- [ ] **T08** — Migrate consumers in this order: `lumat-agent` → re-link the 10 Gen-1 symlink
      projects → self last. Consider extending `adopt` (~100 lines) instead of writing a new
      `migrate` command (~250).

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

## Progress

Slice 1 authorized by the founder on 2026-09-17. Worktree created, task doc seeded. No source
write yet.

## Next step

T01–T05.

## Rationale log

- **Route: ODD-direct, chained PRs — not an SDD change.** The work is a measured string
  substitution across a bounded surface plus one design decision (where the constant lives).
  The decisions are already made; there is no design question for a proposal to answer.
- **Slice 1 flips no value on purpose.** Centralizing first turns slice 3's value flip into a
  one-line change and keeps the risky part (migration + read-compat) in its own reviewable PR.
- **Measured, not estimated.** The prior ~47 files / ~336 lines figure was taken against
  `42ce127` and counted edit estimates. The re-measurement against `0518a67` is literal matches:
  34 files / 150 lines repo-wide, 12 files / 35 lines for slice 1.
