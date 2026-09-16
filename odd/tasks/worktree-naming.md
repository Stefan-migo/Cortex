# ODD Task — worktree-naming

**Branch:** `odd/worktree-naming` · **Worktree:** `../Cortex-odd-worktree-naming`

## Objective

Make the worktree layer ODD-native: rename the branch/worktree namespace from `sdd/` to `odd/`, generalize the SDD-anchored consent requirement, protect `odd/` during cleanup, and document the ODD worktree rule.

## Problem

gentle-ai v3 makes ODD the default workflow and SDD a branch inside it. The worktree layer still assumes `sdd/<slug>`: the branch namespace, the sibling directory name, the merge-marker equality check, and the consent requirement all anchor to SDD. Under ODD the default code path never enters SDD, so the naming misrepresents the work and the consent requirement reads as unreachable.

## Why

The previous recommendation against generalizing was reversed once `auto-resolve-cleanup-refusal` closed: the only argument against was an orphaned live worktree, and it no longer exists. Today there are zero `sdd/*` branches (local and remote), zero sibling worktrees, and zero open PRs, so migration cost is at its historical minimum.

## Scope

Authorized: `cli/src/engine/worktree.ts`, `cli/src/commands/worktree.ts`, `.githooks/post-merge`, `skills/cortex-persona/SKILL.md`, `AGENTS.md`, `openspec/specs/worktree-*/spec.md`.

Out of scope: `.githooks/pre-commit` (the main guard only covers `.cortex-sessions/*`; the ODD task doc is committed inside the worktree and reaches main through a PR merge, which does not run `pre-commit`), `.gitignore`, the retired orphan handoff `.cortex-sessions/ready-for-sdd/2026-09-15-spec-kit-decommission`, and the pre-existing `.cortex-sessions/ready-for-sdd/` handoff protocol owned by `skills/cortex-session/SKILL.md` (a separate session-lifecycle concern, not the worktree branch namespace).

## Constraints

- The rename is atomic across the code sites: if the merge-marker equality check is missed, `refreshMainAfterMerge` rejects instead of silently succeeding.
- The ODD worktree rule MUST live in `AGENTS.md` (or `skills/cortex-persona`), NEVER inside a `<!-- gentle-ai:agent-routing -->` managed block, which `gentle-ai sync` replaces wholesale. Verified: project `AGENTS.md` contains no `gentle-ai:` markers at all.
- `openspec/` is untracked in this repository, so base-spec edits cannot travel through the PR. They are synced in main at close (T06) and this asymmetry is reported to the user.
- `cli/dist/` is gitignored: it must be rebuilt in main after merge before the CLI is dogfooded again.

## TDD

Mode: **off** (resolved from project configuration `AGENTS.md`: this repository has no test harness — zero test files, `npm test` exits 1). No runner. Functional verification is `npm run typecheck`, `npm run build`, and concrete manual shell scenarios.

## Tasks

- [x] **T01** — Rename branch and directory namespace in `cli/src/engine/worktree.ts`: `worktreePath()` infix `-sdd-` → `-odd-`; `worktree add -b odd/<slug>`; config key `branch.odd/<slug>`; `branch -D odd/<slug>`; `push origin --delete odd/<slug>`; merge-marker equality `marker.branch !== odd/<slug>`. Also updated the `refreshMainAfterMerge` doc comment (was "merged SDD PR") and its rejection message (was "requested SDD branch", now "requested branch").
- [x] **T02** — Rename in `cli/src/commands/worktree.ts`: consent prompt text, created-branch output, and the command description (was "isolated SDD worktrees", now "isolated ODD worktrees").
- [x] **T03** — Add `odd/` to `protectedUntrackedPaths()` in `cli/src/engine/worktree.ts`, in the same shape as the existing `openspec/` / `.cortex-sessions/` predicates.
- [x] **T04** — Update the `.githooks/post-merge` comment and its advisory message that named `sdd/<slug>` and "the merged SDD PR".
- [x] **T05** — Update the Graphify-refresh note in `skills/cortex-persona/SKILL.md:200` that named `sdd/<slug>` (reached through `.opencode/skills/cortex-persona`, a symlink — one file only).
- [ ] **T06** — Sync base specs in main (untracked, at close, after merge): generalize `worktree-safety/spec.md:5` `### Requirement: Consent controls SDD entry`; update `worktree-provisioning/spec.md:13` and `worktree-lifecycle/spec.md:85,89` to the new branch name. Blocked on the merge — the specs only become relevant once main carries the new contract, and they cannot travel by PR.
- [x] **T07** — Document the ODD worktree rule in `AGENTS.md` as a new `## ODD Worktrees` section, outside any managed block.
- [x] **T08** — Verify: typecheck, build, and a real dogfood cycle of the rebuilt CLI (create → assert naming → cleanup → assert removal). See evidence below.
- [ ] **T09** — Commit as reviewable work units (code rename, cleanup protection, docs) and open the PR. Commits land on this branch; the PR is opened by the parent afterward, so this box is checked in the follow-up that closes the change.

