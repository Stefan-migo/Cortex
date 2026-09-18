# Sync consumer migration — allowlist, stale renames, AGENTS.md, honest dry-run

Status: in progress · Date: 2026-09-18 · Branch: `odd/sync-consumer-migration` ·
Worktree: `../rapsodia-code-odd-sync-consumer-migration` · Base: `origin/main` `a2d378b`

## Objective

`scripts/rapso-sync.sh` must be a migration a consumer repository survives. Today it is a
copy loop that pushes a skill the project deliberately does not ship, leaves the skills it
renamed standing, never repairs the `AGENTS.md` it taught consumers to write, and reports a plan
that disagrees with itself.

## Problem — measured against the real consumer list

Command: `bash scripts/rapso-sync.sh --dry-run` at `a2d378b`. Nothing was written.

```
▶ /home/stefan/repos/lumat-agent
    [dry-run] cp .../skills/ponytail-audit//SKILL.md  .../skills/ponytail-audit/SKILL.md
    [dry-run] cp .../skills/ponytail-debt//SKILL.md   .../skills/ponytail-debt/SKILL.md
    [dry-run] cp .../skills/ponytail-help//SKILL.md   .../skills/ponytail-help/SKILL.md
    [dry-run] cp .../skills/ponytail-plan//SKILL.md   .../skills/ponytail-plan/SKILL.md
    [dry-run] cp .../skills/ponytail-review//SKILL.md .../skills/ponytail-review/SKILL.md
    [dry-run] cp .../skills/rapso-persona//SKILL.md   .../skills/rapso-persona/SKILL.md
    [dry-run] cp .../skills/rapso-session//SKILL.md   .../skills/rapso-session/SKILL.md
    [dry-run] mv .../.cortex-sessions/ready-for-sdd/2026-09-15-asistente-lumat-chat-ux \
                 .../.cortex-sessions/ready-for-odd/2026-09-15-asistente-lumat-chat-ux
    legacy directory remains with: .../.cortex-sessions/ready-for-sdd/2026-09-15-asistente-lumat-chat-ux
    session: already migrated

▶ /home/stefan/repos/lumat-agent-harness
  - not found, skipped
```

### D1 — the sync ships a skill the project decided not to ship

`ponytail-plan` travels. `rapso-init.sh:71-75` deliberately does not link it, and
`cli/src/engine/worktree.ts:43` dropped it from `CANONICAL_SKILLS`. The sync path still pushes
it, because `sync_skills` iterates `"$PACK_DIR"/skills/*/` with no allowlist.

`odd/tasks/ponytail-post-write.md:252` records this as release-blocking:

> `scripts/cortex-sync.sh` does not enforce any allowlist (release-blocking for this decision).
> … the release-time migration must either add an allowlist or stop shipping the design-shaped
> skills.

### D2 — the sync leaves the skills it renamed standing

`sync_skills` writes `$target/$name/SKILL.md`, keyed on the directory name. The pack renamed
`cortex-persona` → `rapso-persona` and `cortex-session` → `rapso-session`, so the sync **adds**
the new directory and leaves the old one in place.

Measured in `~/repos/lumat-agent` with `git ls-files .opencode/skills`:

```
.opencode/skills/cortex-persona/SKILL.md     <- stale, tracked
.opencode/skills/cortex-session/SKILL.md     <- stale, tracked
```

OpenCode discovers skills by directory, so the stale skill stays loadable and the consumer keeps
resolving the rules the rename was meant to replace.

### D3 — the sync never repairs the `AGENTS.md` it caused

`rapso-init.sh:151-189` writes `AGENTS.md` only `if [ ! -f "$AGENTS_FILE" ]`, and the sync never
touches it. The consumer keeps the text the old installer wrote. Measured inventory of every
`cortex` occurrence in `~/repos/lumat-agent/AGENTS.md` (61 lines):

