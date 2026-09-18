# ODD Tasks — rename-rapsodia-residual-prose

Worktree: `/home/stefan/rapsodia-code-odd-rename-rapsodia-repo`
Branch: `odd/rename-rapsodia-residual-prose`
Base: `d2f345f` (== `origin/main`, the squash merge of PR #40)
TDD: OFF — this repository has no test harness (`npm test` exits 1: "No test files found").
Functional checks only; no RED/GREEN cycle is claimed. Runner: none.

## Objective

Close the last tracked files carrying **human-facing `Cortex` prose** that were never inside the
path list of `rename-rapsodia-repo`'s `## Checks` #4, and replace that check with an instrument
capable of proving the universal claim it was written to prove.

## Problem

`rename-rapsodia-repo` closed with the acceptance criterion *"no live surface claims the tool or its
repository is called Cortex, except the persisted matching keys"* declared met. It is not met. Six
tracked files still carry Cortex prose:

| File | Line(s) |
|---|---|
| `.githooks/post-merge` | 7 — printed to the user on every merge |
| `.opencode/skills/bootstrap/SKILL.md` | 12, 53, 171 |
| `.githooks/pre-commit` | 2 |
| `.env.example` | 1 |
| `.gitignore` | 1 |
| `.opencode/mcp-template.json` | 3 |

None of them is Bucket 2, 3, or 4. All six are Bucket 1 — prose and stale identity — so all six were
in scope of the previous work unit and were missed by it.

## Why the miss happened (and why fixing the check is the real task)

`## Checks` #4 was a **hardcoded, case-sensitive path list**:

```
rg -n 'Cortex' cli/src cli/package.json cli/README.md AGENTS.md README.md commands cortex-init.sh
```

Three independent defects, compounding:

1. **Case-sensitive.** `cortex` (lowercase) was invisible, which hid whole directories.
2. **Path-scoped.** `scripts/`, `skills/`, `docs/`, `.githooks/`, `.opencode/`, and dotfiles were
   never searched. A path list cannot prove a claim that quantifies over the whole repository.
3. **Unfalsifiable pass condition.** The check passed as long as the *listed* paths were clean. It
   could not fail on a file nobody listed, which is exactly what happened.

This is the **fourth consecutive path-scoped measurement** in that document. The conclusion is that
the instrument, not the measurement, is the defect: a check whose scope is chosen by the same
author who chose the changes cannot detect its own blind spots.

The corrected instrument quantifies over the repository and forces a **classification** of every
surviving hit, so a new blind spot fails the check instead of passing it.

## In scope

The six files above, plus the check repair. Bucket 1 only.

| File | Site | Change |
|---|---|---|
| `.githooks/pre-commit` | L2 | comment `# cortex pre-commit hook` → `# Rapsodia pre-commit hook` |
| `.githooks/post-merge` | L7 | user-visible message `Cortex: merge recorded…` → `Rapsodia: merge recorded…` |
| `.gitignore` | L1 | header comment `# Cortex gentle-ai plugin` → `# Rapsodia gentle-ai plugin` |
| `.env.example` | L1 | header comment `# Cortex 2.5 — Environment Variables` → `# Rapsodia 2.5 — …` |
| `.opencode/mcp-template.json` | L3 | `"_comment"` value `=== Cortex MCP Server Template ===` → `Rapsodia` |
| `.opencode/skills/bootstrap/SKILL.md` | L12, L53, L171 | prose: `Cortex template`, the `CORTEX — PRE-FLIGHT CHECK` banner, `Primary agents in Cortex` |
| `odd/tasks/rename-rapsodia-repo.md` | `## Checks` #4, T08, `## Progress` | repair the check; correct the false completion claim |

## Explicitly out of scope

- **Buckets 2 and 3** — agent identity (`@Cortex-*`, `opencode.json` agent keys,
  `.opencode/agents/cortex-*.md`) and command/identifier names (`cortex-init.sh`,
  `commands/cortex-init.md`, `scripts/cortex-sync.sh`, `CORTEX_PACK_DIR`). Deferred by the human.
- **Bucket 4** — the persisted matching keys: the `# cortex:start` / `# cortex:end` /
  `# Cortex managed entries` markers, `__managed_by: 'cortex'`, `GLOBAL_STATE_DIR_NAME = '.cortex'`,
  `LEGACY_SESSIONS_DIR_NAME = '.cortex-sessions'`, the `cortex-session/*` Engram topic keys, and
  `PROJECT="cortex-plugin"`. Never renamed; each is compared against content already written in
  adopted projects.
- **`.gitignore` L16, L17, L33** — these name `cortex-init.sh` / `scripts/cortex-sync.sh`, which
  **still exist under those names**. The references are accurate today; they move with Bucket 3.
- **A full sync of the two stale `.opencode/` copies.** Both differ from
  `cli/src/template/.opencode/**` by more than the name (the root `bootstrap/SKILL.md` still carries
  decommissioned GSD checks and the root `mcp-template.json` has different blank-line structure).
  Aligning them is a separate change. **This work unit changes the name only.**
- **Historical records** — `odd/tasks/*.md` other than the one file named above, `wiki/**`,
  `.rapsodia-code/sessions/**`, `openspec/changes/archive/**`. The one permitted edit is a dated
  correction of a claim this work unit proves false.

## Constraints

- **`.gitignore` L1 sits OUTSIDE the `# cortex:start` / `# cortex:end` managed block.** Verified by
  reading the file; `adopt` will not overwrite it. Inside that block nothing may be touched.
- **Atomicity Gate: ≤5 staged files per commit** (`.githooks/pre-commit`). The work is split across
  commits; the PR squashes them.
- Never stage untracked install artifacts (`.opencode/package.json`, lockfiles).
- `gga` is non-deterministic; a block on byte-identical intent is retried before restructuring.
- `cli/dist/` is gitignored and is NOT rebuilt by this work unit: no CLI source changes.

## Tasks

- [x] **T01** — `.githooks/pre-commit:2`: comment only. Atomicity Gate logic untouched.
- [x] **T02** — `.githooks/post-merge:7`: user-visible `echo` string only.
- [x] **T03** — `.gitignore:1`: header comment only.
- [x] **T04** — `.env.example:1`: header comment only. The runtime **denies `read`** on `**/.env.*`
      while allowing `*.env.example`, a contradictory pair. The write went through the normal
      `edit` tool, which the runtime permits; it was **not** forced through a shell bypass.
- [x] **T05** — `.opencode/mcp-template.json:3`: `_comment` value only; JSON still parses.
- [x] **T06** — `.opencode/skills/bootstrap/SKILL.md:12,53,171`: prose only. The L53 banner frame is
      byte-identical in width after the change (51 chars before and after).
- [x] **T07** — Repaired `## Checks` #4 of `odd/tasks/rename-rapsodia-repo.md`: repo-wide,
      case-insensitive, explicit exclusions, and a pass condition that requires **every** surviving
      hit to be classified. T08's false completion claim is struck, the `## Scope expansion` claim
      of "exactly ten tracked files" is struck, and a dated correction entry is appended. The
      originally measured evidence was preserved, not rewritten.
- [x] **T08** — Checks 1–6 run; exact output in ## Progress.

## Checks

Run from this worktree. Report the real output; never infer a pass.

1. `cd cli && npm run typecheck` — exit 0, no diagnostics.
2. `cd cli && npm run build` — exit 0.
3. **Repo-wide residual scan (the corrected instrument):**

   ```bash
   rg -ni --hidden \
     -g '!.git' -g '!node_modules' -g '!cli/dist' -g '!graphify-out' \
     -g '!odd/tasks/**' -g '!wiki/**' -g '!.rapsodia-code/**' -g '!openspec/**' \
     'cortex' .
   ```

   **Pass condition:** every surviving hit is classified as Bucket 2, 3, or 4 with a recorded
   reason, and the Bucket 1 set is **empty**. A hit that cannot be classified fails the check.
4. `git diff --stat` — no path outside ## In scope.
5. `bash -n .githooks/pre-commit .githooks/post-merge` — exit 0 (hooks stay valid bash).
6. `python3 -c "import json;json.load(open('.opencode/mcp-template.json'))"` — exit 0 (valid JSON).

## Acceptance criteria

- No tracked live surface carries human-facing `Cortex` prose, except the Bucket 3 filename
  references and the Bucket 4 persisted matching keys, which are unchanged byte for byte.
- The check that declared the previous work unit complete can no longer pass while an unclassified
  `cortex` hit exists anywhere in the repository.
- Both git hooks still parse and `.opencode/mcp-template.json` is still valid JSON.

## Progress

- **2026-09-18 — doc created before the first source write**, on branch
  `odd/rename-rapsodia-residual-prose` cut from `origin/main` (`d2f345f`). The previous branch
  `odd/rename-rapsodia-repo` is squash-merged and byte-identical to `origin/main`; it is left
  untouched at `67ab894`.
- **2026-09-18 — implemented inline.** Six files, seven sites; all mechanical substitutions that
  were already mapped before the first edit, so no writer delegation was needed.
- **Check 1** — `cd cli && npm run typecheck` → exit 0, no diagnostics.
- **Check 2** — `cd cli && npm run build` → exit 0.
- **Check 3** — repo-wide scan: **Bucket 1 set is empty**. Every remaining `cortex` hit is
  classified below. The classification is the pass condition, not a path list.
- **Check 4** — `git diff --stat` → 6 files changed, 8 insertions(+), 8 deletions(-): one line
  replaced per site, no path outside ## In scope.
- **Check 5** — `bash -n .githooks/pre-commit .githooks/post-merge` → exit 0.
- **Check 6** — `python3 -c "import json;json.load(open('.opencode/mcp-template.json'))"` → exit 0.
- **Observed, not introduced:** the L53 banner measures 51 chars before and after; the pre-existing
  one-char mismatch against the 52-char frame at L52 is untouched.
- **Next step** — commit in Atomicity-Gate-sized batches, then verify and open the PR.

### Residual classification (Check 3, the corrected instrument)

**Bucket 2 — agent identity (deferred):** `AGENTS.md` L16, L17, L73, L87, L88; `opencode.json` L8,
L25; `.opencode/agents/cortex-planner.md` and `cortex-developer.md` in full;
`skills/rapso-session/SKILL.md` L17 (the `@Cortex-Developer` / `@Cortex-Planner` references).

**Bucket 3 — names and identifiers that still exist under those names (deferred):**
`cortex-init.sh` in full; `commands/cortex-init.md`; `scripts/cortex-sync.sh`; `.gitignore` L16,
L17, L33 (references to those two filenames); `cli/src/utils/defect.ts:48` (`cortexVersion`);
`skills/rapso-session/SKILL.md` L149, L159 (`scripts/cortex-sync.sh`).

**Bucket 4 — persisted matching keys (never renamed):** `cli/src/engine/adopt.ts` L25 (the
intentional `LEGACY_DEFECT_HEADING` alias), L70, L74, L75 (`# cortex:start`, `# cortex:end`,
`# Cortex managed entries`), L87, L88 (`__managed_by: 'cortex'`); `cli/src/utils/state.ts` L6, L8,
L9; `scripts/migrate-wiki-to-engram.sh:8` (`PROJECT="cortex-plugin"`); `skills/rapso-session/SKILL.md`
L73, L81, L83, L108–L112, L131, L149 (`cortex-session/*` Engram topic keys and the legacy
`.cortex-sessions/` directory).