## Acceptance criteria

- No `sdd/` namespace literal remains in `cli/src`, `.githooks`, `skills/`, or `AGENTS.md` (historical records under `openspec/changes/archive/**` are excluded and preserved).
- A worktree created by the rebuilt CLI is born as `Cortex-odd-<slug>` on branch `odd/<slug>` with no upstream.
- `typecheck` and `build` pass with the real observed output reported.

## Verification evidence

### Environment gap found first (real, and reported honestly)

The first attempt ran inside the fresh worktree and failed because `provisionWorktree` installs dependencies for `.opencode` and `.opencode/tools` but NOT for `cli/`. `cli/node_modules` is untracked, so a fresh worktree has no compiler and no bundler:

```
npm run typecheck
> tsc --noEmit
sh: line 1: tsc: command not found

npm run build
> node esbuild.config.js
Error: Cannot find module 'esbuild'
```

Resolved by running `npm ci` in `cli/` inside the worktree. This is a genuine provisioning gap for any work that touches the CLI itself, and it is recorded as a follow-up rather than silently worked around.

### After `npm ci` in `cli/`

```
npm run typecheck
> cortex-brain@1.0.0 typecheck
> tsc --noEmit
(no diagnostics — exit 0)

npm run build
> cortex-brain@1.0.0 build
> node esbuild.config.js

Template copied: .../cli/src/template → .../cli/template
dist/index.js  (207861 bytes)
```

### Dogfood cycle — the real acceptance proof

`createWorktree` requires the main worktree, so the rebuilt dist from the worktree was executed against `--root /home/stefan/Cortex`:

```
node <worktree>/cli/dist/index.js worktree create scratch-naming-proof --yes --root /home/stefan/Cortex
{"accepted":true,"created":true,"path":"/home/stefan/Cortex-odd-scratch-naming-proof","branch":"odd/scratch-naming-proof"}

git worktree list
/home/stefan/Cortex                          0960292 [main]
/home/stefan/Cortex-odd-scratch-naming-proof 0960292 [odd/scratch-naming-proof]
/home/stefan/Cortex-odd-worktree-naming      0960292 [odd/worktree-naming]

git config --get branch.odd/scratch-naming-proof.merge
(none — correct, upstream was unset)

node <worktree>/cli/dist/index.js worktree cleanup scratch-naming-proof --root /home/stefan/Cortex
{"cleaned":true,"slug":"scratch-naming-proof"}

git worktree list      → /home/stefan/Cortex and /home/stefan/Cortex-odd-worktree-naming only
git branch --list odd/* → + odd/worktree-naming only
ls -d /home/stefan/Cortex-odd-scratch-naming-proof → No such file or directory
```

Sibling directory `Cortex-odd-<slug>`, branch `odd/<slug>`, no upstream, and a clean create→cleanup round trip: all four confirmed by observation, not inference.

### Residual literals

`grep -rn "sdd/" cli/src .githooks skills AGENTS.md` returns only the six `.cortex-sessions/ready-for-sdd/` handoff paths in `skills/cortex-session/SKILL.md`. That directory is the session→SDD handoff inbox wired into `cli/src/engine/worktree.ts:91` (`handoffCandidates`) and is a separate lifecycle concern, so it was left untouched on purpose.

`grep -rn "SDD" cli/src` returns only `cli/src/template/.specify/**` — the vendored Spec-Kit template's "Full SDD Cycle" workflow name, unrelated to the worktree namespace.

### T03 decision

`odd/` paths resolve to **loss** paths, like session state, not to archive-preserved paths. An untracked `odd/tasks/<feature>.md` at cleanup time is unsaved branch work that was meant to reach main through the PR; letting `hasArchivedTwin` silently resolve it would be exactly the false reconciliation the previous change removed. Refusing is the correct, fail-closed behaviour.

## Progress

T01–T05, T07 and the verification cycle are complete and evidenced above. Changes remain uncommitted in the worktree. T06 is blocked on the merge by design. T09's commits are the immediate next action.

## Next step

Commit the work units, then open the PR. After the merge: `npm ci && npm run build` in main's `cli/`, then T06's spec sync.

## Rationale log

- **Route: ODD-direct, not an SDD change.** A namespace rename with no behavior change does not earn an openspec change directory, preflight, and four planning phases. Tracking artifact is this file plus its Engram mirror.
- **Bootstrap avoided without a manual rename.** `provisionWorktree(worktree, mainRoot)` resolves everything from the worktree itself and never takes a slug, so raw `git worktree add -b odd/<slug>` plus the *existing* CLI produces a worktree born with the target naming.
- **`odd/` is not `openspec/`.** They share the untracked-in-worktree shape but not the intent: `openspec/` content is local-only and can be superseded by an archived twin, while `odd/tasks/` is committed content with a delivery path. Treating them identically would have weakened the cleanup guarantee.
