# ship gitignore — the CLI writes the files npm refuses to publish

Status: in progress · Date: 2026-09-19 · Branch: `odd/ship-gitignore` ·
Worktree: `../rapsodia-code-odd-ship-gitignore` · Base: `origin/main` `2e73cbc`

## Objective

A project created by the published CLI must receive the same files as one created from the
repository checkout. Today it receives no `.gitignore` at all.

## Problem — measured against the package people actually install

`npm publish` shipped `rapsodia-code@1.0.0` at 2026-09-19T13:13:36Z. Installing that tarball and
running its own binary produces a project with three files fewer than a project created from the
repository:

```
$ diff <(find cli/src/template -type f) <(find node_modules/rapsodia-code/src/template -type f)
< ./.gitignore
< ./.opencode/.gitignore
< ./.opencode/tools/node_modules/.gitkeep
```

**npm never publishes a file named `.gitignore`.** Proved with a throwaway package:

```text
$ printf '{"name":"probe","version":"1.0.0","files":["f"]}' > package.json
$ printf 'node_modules/\n' > f/.gitignore
$ echo hi > f/keep.txt
$ npm pack --dry-run
npm notice 3B f/keep.txt          <- .gitignore is silently dropped, keep.txt survives
```

The third file is a different animal, and measuring it changed the scope: `.gitkeep` is **not
tracked by git**. `cli/src/template/.opencode/.gitignore` ignores it through its own `node_modules/`
rule, so it is a local artifact of the `main` working tree that no clone and no package ever had.
It is recorded below as a finding, not fixed here.

### Impact

A project created from the published package has **no ignore rules**:

```text
project/.gitignore            -> MISSING
project/.opencode/.gitignore  -> MISSING
```

`node_modules/`, `dist/`, `build/`, `.env`, `.env.local`, `*.log`, `.DS_Store`, `graphify-out/`,
`.opencode/tools/node_modules/`, `.engram/`, `.obsidian/workspace*`, `__pycache__/`, `*.pyc` and the
Python caches are all committable. `graphify-out/` and `.engram/` appear as soon as the user works,
so this is not theoretical.

`rapso adopt` is **not** affected: it writes `.gitignore` through `mergeGitignore`. Only `rapso init`
depends on the template carrying the file.

## Why the content moves into code

Two mechanisms were considered.

**Rename and map.** Ship `gitignore.template` and translate the name wherever a template path
becomes a project path. Rejected: that is the same shape as the defect this repository has already
fixed twice today. The mapping has to be applied in `copyTemplate`, `isOwned`, `adoptProject`'s
target and manifest paths, `detectChanges` and six sites in `update.ts` — and one forgotten site is
a silent bug, which is exactly what the previous two work units were about.

**The content moves into code, and the CLI writes it.** Chosen. There is no mapping to forget. It
also gives `.gitignore` a single owner: `init` and `adopt` both write it through the same module, on
the principle this repository has already adopted twice. `update.ts` and `manifest.ts` need no change
at all, because neither the source nor the target path of these files flows through them: `update`
only walks `changes.{modified,userModified,added}`, all of which come from `collectFiles` over the
template, and the files are no longer in the template.

Cost, stated plainly: the content leaves the template, so it is no longer visible where the rest of
the project files are. The mitigation is that it was never editable in a meaningful way — the
managed half already lived in `RAPSO_IGNORE_ENTRIES` and was regenerated on every adoption.

## Authorized scope

- `cli/src/template/.gitignore` — deleted.
- `cli/src/template/.opencode/.gitignore` — deleted.
- `cli/src/engine/gitignore.ts` — new module, the single owner of `.gitignore` content.
- `cli/src/engine/adopt.ts` — imports `mergeGitignore` from the new module; `.opencode/.gitignore`
  moves from the owned-template list to the seed list.
- `cli/src/commands/init.ts` — writes both files after copying the template.
- `odd/tasks/ship-gitignore.md` — this document.

Out of scope, with reasons:

1. **A guard against the next unpublished file.** Nothing today compares the repository's template
   against the tarball's. Building that is its own work unit, and it is the right follow-up rather
   than a rider on this one.
2. **`cli/README.md` (the npm page).** It is accurate but does not mention the skill pack. It
   refreshes with every published version, so it ships with `1.0.1` or after.
3. **The untracked `.gitkeep` under the template's `node_modules`.** It is not in git, so it is not a
   repository defect and no package ever carried it. It only makes the `main` working tree copy one
   file more than a clean checkout, which is why the original measurement saw three differences
   instead of two. Removing it from `main` is a one-line local cleanup.

## Tasks

- [ ] **T01** — Create `cli/src/engine/gitignore.ts`: the project baseline entries, the managed
      entries (moved from `adopt.ts` as `RAPSO_IGNORE_ENTRIES`), the markers and header, the legacy
      marker pairs, `mergeGitignore` (moved verbatim), and the two seed contents — the root
      `.gitignore` for a new project and `.opencode/.gitignore`.
- [ ] **T02** — Delete the two tracked template files npm strips.
- [ ] **T03** — `adopt.ts` imports `mergeGitignore` from the new module and stops claiming
      `.opencode/.gitignore` as an owned template path; it seeds the file instead, through the seed
      mechanism the session store already uses.
- [ ] **T04** — `init.ts` writes `.gitignore` and `.opencode/.gitignore` after `copyTemplate`, and
      counts them in the reported file total.
- [ ] **T05** — Run every check below and record the literal output.
- [ ] **T06** — Commit in Atomicity-Gate batches (≤5 staged files). PR on explicit request only.

## Acceptance criteria