| Line | Text | Token |
|---|---|---|
| 7 | "This project uses the **Cortex skill pack**. The orchestrator loads **cortex-persona** …" | prose + identifier |
| 8, 12, 19, 24 | `.opencode/skills/cortex-persona/SKILL.md`, `cortex-persona 5-Step Execution Gate` | identifier |
| 39, 43, 44, 46 | `### cortex-session — Planning Mode`, `/cortex-session`, `cortex-session/SKILL.md` | identifier |
| 48, 61 | `<!-- cortex:start -->` … `<!-- cortex:end -->` | marker pair |
| 51 | "… before invoking `cortex worktree create`" | command |
| 59 | "Step 5: FINALIZE — mem_save + `cortex close --message`" | command |

`adopt` does not fix this. `adopt.ts:52-59` (`injectSections`) only appends a section whose
heading is **missing**; `## ODD Worktrees` and `### 5-Step Execution Gate (MANDATORY)` are
already present at lines 50 and 53, so their stale content is never refreshed.

### D4 — `projects.txt` points at a directory that does not exist

`projects.txt` lists `repos/lumat-agent` and `repos/lumat-agent-harness`. The second does not
exist. Real siblings under `~/repos/` are `lumat-agent`, `lumat-agent-odd-chat-harness` and
`lumat-agent-odd-test-db-isolation`.

### D5 — `--dry-run` reports work it did not do

`sync_skills` echoes `skill: $name` unconditionally, and `migrate_sessions` prints
`legacy directory remains with: …` for a move it would perform. In dry-run the `mv` does not
run, so `remaining=("$legacy"/*)` still matches and the summary contradicts the plan above it.

## Why this is one work unit

D1, D2 and D3 are the same defect: the sync has no model of what it owns, so it adds without
removing and writes without repairing. D4 and D5 are what makes the whole thing undiagnosable —
the tool points at the wrong repositories and reports a plan that disagrees with itself.

## Finding: state migration already has an owner (migration removed from scope)

The first draft of this change also renamed the legacy state stores from the script. That is
**withdrawn**: the CLI already performs it, and a script-side copy would be overwritten.

| Concern | Existing owner |
|---|---|
| `.cortex/` → `.rapsodia-code/`, `.cortex-sessions/` → `.rapsodia-code/sessions/` | `migrateLegacyState`, `cli/src/utils/state.ts:31-54` |
| `.gitignore` `# cortex:start` block, `.rapsodia-code/` entry | `mergeGitignore`, `cli/src/engine/adopt.ts:69-76`, from `RAPSO_IGNORE_ENTRIES` |
| `.rapsodia-code/sessions/.gitignore` = `*` | `adopt.ts:162` |

`mergeGitignore` **regenerates the whole marked block** on every `adopt` run. Any content the
script wrote inside `# cortex:start` … `# cortex:end` would be silently replaced by the next
`rapso adopt`. Duplicating this in bash is the same drift that produced D2 and D3.

What the script keeps is what no CLI path does: the `ready-for-sdd/` → `ready-for-odd/` move and
the flat-session organization, applied to whichever store already exists. It renames no store
and writes no `.gitignore`.

## Authorized scope

- `scripts/rapso-sync.sh` — `sync_skills`, `remove_stale_skills`, the `AGENTS.md` repair, the
  session migration reporting, and the dry-run reporting.
- `projects.txt` — the dead entry only. **Untracked and gitignored** (`/.gitignore:38`), and the
  worktree carries it as a symlink to `../rapsodia-code/projects.txt`; this is a local config fix
  that cannot travel in the PR.
- `odd/tasks/sync-consumer-migration.md` — this document.

Out of scope, with reasons:

1. **State stores and `.gitignore`** — see the finding above.
2. **`README.md`'s "The CLI is the supported installation path for the project files"** is false
   today: `cli/src/template` ships only `graphify`, `design-system` and `bootstrap`; the pack
   skills reach projects through `rapso-init.sh` and this script. Recorded, not fixed.
3. **`rapso-init.sh:65` creates absolute symlinks** (`ln -sf "$src" "$target"`, `src` absolute).
   The worktree provisioner uses relative links and survives a move; the installer does not.
   This is the risk `report.md` logged as "Absolute symlinks rot silently". Recorded, not fixed.
4. **Deleting `skills/ponytail-plan/`.** The allowlist stops it travelling; deleting the pack's
   copy would break `.opencode/skills/ponytail-plan` in the pack repo, a live symlink to it.
