# skills through template — make the published CLI deliver the pack skills

Status: in progress · Date: 2026-09-18 · Branch: `odd/skills-through-template` ·
Worktree: `../rapsodia-code-odd-skills-through-template` · Base: `origin/main` `60552a0`

## Objective

A project created by the published CLI must receive the skills the README says it receives. Today it
receives none of them.

## Problem — measured against the published tarball

`npm pack --dry-run` from `cli/` ships exactly three skill directories:

```
src/template/.opencode/skills/bootstrap/
src/template/.opencode/skills/design-system/
src/template/.opencode/skills/graphify/
```

The repository tracks seven more in `skills/`: `rapso-persona`, `rapso-session`, `ponytail-review`,
`ponytail-audit`, `ponytail-debt`, `ponytail-help`, `ponytail-plan`. **None of them reach a project
created by the CLI**, because `cli/package.json` declares `files: ['dist', 'src/template']` and
neither `skills/` nor `rapso-init.sh` is in that list.

`cli/src/engine/worktree.ts:45` already documents the gap in its own words:

> The canonical skills live in `<repo>/skills/` only in the Rapsodia pack repository. An adopted
> project tracks its own copies under `.opencode/skills/` instead, and **a project created by
> `rapso init` has neither**.

`rapso update` cannot close it either: it diffs the template against the manifest, so it can only
refresh a file the template already contains.

### What the README claims

`README.md:48`, under the heading **Included skill pack**:

> It provides the `rapso-persona` and `rapso-session` skills, Ponytail review skills, Graphify
> integration, Engram memory guidance, and the five-step execution gate. The CLI is the supported
> installation path for the project files…

This is the central description of the product, and a user who installs from npm receives three
skills, none of which is named in that sentence. The section heading is part of the claim.

### Why the two copies drifted

`skills/` (repo root, tracked) and `cli/src/template/.opencode/skills/` are two unrelated stores of
skill content. The pack repository wires its own working copies as symlinks from
`.opencode/skills/<name>` to `../../skills/<name>`; `rapso-init.sh:59` symlinks from the same place
into a consumer; `scripts/rapso-sync.sh:50` copies from the same place. The template holds three
different skills and is the only store the package ships. Two stores, one of them invisible to
consumers, is the same shape as the drift `rapso-sync.sh` was written to repair.

## Authorized scope

- `skills/` — the six canonical skill directories move out (`git mv`).
- `cli/src/template/.opencode/skills/` — they arrive here, the only store the package ships.
- `cli/src/engine/worktree.ts` — `canonicalSkillsRoot` reads the template.
- `rapso-init.sh` — links from the template.
- `scripts/rapso-sync.sh` — copies from the template.
- `README.md` — the claim becomes true, and names the six it actually delivers.
- `odd/tasks/skills-through-template.md` — this document.

Local, gitignored, therefore **not in the PR**: the repository's own `.opencode/skills/*` symlinks,
which `.gitignore:19-20` ignores (`/.opencode/skills/rapso-*`, `/.opencode/skills/ponytail-*`). They
are repointed so the author's working environment keeps resolving.

Out of scope, with reasons:

1. **`skills/ponytail-plan/`.** PR #42 removed `ponytail-plan` from `rapso-init.sh` and from
   `CANONICAL_SKILLS` deliberately, and `OWNED_PATHS` claims `.opencode/skills/**` wholesale — so a
   `ponytail-plan` inside the template would be distributed by `adopt`. It stays where it is.
2. **`rapso-sync.sh`'s skill copying.** After this change `adopt` owns the same six files from the
   same source, so the sync's copy loop is redundant but not conflicting. Retiring it is a separate
   decision about what the sync still owns. Recorded, not done.
3. **`rapso-session/SKILL.md`'s `cortex-session/…` Engram topic keys.** Real, separate, and a
   question for the human: persisted compat keys or residue.
4. **T08 Slice B, `worktree.ts:93`, and the `.gitignore:33` dead entry in a consumer.** Unrelated.

## Tasks

