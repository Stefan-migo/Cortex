# ODD Task — session-handoff-odd

**Branch:** `odd/session-handoff-odd` · **Worktree:** `../Cortex-odd-session-handoff-odd`

**Origin:** founder report — the `cortex-session` skill still hands off to SDD while the repository norm is now ODD. Re-verified against `main` @ `42ce127`.

**TDD mode:** OFF — source: this repository has no test harness and no lint script (`AGENTS.md`; `npm test` exits 1 with "No test files found"). Checks are `npm run typecheck`, `npm run build`, grep criteria, and manual shell scenarios.

---

## Objective

Make the planning-session handoff land on ODD instead of SDD: rename the `cortex-session` handoff state from `ready-for-sdd/` to `ready-for-odd/`, and align every surface that prescribes the handoff vehicle so a closed session seeds `odd/tasks/<feature>.md`, not an SDD change.

## Problem

The session handoff is not a string in one file. It is a contract across four layers, and each layer independently names SDD as the continuation:

1. **The skill** — `skills/cortex-session/SKILL.md` defines the state machine `open/ → ready-for-sdd/ → archived/`, asks *"Does this session close with an SDD handoff?"* at close, and consumes the inbox when an **SDD change is created**.
2. **The CLI consumer** — `cli/src/engine/worktree.ts:103` hardcodes `.cortex-sessions/ready-for-sdd` in `handoffCandidates()`.
3. **The sync migration** — `scripts/cortex-sync.sh:6,53,57,61` creates and migrates into `open|ready-for-sdd|archived`.
4. **The agent and prompt surfaces** — `cli/src/template/.opencode/agents/cortex-planner.md` (and its root twin `.opencode/agents/cortex-planner.md`) titles the planning section *"Spec-Driven Planning (Gentle AI SDD)"* and ends it with *"Then hand off to `@Cortex-Developer` for `/sdd-apply`"*. `cli/src/template/AGENTS.md` and the root `AGENTS.md` describe the planning lobe as *"cortex-session + Gentle AI SDD — /sdd-\*"* and step 1 of Session Flow as *"drafts the change with `/sdd-new`"*.

## Why

Layer 1 alone is not a fix. Renaming the state directory in the skill without layer 2 produces a **silent** break: `handoffCandidates()` returns an empty array when the directory does not exist, so `cleanupWorktree()` stops archiving the handoff — no error, no report, and the session is silently left in the inbox forever. The rename must be atomic across layers 1–3.

## Already known — DO NOT REDO

| Fact | Consequence |
|---|---|
| `handoffCandidates()` is consumed by `cleanupWorktree()` (`worktree.ts:270`), **not** by `createWorktree()` | The inbox is archived when the worktree is cleaned up, not when it is created. The pending `2026-09-15-spec-kit-decommission` item is **correctly pending**, not leaky. Do not "fix" that. |
| `.opencode/agents/**` is in `OWNED_PATHS` (`cli/src/engine/adopt.ts:7-11`) | The root `.opencode/agents/cortex-planner.md` is refreshed from the template by `cortex adopt`. Editing only the root copy loses the change. Both copies must change, and the template is the source of truth. |
| `markdownSections()` (`adopt.ts:35-45`) injects only the `5-Step Execution Gate` and `## ODD Worktrees` sections into a target `AGENTS.md` | The Frontal Lobe table and Session Flow are repository-owned text, editable by ordinary PR. The injected sections are not. |
| `sdd-surface-alignment` (merged, `9ec7295`) already added `## ODD Worktrees` to the template | Do not re-add it, and do not re-touch `cli/src/commands/analyze.ts` or `cli/src/engine/session.ts`. |

## Scope — in

| ID | Surface | Change |
|---|---|---|
| T01 | `skills/cortex-session/SKILL.md` | `ready-for-sdd/` → `ready-for-odd/` (lines 25, 32, 129, 145, 148, 160, 170); section "SDD Handoff" → "ODD Handoff"; close question asks for an **ODD** handoff; the consumption gate fires on the **ODD task doc** being created, not on an SDD change; the legacy-migration table gains `ready-for-sdd/ → ready-for-odd/`; description no longer says "pre-SDD work"; the "do not load" line names ODD implementation instead of SDD apply/verify/archive |
| T02 | `cli/src/engine/worktree.ts:103` | `ready-for-sdd` → `ready-for-odd` in `handoffCandidates()` |
| T03 | `scripts/cortex-sync.sh` (lines 6, 53, 57, 61) | Create `ready-for-odd`; add a one-time, idempotent `ready-for-sdd/` → `ready-for-odd/` migration for projects that already ran the old sync |
| T04 | `cli/src/template/.opencode/agents/cortex-planner.md` | The planning section becomes ODD-first and its handoff ends at the ODD task doc / `@Cortex-Developer`, not `/sdd-apply` |
| T05 | `.opencode/agents/cortex-planner.md` | Same edit as T04 (root twin) |
| T06 | `cli/src/template/AGENTS.md` + `AGENTS.md` | The Frontal Lobe planning line and Session Flow "Work" step 1 stop prescribing `/sdd-new` as the handoff vehicle |

