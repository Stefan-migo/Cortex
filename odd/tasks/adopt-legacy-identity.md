# adopt legacy identity — remove the agent identity Rapsodia superseded

Status: in progress · Date: 2026-09-18 · Branch: `odd/adopt-legacy-identity` ·
Worktree: `../rapsodia-code-odd-adopt-legacy-identity` · Base: `origin/main` `c5a344f`

## Objective

`rapso adopt` must complete the migration it starts. Today it installs the Rapsodia agent
identity and leaves the Cortex agent identity standing, so a migrated consumer ends up running
two generations of the same agents in parallel.

## Problem — measured against the real consumer

Command: `rapso adopt --dry-run` at `~/repos/lumat-agent`, after `scripts/rapso-sync.sh`
(PR #49) had already migrated the skills and `AGENTS.md`.

```
Created (2):
  .opencode/agents/rapso-developer.md
  .opencode/agents/rapso-planner.md
Injected (3):
  AGENTS.md
  .gitignore
  .opencode/opencode.json
```

Nothing in that plan removes the superseded identity. Four distinct defects follow.

### D1 — the superseded agent config entries survive

`.opencode/opencode.json` defines `agent.cortex-planner` and `agent.cortex-developer`, both
carrying `__managed_by: "cortex"`. `mergeJson` (`adopt.ts:83-89`) only ever claims the names
`rapso-planner` and `rapso-developer`; it has no notion of the name it replaced. After adopt the
consumer holds four agent entries, two per role.

The marker proves ownership: `__managed_by: "cortex"` is the string this code writes
(`adopt.ts:88`). So the CLI already considers these entries its own — it just never migrates them.

### D2 — the superseded agent files survive

`.opencode/agents/cortex-planner.md` and `.opencode/agents/cortex-developer.md` remain on disk.
`adoptProject` has no deletion path at all: it creates, refreshes, conflicts, or skips.

Ownership is provable, not guessed. The consumer's legacy manifest records both files and their
hashes, and both match the bytes on disk:

| File | Manifest hash | On-disk hash | Match |
|---|---|---|---|
| `.opencode/agents/cortex-planner.md` | `3f5941eb…efd5` | `3f5941eb…efd5` | yes |
| `.opencode/agents/cortex-developer.md` | `a518f4ea…ed09` | `a518f4ea…ed09` | yes |

This is the same evidence `adopt` already trusts for `refreshed` (`adopt.ts:139`):
`oldHashes.get(file) === hashFile(target)` means "Rapsodia wrote this and nobody touched it".

Content comparison is **not** usable as the ownership test: the legacy files have diverged from
the current template (the new planner is ODD-first, the old one is SDD-first), so a
normalized-content match fails on exactly the files that are ours.

### D3 — the managed `.gitignore` block keeps its Cortex name

`mergeGitignore` (`adopt.ts:69-76`) matches `# cortex:start … # cortex:end` and replaces the
block body, but writes the markers back unchanged and keeps the header `# Cortex managed
entries`. The consumer's `.gitignore` is a managed region still labelled with the retired name.

### D4 — the dry-run plan is wrong about two things

`adoptProject` reads the manifest through `statePath(targetDir, 'manifest.json')`
(`adopt.ts:122`), which is `.rapsodia-code/manifest.json`. In a dry run `migrateLegacyState` does
not run (`adopt.ts:116`), so that path does not exist and `oldHashes` is empty.

Two consequences, both measured:

1. Files the real run would **refresh** are reported as **conflicting**. In the dry-run above,
   `.opencode/mcp-template.json` is unmodified by the project and recorded in the legacy
   manifest (`b34e93f4…`), so the real run refreshes it; the dry run calls it a conflict.
2. The session seed is misreported. `.cortex-sessions/.gitignore` exists, so the real run's
   rename makes `.rapsodia-code/sessions/.gitignore` already present and the seed is skipped; the
   dry run reports it as `Seeded`.

A plan nobody can trust is what let the original defect ship. Both misreports are fixed by
reading the manifest through `resolveStatePath`, which already exists for exactly this case
(`state.ts:23-29`).

## Why this is one work unit

D1 and D2 are one defect — the superseded identity is never removed, in either of the two places
it lives. D3 is the same defect in the managed-marker form: a retired name left standing. D4 is
what makes all of it diagnosable, and fixing D4 is a precondition for detecting D1/D2 correctly.

## Authorized scope

- `cli/src/engine/adopt.ts` — `mergeJson`, `mergeGitignore`, `adoptProject`, `AdoptPlan`.
- `cli/src/commands/adopt.ts` — print the new plan buckets.
- `odd/tasks/adopt-legacy-identity.md` — this document.

Out of scope, with reasons:

1. **`.cortex-sessions/` in the consumer's `.gitignore` (`lumat-agent:.gitignore:33`).** It lives
   outside the managed block, surrounded by hand-written entries. Reported, not deleted.
2. **`__managed_by: "cortex"`.** A persisted compatibility key: changing the value would make
   every existing project's entries read as "not ours" and stop being migrated. The rename
   decision already records persisted compat keys as deliberately never renamed.
3. **Skill directories.** `.opencode/skills/**` belongs to `scripts/rapso-sync.sh`. Reimplementing
   its stale-skill removal here is the drift this repo already refused once.
4. **`rapso-init.sh`.** `rapso init` uses `copyTemplate`, not `adoptProject`; a project created
   by it has no legacy identity to migrate.

## Tasks

- [ ] **T01** — Read the manifest through `resolveStatePath(targetDir, 'manifest.json')` so a dry
      run sees the same manifest the real run will see. Keep writing to `statePath`. A dry run and
      a real run must agree on every operation.
- [ ] **T02** — Add `removed` and `leftover` to `AdoptPlan` and print them as `Removed` and
      `Leftover` in the adopt command. `removed` names an operation the plan performs; `leftover`
      names a legacy path kept because it is not provably ours.
- [ ] **T03** — `mergeJson` removes `agent.cortex-planner` and `agent.cortex-developer` when, and
      only when: the entry exists, its `__managed_by` is `cortex`, and the `rapso-*` replacement
      is present in the merged config. A project agent that merely shares a legacy name is never
      touched. Report each removal.
- [ ] **T04** — `adoptProject` removes `.opencode/agents/cortex-planner.md` and
      `cortex-developer.md` when, and only when: the file exists, the legacy manifest records it
      **with the hash it still has** (nobody hand-edited it), and the replacement file exists or
      is being created by this run. A file whose hash no longer matches is kept and reported in
      `leftover`. Removal happens after the template loop so `created` is known.
- [ ] **T05** — `mergeGitignore` renames the marker pair `# cortex:start` / `# cortex:end` to
      `# rapso:start` / `# rapso:end` and the block header to `# Rapsodia managed entries`. The
      matcher accepts either marker pair, so an already-renamed file is not duplicated.
- [ ] **T06** — Report the session seed truthfully: `.rapsodia-code/sessions/.gitignore` counts as
      present when the legacy `.cortex-sessions/.gitignore` that would be renamed to it exists.
- [ ] **T07** — Run every check below and record the literal output.
- [ ] **T08** — Commit in Atomicity-Gate batches (≤5 files). PR on explicit request only.

## Acceptance criteria

1. `npm run typecheck` exits 0.
2. `npm run build` exits 0.
3. Against a fixture carrying the legacy identity (manifest hashes matching, `cortex-*` agents in
   `opencode.json`, `# cortex:start` markers), a real run removes both config entries and both
   files, reports them under `Removed`, and installs `rapso-planner` / `rapso-developer`.
4. A legacy agent file whose bytes no longer match its manifest hash is **kept** and reported
   under `Leftover`; its config entry is also kept.
5. A second run reports no removal, no leftover and no rewrite — idempotent.
6. `.gitignore` carries `# rapso:start` / `# rapso:end` and `# Rapsodia managed entries`; no
   `# cortex:` marker remains anywhere in the file.
7. `--dry-run` and the real run report the same plan buckets on the same fixture. The
   `State migration:` lines are the one deliberate difference: `migrateLegacyState` performs a
   real filesystem rename and no dry run performs it.
8. `rapso adopt --dry-run` against `~/repos/lumat-agent` stays read-only and replaces the
   previously wrong `Conflicting` / `Seeded` lines with the true ones.
9. No write reaches `~/repos/lumat-agent` in this work unit.

## Checks

Every check runs from the worktree root and records its literal output in Progress. The worktree
build is invoked explicitly — `/home/stefan/.local/bin/rapso` points at `main`'s `cli/dist`, not
this worktree.

1. **Typecheck** — `npm run typecheck` from `cli/` exits 0.
2. **Build** — `npm run build` from `cli/` exits 0.
3. **Fixture migration** — a throwaway consumer replicating the legacy layout is adopted with the
   worktree build; output shows both removals and the new agents.
4. **Hand-edit protection** — the fixture's `cortex-planner.md` is modified; the run keeps it and
   reports `Leftover`.
5. **Idempotence** — the real run is repeated; the plan is empty of removals and rewrites.
6. **Marker rename** — `grep -c cortex` over the fixture's `.gitignore` is 0 after the run.
7. **Dry-run parity** — dry-run and real operations are compared line by line on a fresh fixture.
8. **Consumer read-only** — `sh scripts/rapso-sync.sh` is not run; `rapso adopt --dry-run` against
   `~/repos/lumat-agent` leaves `git -C ~/repos/lumat-agent status --short` byte-identical.

## Progress

- [x] Explored the real consumer, the manifest, both agent files, `mergeJson`, `mergeGitignore`,
      `adoptProject`, the adopt command, and the template.
- [x] Established ownership evidence: manifest hashes match both legacy agent files byte for byte.
- [x] Established that content normalization cannot serve as the ownership test.
- [x] **T01** — the manifest is read through `resolveStatePath`, written through `statePath`. A
      dry run and a real run now report the same plan.
- [x] **T02** — `AdoptPlan` carries `removed` and `leftover`; the adopt command prints `Removed`
      and `Leftover` and warns about a retired path it kept.
- [x] **T03** — `mergeJson` retires a legacy agent entry only for the names the caller proved safe
      and only when the entry is ours and its replacement is present.
- [x] **T04** — the legacy agent file is removed only when the manifest recorded it with the hash
      it still has and the replacement is installed; otherwise it — and its config entry — stay.
- [x] **T05** — the managed block is renamed to `# rapso:start` / `# rapso:end` with the header
      `# Rapsodia managed entries`; the matcher accepts either marker pair.
- [x] **T06** — the session seed counts the legacy `.cortex-sessions/.gitignore` that the rename
      puts at the new path, so a dry run no longer promises a file the real run leaves alone.
- [x] **T07** — checks recorded below.
- [ ] **T08** — pending: commit in Atomicity-Gate batches; PR on explicit request only.

### Verification output

Worktree build invoked explicitly: `node ../rapsodia-code-odd-adopt-legacy-identity/cli/dist/index.js`.
`/home/stefan/.local/bin/rapso` points at `main`'s `cli/dist`, so it cannot test this branch.

1. `npm run typecheck` from `cli/`
   ```text
   > rapsodia-code@1.0.0 typecheck
   > tsc --noEmit

   (exit 0)
   ```
2. `npm run build` from `cli/`
   ```text
   > rapsodia-code@1.0.0 build
   > node esbuild.config.js

   (exit 0)
   ```
3. Fixture replicating the real consumer's legacy layout — dry run
   (`adopt /tmp/opencode/adopt-dry --dry-run --yes`):
   ```text
   Created (10): rapso-developer.md, rapso-planner.md, package.json, bootstrap|design-system|graphify/SKILL.md, tools/*
   Refreshed (1): .opencode/mcp-template.json
   Removed (4): .opencode/agents/cortex-planner.md, .opencode/agents/cortex-developer.md,
                .opencode/opencode.json → agent.cortex-planner,
                .opencode/opencode.json → agent.cortex-developer
   Leftover (0)
   Conflicting (0)
   Injected (3): AGENTS.md, .gitignore, .opencode/opencode.json
   Seeded (1): odd/tasks/.gitkeep
   Skipped (3): .opencode/.gitignore, .rapsodia-code/sessions/.gitignore, .rapsodia-code/manifest.json
   ```
   Observed: the same fixture's previous behaviour reported `mcp-template.json` as **Conflicting**
   and `sessions/.gitignore` as **Seeded**; both are now correct.
4. Same fixture — real run (`adopt /tmp/opencode/adopt-real --yes`):
   ```text
   State migration: .cortex -> .rapsodia-code
   State migration: .cortex-sessions -> .rapsodia-code/sessions
   Created (10) · Refreshed (1) · Removed (4) · Leftover (0) · Conflicting (0) · Injected (3) · Seeded (1) · Skipped (3)
   ```
   Observed: the plan buckets are identical to the dry run; only the two `State migration:` lines
   are new, and they are filesystem operations no dry run can perform.
5. Post-run state of the real fixture:
   ```text
   .opencode/agents/                  -> rapso-developer.md rapso-planner.md
   opencode.json agent keys           -> ['rapso-developer', 'rapso-planner']
   grep -c '# cortex:' .gitignore     -> 0
   grep -n cortex .gitignore          -> 33:.cortex-sessions/   (outside the managed block, reported not removed)
   .cortex / .cortex-sessions         -> absent; .rapsodia-code/sessions present with .gitignore = '*'
   ```
6. Idempotence — the real fixture adopted a second time:
   ```text
   Created (0) · Refreshed (0) · Removed (0) · Leftover (0) · Conflicting (0) · Injected (0) · Seeded (0)
   Skipped (18)
   ```
7. Hand-edit protection — a fixture whose `cortex-planner.md` gained a hand-written line:
   ```text
   Removed (2): .opencode/agents/cortex-developer.md, .opencode/opencode.json → agent.cortex-developer
   Leftover (1): .opencode/agents/cortex-planner.md
   ⚠ 1 retired path(s) kept because their content differs from what Rapsodia wrote.
   ```
   ```text
   .opencode/agents/        -> cortex-planner.md rapso-developer.md rapso-planner.md
   opencode.json agent keys -> ['cortex-planner', 'rapso-developer', 'rapso-planner']
   ```
   Observed: the retired identity is kept whole — file **and** config entry — never half-removed.
8. Consumer read-only — `adopt ~/repos/lumat-agent --dry-run --yes`:
   ```text
   Created (2): .opencode/agents/rapso-developer.md, .opencode/agents/rapso-planner.md
   Refreshed (3): .opencode/mcp-template.json, .opencode/skills/bootstrap/SKILL.md, .opencode/skills/graphify/SKILL.md
   Removed (4): .opencode/agents/cortex-planner.md, .opencode/agents/cortex-developer.md,
                .opencode/opencode.json → agent.cortex-planner,
                .opencode/opencode.json → agent.cortex-developer
   Leftover (0) · Conflicting (0) · Injected (3): AGENTS.md, .gitignore, .opencode/opencode.json
   Seeded (0) · Skipped (10)
   ```
   ```text
   git -C ~/repos/lumat-agent status --short | sha256sum
   before: 30164c039efc91b23a66c9ed0d639a8b91c2029b09f8b78d426326eb5ec9ef9c
   after:  30164c039efc91b23a66c9ed0d639a8b91c2029b09f8b78d426326eb5ec9ef9c
   ```
   Observed: read-only, and the consumer's plan now names the four removals the old build could
   not see.

## Next step

Commit T01–T07 in Atomicity-Gate batches, then run `rapso adopt` for real against
`~/repos/lumat-agent` and commit the consumer's migration.

## Rationale log

- **Hash over content.** The legacy files diverged from the template, so content matching would
  keep exactly the files that are ours. The manifest hash answers the question that matters — did
  a human edit this? — and reuses the check `adopt` already trusts.
- **Removal is gated on the replacement, as in the sync.** Deleting the legacy agent before the
  new one exists would leave the consumer with no planner and no developer. The gate makes this an
  upgrade instead of a loss.
- **`leftover` is a report, not a failure.** A legacy file a human edited is that human's file.
  Saying so is the honest outcome; deleting it silently would be the defect.
- **Keep the compat marker.** `__managed_by: "cortex"` stays the value this code writes, because
  changing it would orphan every project already marked with it.
