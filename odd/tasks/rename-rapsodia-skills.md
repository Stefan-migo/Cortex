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

This is a manual sequence that the Orchestrator requests from the human; the PR body carries it.

## Tasks

- [ ] **T01** — Rename the two skill directories with `git mv`, and update the `name:` frontmatter,
      the `description:` trigger, the `/cortex-session` invocation and the two prose references.
      The Engram `topic_key` namespace stays.
- [ ] **T02** — Update `CANONICAL_SKILLS` in `cli/src/engine/worktree.ts`.
- [ ] **T03** — Update `cortex-init.sh`: the 2 `link_skill` calls, the name list, and the prose.
- [ ] **T04** — Update the shipped template: `cli/src/template/{AGENTS,SYSTEM-MAP,USER-GUIDE}.md`.
- [ ] **T05** — Update this repository's own references: `AGENTS.md`,
      `.opencode/agents/cortex-planner.md`, `commands/cortex-init.md`, `README.md`.
- [ ] **T06** — Verify: typecheck, build, the audit command, and a real
      `worktree create` / `cleanup` probe that proves the new names provision and resolve.
- [ ] **T07** — Recreate this worktree's own 2 links and record the exact commands.

## Acceptance criteria

1. `cd cli && npm run typecheck` passes. Report the real output.
2. `cd cli && npm run build` passes and `cli/dist/index.js` is rebuilt.
3. `ls skills/` shows `rapso-persona` and `rapso-session`; `cortex-persona` and `cortex-session`
   are gone.
4. `rg -n 'cortex-persona|cortex-session'` across the repository returns **only** the accepted
   exclusions above. Report the command and the full output — the audit is the deliverable, not a
   count.
5. `rapso worktree create <probe> --yes` inside this repository provisions 7 links that all
   resolve, with `rapso-persona` and `rapso-session` among them; `rapso worktree cleanup <probe>`
   leaves no worktree, branch, or directory behind.
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

- **T01–T07**: not started.

## Verification evidence

_(filled in as tasks complete; exact commands and their real output)_