## Scope — out

- **The 5-Step Gate, step 4 (`/sdd-verify`).** Verification, not handoff. The gate is also an *injected* section whose source is the template, so changing it is a separate decision with a separate blast radius.
- **The SDD command tables.** `/sdd-*` still exist and remain usable on explicit request. They stay listed.
- `cli/src/commands/**`, `cli/src/engine/{session,analyze,deps,adopt}.ts`, `cli/src/template/{SYSTEM-MAP,USER-GUIDE}.md`, `docs/**`, the stale `sdd/<slug>` in `.opencode/skills/sdd/SKILL.md:55-57`, the `openspec/` leftover in `main`.
- **The local state rename in `main`.** `.cortex-sessions/ready-for-sdd/` → `ready-for-odd/` in `main` happens **after this PR merges**, because `main` still runs the old CLI until then. It is a post-merge step, listed under Next step, not a task here.
- Rebuilding `cli/dist/` (gitignored, does not travel with the merge).

## Constraints

- **No backward-compatibility branch in the CLI.** `handoffCandidates()` must not read both directory names. Dual-path reading is dead flexibility: layer 3 migrates the state once, and a project that never runs the sync keeps a stale inbox that the skill does not describe either. Rename, migrate, done.
- **The migration must not clobber.** If both directories exist and a session name collides, the target's copy wins and the script reports what it left behind. Never overwrite content to make a migration "succeed".
- **Artifacts stay in English**, including the task doc, commit messages, and the skill body.
- **Commit boundary:** one work unit for the CLI + script + skill (the atomic rename contract), a second work unit for the agent and AGENTS.md surfaces. Do not mix them.

## TDD

Mode: **off**. Rationale: no harness exists to drive. An attempted RED would be a fabricated test file, and `AGENTS.md` forbids claiming coverage that does not exist. Functional verification is `npm run typecheck`, `npm run build`, the grep criteria, and the manual scripted scenarios below.

## Tasks

- [x] **T01** — `skills/cortex-session/SKILL.md`: rename the handoff state to `ready-for-odd` and retarget the handoff/consumption/migration rules at ODD
- [x] **T02** — `cli/src/engine/worktree.ts`: rename the directory in `handoffCandidates()`
- [x] **T03** — `scripts/cortex-sync.sh`: create `ready-for-odd` and migrate legacy `ready-for-sdd`
- [x] **T04** — `cli/src/template/.opencode/agents/cortex-planner.md`: ODD-first planning section with an ODD handoff
- [x] **T05** — `.opencode/agents/cortex-planner.md`: mirror T04
- [x] **T06** — `cli/src/template/AGENTS.md` + `AGENTS.md`: retarget the Frontal Lobe line and Session Flow step 1
- [x] **T07** — Verify, commit as two work units, open the PR

## Acceptance criteria

1. `grep -rn "ready-for-sdd" skills/ scripts/ cli/src/ AGENTS.md .opencode/agents/` returns nothing outside an explicitly-labelled legacy-migration clause.
2. `grep -rn "ready-for-odd" skills/ scripts/ cli/src/` returns the skill, the script, and `worktree.ts`.
3. `npm run typecheck` (from `cli/`) exits 0.
4. `npm run build` (from `cli/`) exits 0; `grep -c "ready-for-sdd" cli/dist/index.js` is `0` and `grep -c "ready-for-odd" cli/dist/index.js` is greater than `0`.
5. No surface still prescribes an SDD handoff. Reading `AGENTS.md`, `cli/src/template/AGENTS.md`, both `cortex-planner.md` copies, and the skill, the prescribed continuation from a closed planning session is the ODD task doc. `/sdd-*` appears only in the retained command tables.
6. `diff .opencode/agents/cortex-planner.md cli/src/template/.opencode/agents/cortex-planner.md` reports only the pre-existing `mode: primary` line.
7. Manual scenario A (handoff archives): in a scratch git repo containing `.cortex-sessions/ready-for-odd/2026-09-17-demo/`, run the built CLI's `cortex worktree create demo --yes`, then `cortex worktree cleanup demo`, and confirm the session landed in `.cortex-sessions/archived/2026-09-17-demo/`.
8. Manual scenario B (legacy migration): a scratch project holding `.cortex-sessions/ready-for-sdd/2026-09-01-legacy/` and a pre-existing `open/` session, after `cortex-sync.sh`, ends with `ready-for-odd/2026-09-01-legacy/`, no `ready-for-sdd/`, and the `open/` session untouched. Re-running the sync changes nothing.
9. No file outside the authorized list is modified.