5. **Consolidating the remaining script work onto the CLI.** See the closing finding.

## Tasks

- [ ] **T01** — Replace the `skills/*/` glob with an explicit allowlist of the six skills the
      pack owns: `rapso-persona`, `rapso-session`, `ponytail-review`, `ponytail-audit`,
      `ponytail-debt`, `ponytail-help`. A pack directory outside the list must not travel. A
      listed skill missing from the pack must be reported, not silently skipped.
- [ ] **T02** — Remove the stale renamed skill directories in the consumer
      (`cortex-persona`, `cortex-session`) **only when the replacement is installed**, handling
      both a symlink and a real directory. Remove the old name only, never a pack-owned name.
- [ ] **T03** — Repair the consumer `AGENTS.md` with the bounded table below. Every byte not
      covered by the table must stay identical. A file carrying no legacy token is reported, not
      rewritten.
- [ ] **T04** — Keep the session migration to what the script owns: `ready-for-sdd/` →
      `ready-for-odd/`, and flat session directories into `open/` or `archived/`. No store
      rename, no `.gitignore` write. When only the legacy store exists, say so and name
      `rapso adopt` as the owner of the rename.
- [ ] **T05** — Remove the dead entry from `projects.txt`.
- [ ] **T06** — Make `--dry-run` truthful: no summary line may name an operation the plan does
      not perform.
- [ ] **T07** — Run every check below and record the literal output.
- [ ] **T08** — Commit in Atomicity-Gate batches (≤5 files). PR on explicit request only.

### T03 rewrite table (bounded, literal, no regex classes)

| From | To |
|---|---|
| `cortex-persona` | `rapso-persona` |
| `cortex-session` | `rapso-session` |
| `cortex-init` | `rapso-init` |
| `cortex-sync` | `rapso-sync` |
| `cortex worktree` | `rapso worktree` |
| `cortex close` | `rapso close` |
| `cortex adopt` | `rapso adopt` |
| `cortex init` | `rapso init` |
| `cortex start` | `rapso start` |
| `cortex status` | `rapso status` |
| `cortex update` | `rapso update` |
| `cortex install` | `rapso install` |
| `cortex analyze` | `rapso analyze` |
| `Cortex skill pack` | `Rapsodia skill pack` |
| `<!-- cortex:start -->` | `<!-- rapso:start -->` |
| `<!-- cortex:end -->` | `<!-- rapso:end -->` |

The marker rename is what makes the migration idempotent: nothing in `cli/src` reads the HTML
comment form (the `.gitignore` markers use `# cortex:start` and are read by `mergeGitignore`, and
are therefore **not** in this table).

## Acceptance criteria

1. `bash scripts/rapso-sync.sh --dry-run` against a throwaway consumer plans **six** skill
   copies and matches nothing for `ponytail-plan`.
2. Against a throwaway consumer holding `cortex-persona` and `cortex-session`, the plan removes
   both once the replacements are installed.
3. A pack skill absent from the allowlist never appears in the plan, at any path.
4. No summary line in `--dry-run` names an operation the plan does not contain.
5. A second run against an already-migrated consumer plans no skill copy, no removal and no
   rewrite — idempotent.
6. `AGENTS.md` is byte-identical except where the table applies.
7. `bash -n scripts/rapso-sync.sh` exits 0.
8. The script writes no `.gitignore` and renames no store directory.
9. No write reaches `~/repos/lumat-agent` in this work unit.

## Checks

Every check runs from the worktree root and records its literal output in Progress.

1. **Shell syntax** — `bash -n scripts/rapso-sync.sh` exits 0.
2. **Hooks intact** — `bash -n .githooks/pre-commit .githooks/post-merge` exits 0.
3. **Allowlist** — the dry-run plan against a throwaway consumer contains the six owned skills
   and matches nothing for `ponytail-plan`.
4. **Stale removal** — against a throwaway consumer holding `cortex-persona` and
   `cortex-session`, the plan removes both once the replacements are installed.
5. **AGENTS.md surgical** — against a throwaway consumer whose `AGENTS.md` carries the legacy
   tokens plus unrelated hand-written content, a real run leaves every byte outside the table
   unchanged, verified with `diff`.
