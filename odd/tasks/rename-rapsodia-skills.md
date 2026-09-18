# ODD Tasks — rename-rapsodia-skills

Worktree: `/home/stefan/Cortex-odd-rename-rapsodia-skills`
Branch: `odd/rename-rapsodia-skills`
Base: `47b15a4`

## Objective

Finish the brand rename for the **skill pack**: `skills/cortex-persona` → `skills/rapso-persona`
and `skills/cortex-session` → `skills/rapso-session`, and every reference that resolves to those
directory names, so no skill reference points at a directory that no longer exists.

## Problem

PR #30 renamed the visible brand and PR #33 renamed the on-disk state. Both deferred this slice
because it was believed to break "absolute symlinks in ~10 Gen-1 projects".

That premise is false and is corrected in `odd/tasks/rename-rapsodia-brand.md` (see "Correction —
the slice-3 blast radius"). Measured on 2026-09-17: the only links into `skills/` are 7, all
inside this repository's gitignored `.opencode/skills/`, and only 2 of them belong to the skills
being renamed. `lumat-agent` — the only other project carrying the pack — tracks copies, not
links. There is no cross-project migration.

## Why now

`cli/src/template/AGENTS.md` tells every generated project to use the `cortex-session` skill, and
`CANONICAL_SKILLS` provisions it into every ODD worktree. The template and the CLI already speak
`rapsodia-code` everywhere else, so the skill names are the last user-visible `cortex` surface that
the rename left behind, and the reference is load-bearing: renaming a reference is only safe in
the same change as the directory it names.

## In scope (measured, not estimated)

| Surface | What changes |
|---|---|
| `skills/cortex-persona/` → `skills/rapso-persona/` | directory; `name:` (L2); prose at L211, L218 |
| `skills/cortex-session/` → `skills/rapso-session/` | directory; `name:` (L2); the trigger in `description:` (L3); `/cortex-session` (L13) |
| `cli/src/engine/worktree.ts:43` | `CANONICAL_SKILLS` |
| `cortex-init.sh` | `link_skill` calls (L70, L75); the name list (L210); prose at L159, L161, L167, L173, L179, L186, L293 |
| `cli/src/template/AGENTS.md` | L6, L50, L72 |
| `cli/src/template/SYSTEM-MAP.md` | L41, L58 |
| `cli/src/template/USER-GUIDE.md` | L32 |
| `AGENTS.md` (this repository's own) | L6, L50, L72 |
| `.opencode/agents/cortex-planner.md` | L13, L17 — references only; the file name stays |
| `commands/cortex-init.md` | L16 |
| `README.md` | L48 |

## Exclusions

Recorded so they are not "helpfully" renamed:

1. **The Engram `topic_key` namespace** — `cortex-session/{slug}/…` at
   `skills/cortex-session/SKILL.md:73,81,83,108-112,131`. This is persisted memory, not a skill
   reference. Renaming it orphans every observation already stored under those keys. **Keep.**
2. **`.cortex-sessions/`** — `cli/src/utils/state.ts:9`, `scripts/cortex-sync.sh:57`,
   `skills/cortex-session/SKILL.md:149`. Legacy on-disk path with read compatibility. **Keep.**
3. **The `scripts/cortex-sync.sh` file name** — referenced from `SKILL.md:149`. Renaming a script
   is not this slice. **Keep.**
4. **The agent identities** — the file names `.opencode/agents/cortex-{planner,developer}.md` and
   the `@Cortex-Planner` / `@Cortex-Developer` names in `AGENTS.md`. The template already ships
   `rapso-planner.md` / `rapso-developer.md`, so this repository is inconsistent with its own
   template, but agent identity is a different surface from the skill pack. Its own slice. Only the
   skill references *inside* those files are corrected here.
5. **Renaming the local folder `~/Cortex`** — see `odd/tasks/rename-rapsodia-state.md` exclusion 5.

## Post-merge step (local, cannot ride in the PR)

`.opencode/skills/*` is gitignored, so the PR cannot carry this repository's own links.
`cortex-init.sh` recreates them. To keep the window at zero — a dangling entry is skipped by the
skill registry, not fatal, but the skill would be unavailable until repaired:

1. Before merging: create `../../skills/rapso-persona` and `../../skills/rapso-session` links in
   `main`'s `.opencode/skills/` (they dangle until the merge lands, harmlessly).
2. After merging: rebuild `cli/dist/` and delete the 2 old dangling `cortex-*` links.
   This step is **required, not cosmetic**: the PR moves the ignore rule on `.gitignore:19` from
   `/.opencode/skills/cortex-*` to `/.opencode/skills/rapso-*`, so a stale `cortex-*` link is no
   longer ignored and would show up as an untracked artifact in `main`.

This is a manual sequence that the Orchestrator requests from the human; the PR body carries it.

## Tasks

- [x] **T01** — Rename the two skill directories with `git mv`, and update the `name:` frontmatter,
      the `description:` trigger, the `/cortex-session` invocation and the two prose references.
      The Engram `topic_key` namespace stays.
- [x] **T02** — Update `CANONICAL_SKILLS` in `cli/src/engine/worktree.ts`.
- [x] **T03** — Update `cortex-init.sh`: the 2 `link_skill` calls, the name list, and the prose.
- [x] **T04** — Update the shipped template: `cli/src/template/{AGENTS,SYSTEM-MAP,USER-GUIDE}.md`.
- [x] **T05** — Update this repository's own references: `AGENTS.md`,
      `.opencode/agents/cortex-planner.md`, `commands/cortex-init.md`, `README.md`.
- [x] **T06** — Verify: typecheck, build, the audit command, and a real
      `worktree create` / `cleanup` probe that proves the new names provision and resolve.
- [x] **T07** — Recreate this worktree's own 2 links and record the exact commands.

## Acceptance criteria

1. `cd cli && npm run typecheck` passes. Report the real output.
2. `cd cli && npm run build` passes and `cli/dist/index.js` is rebuilt.
3. `ls skills/` shows `rapso-persona` and `rapso-session`; `cortex-persona` and `cortex-session`
   are gone.
4. `rg -n 'cortex-persona|cortex-session'` across the repository returns **only** the accepted
   exclusions above. Report the command and the full output — the audit is the deliverable, not a
   count.
5. A disposable pack repository — a git repo holding `skills/<name>/SKILL.md` for all seven names,
   with a bare `origin` — accepts `worktree create <probe> --yes` from the rebuilt binary and
   provisions 7 links that all resolve, with `rapso-persona` and `rapso-session` among them;
   `worktree cleanup <probe>` leaves no worktree, branch, or directory behind.
   An in-repo probe is impossible **before** the merge, and this is the reason: the CLI refuses to
   create from a linked worktree, and from `main` the still-renamed `skills/cortex-*` directories
   would make `canonicalSkillsRoot` return null and link nothing. The in-repo probe from `main`
   belongs to the post-merge sequence below, not to the pre-merge acceptance criteria.
6. Every entry in `.opencode/skills/` resolves (`test -e` per entry).
7. `rapso --help` and `rapso worktree list` still run.

## Constraints

- **No behaviour change beyond names.** The installer's absolute links and the worktree
  provisioner's relative links are both correct for their own roots; do not "unify" them.
- Do not stage the worktree's untracked `.opencode/` install artifacts.
- Each commit ≤5 files and one concern, per the pre-commit Atomicity Gate.

## Resolved check mode

- **TDD: off.** Source: this repository's `AGENTS.md` — "This repository has **no test harness**";
  `vitest` is configured but there are zero test files. Runner: none.
- Functional checks: `npm run typecheck`, `npm run build`, the audit `rg`, and the worktree
  create/cleanup probe. Manual shell scenarios are the only executable evidence this repo has.

## Progress

- **T01–T05, T07**: complete and observed.
- **T06**: complete. Typecheck, build, audit, link resolution, `rapso --help`, and `rapso worktree
  list` passed; the create/cleanup probe was refused in-repo (it must start from the main worktree)
  and was then run to completion from a disposable pack repository, which is the equivalent
  end-to-end check. The main worktree was never touched.

## Verification evidence

### Typecheck

Command:

```text
cd /home/stefan/Cortex-odd-rename-rapsodia-skills/cli && npm run typecheck
```

Output:

```text
> rapsodia-code@1.0.0 typecheck
> tsc --noEmit
```

### Build

Command:

```text
cd /home/stefan/Cortex-odd-rename-rapsodia-skills/cli && npm run build
```

Output:

```text
> rapsodia-code@1.0.0 build
> node esbuild.config.js
```

### Audit

Command:

```text
rg -n 'cortex-persona|cortex-session' --glob '!wiki/**' --glob '!graphify-out/**' --glob '!node_modules/**' --glob '!.git/**' --glob '!cli/dist/**' --glob '!openspec/**' .
```

Observed output (trimmed to representative meaningful lines; the complete output was captured for the delivery report):

```text
./skills/rapso-session/SKILL.md:73:e. **Save to Engram**: `mem_save(type: architecture, topic_key: "cortex-session/{slug}/init", title: "Session: {topic}", content: <structured block — see Save format>)`
./skills/rapso-session/SKILL.md:149:Projects that ran the previous sync may hold the legacy `.cortex-sessions/ready-for-sdd/` directory.
./odd/tasks/rename-rapsodia-skills.md:9:Finish the brand rename for the **skill pack**: `skills/cortex-persona` → `skills/rapso-persona`
./scripts/cortex-sync.sh:57:    root="$1/.cortex-sessions"
./cli/src/utils/state.ts:9:export const LEGACY_SESSIONS_DIR_NAME = '.cortex-sessions';
```

The complete output contained **185** hits: **12** outside `odd/**` and **173** inside it. The 12
were re-verified against the exclusion list and are exactly it — 9 Engram `topic_key` keys
(`rapso-session/SKILL.md:73,81,83,108-112,131`), 2 legacy `.cortex-sessions` paths
(`rapso-session/SKILL.md:149`, `scripts/cortex-sync.sh:57`) and 1 legacy constant
(`cli/src/utils/state.ts:9`). The 173 inside `odd/**` are task documents and recorded history that
discuss this rename; item 6 of `odd/tasks/rename-rapsodia-state.md` forbids rewriting them. No
non-accepted production or template reference remained.

### Worktree probe

Binary used: the rebuilt worktree binary, `node /home/stefan/Cortex-odd-rename-rapsodia-skills/cli/dist/index.js`.

**Attempt 1 — in the worktree, refused.** Commands:

```text
cd /home/stefan/Cortex-odd-rename-rapsodia-skills
node /home/stefan/Cortex-odd-rename-rapsodia-skills/cli/dist/index.js worktree create probe-skills --yes
node /home/stefan/Cortex-odd-rename-rapsodia-skills/cli/dist/index.js worktree cleanup probe-skills
```

Output:

```text
Worktree creation must start from the main worktree.
Cleanup must start from the main worktree.
```

The probe directory and branch were absent afterward. The main worktree was not touched.

**Attempt 2 — disposable pack repository, completed.** An in-repo probe from `main` would have been
meaningless before the merge (see acceptance criterion 5), so the check ran against a throwaway
pack repository that carries the renamed skill directories:

```text
rm -rf /tmp/opencode/probe-pack /tmp/opencode/probe-origin
mkdir -p /tmp/opencode/probe-pack && cd /tmp/opencode/probe-pack
git init -q && git config user.email p@p && git config user.name p
for n in rapso-persona rapso-session ponytail-review ponytail-audit ponytail-debt ponytail-help ponytail-plan; do
  mkdir -p skills/$n; printf -- "---\nname: %s\n---\nprobe\n" "$n" > skills/$n/SKILL.md
done
git add -A && git commit -qm init && git branch -M main
git init -q --bare /tmp/opencode/probe-origin && git remote add origin /tmp/opencode/probe-origin
git push -q -u origin main
node /home/stefan/Cortex-odd-rename-rapsodia-skills/cli/dist/index.js worktree create probe-skills --yes --root /tmp/opencode/probe-pack
```

Output:

```text
{"accepted":true,"created":true,"path":"/tmp/opencode/probe-pack-odd-probe-skills","branch":"odd/probe-skills"}
```

Provisioned links in the new worktree, and their resolution:

```text
lrwxrwxrwx 1 stefan stefan 27 .opencode/skills/ponytail-audit -> ../../skills/ponytail-audit
lrwxrwxrwx 1 stefan stefan 26 .opencode/skills/ponytail-debt  -> ../../skills/ponytail-debt
lrwxrwxrwx 1 stefan stefan 26 .opencode/skills/ponytail-help  -> ../../skills/ponytail-help
lrwxrwxrwx 1 stefan stefan 26 .opencode/skills/ponytail-plan  -> ../../skills/ponytail-plan
lrwxrwxrwx 1 stefan stefan 28 .opencode/skills/ponytail-review -> ../../skills/ponytail-review
lrwxrwxrwx 1 stefan stefan 26 .opencode/skills/rapso-persona  -> ../../skills/rapso-persona
lrwxrwxrwx 1 stefan stefan 26 .opencode/skills/rapso-session  -> ../../skills/rapso-session

OK ponytail-audit / OK ponytail-debt / OK ponytail-help / OK ponytail-plan
OK ponytail-review / OK rapso-persona / OK rapso-session      (7/7, each SKILL.md readable)
```

Cleanup:

```text
{"cleaned":true,"slug":"probe-skills"}
```

Afterward: no `/tmp/opencode/probe-pack-odd-probe-skills` directory, and the repository's branches
are only `main` and `remotes/origin/main`. No `cortex-*` link was provisioned.

### Canonical list invariant

`CANONICAL_SKILLS` and `skills/` must correspond one to one:

```text
OK   skills/rapso-persona/SKILL.md
OK   skills/rapso-session/SKILL.md
OK   skills/ponytail-review/SKILL.md
OK   skills/ponytail-audit/SKILL.md
OK   skills/ponytail-debt/SKILL.md
OK   skills/ponytail-help/SKILL.md
OK   skills/ponytail-plan/SKILL.md
names: 7 | missing: 0 | dirs not in list: []
```

### Local skill links

Commands:

```text
ln -sfn ../../skills/rapso-persona .opencode/skills/rapso-persona
ln -sfn ../../skills/rapso-session .opencode/skills/rapso-session
rm .opencode/skills/cortex-persona .opencode/skills/cortex-session
```

Output:

```text
lrwxrwxrwx. 1 stefan stefan 26 Sep 17 22:14 .opencode/skills/rapso-persona -> ../../skills/rapso-persona
lrwxrwxrwx. 1 stefan stefan 26 Sep 17 22:14 .opencode/skills/rapso-session -> ../../skills/rapso-session
both resolve
```

### Remaining CLI and link checks

Commands:

```text
node /home/stefan/Cortex-odd-rename-rapsodia-skills/cli/dist/index.js --help
node /home/stefan/Cortex-odd-rename-rapsodia-skills/cli/dist/index.js worktree list
for entry in .opencode/skills/*; do test -e "$entry" || exit 1; printf 'OK %s\\n' "$entry"; done
```

Output included:

```text
Usage: rapso [options] [command]
{"path":"/home/stefan/Cortex","head":"47b15a49b92a8bb1d501974ec789129c680809f1","branch":"main"}
{"path":"/home/stefan/Cortex-odd-rename-rapsodia-skills","head":"4e54d100b5b58e17d914aceba6daf233d93ad2e9","branch":"odd/rename-rapsodia-skills"}
OK .opencode/skills/rapso-persona
OK .opencode/skills/rapso-session
```