## Graph check

Consulted before editing (worktree graph, copied from `main` @ `42ce127`):

- **God nodes:** `closeCommand()` (16 edges), `initCommand()` (13 edges) — adjacent but untouched; this change stays inside the worktree lifecycle and the documentation surfaces.
- **Queried areas:** `worktree lifecycle, session handoff, and skill provisioning` → communities `Worktree Command Lifecycle`, `engine/adopt.ts`.
- **Nodes consulted:** `cli/src/engine/worktree.ts` (`handoffCandidates`, `archiveHandoff`, `provisionWorktree`, `cleanupWorktree`), `cli/src/engine/adopt.ts` (`OWNED_PATHS`, `markdownSections`), `skills/cortex-session/SKILL.md`, `scripts/cortex-sync.sh`, `cli/src/template/.opencode/agents/cortex-planner.md`, `cli/src/template/AGENTS.md`.
- **Edges relied on:** `cleanupWorktree()` → `handoffCandidates()` → `.cortex-sessions/ready-for-sdd` (the rename contract); `adopt.ts` → `OWNED_PATHS` → `.opencode/agents/**` (why both planner copies must change); `adopt.ts` → `markdownSections()` → injected AGENTS.md sections (why the 5-Step Gate is out of scope).

## Progress

- [x] Diagnosis re-verified against `main` @ `42ce127` (4 layers, 6 files, 1 local state dir)
- [x] Worktree created (`../Cortex-odd-session-handoff-odd`, base `42ce127`) and provisioned
- [x] Implementation (T01–T06)
- [x] Native review: approved, receipt acknowledged and burned
- [x] Verification (T07)

## Evidence log

All commands ran in this worktree. `[orch]` marks a check the orchestrator re-ran after fixing a defect the implementation session missed; unmarked lines were run once during implementation and reported.

### Defect found after implementation, before review

Both `AGENTS.md` files had the new qualifier line inserted directly under the `### Gentle AI SDD` heading with no blank line, and no blank line before the table. GFM does not let a table interrupt a paragraph, so the SDD command table rendered as broken text. Fixed by separating the heading, the note, and the table into their own blocks. The same change retargeted Session Flow step 2, which still read `Planner hands spec to Developer` — a "spec" no longer exists in this flow.

### Acceptance criteria

| # | Check | Result |
|---|---|---|
| 1 | `grep -rn "ready-for-sdd" skills/ scripts/ cli/src/ AGENTS.md .opencode/agents/` | 4 hits, all inside the labelled legacy-migration clause: `skills/cortex-session/SKILL.md:149` and `scripts/cortex-sync.sh:59,66,82`. Nothing else. `[orch]` |
| 2 | `grep -rn "ready-for-odd" skills/ scripts/ cli/src/` | 15 hits: the skill, the sync script, and `cli/src/engine/worktree.ts`. `[orch]` |
| 3 | `cd cli && npm run typecheck` | exit 0. `[orch]` |
| 4 | `cd cli && npm run build` | exit 0. `[orch]` |
| 5 | `grep -c "ready-for-sdd" cli/dist/index.js` | `0` `[orch]` |
| 6 | `grep -c "ready-for-odd" cli/dist/index.js` | `1` `[orch]` |
| 7 | `diff .opencode/agents/cortex-planner.md cli/src/template/.opencode/agents/cortex-planner.md` | only the pre-existing `mode: primary` line. `[orch]` |
| 9 | `git diff --name-only` | exactly the 7 authorized paths; the 8th manifest path is this task doc. `[orch]` |

`cli/template/` is absent after the build, confirming that path is not build output and that the runtime reads `cli/src/template`.

### Manual scenarios

**Scenario A — the handoff archives.** Scratch repo at `/tmp/opencode/handoff-scenario` with a bare `origin` on `main`; untracked `.cortex-sessions/ready-for-odd/2026-09-17-demo/session.md`; then the built CLI: `worktree create demo --yes`, then `worktree cleanup demo`. Result: `.cortex-sessions/archived/2026-09-17-demo/` present, `ready-for-odd/` no longer holding it. This exercises the real `cleanupWorktree()` → `handoffCandidates()` → `archiveHandoff()` path.