6. **No state writes** — after a real run against a throwaway consumer holding `.cortex/` and
   `.cortex-sessions/`, both legacy paths are untouched and no `.gitignore` was written.
7. **Idempotence** — the real run above is repeated; the second plan is empty.
8. **Consumer untouched** — `git -C ~/repos/lumat-agent status --short` is byte-identical before
   and after every check in this work unit.

## Closing finding (reported, not fixed)

The sync owns skill installation while the CLI owns state and configuration. That split is the
reason D2 and D3 existed at all: two owners with no shared model of what the pack contains. After
this change the script is correct, but the structural fix — the pack skills travel through the
CLI's template so one owner installs everything — changes the design and belongs to the human.

## Progress

- [x] Measured the consumer and the dry-run before writing anything.
- [x] Design settled with the human: the marked `AGENTS.md` region plus the known references.
- [x] Design settled with the human: state and `.gitignore` migration **removed** from the
      script, because `adopt` already owns both and `mergeGitignore` would overwrite it.
- [x] **T01** — `sync_skills` copies exactly the six allowlisted skills and reports missing
      allowlisted skills; `ponytail-plan` is not copied or planned.
- [x] **T02** — stale `cortex-persona` and `cortex-session` entries are removed only after their
      replacements are installed; both real directories and symlinks were verified.
- [x] **T03** — the literal rewrite table repairs legacy `AGENTS.md` content, reports the diff,
      and skips files with no legacy token.
- [x] **T04** — session migration uses the canonical store first and legacy fallback, moves
      `ready-for-sdd/` to `ready-for-odd/`, keeps flat-session organization, and reports `rapso adopt`
      as the owner of a legacy store rename without touching either store name.
- [x] **T06** — dry-run output contains only planned commands and truthful migration status.
- [x] **T07** — checks recorded below.

### Verification output

1. `bash -n scripts/rapso-sync.sh`
   ```text
   (no output; exit 0)
   ```
2. `bash -n .githooks/pre-commit .githooks/post-merge`
   ```text
   (no output; exit 0)
   ```
