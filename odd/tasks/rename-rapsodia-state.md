# ODD Task — rename-rapsodia-state

**Branch:** `odd/rename-rapsodia-state` · **Worktree:** `../Cortex-odd-rename-rapsodia-state`
**Base:** `main` @ `623036a` (slice "brand" merged as PR #30)
**TDD:** OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.
**Umbrella:** [`rename-rapsodia.md`](rename-rapsodia.md) · **Plan of record:** [`rename-rapsodia-brand.md`](rename-rapsodia-brand.md) → `## The re-sequencing`

## Objective

Flip the on-disk project state from Cortex's names to the rapsodia family, with read
compatibility for every project created before the rename.

| Constant | Before | After |
|---|---|---|
| `PROJECT_STATE_DIR_NAME` | `.cortex` | `.rapsodia-code` |
| `SESSIONS_DIR_NAME` | `.cortex-sessions` | `.rapsodia-code/sessions` |

This is slice 2 of 3 in the re-sequenced rename. Slice 1 (constants + publish identity, PR #29)
and the brand slice (PR #30) are merged. Slice 3 is the skill symlink migration.

## Why

The release is blocked on identity, and the on-disk layer is the part consumers actually feel:
after this slice a project's state directory, its session store, and the gitignore rules the CLI
writes all carry the new name. It is done as its own PR because it is the only slice in the
rename that changes behaviour on disk, so it carries the read-compat and migration surface and
must be reviewable on its own.

## The measured surface (verified against `623036a`, not estimated)

Every runtime path is already routed through `cli/src/utils/state.ts` — slice 1 did that. There
are **zero raw `.cortex` / `.cortex-sessions` literals left in `cli/src/**` outside** the constant
module and the two template files named in T08.

Fifteen files import from `state.ts`:

```
engine/worktree.ts:5   engine/session.ts:8    engine/project.ts:4    engine/manifest.ts:4
engine/template.ts:4   engine/context.ts:7    engine/adopt.ts:6      commands/update.ts:7
commands/status.ts:6   commands/start.ts:6    commands/close.ts:7    commands/init.ts:8
utils/config.ts:4
```

Non-`cli/` references to the old paths, verified tracked with `git ls-files`:

```
.githooks/pre-commit:22,23          the main-worktree carve-out and its message
.gitignore:8                        /.cortex/
AGENTS.md:69                        .cortex/prelude.md
skills/cortex-session/SKILL.md:17,21,45,46,121,129,130,142,145,151,164,182
cortex-init.sh:239,254              legacy Gen-1 installer
scripts/backup.sh:9                 scripts/rollback.sh:4,9,14
scripts/cortex-sync.sh:6,55,56      legacy session-store sync
cli/scripts/generate-retrospective.sh:4
README.md                           references cortex-init.sh, no state paths
wiki/**                             historical engram exports — DO NOT TOUCH
odd/**                              historical task docs and evidence — DO NOT TOUCH
```

## The two hard couplings

### 1. The session store is written by a skill, read by the CLI

`skills/cortex-session/SKILL.md` is what tells an agent to create
`.cortex-sessions/ready-for-odd/<date>-<slug>/`. `cli/src/engine/worktree.ts:104` is what reads
it, through `sessionsDir()`. Flipping the constant without updating the skill forks the handoff
inbox **silently**: worktrees keep being created, and the CLI simply never finds the handoff.

This is why `skills/cortex-session/SKILL.md` and `AGENTS.md:69` are in this slice even though the
brand document's exclusion 8 defers `skills/**` and the repository's own `AGENTS.md`. The rule is:
**path strings the CLI reads or writes move now; names and identities move in slice 3.** The skill
directory keeps the name `cortex-session` in this PR.

### 2. Nesting a store inside an ignored directory

`SESSIONS_DIR_NAME` becomes `.rapsodia-code/sessions`, which puts the session store *inside* the
state directory. Git cannot re-include a file whose parent directory is excluded, so the rule
cannot be `/.rapsodia-code/` plus a negation. It has to exclude the *contents*:

```gitignore
/.rapsodia-code/*
!/.rapsodia-code/sessions/
```

This repository tracks its planning sessions, which is why `.githooks/pre-commit:22` exists at
all: it lets `.cortex-sessions/**` be committed directly from the main worktree. That carve-out
must follow the rename, or session commits stop being possible.

## Scope

Authorized for this slice:

- `cli/src/**` — the constants, the read-compat resolver, and every consumer.
- `cli/src/template/**` — the two files carrying state paths.
- `.gitignore`, `.githooks/pre-commit` — this repository's own rules for those paths.
- `AGENTS.md`, `skills/cortex-session/SKILL.md` — path strings only.
- `cortex-init.sh`, `scripts/{backup,rollback,cortex-sync}.sh`,
  `cli/scripts/generate-retrospective.sh` — the repository's own tooling, marked as such.

Out of scope for this slice, and recorded so it is not "helpfully" fixed:

1. **`GLOBAL_STATE_DIR_NAME`** (`~/.cortex`, `cli/src/utils/config.ts:11`). Same spelling,
   different semantics: a global cross-project registry holding `config.json`, not per-project
   state. The plan lists only `PROJECT_STATE_DIR_NAME` and `SESSIONS_DIR_NAME`. Flipping it
   orphans the registry for every project at once, with no read path, so it gets its own change
   with its own migration. It keeps the value `.cortex` in this PR **on purpose**.
2. **Renaming the `cortex-persona` / `cortex-session` skill directories** and `CANONICAL_SKILLS`
   (`cli/src/engine/worktree.ts:43`). Slice 3. Their ~10 Gen-1 absolute symlinks break
   physically, which is exactly why they get their own PR.
3. **`# cortex:start` / `# cortex:end` / `# Cortex managed entries`** (`cli/src/engine/adopt.ts:63,67,68`)
   and **`__managed_by: 'cortex'`** (`adopt.ts:80,81`). Persisted markers in every adopted
   project. Renaming them stops `mergeGitignore` from matching and appends a duplicate managed
   block. Zero user value, real cost. **Keep.**
4. **`## Reporting Cortex Defects`** (`cli/src/template/AGENTS.md:134`, `cli/src/engine/adopt.ts:40,43`)
   and **`cli/src/utils/defect.ts`**. They name the repository, which is still `Cortex` and stays
   that way. **Keep.**
5. **Renaming the local folder `~/Cortex`.** Breaks ~8 absolute symlinks across 10 projects
   silently. Deferrable lever. **Keep.**
6. **`wiki/**` and `odd/**`.** Historical engram exports and recorded evidence. Rewriting them
   would falsify the record. **Do not touch.**
7. **`openspec/**`.** Untracked; synced in `main` at close.

## Constraints

- **Read compatibility is not optional.** After the flip, `findProjectRoot`
  (`cli/src/engine/project.ts:29-41`), `getSessionInfo` (`session.ts:143`),
  `resolveProjectManifestPath` (`project.ts:74-87`), `handoffCandidates` (`worktree.ts:102-114`)
  and `closeCommand` (`close.ts:55`) all read the new path only. Without a resolver, every
  pre-rename project stops being recognised as a project at all.
- **Writes always target the new path.** Only reads fall back.
- **The migration must never destroy.** Rename only when the destination is absent. When both
  exist, leave the legacy directory untouched and report it.
- **Never stage the worktree's untracked `.opencode/` install artifacts**
  (`package.json`, `package-lock.json`, `tools/package-lock.json`). `.opencode/.gitignore` does
  not reach worktrees. Use explicit paths when staging.
- **The repo's pre-commit hook enforces ≤5 files per commit** (Atomicity Gate) and a GGA review.
  No `--no-verify` bypass.
- `cli/dist/` is gitignored and must be rebuilt in `main` after the merge before dogfooding.
- **Dogfooding is safe:** renaming the constants does not touch the `cortex` binary already on
  `PATH`, which is a symlink to `main`'s `cli/dist/index.js`. This worktree runs its own build.

## Task list

### Unit A — the constants, the resolver, the migration

- [ ] **T01** — `cli/src/utils/state.ts`: flip `PROJECT_STATE_DIR_NAME` to `.rapsodia-code` and
      `SESSIONS_DIR_NAME` to `.rapsodia-code/sessions`. Leave `GLOBAL_STATE_DIR_NAME` at `.cortex`
      with a comment stating why (exclusion 1). Add `LEGACY_PROJECT_STATE_DIR_NAME = '.cortex'` and
      `LEGACY_SESSIONS_DIR_NAME = '.cortex-sessions'`.
- [ ] **T02** — Add the read-compat resolvers to the same module: `resolveStateDir(root)`,
      `resolveStatePath(root, ...parts)` (new first, legacy second, `null` when neither exists),
      and `resolveSessionsDir(root)`. Reads only; they must never create anything.
- [ ] **T03** — Add `migrateLegacyState(root): string[]` to the same module. It renames
      `.cortex/` → `.rapsodia-code/` and `.cortex-sessions/` → `.rapsodia-code/sessions/` when the
      destination does not exist, creating parents as needed; returns the repository-relative
      moves it performed so the caller can print them. Idempotent. When both the legacy and the
      new path exist it performs no move and reports nothing. It never deletes or overwrites.

### Unit B — engine reads

- [ ] **T04** — `cli/src/engine/project.ts`: `findProjectRoot` must recognise a legacy state dir
      (resolve `manifest.json` / `session.json` / `worktree.json` through `resolveStatePath`);
      `worktreeSource` and `resolveProjectManifestPath` read through `resolveStatePath`.
- [ ] **T05** — `cli/src/engine/session.ts`: `getSessionInfo` reads through `resolveStatePath`.
      `openSession` keeps writing to the new path. Do not change the `preludeFile` metadata shape.
- [ ] **T06** — `cli/src/engine/context.ts`: the `config.json` budget read and the prelude
      existence checks fall back to legacy; the prelude write stays on the new path.
- [ ] **T07** — `cli/src/engine/manifest.ts`: reads fall back; the write stays new.

### Unit C — the adapters that read the state

- [ ] **T08** — `cli/src/engine/worktree.ts`: `handoffCandidates` must consider the legacy session
      store as well as the new one, for both `target` and `main`; `archiveHandoff` targets the new
      store; `protectedUntrackedPaths`'s `isSessionState` predicate must treat both
      `.rapsodia-code/sessions/` and the legacy `.cortex-sessions/` as session state, or cleanup
      will silently stop protecting the legacy store.
- [ ] **T09** — `cli/src/engine/adopt.ts`: call `migrateLegacyState(targetDir)` before the
      `.gitignore` merge and report the moves; drop the now-redundant
      `SESSIONS_DIR_NAME` entry from `RAPSO_IGNORE_ENTRIES` because `PROJECT_STATE_DIR_NAME/`
      already covers the nested store — record that reasoning in a comment; keep seeding the
      sessions `.gitignore` at the resolved (new) path. Do **not** touch the persisted markers
      (exclusion 3).
- [ ] **T10** — `cli/src/engine/template.ts`: the `PROJECT_STATE_DIR_NAME` substitution follows the
      new value.

### Unit D — commands

- [ ] **T11** — `cli/src/commands/start.ts`: call `migrateLegacyState` after the project root is
      resolved and before anything is written, and print what moved. The prelude and session paths
      follow the new constants.
- [ ] **T12** — `cli/src/commands/close.ts`: the active-session check falls back to legacy; the
      prelude file removal removes the new path and then the legacy path if it is still present.
      `close.ts:92`'s `opencode.json.instructions` splice stays as the constant-based lookup — it
      is a pre-existing dead path (nothing writes the prelude reference; the template ships
      `["AGENTS.md", "DESIGN.md"]`), so it is reported, not fixed here.
- [ ] **T13** — `cli/src/commands/{status,update,init}.ts`: reads fall back, writes stay new.

### Unit E — the shipped template

- [ ] **T14** — `cli/src/template/AGENTS.md:69` and
      `cli/src/template/scripts/generate-retrospective.sh:4`: the `.cortex/` state path follows
      the rename. Leave the `cortex-session` skill references alone (exclusion 2).

### Unit F — the repository's own surface for these paths

- [ ] **T15** — `.gitignore`: replace `/.cortex/` with the contents-exclusion form plus the
      sessions carve-out, exactly as specified under coupling 2.
- [ ] **T16** — `.githooks/pre-commit`: the carve-out case pattern and the message follow the
      rename. The `ACDMR` comment above it stays valid and must not be weakened.
- [ ] **T17** — `AGENTS.md:69` and `skills/cortex-session/SKILL.md`: every `.cortex-sessions/`
      and `.cortex/prelude.md` path follows the rename. **Path strings only** — the skill keeps
      its name. The one line at `SKILL.md:149` that documents the *legacy*
      `ready-for-sdd/` → `ready-for-odd/` migration is about a different, already-retired
      migration: leave the historical sentence intact and only move the live store path.
- [ ] **T18** — Repository tooling, marked as such in the commit message:
      `cortex-init.sh:239,254`, `scripts/backup.sh:9`, `scripts/rollback.sh:4,9,14`,
      `cli/scripts/generate-retrospective.sh:4`. For `scripts/cortex-sync.sh:6,55,56` the store
      path follows the rename while the already-retired `.cortex-sessions/ready-for-sdd/`
      migration logic it documents is left alone. If any of these turns out to be dead code
      rather than live tooling, report it instead of rewriting it.

### Unit G — verification and delivery

- [ ] **T19** — Run the verification scenarios below and record real output.
- [ ] **T20** — Commit as reviewable work units (one concern each, ≤5 files per commit), push,
      and report.

## Acceptance criteria

1. `cd cli && npm run typecheck` passes with the real output reported.
2. `cd cli && npm run build` passes and `cli/dist/index.js` is rebuilt.
3. `rg -n '\.cortex' cli/src --glob '!template/**'` returns only: the two legacy constants in
   `utils/state.ts`, `utils/defect.ts` (exclusion 4), and the kept markers in `engine/adopt.ts`
   (exclusion 3). Report the command and its real output.
4. `rg -n '\.cortex' cli/src/template` returns only exclusion 2's skill references.
5. **Read compatibility works** — the scenario below is the acceptance test for this slice.
6. **The migration is non-destructive** — it never overwrites, and it reports instead of moving
   when both directories exist.
7. **No behaviour change to the new-path flow** — a project already on the new layout behaves
   exactly as before.
8. `cd cli && npm pack --dry-run` still lists `src/template/**` (the PR #25 fix must not
   regress).
9. The worktree's untracked `.opencode/` artifacts are **not** staged.

## Verification scenarios

Run from the worktree after `npm run build`. `STATE_CLI="node $PWD/cli/dist/index.js"`.

1. **Typecheck** — `cd cli && npm run typecheck` → report exact output and exit code.
2. **Build** — `cd cli && npm run build` → report the resulting `cli/dist/index.js` size.
3. **Literal inventory** — the two `rg` commands from acceptance criteria 3 and 4; report the
   complete output.
4. **Read compatibility — legacy project, no migration yet.** Build a throwaway tree outside the
   repo containing `.cortex/manifest.json` (minimal valid shape) and
   `.cortex-sessions/ready-for-odd/2026-09-17-legacy-probe/`. Run `status` and
   `worktree list --root` against it and report the real output: the project must be recognised
   as a project, not as `unknown`.
5. **Migration.** Run `start --dry-run` (or the smallest command that calls
   `migrateLegacyState`) against the same throwaway tree; report the printed moves and assert the
   resulting layout with `find`. Then re-run it and assert it is a no-op.
6. **Non-destructive migration.** Create a second throwaway tree where both `.cortex/` and
   `.rapsodia-code/` exist; assert nothing was moved or deleted and that the report says so.
7. **No regression** — `node cli/dist/index.js worktree list --root /home/stefan/Cortex` still
   lists both worktrees correctly.
8. **Tarball** — `cd cli && npm pack --dry-run` → `src/template/**` present.

## Risk notes

- **This repository's own `.cortex/` is empty and it has no `manifest.json`**, so
  `node cli/dist/index.js status` here reports `Project: unknown` today. That is pre-existing and
  not caused by this slice, but it means `main` is **not** a usable dogfood signal for
  acceptance criterion 5. The throwaway trees in scenarios 4–6 exist for that reason.
- The `.gitignore` form in T15 is the one git rule that is easy to get subtly wrong. Scenario 5
  should include a `git check-ignore` assertion that a file under `.rapsodia-code/sessions/` is
  **not** ignored, not just that the state directory is.
- `.cortex-sessions/` in `main` is untracked today but carries real content (archived and
  ready-for-odd sessions). The migration renames it in place, so nothing is lost — but the
  builder must confirm `git status` in `main` afterwards and report it rather than assume.

## Progress

Implementation completed on `odd/rename-rapsodia-state` with local commits:

- `9fae71d feat(cli): add compatible project state resolvers`
- `90c6875 fix(cli): preserve file-level legacy state fallback`
- `39a3d10 feat(cli): migrate and read compatible project state`
- `55921af docs(cli): update shipped state path references`
- `a1c26cb docs: update project state path guidance`
- `[pending]` repository tooling path updates and this progress record

T01–T18 are implemented. T19 verification completed: typecheck and build passed; the
legacy-only, migrated, idempotent, and both-layout-preservation scenarios passed; the
gitignore carve-out and worktree-list regression passed; `npm pack --dry-run` listed
`src/template/**`. `cli/dist/index.js` was rebuilt at 223189 bytes.

Discrepancies: `cli/src/engine/context.ts` has no prelude existence read to route through a
resolver, and `cli/src/engine/manifest.ts` has no state read path beyond its new-path write;
the task items were satisfied by the existing code rather than by inventing dead logic.
The requested `npm test` harness remains absent and reports `No test files found` when run by
the repository hook. T20 is local-only per the implementation instruction; nothing was pushed.

## Next step

Implement unit A, then B, then C, then D, then E, then F. Verify with unit G.

## Rationale log

- **Route: ODD-direct, chained PRs — not an SDD change.** The decisions are made and recorded in
  the umbrella and brand documents; this is a measured value flip plus one read-compat design
  (resolver + one-shot migration). There is no design question for a proposal to answer.
- **Read-compat as a resolver, not as a rename-on-sight.** A resolver keeps `status`, `close` and
  manifest reads working on an unmigrated project without any mutation, which matters because
  `close` is how a user ends a session and must never be the command that surprises them.
- **One-shot migration added on top of the written plan.** The plan says "read-compat" only.
  Without a migration, `adopt`'s rewritten `.gitignore` block drops the legacy ignore rules and
  exposes `.cortex/` in `git status`, and a Gen-1 project never populates the nested store, so the
  handoff inbox forks permanently. Folding it in is what makes "read-compat" actually true rather
  than a permanent split. It is bounded: one function, two call sites, no deletion.
- **Exclusion 1 is deliberately asymmetric.** `state.ts` will hold a value ending in `.cortex`
  (the global registry) next to one ending in `.rapsodia-code`. That is not an oversight: they are
  different scopes with different migration costs, and merging them would be the bug.
- **Path strings now, names in slice 3.** The skill directory keeps `cortex-session` while the
  paths inside it move. The alternative — deferring the skill's paths to slice 3 — would leave the
  handoff inbox broken between the two PRs, which is worse than a split rename.

## Graph evidence

Read `graphify-out/GRAPH_REPORT.md` (graph built from `623036a2`, `GRAPH_REPORT.md:12-15`;
904 nodes / 1371 edges / 125 communities). Consulted nodes/edges:
`GRAPH_REPORT.md:136-145` — `statePath()` is the highest-connectivity node in the graph, which is
what makes this slice a value flip instead of a rewrite; `:459-460` — its cross-module edges into
`engine/adopt.ts`, `engine/context.ts` and `engine/worktree.ts`, which are units C and D.