**Scenario B — the legacy migration.** Scratch project holding `.cortex-sessions/ready-for-sdd/2026-09-01-legacy/` plus a pre-existing `open/` session. Result: `ready-for-odd/2026-09-01-legacy/` present, `ready-for-sdd/` gone, `open/` untouched; a second run changed nothing; a colliding legacy name was left in place and reported rather than overwritten.

### Independent refutation of the review's only findings

The four-lens review returned three WARNING findings, all anchored at `scripts/cortex-sync.sh:66-70`, all claiming that `remaining=("$legacy"/*)` keeps the unmatched glob literal when the legacy directory empties, so `rmdir` never runs and `ready-for-sdd/` is left behind.

**All three are false.** Line 16 of the script sets `shopt -s nullglob`, and that line is not in any hunk the reviewers received — they are correctly forbidden from reading the working tree, so they could not see it. `[orch]` Sourcing the real function with the real shell options against a scratch project:

```
legacy session: 2026-09-01-legacy -> ready-for-odd/
session: already migrated
ready-for-sdd existe? NO
```

The directory is removed. No correction was opened; the review's disposition already treated the findings as non-blocking.

### Review

Native receipt-driven review on this candidate. Four lenses (`review-risk`, `review-resilience`, `review-readability`, `review-reliability`), risk **high**, 8 paths / 246 changed lines, correction budget 123 (unused). Every lens admitted. Outcome **approved**, then acknowledged: lineage `review-bfb13efee4268012`, consumed revision `sha256:f92beab7429efb035d182ad7064814023a6dd60259a9bbb61a8c7f940e71bbc6`, `authority: burned`.

### Unavailable checks — disclosed, not claimed

- `shellcheck scripts/cortex-sync.sh`: **not run.** `shellcheck` is not installed on this machine (`command not found`) and this repository has no CI enforcing it. `bash -n scripts/cortex-sync.sh` was used instead and reported no syntax error. The gap is real.
- No test suite exists (`npm test` exits 1, "No test files found"). TDD is OFF; no coverage is claimed.
- Scenarios A and B were executed and reported during implementation and are not independently re-run here. The `nullglob` refutation above was independently reproduced.

## Next step

Merged. Two post-merge steps in `main`, in this order, because `main` still runs the previously built CLI until both are done:

1. `mv .cortex-sessions/ready-for-sdd .cortex-sessions/ready-for-odd` — the live local inbox holds `2026-09-15-spec-kit-decommission`, correctly pending until its own worktree is cleaned up. Renaming the parent directory preserves it exactly; nothing is consumed.
2. `cd cli && npm run build` — `cli/dist/` is gitignored and does not travel with the merge.

### Follow-ups, deliberately not in this change

- **The 5-Step Gate's `Step 4: SPEC CHECK — /sdd-verify`** in both `AGENTS.md` files. Out of scope: verification, not handoff, and it is an *injected* section whose source is `cli/src/template/AGENTS.md` via `markdownSections()`, so editing only the root copy is lost on the next `cortex adopt`.
- **`@Cortex-Planner` is still described as doing `spec drafting`** in the Two Identities table of both `AGENTS.md` files, and in the planner's own role line. Role prose, not the handoff; left for a separate decision.


## Rationale log

- **Rename rather than delete the inbox** (founder decision, 2026-09-17). ODD's continuation vehicle is `odd/tasks/<feature>.md`, so the inbox could be dropped entirely — but `cleanupWorktree()` uses a pending handoff to archive the session and to protect untracked `.cortex-sessions/` paths from loss, and `archiveHandoff()` carries a deliberate guard against reconciling divergent archived content. Deleting the mechanism would remove both. Renaming keeps the value at the cost of touching the layers.
- **No dual-directory read in the CLI.** See Constraints. A compatibility branch would outlive its reason and hide the migration's failure.
- **Migration lives in `cortex-sync.sh`, not in the CLI.** The sync already owns state-shape migration for every project on the list; the CLI should only know the current shape.
- **5-Step Gate left alone.** Out of the requested scope, and it is an injected section with a separate blast radius. Flagged, not silently fixed.
- **Collision check with the active worktree `../Cortex-odd-spec-kit-decommission`** (`odd/spec-kit-decommission`): its authorized files are `cli/src/commands/{status,close}.ts`, `cli/src/engine/deps.ts`, `scripts/{install-deps,setup,sdd-init}.sh`, `cli/src/template/.specify/**`, `cli/template/**`, `docs/COMPETITIVE-ANALYSIS.md`, and the root `.specify/`. **Zero file overlap.** They share the `scripts/` and `cli/src/engine/` directories, so merges stay clean but the second merge must rebuild `cli/dist/`.