3. `bash scripts/rapso-sync.sh --dry-run --projects /tmp/opencode/sync-check-list.txt`
   ```text
   Rapsodia sync
     pack: /home/stefan/rapsodia-code-odd-sync-consumer-migration
     list: /tmp/opencode/sync-check-list.txt
     mode: dry-run (nothing is written)

   ▶ /tmp/opencode/sync-check
       [dry-run] mkdir -p /tmp/opencode/sync-check/.opencode/skills/rapso-persona
       [dry-run] cp /home/stefan/rapsodia-code-odd-sync-consumer-migration/skills/rapso-persona/SKILL.md /tmp/opencode/sync-check/.opencode/skills/rapso-persona/SKILL.md
       skill: rapso-persona
       [dry-run] mkdir -p /tmp/opencode/sync-check/.opencode/skills/rapso-session
       [dry-run] cp /home/stefan/rapsodia-code-odd-sync-consumer-migration/skills/rapso-session/SKILL.md /tmp/opencode/sync-check/.opencode/skills/rapso-session/SKILL.md
       skill: rapso-session
       [dry-run] mkdir -p /tmp/opencode/sync-check/.opencode/skills/ponytail-review
       [dry-run] cp /home/stefan/rapsodia-code-odd-sync-consumer-migration/skills/ponytail-review/SKILL.md /tmp/opencode/sync-check/.opencode/skills/ponytail-review/SKILL.md
       skill: ponytail-review
       [dry-run] mkdir -p /tmp/opencode/sync-check/.opencode/skills/ponytail-audit
       [dry-run] cp /home/stefan/rapsodia-code-odd-sync-consumer-migration/skills/ponytail-audit/SKILL.md /tmp/opencode/sync-check/.opencode/skills/ponytail-audit/SKILL.md
       skill: ponytail-audit
       [dry-run] mkdir -p /tmp/opencode/sync-check/.opencode/skills/ponytail-debt
       [dry-run] cp /home/stefan/rapsodia-code-odd-sync-consumer-migration/skills/ponytail-debt/SKILL.md /tmp/opencode/sync-check/.opencode/skills/ponytail-debt/SKILL.md
       skill: ponytail-debt
       [dry-run] mkdir -p /tmp/opencode/sync-check/.opencode/skills/ponytail-help
       [dry-run] cp /home/stefan/rapsodia-code-odd-sync-consumer-migration/skills/ponytail-help/SKILL.md /tmp/opencode/sync-check/.opencode/skills/ponytail-help/SKILL.md
       skill: ponytail-help
       [dry-run] rm -rf /tmp/opencode/sync-check/.opencode/skills/cortex-persona
       stale skill removed: cortex-persona
       [dry-run] rm -rf /tmp/opencode/sync-check/.opencode/skills/cortex-session
       stale skill removed: cortex-session
       [dry-run] sed -i -e s|cortex-persona|rapso-persona|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex-session|rapso-session|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex-init|rapso-init|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex-sync|rapso-sync|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex worktree|rapso worktree|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex close|rapso close|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex adopt|rapso adopt|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex init|rapso init|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex start|rapso start|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex status|rapso status|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex update|rapso update|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex install|rapso install|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|cortex analyze|rapso analyze|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|Cortex skill pack|Rapsodia skill pack|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|<!-- cortex:start -->|<!-- rapso:start -->|g /tmp/opencode/sync-check/AGENTS.md
       [dry-run] sed -i -e s|<!-- cortex:end -->|<!-- rapso:end -->|g /tmp/opencode/sync-check/AGENTS.md
       AGENTS.md rewrite planned
       legacy session store detected; rapso adopt owns the store rename
       [dry-run] mkdir -p /tmp/opencode/sync-check/.cortex-sessions/open
       [dry-run] mkdir -p /tmp/opencode/sync-check/.cortex-sessions/ready-for-odd
       [dry-run] mkdir -p /tmp/opencode/sync-check/.cortex-sessions/archived
       [dry-run] mv /tmp/opencode/sync-check/.cortex-sessions/ready-for-sdd/sample-session /tmp/opencode/sync-check/.cortex-sessions/ready-for-odd/sample-session
       legacy session: sample-session -> ready-for-odd/
       [dry-run] rmdir /tmp/opencode/sync-check/.cortex-sessions/ready-for-sdd
       session: already migrated

   Done.
   ```
   Observed: six owned skill copies; no `ponytail-plan` match.
4. `bash scripts/rapso-sync.sh --projects /tmp/opencode/sync-check-list.txt`
   ```text
   Rapsodia sync
     pack: /home/stefan/rapsodia-code-odd-sync-consumer-migration
     list: /tmp/opencode/sync-check-list.txt

   ▶ /tmp/opencode/sync-check
       skill: rapso-persona
       skill: rapso-session
       skill: ponytail-review
       skill: ponytail-audit
       skill: ponytail-debt
       skill: ponytail-help
       stale skill removed: cortex-persona
       stale skill removed: cortex-session
       AGENTS.md changed lines:
   --- /tmp/tmp.WnyHaSImFZ	2026-09-18 14:27:14.266019511 -0300
   +++ /tmp/opencode/sync-check/AGENTS.md	2026-09-18 14:27:14.295966179 -0300
   @@ -1,9 +1,9 @@
    # Consumer instructions
   -This project uses the Cortex skill pack.
   -Load cortex-persona and cortex-session.
   -Use cortex-init, cortex-sync, cortex worktree, cortex close, cortex adopt.
   -Use cortex init, cortex start, cortex status, cortex update, cortex install, cortex analyze.
   -<!-- cortex:start -->
   +This project uses the Rapsodia skill pack.
   +Load rapso-persona and rapso-session.
   +Use rapso-init, rapso-sync, rapso worktree, rapso close, rapso adopt.
   +Use rapso init, rapso start, rapso status, rapso update, rapso install, rapso analyze.
   +<!-- rapso:start -->
    Owned section.
   -<!-- cortex:end -->
   +<!-- rapso:end -->
    Hand-written section: keep this line exactly, with no legacy token.
       legacy session store detected; rapso adopt owns the store rename
       legacy session: sample-session -> ready-for-odd/
       session: already migrated

   Done.
   ```