1. `npm run typecheck` and `npm run build` from `cli/` exit 0.
2. `npm pack --dry-run` from `cli/` no longer lists `src/template/.gitignore`,
   `src/template/.opencode/.gitignore` or the `node_modules/.gitkeep`.
3. **The decisive check.** Pack the worktree, install the tarball into a throwaway directory, run
   **its** binary, and assert that the generated project has both `.gitignore` and
   `.opencode/.gitignore`, with the baseline patterns and the managed block.
4. The generated root `.gitignore` contains `node_modules/`, `dist/`, `build/`, `.env`,
   `.env.local`, `*.log`, `.DS_Store` and `Thumbs.db` outside the managed block, and the managed
   block between `# rapso:start` and `# rapso:end`.
5. `rapso adopt` on an existing project seeds a missing `.opencode/.gitignore` and reports it, and
   `mergeGitignore` behaviour is unchanged for a file that already has the block.
6. A second `init` and a second `adopt` change neither file — idempotent.
7. The repository template and the published template agree file for file.

## Checks

Every check runs from the worktree root. The worktree build is invoked explicitly —
`/home/stefan/.local/bin/rapso` points at `main`'s `cli/dist`.

1. **Typecheck and build** — both exit 0.
2. **Tarball** — `npm pack --dry-run` lists no `.gitignore` and no template `node_modules` path.
3. **Published-package simulation** — `npm pack` into `/tmp`, install the tarball, run that install's
   binary, list the generated project's dotfiles.
4. **Content** — read the generated `.gitignore`; confirm the baseline and the managed block.
5. **Adopt seeding** — `adopt` against a project missing `.opencode/.gitignore`.
6. **Idempotence** — re-run both.
7. **Parity** — `diff` of the repository template and the installed template file lists.

## Progress

- [x] Measured the divergence between the repository template and the published tarball.
- [x] Proved npm's `.gitignore` exclusion empirically.
- [x] Chose the mechanism with the human, and recorded why the alternative was rejected.
- [x] Confirmed `update.ts` and `manifest.ts` need no change.
- [x] Established that the third difference is an untracked local artifact, not a repository file,
      and narrowed the scope to two files.
- [x] **T01** — `cli/src/engine/gitignore.ts` owns the baseline, the managed entries, the markers,
      `mergeGitignore` and the two seed contents.
- [x] **T02** — the two tracked `.gitignore` template files are deleted; the template is 39 tracked
      files, matching what the package ships.
- [x] **T03** — `adopt.ts` imports `mergeGitignore`, no longer claims `.opencode/.gitignore` as an
      owned template path, and seeds it instead.
- [x] **T04** — `init.ts` writes both files and counts them.
- [x] **T05** — checks recorded below.
- [ ] **T06** — pending: commit in Atomicity-Gate batches; PR on explicit request only.

### Verification output

The worktree build was used for the local runs. The decisive check used the **packed tarball**: the
repository checkout has the files and the package does not, so verifying against `cli/dist` would
have proved nothing.

1. `npm run typecheck` and `npm run build` from `cli/` — both exit 0.
2. `npm pack --pack-destination /tmp` from `cli/`:
   ```text
   rapsodia-code-1.0.0.tgz
   $ tar -tzf … | grep -c "\.gitignore"        -> 0
   $ tar -tzf … | grep -c '^package/src/template/' -> 39
   ```
3. Installed that tarball into `/tmp/pubcheck` and ran **its** binary:
   ```text
   $ npm i /tmp/rapsodia-code-1.0.0.tgz
   $ ./node_modules/.bin/rapso init project --no-git
   ✔ Copied 41 files                      <- 39 template files + the 2 the CLI now writes
   ✅ project/.gitignore EXISTS
   ✅ project/.opencode/.gitignore EXISTS
   ```
4. Generated `project/.gitignore`:
   ```text
   node_modules/
   dist/
   build/
   .env
   .env.local
   *.log
   .DS_Store
   Thumbs.db

   # rapso:start
   # Rapsodia managed entries
   .rapsodia-code/
   graphify-out/
   .opencode/tools/node_modules/
   .engram/
   .obsidian/workspace.json
   .obsidian/workspace
   __pycache__/
   *.pyc
   *.pyo
   .pytest_cache/
   .ruff_cache/
   .mypy_cache/
   # rapso:end
   ```
   Parsed: 8/8 baseline entries outside the block, 7/7 sampled managed entries inside it.
   `project/.opencode/.gitignore` is `node_modules/` + `bun.lock`.
5. `adopt` against that project with `.opencode/.gitignore` removed:
   ```text
   Seeded (3): .rapsodia-code/sessions/.gitignore, .opencode/.gitignore, odd/tasks/.gitkeep
   ```
   The real run created it.
6. Idempotence — two further `adopt` runs leave both files byte-identical (`sha256` of the pair
   unchanged), a second `init` produces byte-identical files, and the project-owned baseline
   survives adoption untouched.
7. Parity:
   ```text
   $ diff <(find cli/src/template -type f) <(find node_modules/rapsodia-code/src/template -type f)
   ✅ IDENTICAL file lists
   ```

## Next step

Commit T01–T05 in Atomicity-Gate batches, then open the PR on request.

## Rationale log

- **The decisive check runs against an installed tarball.** The defect was invisible to every local
  run: a repository checkout has the files, the package does not. Verifying with `cli/dist` would
  have proved nothing.
- **One owner for `.gitignore` content.** `init` seeding the same block `adopt` maintains means a
  project created and a project adopted converge instead of drifting.
- **Delete the `node_modules` placeholder rather than work around it.** npm will never publish that
  path, so keeping the file guarantees the two templates keep disagreeing.
