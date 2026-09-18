# ODD Tasks — rename-rapsodia-agents

Worktree: `/home/stefan/rapsodia-code-odd-rename-rapsodia-agents`
Branch: `odd/rename-rapsodia-agents`
Base: `e632be9` (== `origin/main`, the squash merge of PR #45)
TDD: OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Rename this repository's **own agent identity** from `cortex-planner` / `cortex-developer` to
`rapso-planner` / `rapso-developer`, in the config keys, the agent files (filenames and contents),
and every `@Cortex-*` reference that points at them.

This is **Bucket 2** of the Cortex → Rapsodia rename, explicitly deferred by
`rename-rapsodia-repo` and left untouched by `rename-rapsodia-residual-prose`.

## Problem

`opencode.json` declares `cortex-planner` / `cortex-developer`, and
`.opencode/agents/cortex-planner.md` / `cortex-developer.md` exist under those names. Five files
carry the old identity:

| File | Sites |
|---|---|
| `opencode.json` | the two `agent` keys |
| `.opencode/agents/cortex-planner.md` | filename + 11 refs |
| `.opencode/agents/cortex-developer.md` | filename + 6 refs |
| `AGENTS.md` | L16, L17, L73, L87, L88 |
| `skills/rapso-session/SKILL.md` | L17 (two refs) |

Beyond the cosmetic debt, there is a **real defect**. `cli/src/engine/adopt.ts:78` writes
`rapso-planner` / `rapso-developer` into adopted projects, and its ownership guard is
`if (existing && existing.__managed_by !== 'cortex') continue;`. This repository's `agent` keys
are `cortex-*` and carry no `__managed_by`, so they do not collide with `rapso-*`: running
`rapso adopt` here would **add a second pair of agents** alongside the existing ones instead of
recognising its own. Renaming the keys closes that gap.

## Why it could not be renamed alone

Agent keys are coupled by construction:

- `AGENTS.md` and `skills/rapso-session/SKILL.md` reference `@Cortex-*`, so renaming them without
  `opencode.json` would point at agents that no longer exist.
- The `.opencode/agents/*.md` filenames are the other half of the same identity: `opencode.json`
  defines the key, the file defines the agent.

The three must land in a single change.

## Source of truth

`cli/src/template/**` already ships `rapso-planner.md`, `rapso-developer.md` and the `rapso-*` keys
in its `opencode.json`. The root files are the **stale copy** — this is a sync toward the template,
not new authoring.

Verified by diff, the root↔template delta is **exactly the rename**, with one exception:
`.opencode/agents/cortex-planner.md` carries a frontmatter `mode: primary` line the template omits.
The rename preserves that line rather than dropping it: removing a non-rename line would exceed the
mandate. It is redundant anyway — `opencode.json` already sets `mode: primary` for the agent.

## In scope

The five files above. The rename also replaces the stale `cortex <verb>` CLI calls inside the agent
files (`cortex worktree create|list|cleanup`, `cortex start`, `cortex close`), which are factually
wrong today because the binary is `rapso`; they are part of the same identity surface and are named
as Bucket 2 by `rename-rapsodia-repo`.

## Out of scope

1. **Bucket 3** — filenames that define the user-visible command: `cortex-init.sh`,
   `commands/cortex-init.md`, `scripts/cortex-sync.sh`; and the internal identifiers
   `CORTEX_PACK_DIR`, `CORTEX_SRC`, `CORTEX_WORKTREE_PROVISION`, `cortex_dir`,
   `_cortex_mcp_tmp.json`, `cortexVersion`. Renaming a command is an API change, not prose.
2. **Bucket 4 — deliberate compatibility, never renamed**: `GLOBAL_STATE_DIR_NAME = '.cortex'`,
   `LEGACY_SESSIONS_DIR_NAME = '.cortex-sessions'`, the `# cortex:start` / `# cortex:end` /
   `# Cortex managed entries` markers, `__managed_by: 'cortex'`, `cortex-session/*` Engram topic
   keys, `PROJECT="cortex-plugin"`, and the `LEGACY_DEFECT_HEADING` alias. All of these are matched
   against content already written in adopted projects.
3. **Consumer projects** — `~/repos/lumat-agent` still has `cortex-persona`,
   `cortex-session`, `cortex-*.md` agents and a `cortex-persona`-referencing `AGENTS.md`. That is
   migration work performed by `scripts/cortex-sync.sh` after Bucket 3, not a change to this
   repository.
4. **Historical records** — `odd/tasks/*.md`, `wiki/**`, `.rapsodia-code/sessions/**`,
   `openspec/changes/archive/**`. They cite PR numbers and paths as evidence; rewriting them
   falsifies the trail.
5. **`cli/src/template/**`** — already correct, verified by diff. No change.
6. **`cli/dist/`** — no CLI source changes, so it is not rebuilt.

## Constraints

- Atomicity Gate: **at most 5 staged files per commit** (`.githooks/pre-commit`).
- Never stage the untracked provisioning artifacts `.\opencode\package.json`,
  `.\opencode\package-lock.json`, `.\opencode\tools\package-lock.json`.
- `mode: primary` in `.opencode/agents/cortex-planner.md` is preserved.
- No CLI source change, so no `cli/dist` rebuild and no `npm run build` requirement beyond the
  typecheck proof.
- The change requires an **OpenCode restart** to take effect: agent keys are read at session start.

## Tasks

- [x] **T01** — `opencode.json`: the `agent` keys are `rapso-planner` / `rapso-developer`. Nothing
      else in the file changed.
- [x] **T02** — `.opencode/agents/cortex-planner.md` → `rapso-planner.md` via `git mv`, then the 11
      internal refs: the `description`, the `# @Cortex-Planner` heading, the `Cortex system` line,
      the three `cortex worktree` rows, the `@Cortex-Developer` handoff, the `@Cortex-Developer`
      task spawn, `cortex start` (twice) and `cortex close` (once). The frontmatter `mode: primary`
      line was preserved.
- [x] **T03** — `.opencode/agents/cortex-developer.md` → `rapso-developer.md` via `git mv`, then
      the 6 internal refs: `description`, heading, the `Cortex system` / `@Cortex-Planner` line,
      `cortex close`, `@Cortex-Planner`, `cortex close`.
- [x] **T04** — `AGENTS.md`: the 5 `@Cortex-*` refs on L16, L17, L73, L87, L88. Repo-specific
      sections (Pull Request Policy, ODD Worktrees, coding standards) are untouched — this file is
      the template plus deliberate divergences, not a stale copy.
- [x] **T05** — `skills/rapso-session/SKILL.md:17`: the `@Cortex-Developer` / `@Cortex-Planner`
      pair.
- [x] **T06** — Checks and Progress.

## Checks

Every check must be run from the worktree root and its real output recorded.

1. **JSON valid**: `node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8'))"` exits 0.
2. **Agent keys**: `node -e` prints the `Object.keys(config.agent)`; expected exactly
   `["rapso-planner","rapso-developer"]`.
3. **Files**: `.opencode/agents/rapso-planner.md` and `rapso-developer.md` exist;
   `.opencode/agents/cortex-*.md` matches nothing.
4. **Identity-surface scan (quantified over the repository, not a path list)**:
   `rg -n 'Cortex-Planner|Cortex-Developer|@Cortex|cortex-planner|cortex-developer' --hidden -g '!node_modules' -g '!.git' -g '!cli/dist' -g '!odd/tasks/**' -g '!wiki/**' -g '!.rapsodia-code/**' -g '!openspec/changes/archive/**' .`
   **Pass condition:** zero hits, *and* every excluded root must be a historical record, not a live
   surface. The pattern is specific to the agent identity, so an unlisted live file cannot hide from
   it; the exclusions are the frozen evidence trail, which this change must not rewrite.
5. **Stale commands inside the agent files**: `rg -n 'cortex (start|close|worktree)' .opencode/agents`
   matches nothing.
6. **Semantic parity with the template**: the `agent` blocks of root `opencode.json` must equal
   those of `cli/src/template/opencode.json` once key names match.
7. **Typecheck**: `npm run typecheck` (from `cli/`) exits 0 — no source changed, so this must stay
   green.

## Acceptance criteria

- No tracked surface declares the agent identity `cortex-planner` / `cortex-developer`; the live
  names are `rapso-planner` / `rapso-developer`.
- Root `opencode.json` and `.opencode/agents/` are in sync with `cli/src/template/**` apart from
  the intentionally preserved `mode: primary` line.
- Bucket 3 and Bucket 4 surfaces are unchanged byte for byte.
- Repo-specific `AGENTS.md` sections survive untouched.

## Progress

- **Doc created before the first source write**, as required.
- **T01–T05 implemented.** 5 files, 24 refs. The two agent files were renamed with `git mv`; the
  content rewrite was verified to be rename-only by `git diff -U0 -- .opencode/agents | rg '^[+-]'`
  filtered against `Cortex|cortex|Rapso|rapso`, which returned **no lines**. Everything changed
  involves the rename and nothing else.
- **Checks — observed output, run from the worktree root:**
  1. `node -e "JSON.parse(...)"` → exit 0.
  2. agent keys → `["rapso-planner","rapso-developer"]`.
  3. `ls .opencode/agents/` → `rapso-developer.md`, `rapso-planner.md`; `cortex-*.md` → no such file.
  4. identity scan → **zero hits** (corrected form; see the instrument defect below).
  5. `rg -n 'cortex (start|close|worktree)' .opencode/agents` → exit 1, no matches.
  6. root `agent` block == `cli/src/template/opencode.json` `agent` block → `true`.
  7. `npm run typecheck` (from `cli/`) → exit 0.

- **2026-09-18 — instrument defect found and corrected in this document's own check #4.** The first
  form of check #4 had no historical-record exclusions and returned **~120 hits**. Every one of them
  was inside `odd/tasks/*.md` — the frozen evidence trail that both this change and its predecessor
  declare read-only. The check was therefore mis-scoped in the opposite direction from the retired
  instruments: not too narrow (path-listed) but **too broad**, counting records that legally must
  keep the old spelling. The corrected form excludes `odd/tasks/**`, `wiki/**`, `.rapsodia-code/**`
  and `openspec/changes/archive/**`, and requires that each excluded root be a historical record
  rather than a live surface. This is recorded rather than silently amended because a check that
  passes after being loosened is exactly the failure mode this repository keeps hitting; the
  loosening is narrow, named, and justified above.

- **Next step** — commit, then native review (RDD) before the PR.

## Next step after this change

Bucket 3 (the `cortex-init` / `cortex-sync` command names and the internal `CORTEX_*` /
`cortexVersion` identifiers), then the consumer sync against `~/repos/lumat-agent`: the sync script
copies skills but never deletes the stale `cortex-*` ones, and the state rename lives in
`migrateLegacyState` (`cli/src/utils/state.ts:31`), not in the sync script.