- [ ] **T01** — `git mv` the six canonical skills from `skills/` into
      `cli/src/template/.opencode/skills/`. `skills/ponytail-plan/` stays behind.
- [ ] **T02** — `chmod 644` `cli/src/template/.opencode/skills/rapso-session/SKILL.md`. It is 755
      today, and this change is what makes it travel inside a published package for the first time.
- [ ] **T03** — `canonicalSkillsRoot` resolves `cli/src/template/.opencode/skills`. Its comment
      describes a world where the canonical skills live in `<repo>/skills/`; that world is over.
- [ ] **T04** — `rapso-init.sh` links each skill from the template.
- [ ] **T05** — `scripts/rapso-sync.sh` copies each skill from the template.
- [ ] **T06** — `README.md`'s "Included skill pack" section states what the CLI delivers and names
      the six skills.
- [ ] **T07** — Repoint the repository's local, gitignored `.opencode/skills/*` symlinks (in `main`
      after merge, and in this worktree to verify).
- [ ] **T08** — Run every check below and record the literal output.
- [ ] **T09** — Commit in Atomicity-Gate batches (≤5 staged files). PR on explicit request only.

## Acceptance criteria

1. `npm pack --dry-run` from `cli/` lists all six canonical skills under
   `src/template/.opencode/skills/`, and lists `ponytail-plan` nowhere.
2. A project created by the worktree build's `rapso init` contains the six skills as real files.
3. `rapso adopt` on an existing project reports the six skills as created or skipped — never
   conflicting — and `rapso update` can refresh them.
4. `canonicalSkillsRoot` still resolves in the pack repository, so `rapso worktree create`
   provisions the six canonical skills into a new worktree.
5. `bash -n rapso-init.sh` and `bash -n scripts/rapso-sync.sh` exit 0.
6. `rapso-sync.sh --dry-run` still plans the six skills against a throwaway consumer.
7. `npm run typecheck` and `npm run build` from `cli/` exit 0.
8. `README.md`'s skill section names only skills the tarball actually ships.
9. No file under `skills/ponytail-plan/` is moved, copied or deleted.

## Checks

Every check runs from the worktree root and records its literal output in Progress. The worktree
build is invoked explicitly — `/home/stefan/.local/bin/rapso` points at `main`'s `cli/dist`.

1. **Tarball** — `npm pack --dry-run` from `cli/` lists the nine skills the template carries.
2. **Init** — `rapso init` via the worktree build into `/tmp`, then list `.opencode/skills/`.
3. **Adopt** — `adopt --dry-run` against the init result reports no conflict for the six.
4. **Provisioning** — `canonicalSkillsRoot` resolves; a worktree created from the pack still gets
   the six.
5. **Shell syntax** — `bash -n` on both scripts exits 0.
6. **Sync plan** — `rapso-sync.sh --dry-run` against a throwaway consumer plans six copies.
7. **Typecheck and build** — both exit 0.
8. **README honesty** — every skill named in the section appears in the tarball listing.

## Progress

- [x] Measured the tarball, the two skill stores, the three readers, and the README claim.
- [x] Confirmed `skills/` is tracked and the repository's own skill symlinks are gitignored.
- [x] **T01** — six `git mv` renames; git reports all six as renames, `skills/ponytail-plan/`
      untouched.
- [x] **T02** — `rapso-session/SKILL.md` chmod 644. All nine template skills are 644 now.
- [x] **T03** — `canonicalSkillsRoot` resolves `cli/src/template/.opencode/skills`; the comment now
      describes why the old location could never reach a generated project.
- [x] **T04** — `rapso-init.sh` links from the template.
- [x] **T05** — `scripts/rapso-sync.sh` copies from the template.
- [x] **T06** — the README section states what the CLI delivers and names the nine skills the
      tarball carries.
- [x] **T07** — the repository's gitignored `.opencode/skills/*` symlinks repointed in this
      worktree with `ln -sfn`; all six resolve.
- [x] **T08** — checks recorded below.
- [ ] **T09** — pending: commit in Atomicity-Gate batches; PR on explicit request only.