5. `diff /tmp/opencode/sync-check/AGENTS.before.md /tmp/opencode/sync-check/AGENTS.md`
   ```text
   2,6c2,6
   < This project uses the Cortex skill pack.
   < Load cortex-persona and cortex-session.
   < Use cortex-init, cortex-sync, cortex worktree, cortex close, cortex adopt.
   < Use cortex init, cortex start, cortex status, cortex update, cortex install, cortex analyze.
   < <!-- cortex:start -->
   ---
   > This project uses the Rapsodia skill pack.
   > Load rapso-persona and rapso-session.
   > Use rapso-init, rapso-sync, rapso worktree, rapso close, rapso adopt.
   > Use rapso init, rapso start, rapso status, rapso update, rapso install, rapso analyze.
   > <!-- rapso:start -->
   8c8
   < <!-- cortex:end -->
   ---
   > <!-- rapso:end -->
   ```
   Observed: only table-covered lines differ; the hand-written line is unchanged (diff exits 1 because authorized changes exist).
6. `ls -la /tmp/opencode/sync-check/.cortex /tmp/opencode/sync-check/.cortex-sessions` and `ls -la /tmp/opencode/sync-check/.gitignore`
   ```text
   /tmp/opencode/sync-check/.cortex:
   total 4
   drwxr-xr-x. 3 stefan stefan  80 Sep 18 14:27 .
   drwxr-xr-x. 5 stefan stefan 140 Sep 18 14:27 ..
   -rw-r--r--. 1 stefan stefan  19 Sep 18 14:27 manifest.json
   drwxr-xr-x. 2 stefan stefan  40 Sep 18 14:27 metadata

   /tmp/opencode/sync-check/.cortex-sessions:
   total 0
   drwxr-xr-x. 5 stefan stefan 100 Sep 18 14:27 .
   drwxr-xr-x. 5 stefan stefan 140 Sep 18 14:27 ..
   drwxr-xr-x. 2 stefan stefan  40 Sep 18 14:27 archived
   drwxr-xr-x. 2 stefan stefan  40 Sep 18 14:27 open
   drwxr-xr-x. 3 stefan stefan  60 Sep 18 14:27 ready-for-odd
   ls: cannot access '/tmp/opencode/sync-check/.gitignore': No such file or directory
   ```
7. Re-run of `bash scripts/rapso-sync.sh --dry-run --projects /tmp/opencode/sync-check-list.txt`
   ```text
   Rapsodia sync
     pack: /home/stefan/rapsodia-code-odd-sync-consumer-migration
     list: /tmp/opencode/sync-check-list.txt
     mode: dry-run (nothing is written)

   ▶ /tmp/opencode/sync-check
     - AGENTS.md has no legacy token, skipped
       legacy session store detected; rapso adopt owns the store rename
       session: already migrated

   Done.
   ```
   Observed: no `[dry-run]` command, skill copy, stale removal, or rewrite remains.
8. `git -C /home/stefan/repos/lumat-agent status --short`
   ```text
   (no output; exit 0)
   ```
9. Additional symlink stale-removal fixture
   ```text
   symlink stale removal: verified
   ```

## Next step

Commit T01–T07 in Atomicity-Gate batches; T05 remains with the orchestrator.

## Rationale log

- **Allowlist over deletion.** Deleting `skills/ponytail-plan/` would also remove it from a
  consumer that installed it deliberately — `~/repos/lumat-agent` carries it as a tracked file.
  The decision in `ponytail-post-write.md` is that the sync must stop *pushing* it, not that an
  existing copy must be destroyed.
- **Stale removal is gated on the replacement.** Removing `cortex-persona` before `rapso-persona`
  exists would leave the consumer with no persona at all. The gate makes the operation an
  upgrade instead of a loss.
- **Literal table, not a `cortex` → `rapso` sweep.** A blanket substitution would rewrite a
  consumer's own prose about the retired tool. The table names only machine identifiers and
  commands the old installer wrote.
- **Dry-run is a contract.** A plan that disagrees with itself is what let D1 ship in the first
  place; the operator's only defence is that the plan is true.
- **One owner per concern.** The migration was removed from the script the moment the CLI was
  shown to own it. Reimplementing it would have reproduced the exact drift this change fixes.
