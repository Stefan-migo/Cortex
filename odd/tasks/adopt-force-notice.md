# ODD Task — adopt-force-notice

## Objective

Make the adopt conflict notice state what actually happened, so `--force` stops producing a
message that instructs the user to re-run with the flag they just used.

## Problem

The native review that approved `adopt-self-safety` left one non-blocking advisory finding:

> **`R3-force-warning`** — `cli/src/commands/adopt.ts:35` — severity WARNING, introduced —
> "The CLI warns users to re-run with --force whenever conflicts exist, including after
> `--force` has already been supplied and the conflicting files were overwritten."
> — lineage `review-d4588f3be4ed0ab2`, lens `review-reliability`

The cause is a single unconditional branch: the notice is emitted whenever
`plan.conflicting` is non-empty, and `plan.conflicting` stays populated after a forced
overwrite because it classifies the file, not the outcome.

Literal reproduction from the merged evidence log of `adopt-self-safety`, scenario 2
(`adopt --yes --force` over a copy with five divergent project-owned files):

```
ℹ Conflicting (5):
ℹ   .opencode/agents/cortex-developer.md
ℹ   .opencode/agents/cortex-planner.md
ℹ   .opencode/mcp-template.json
ℹ   .opencode/skills/bootstrap/SKILL.md
ℹ   .opencode/tools/execute_script.ts
ℹ Injected (0):
ℹ Seeded (0):
ℹ Skipped (14):
...
⚠ Conflicting files are project-owned. Re-run with --force to overwrite them.
✔ Cortex adopted successfully.
```

All five files were replaced in that run. The one line that should report a destructive
overwrite instead tells the user to perform it.

Why it is worth a change rather than a shrug: `--force` is the only way to replace
project-owned content, and this is the only signal that it happened. Replacing that signal
with a no-op instruction removes the feedback for the destructive path — the same class of
defect (a message that misdescribes what the command did) this codebase already fixed once in
`formatDefectReport`.

## Scope

**In scope**

- `cli/src/commands/adopt.ts` — the notice, so it reports the outcome instead of prescribing it.
- `odd/tasks/adopt-self-safety.md` — check off `T7` and record the review outcome and this
  follow-up, both deferred by the review closure.

**Out of scope**

- Anything in `cli/src/engine/adopt.ts`. The classification is correct; only its presentation
  was wrong.
- The style and wording of the other adopt messages.
- Re-reviewing the approved `adopt-self-safety` candidate. Its closure states the finding is
  non-blocking and belongs to later work, so this is a new change with its own boundary.

## Change

One branch, no new abstraction: report the overwrite when the overwrite happened.

```ts
if (plan.conflicting.length > 0) {
  warn(options.force && !options.dryRun
    ? `${plan.conflicting.length} conflicting file(s) overwritten because --force was given.`
    : 'Conflicting files are project-owned. Re-run with --force to overwrite them.');
}
```

`plan.conflicting.length` is the accurate count for the overwrite message: with `--force` and
without `--dry-run`, every conflicting file is written by the loop in `adoptProject`.

## Acceptance criteria

1. `adopt --yes --force` over a copy with conflicts prints the overwrite message with the
   correct count, and no longer prints "Re-run with --force".
2. `adopt --yes` without `--force` prints the original message unchanged.
3. `adopt --dry-run --force` does not claim anything was overwritten, because nothing is
   written in a dry run.
4. `npm run typecheck` and `npm run build` pass in `cli/`.

## Verification

| Scenario | Command | Expected |
|---|---|---|
| forced overwrite | `adopt <copy> --yes --force` | `5 conflicting file(s) overwritten because --force was given.` |
| conflicts preserved | `adopt <copy> --yes` | `Conflicting files are project-owned. Re-run with --force to overwrite them.` |
| dry run with force | `adopt <copy> --dry-run --force` | no overwrite claim; `Dry run — no changes applied.` |
| dirty git repository | `adopt <dirty-copy> --dry-run` | the rewritten dirty-tree notice, naming the merge targets |

Fixtures are disposable copies (`git archive HEAD` → `/tmp/opencode/`), never a worktree; the
dirty fixture is that copy turned into a git repository with one uncommitted edit.

Observed on 2026-09-17 with `node cli/dist/index.js` from this worktree:

```text
S1  adopt <copy> --yes --force      → ⚠ 5 conflicting file(s) overwritten because --force was given.
                                      the five files were replaced (sha256 changed)
S2  adopt <copy> --yes              → ⚠ Conflicting files are project-owned. Re-run with --force to overwrite them.
                                      the five files were untouched (sha256 unchanged)
S3  adopt <copy> --dry-run --force  → ⚠ Conflicting files are project-owned. Re-run with --force to overwrite them.
                                      ⚠ Dry run — no changes applied.
S4  adopt <dirty-git-copy> --dry-run→ ⚠ Working tree is dirty. Cortex writes only its own files and the merge
                                        targets it merges into (AGENTS.md, .gitignore, opencode.json);
                                        uncommitted work anywhere else is left alone.
typecheck                           → tsc --noEmit, exit 0
build                               → esbuild, dist rebuilt
```

## Gate

The repository's pre-commit gate (`gga`, which reviews staged `.ts` files as whole files
against `AGENTS.md`) blocked the first commit attempt with a finding against the adjacent
dirty-tree notice:

> **Line 24** — "The warning claims files differing from Cortex's recorded content are never
> overwritten without `--force`. However, `adoptProject` can modify merged files such as
> `AGENTS.md`, `.gitignore`, and OpenCode configs without `--force`
> (`cli/src/engine/adopt.ts:137-149`). The warning is therefore misleading."

The finding is correct and was accepted rather than argued away. The `--force` gate applies to
**owned** files (`OWNED_PATHS`); the merge targets are written without it. An unqualified
sentence therefore reads as a guarantee the code does not give. Both the comment and the
user-facing message now name that scope, and the stale "marked blocks" mechanism was dropped —
it no longer applies to `AGENTS.md` after the section-aware injection delivered by
`adopt-self-safety`.

## Rollback

One source file plus documentation. `git revert` restores the previous notice.

## Provenance

- Finding: `R3-force-warning`, lineage `review-d4588f3be4ed0ab2`, delivered by PR #22 and
  recorded in `odd/tasks/adopt-self-safety.md`.
- Route: ODD-direct under explicit per-feature consent; worktree `../Cortex-odd-adopt-force-notice`,
  branch `odd/adopt-force-notice`, base `fbbfade`.