### Verification output

Worktree build invoked explicitly — `/home/stefan/.local/bin/rapso` points at `main`'s
`cli/dist`.

1. `npm run typecheck` and `npm run build` from `cli/`
   ```text
   > rapsodia-code@1.0.0 typecheck
   > tsc --noEmit
   > rapsodia-code@1.0.0 build
   > node esbuild.config.js

   (both exit 0)
   ```
2. `npm pack --dry-run` from `cli/` — skill directories:
   ```text
   src/template/.opencode/skills/bootstrap/
   src/template/.opencode/skills/design-system/
   src/template/.opencode/skills/graphify/
   src/template/.opencode/skills/ponytail-audit/
   src/template/.opencode/skills/ponytail-debt/
   src/template/.opencode/skills/ponytail-help/
   src/template/.opencode/skills/ponytail-review/
   src/template/.opencode/skills/rapso-persona/
   src/template/.opencode/skills/rapso-session/
   ```
   `grep -c ponytail-plan` over the same listing → `0`.
3. `bash -n rapso-init.sh` and `bash -n scripts/rapso-sync.sh` → both exit 0.
4. `rapso init init-probe --no-git` via the worktree build, into `/tmp`:
   ```text
   bootstrap  design-system  graphify  ponytail-audit  ponytail-debt
   ponytail-help  ponytail-review  rapso-persona  rapso-session
   ```
   All nine `-printf '%m %y'` → `644 f` — real files, not links.
   (`init` calls `addProject()`, which writes `~/.cortex/config.json`; the file was backed up
   before the run and restored after it.)
5. `adopt --dry-run --yes` against that generated project:
   ```text
   Created (0) · Refreshed (0) · Removed (0) · Leftover (0) · Conflicting (0)
   Injected (3): .gitignore, opencode.json, .opencode/opencode.json
   Seeded (2): .rapsodia-code/sessions/.gitignore, odd/tasks/.gitkeep
   Skipped (20), including all nine .opencode/skills/*/SKILL.md
   ```
   Observed: the skills `init` writes are byte-identical to the template, so `adopt` and `update`
   see them as current rather than conflicting.
6. `scripts/rapso-sync.sh --dry-run` against a throwaway consumer → exactly six planned copies,
   sourced from the new template paths:
   ```text
   skills/rapso-persona/SKILL  skills/rapso-session/SKILL
   skills/ponytail-review/SKILL  skills/ponytail-audit/SKILL
   skills/ponytail-debt/SKILL  skills/ponytail-help/SKILL
   ```
7. `canonicalSkillsRoot` end to end. A throwaway worktree was created from this branch's commit and
   provisioned with the worktree build:
   ```text
   {"provisioned":true,"path":"/tmp/opencode/prov-probe"}
   rapso-persona -> ../../..(/worktree)/cli/src/template/.opencode/skills/rapso-persona   (x6, all resolve)
   ```
   Known limit, stated rather than hidden: the probe worktree was checked out from `60552a0`, which
   does not carry this branch's uncommitted changes, so the resolution came through the `main`
   fallback — the root that does carry them. The `target`-first branch is exercised only after
   merge, when a new worktree lands on a `main` that contains the template skills. The probe
   worktree and its temporary branch were removed afterwards.

## Next step

Commit T01–T08 in Atomicity-Gate batches, then open the PR on request.

## Rationale log

- **One store, not two with a guard.** A copy plus a drift check is the arrangement that produced
  the sync's stale-skill defect. One store removes the failure mode instead of detecting it.
- **The template is the surviving store because it is the one the package ships.** Keeping `skills/`
  as truth would mean teaching the package to reach outside its own `files` list.
- **`ponytail-plan` stays out, and that is a feature.** `OWNED_PATHS` is `.opencode/skills/**`, so
  anything in the template is distributed. Excluding it is only possible by not putting it there.
- **The README is fixed last, by consequence.** The honest sentence is whatever the tarball makes
  true, so it is written after the tarball changes, not instead of them.
